import { requireAdmin } from "@/lib/auth";
import { AppLayout } from "@/components/shared/app-layout";
import { redirect } from "next/navigation";

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Get user data for the layout - enforce admin role
    const user = await requireAdmin();

    // Serialize user data to ensure it's safe for client components
    const serializedUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
    };

    return <AppLayout user={serializedUser}>{children}</AppLayout>;
  } catch (error) {
    // Redirect to login if not authenticated or not admin
    redirect("/login");
  }
}
