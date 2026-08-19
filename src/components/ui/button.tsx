import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] select-none",
  {
    variants: {
      variant: {
        // Primary — amber gradient, warm glow
        default: [
          "rounded-full text-[#0A0A0A]",
          "bg-[linear-gradient(135deg,#E0B458,#C49030)]",
          "shadow-[0_4px_24px_rgba(212,164,71,0.35),0_1px_3px_rgba(0,0,0,0.3)]",
          "hover:shadow-[0_4px_32px_rgba(212,164,71,0.5),0_1px_3px_rgba(0,0,0,0.3)]",
          "hover:brightness-110",
        ].join(" "),
        // Secondary — glass surface
        secondary: [
          "rounded-full",
          "glass text-[var(--color-text-primary)]",
          "hover:bg-[rgba(255,255,255,0.09)]",
        ].join(" "),
        // Ghost — transparent
        ghost: [
          "rounded-full",
          "text-[var(--color-text-secondary)]",
          "hover:text-[var(--color-text-primary)]",
          "hover:bg-[rgba(255,255,255,0.05)]",
        ].join(" "),
        // Destructive
        destructive: [
          "rounded-full",
          "bg-[var(--color-destructive)] text-white",
          "hover:opacity-90",
        ].join(" "),
        // Outline
        outline: [
          "rounded-full border border-[rgba(255,255,255,0.12)]",
          "text-[var(--color-text-primary)]",
          "hover:bg-[rgba(255,255,255,0.05)]",
        ].join(" "),
        // Link
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline px-0 rounded-none",
      },
      size: {
        sm:      "h-8 px-4 text-xs",
        default: "h-11 px-6",
        lg:      "h-13 px-8 text-[15px]",
        xl:      "h-14 px-10 text-base",
        icon:    "h-10 w-10 rounded-full",
        "icon-sm": "h-8 w-8 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
