#!/usr/bin/env bun
/**
 * Script to create a platform admin account
 * 
 * Usage:
 * bun run src/scripts/create-admin.ts
 * 
 * This script will:
 * 1. Create a user in Supabase Auth
 * 2. Create a corresponding user record in the database
 * 3. Set up the user as a platform admin
 * 4. Create an agency membership for the admin
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient, UserRole, AgencyMemberFunction } from '@prisma/client'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const databaseUrl = process.env.DATABASE_URL!

if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
  console.error('❌ Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  console.error('- DATABASE_URL')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const prisma = new PrismaClient()

interface AdminUserData {
  email: string
  firstName: string
  lastName: string
  password?: string
  agencyFunction?: AgencyMemberFunction
}

async function createAdminUser(userData: AdminUserData) {
  try {
    console.log('🚀 Starting admin user creation process...')
    
    // Step 1: Create user in Supabase Auth
    console.log('📧 Creating user in Supabase Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password || generateRandomPassword(),
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: 'PLATFORM_ADMIN'
      }
    })

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Failed to create user in Supabase Auth')
    }

    console.log('✅ User created in Supabase Auth:', authData.user.id)

    // Step 2: Create user record in database
    console.log('💾 Creating user record in database...')
    const dbUser = await prisma.user.create({
      data: {
        authId: authData.user.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: UserRole.PLATFORM_ADMIN,
        isActive: true,
        createdBy: authData.user.id, // Self-created
        updatedBy: authData.user.id
      }
    })

    console.log('✅ User record created in database:', dbUser.id)

    // Step 3: Create agency membership
    console.log('🏢 Creating agency membership...')
    const agencyMembership = await prisma.agencyMembership.create({
      data: {
        userId: dbUser.id,
        function: userData.agencyFunction || AgencyMemberFunction.CREATIVE_DIRECTOR,
        isActive: true,
        createdBy: dbUser.id,
        updatedBy: dbUser.id
      }
    })

    console.log('✅ Agency membership created:', agencyMembership.id)

    // Step 4: Create activity log
    console.log('📝 Creating activity log...')
    await prisma.activity.create({
      data: {
        actorId: dbUser.id,
        verb: 'CREATED',
        targetType: 'user',
        targetId: dbUser.id,
        metadata: {
          action: 'admin_account_created',
          email: userData.email,
          role: 'PLATFORM_ADMIN'
        },
        createdBy: dbUser.id,
        updatedBy: dbUser.id
      }
    })

    console.log('✅ Activity logged')

    console.log('\n🎉 Admin user created successfully!')
    console.log('📋 User Details:')
    console.log(`   ID: ${dbUser.id}`)
    console.log(`   Auth ID: ${authData.user.id}`)
    console.log(`   Email: ${dbUser.email}`)
    console.log(`   Name: ${dbUser.firstName} ${dbUser.lastName}`)
    console.log(`   Role: ${dbUser.role}`)
    console.log(`   Agency Function: ${agencyMembership.function}`)
    
    if (userData.password) {
      console.log(`   Password: ${userData.password}`)
    } else {
      console.log('   Password: Generated (check Supabase Auth dashboard)')
    }

    console.log('\n🔗 Next Steps:')
    console.log('1. The user can now login using magic link at the login page')
    console.log('2. Or use the email/password if you provided one')
    console.log('3. The user has full platform admin privileges')

    return {
      user: dbUser,
      authUser: authData.user,
      agencyMembership
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    
    // Cleanup: If database user was created but something else failed
    if (error instanceof Error && error.message.includes('agency membership')) {
      console.log('🧹 Cleaning up database user...')
      try {
        await prisma.user.delete({
          where: { authId: userData.email }
        })
      } catch (cleanupError) {
        console.error('Failed to cleanup:', cleanupError)
      }
    }
    
    throw error
  }
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function main() {
  console.log('🔧 Agency Client Portal - Admin Account Creator')
  console.log('================================================\n')

  // Get user input
  const email = process.argv[2]
  const firstName = process.argv[3]
  const lastName = process.argv[4]
  const agencyFunction = process.argv[5] as AgencyMemberFunction

  if (!email || !firstName || !lastName) {
    console.log('Usage: bun run src/scripts/create-admin.ts <email> <firstName> <lastName> [agencyFunction]')
    console.log('\nExample:')
    console.log('bun run src/scripts/create-admin.ts admin@agency.com "John" "Doe" "CREATIVE_DIRECTOR"')
    console.log('\nAvailable agency functions:')
    Object.values(AgencyMemberFunction).forEach(func => {
      console.log(`  - ${func}`)
    })
    process.exit(1)
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    console.error('❌ Invalid email format')
    process.exit(1)
  }

  // Validate agency function if provided
  if (agencyFunction && !Object.values(AgencyMemberFunction).includes(agencyFunction)) {
    console.error(`❌ Invalid agency function: ${agencyFunction}`)
    console.log('Available functions:', Object.values(AgencyMemberFunction).join(', '))
    process.exit(1)
  }

  try {
    await createAdminUser({
      email,
      firstName,
      lastName,
      agencyFunction: agencyFunction || AgencyMemberFunction.CREATIVE_DIRECTOR
    })
  } catch (error) {
    console.error('\n💥 Failed to create admin user')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (import.meta.main) {
  main()
}

export { createAdminUser }
