import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row">
      {/* Left Column - Image and Text */}
      <div className="lg:w-1/2 lg:flex flex-col justify-start gap-10 bg-figma-sidebar-gradient">
        {/* Main content area with image */}
        <div className="w-full">
          <Image
            src="/images/auth-login.jpg"
            alt="Error Image"
            width={800}
            height={800}
            className="w-full h-fit object-cover lg:h-[65vh]"
          />
        </div>

        {/* Bottom Text */}
        <div className="flex flex-col items-center lg:gap-4 gap-6 px-6 py-12 lg:px-12 lg:py-8 justify-center">
          <Image
            src={"/logo.png"}
            alt="Logo"
            width={400}
            height={400}
            className="w-fit object-contain h-fit max-h-12"
          />
          <p className="figma-paragraph text-center">
            We&apos;re here to help you get back on track. Authentication issues
            can happen, but we&apos;ll make sure you have secure access to your
            business portal.
          </p>
        </div>
      </div>

      {/* Right Column - Error Content */}
      <div className="flex-1 min-h-[80vh] w-full bg-foreground text-background flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md relative">
          <div className="bg-transparent border-primary/20 shadow-none">
            <div className="text-center space-y-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-figma-alert/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-figma-alert" />
              </div>
              <div className="figma-h3 text-background">
                Authentication Error
              </div>
            </div>
            <div className="space-y-6 mt-4">
              <div className="bg-destructive text-foreground rounded-lg px-3 py-2 border-dashed border border-foreground">
                <p>
                  There was a problem with your authentication. This could be
                  due to an expired or invalid link.
                </p>
              </div>

              <div className="space-y-4">
                <p className="figma-paragraph text-background/80">
                  Possible reasons:
                </p>
                <ul className="figma-paragraph text-background/70 list-disc list-inside space-y-2 ml-4">
                  <li>The magic link has expired</li>
                  <li>The link has already been used</li>
                  <li>You do not have access to this portal</li>
                </ul>
              </div>

              <div className="pt-6">
                <Link href="/auth/login" className="block">
                  <Button
                    variant="figmaPrimary2"
                    className="w-full bg-figma-primary-gradient  text-figma-text-white border-0 py-3 rounded-full font-light"
                    size="lg"
                  >
                    Try Again
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
