import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Figma Design System Variants
        figmaPrimary:
          "bg-[#5B4BFF] text-white rounded-lg font-inter text-sm font-semibold hover:bg-[#7F70FF] ",
        figmaPrimary2:
          "bg-[#6B42D1] text-white rounded-lg font-inter text-sm font-semibold hover:bg-[#7F70FF] ",
        figmaSecondary:
          "bg-[#EBE0FF] text-[#5B4BFF] border border-[#C7BAFF] rounded-lg font-inter text-sm font-semibold hover:bg-[#C7BAFF] transition-all duration-200 ease-out",
        figmaSuccess:
          "bg-[#00C896] text-white rounded-lg font-inter text-sm font-semibold hover:bg-[#00C896]/90 transition-all duration-200 ease-out shadow-sm",
        figmaWarning:
          "bg-[#FFA726] text-white rounded-lg font-inter text-sm font-semibold hover:bg-[#FFA726]/90 transition-all duration-200 ease-out shadow-sm",
        figmaAlert:
          "bg-[#FF6B6B] text-white rounded-lg font-inter text-sm font-semibold hover:bg-[#FF6B6B]/90 transition-all duration-200 ease-out shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        // Figma sizes
        figmaSM: "h-8 px-4 py-2 text-xs",
        figmaMD: "px-6 py-3 text-sm",
        figmaLG: "h-12 px-8 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
