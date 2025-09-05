import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ClientDashboard() {
  // This will redirect to login if not authenticated
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-foreground/60 mb-8">
            This is your client dashboard. More features coming soon!
          </p>
          
          <div className="bg-card border border-primary/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Client Portal
            </h2>
            <p className="text-foreground/60">
              Your client portal is being set up. You'll be able to view your projects, 
              contracts, and communicate with the agency team here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
