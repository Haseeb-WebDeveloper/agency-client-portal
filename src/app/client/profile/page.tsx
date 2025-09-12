import { requireClient } from "@/lib/auth";
import { ClientProfileForm } from "@/components/client/client-profile-form";

export default async function ClientProfilePage() {
  const user = await requireClient();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Profile Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and personal information.
        </p>
      </div>

      <ClientProfileForm user={user} />
    </div>
  );
}
