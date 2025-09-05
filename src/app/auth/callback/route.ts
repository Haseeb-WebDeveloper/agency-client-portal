import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user exists in our database
      const existingUser = await prisma.user.findUnique({
        where: { authId: data.user.id }
      })

      if (!existingUser) {
        // User doesn't exist in our database, redirect to unauthorized page
        return NextResponse.redirect(`${origin}/unauthorized`)
      }

      // Log successful login
      await prisma.activity.create({
        data: {
          actorId: existingUser.id,
          verb: 'MESSAGE_SENT', // Using MESSAGE_SENT as a general activity for login
          targetType: 'user',
          targetId: existingUser.id,
          metadata: {
            action: 'user_login',
            method: 'magic_link'
          },
          createdBy: existingUser.id,
          updatedBy: existingUser.id
        }
      })

      // Redirect based on user role
      let redirectPath = redirectTo
      
      if (existingUser.role === UserRole.PLATFORM_ADMIN) {
        redirectPath = '/admin'
      } else if (existingUser.role === UserRole.CLIENT || existingUser.role === UserRole.CLIENT_MEMBER) {
        redirectPath = '/client'
      } else if (existingUser.role === UserRole.AGENCY_MEMBER) {
        redirectPath = '/agency'
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?message=Could not authenticate user`)
}


