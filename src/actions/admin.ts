'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { UserRole, AgencyMemberFunction } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface CreateUserData {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  agencyFunction?: AgencyMemberFunction
  clientId?: string
  projectRole?: string
}

interface CreateUserResult {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
  }
  error?: string
}

/**
 * Create a new user account (admin only)
 * This function can create users for any role: platform admin, agency members, clients, client members
 */
export async function createUser(data: CreateUserData): Promise<CreateUserResult> {
  try {
    // Get current user and verify admin privileges
    const supabase = await createClient()
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'Not authenticated'
      }
    }

    // Check if current user is platform admin
    const currentDbUser = await prisma.user.findUnique({
      where: { authId: currentUser.id },
      select: { role: true, id: true }
    })

    if (!currentDbUser || currentDbUser.role !== UserRole.PLATFORM_ADMIN) {
      return {
        success: false,
        message: 'Insufficient permissions',
        error: 'Only platform admins can create users'
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return {
        success: false,
        message: 'User already exists',
        error: 'A user with this email already exists'
      }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
      email: data.email,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role
      }
    })

    if (authCreateError || !authData.user) {
      return {
        success: false,
        message: 'Failed to create user in authentication system',
        error: authCreateError?.message || 'Unknown auth error'
      }
    }

    // Create user record in database
    const dbUser = await prisma.user.create({
      data: {
        authId: authData.user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: true,
        createdBy: currentDbUser.id,
        updatedBy: currentDbUser.id
      }
    })

    // Create role-specific records
    if (data.role === UserRole.AGENCY_MEMBER && data.agencyFunction) {
      await prisma.agencyMembership.create({
        data: {
          userId: dbUser.id,
          function: data.agencyFunction,
          isActive: true,
          createdBy: currentDbUser.id,
          updatedBy: currentDbUser.id
        }
      })
    }

    if (data.role === UserRole.CLIENT && data.clientId) {
      await prisma.clientMembership.create({
        data: {
          userId: dbUser.id,
          clientId: data.clientId,
          role: 'owner',
          isActive: true,
          createdBy: currentDbUser.id,
          updatedBy: currentDbUser.id
        }
      })
    }

    if (data.role === UserRole.CLIENT_MEMBER && data.clientId) {
      await prisma.clientMembership.create({
        data: {
          userId: dbUser.id,
          clientId: data.clientId,
          role: data.projectRole || 'member',
          isActive: true,
          createdBy: currentDbUser.id,
          updatedBy: currentDbUser.id
        }
      })
    }

    // Log the activity
    await prisma.activity.create({
      data: {
        actorId: currentDbUser.id,
        verb: 'CREATED',
        targetType: 'user',
        targetId: dbUser.id,
        metadata: {
          action: 'user_created',
          email: data.email,
          role: data.role,
          createdBy: currentDbUser.id
        },
        createdBy: currentDbUser.id,
        updatedBy: currentDbUser.id
      }
    })

    revalidatePath('/admin/users')

    return {
      success: true,
      message: `User created successfully. They can now login using magic link.`,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role
      }
    }

  } catch (error) {
    console.error('Error creating user:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send magic link to user (admin can send on behalf of users)
 */
export async function sendMagicLink(email: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current user and verify admin privileges
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'Not authenticated'
      }
    }

    const currentDbUser = await prisma.user.findUnique({
      where: { authId: currentUser.id },
      select: { role: true, id: true }
    })

    if (!currentDbUser || currentDbUser.role !== UserRole.PLATFORM_ADMIN) {
      return {
        success: false,
        message: 'Insufficient permissions',
        error: 'Only platform admins can send magic links'
      }
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true }
    })

    if (!targetUser) {
      return {
        success: false,
        message: 'User not found',
        error: 'No user found with this email address'
      }
    }

    // Send magic link
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

    if (magicLinkError) {
      return {
        success: false,
        message: 'Failed to send magic link',
        error: magicLinkError.message
      }
    }

    // Log the activity
    await prisma.activity.create({
      data: {
        actorId: currentDbUser.id,
        verb: 'MESSAGE_SENT',
        targetType: 'user',
        targetId: targetUser.id,
        metadata: {
          action: 'magic_link_sent',
          email: email,
          sentBy: currentDbUser.id
        },
        createdBy: currentDbUser.id,
        updatedBy: currentDbUser.id
      }
    })

    return {
      success: true,
      message: `Magic link sent to ${email}`
    }

  } catch (error) {
    console.error('Error sending magic link:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all users (admin only)
 */
export async function getUsers(): Promise<{
  success: boolean
  users?: Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    isActive: boolean
    createdAt: Date
  }>
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    const currentDbUser = await prisma.user.findUnique({
      where: { authId: currentUser.id },
      select: { role: true }
    })

    if (!currentDbUser || currentDbUser.role !== UserRole.PLATFORM_ADMIN) {
      return {
        success: false,
        error: 'Insufficient permissions'
      }
    }

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      users
    }

  } catch (error) {
    console.error('Error fetching users:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
