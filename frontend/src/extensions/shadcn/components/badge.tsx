import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-ngx-full border px-ngx-3 py-ngx-1 text-xs font-semibold font-ngx-primary transition-all duration-ngx-normal focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 uppercase tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 hover:shadow-ngx-glow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-ngx-border hover:border-ngx-border-hover",
        // NGX Enhanced Variants
        ngx: "badge-ngx",
        "ngx-outline": "badge-ngx-outline",
        "ngx-prime": "bg-ngx-prime text-ngx-white border-transparent hover:bg-ngx-prime/dark hover:shadow-ngx-glow-sm",
        "ngx-longevity": "bg-ngx-longevity text-ngx-white border-transparent hover:bg-ngx-longevity/dark hover:shadow-ngx-glow-sm",
        "ngx-custom": "bg-ngx-custom text-ngx-white border-transparent hover:bg-ngx-custom/dark hover:shadow-ngx-glow-sm",
      },
    },
    defaultVariants: {
      variant: "ngx",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
