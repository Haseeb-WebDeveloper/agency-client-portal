import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/types/enums';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getCurrentUser();
  
  // Redirect based on user role
  if (user.role === UserRole.PLATFORM_ADMIN) {
    redirect('/admin');
  } else if (user.role === UserRole.CLIENT || user.role === UserRole.CLIENT_MEMBER) {
    redirect('/client');
  } else {
    // For other roles (like AGENCY_MEMBER), redirect to unauthorized
    redirect('/unauthorized');
  }
}
