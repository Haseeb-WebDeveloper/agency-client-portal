import { getCurrentUser } from "@/lib/auth";
import { AppLayout } from "@/components/shared/app-layout";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const serializedUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    role: user.role,
    isActive: user.isActive,
  };
  return <AppLayout user={serializedUser}>{children}</AppLayout>;
}
