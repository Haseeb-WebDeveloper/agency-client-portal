import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0A1D]">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold ">Access Denied</h2>
          <p className="mt-2 text-sm ">
            Your account is not authorized to access this platform.
          </p>
        </div>

        <div>
          You don't have permission to access this area. This could be because:
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              Your account doesn't have the required role for this section
            </li>
            <li>
              You're trying to access an admin area as a client, or vice versa
            </li>
            <li>Your account is inactive or not properly configured</li>
          </ul>
          Please contact your administrator if you believe this is an error.
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
