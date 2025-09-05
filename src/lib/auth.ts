import { createClient } from '@/utils/supabase/server';
import { prisma } from './prisma';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const supabase = await createClient();
  
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    redirect('/login');
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
    redirect('/unauthorized');
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  
  if (user.role !== 'PLATFORM_ADMIN') {
    redirect('/unauthorized');
  }

  return user;
}

export async function requireClient() {
  const user = await getCurrentUser();
  
  if (user.role !== 'CLIENT' && user.role !== 'CLIENT_MEMBER') {
    redirect('/unauthorized');
  }

  return user;
}