import { prisma } from './prisma';
import { redirect } from 'next/navigation';

// Dynamically import the Supabase client based on context
async function getSupabaseClient() {
  try {
    // Try to import the server client first
    const { createClient } = await import('@/utils/supabase/server');
    return await createClient();
  } catch (error) {
    // If that fails, fall back to client-side client
    try {
      const { createClient } = await import('@/utils/supabase/clients');
      return createClient();
    } catch (clientError) {
      throw new Error('Could not create Supabase client');
    }
  }
}

export async function getCurrentUser() {
  // Use dynamic import to avoid importing server-only modules in client components
  const supabase = await getSupabaseClient();
  
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    // Instead of redirecting, return null for API routes
    // The calling function can handle the redirect if needed
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      authId: authUser.id,
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    // Instead of redirecting, return null for API routes
    return null;
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (user.role !== 'PLATFORM_ADMIN') {
    redirect('/unauthorized');
  }

  return user;
}

export async function requireClient() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (user.role !== 'CLIENT' && user.role !== 'CLIENT_MEMBER') {
    redirect('/unauthorized');
  }

  return user;
}