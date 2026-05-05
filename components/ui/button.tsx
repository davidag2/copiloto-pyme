import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#2563EB] text-white shadow-lg shadow-blue-500/20 hover:bg-[#1D4ED8]",
        secondary: "border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50",
        ghost: "text-slate-700 hover:bg-slate-100",
        success: "bg-[#22C55E] text-white shadow-lg shadow-emerald-500/20 hover:bg-[#16A34A]"
      },
      size: {
        default: "h-11",
        sm: "h-9 rounded-xl px-3",
        lg: "h-12 rounded-2xl px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
