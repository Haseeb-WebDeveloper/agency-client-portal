import { getCurrentUser } from '@/lib/auth';
import { AdminLayout } from '@/components/admin/admin-layout';

export default async function AdminLayoutWrapper({
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
    <AdminLayout user={serializedUser}>
      {children}
    </AdminLayout>
  );
}
