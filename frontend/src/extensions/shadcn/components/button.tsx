import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-ngx-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 font-ngx-primary",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:transform hover:-translate-y-0.5 hover:shadow-ngx-glow-sm",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-ngx-electric-violet",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-ngx-glow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:backdrop-blur-ngx",
        link: "text-primary underline-offset-4 hover:underline hover:text-ngx-electric-violet",
        // NGX Enhanced Variants
        ngx: "ngx-btn-primary hover:shadow-ngx-glow-md hover:-translate-y-1 active:translate-y-0",
        "ngx-secondary": "ngx-btn-secondary hover:shadow-ngx-glow-sm",
        "ngx-glass": "ngx-glass border-ngx-border hover:border-ngx-border-hover backdrop-blur-ngx hover:shadow-ngx-glow-sm",
        "ngx-gradient": "ngx-gradient-primary text-ngx-white border-none hover:shadow-ngx-glow-md hover:-translate-y-1 active:translate-y-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "ngx",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
