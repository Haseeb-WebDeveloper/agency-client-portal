import { AdminProfileForm } from "@/components/admin/admin-profile-form";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProfilePage() {
  const user = await requireAdmin();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and personal information.
        </p>
      </div>

      <AdminProfileForm user={user} />
    </div>
  );
}
