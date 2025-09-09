
import { getCurrentUser } from '@/lib/auth';
import { AppLayout } from '@/components/shared/app-layout';

export default async function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user data for the layout
  const user = await getCurrentUser();
  
  // Serialize user data to ensure it's safe for client components
  const serializedUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    role: user.role,
    isActive: user.isActive,
  };

  return (
    <AppLayout user={serializedUser}>
      {children}
    </AppLayout>
  );
}
  