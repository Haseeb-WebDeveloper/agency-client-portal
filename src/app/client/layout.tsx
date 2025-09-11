import { requireClient } from "@/lib/auth";
import { AppLayout } from "@/components/shared/app-layout";
import { redirect } from "next/navigation";
import { ClientPerformanceMonitor } from "@/components/client/performance-monitor";

export default async function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Get user data for the layout - enforce client role
    const user = await requireClient();

    // Serialize user data to ensure it's safe for client components
    const serializedUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
    };

    return (
      <AppLayout user={serializedUser}>
        {children}
        <ClientPerformanceMonitor />
      </AppLayout>
    );
  } catch (error) {
    // Redirect to login if not authenticated or not client
    redirect("/login");
  }
}
