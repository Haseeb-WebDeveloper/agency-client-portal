import { MagicLinkLogin } from "@/components/auth/magic-link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row">
      {/* Left Column - Image and Text */}
      <div className=" lg:w-1/2 lg:flex flex-col justify-start gap-10 bg-figma-sidebar-gradient">
        {/* Main content area with image */}
        <div className="w-full ">
          <Image
            src="/images/auth-login.jpg"
            alt="Login Image"
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
          <p className="figma-paragraph">
            Join us for a seamless online experience. Access your account
            effortlessly. Stay secure and enjoy a hassle-free growth for your
            business.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 min-h-[80vh] w-full bg-foreground text-background flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md relative">
          <MagicLinkLogin  redirectTo="/dashboard" />
        </div>
      </div>
    </div>
  );
}
