"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import Image from "next/image";
import { createClient } from "@/utils/supabase/clients";

interface MagicLinkLoginProps {
  redirectTo?: string;
  title?: string;
  description?: string;
}

export function MagicLinkLogin({
  redirectTo = "/",
  title = "",
  description = "",
}: MagicLinkLoginProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Pre-check if user exists in our database
      const checkResponse = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const checkJson = await checkResponse.json();

      if (!checkResponse.ok || !checkJson.ok) {
        throw new Error(checkJson.error || "Unable to verify user");
      }

      if (!checkJson.exists) {
        setError(
          "You are not registered on Figmenta client portal. Please contact the administration team for more info."
        );
        setIsLoading(false);
        return;
      }

      const appOrigin =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${appOrigin}/auth/callback?redirectTo=${encodeURIComponent(
            redirectTo
          )}`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      setIsEmailSent(true);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="w-full max-w-xl mx-auto border-0 shadow-none py-10 px-6">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-16 h-16 bg-success bg-opacity-10 rounded-full flex items-center justify-center">
            <Image src="/icons/check.svg" alt="Check" width={35} height={35} />
          </div>
          <div className="figma-h3 text-text-black mb-3">Check Your Email</div>
          <div className="figma-paragraph text-text-grey mb-2">
            We have sent a magic link to{" "}
            <strong className="text-text-black">{email}</strong>
            <p className="figma-small pt-2">
              Click the link in your email to sign in.
            </p>
          </div>
        </div>
        <div>
          <div
            className="w-fit text-sm bg-background/5 py-2 px-4 mx-auto text-center cursor-pointer hover:bg-background/10 transition-all duration-200"
            onClick={() => {
              setIsEmailSent(false);
              setEmail("");
              setIsLoading(false);
              setError(null);
            }}
          >
            Use different email
          </div>
        </div>
      </div>
    );
  }

  const showHeader = title || description;

  return (
    <div className="w-full max-w-md mx-auto border-0 shadow-none bg-transparent">
      {showHeader && (
        <div className="text-center px-0">
          {title && <div className="text-2xl font-bold">{title}</div>}
          {description && <div>{description}</div>}
        </div>
      )}

      <div className="">
        <Image
          src="/icons/currved-arrow.svg"
          alt="Login Image"
          width={800}
          height={800}
          className="w-20 h-fit object-cover absolute lg:-top-16 -top-20 lg:-left-12"
        />
      </div>

      {/* Desktop Header */}
      <div className="mb-10">
        <h2 className="figma-h3 text-pretty text-background mb-2">
          Login into your
        </h2>
        <h4 className="figma-h2 text-pretty text-primary mb-2">
          Business’s Growth
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4 px-0">
          {error && (
            <div className="bg-destructive text-foreground rounded-lg px-3 py-2 border-dashed border border-foreground">
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="">
              Email Address
            </Label>
            <input
              id="email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-transparent border border-background/20 rounded-lg px-3 py-2 placeholder:text-sm placeholder:text-background/50 focus:border-none focus:ring-0"
            />
          </div>
        </div>
        <div className="px-0">
          <Button
            type="submit"
            variant="figmaPrimary2"
            size="figmaMD"
            className="w-full rounded-full font-light"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Magic Link...
              </>
            ) : (
              <>Login</>
            )}
          </Button>
        </div>
      </form>

      <div className="w-fit mx-auto mt-4 text-center">
        <p className="figma-small cursor-pointer hover:underline select-none">
          Or contact our admin team
        </p>
      </div>
    </div>
  );
}
