import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "success"
    | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        {
          "bg-brand-blue text-white": variant === "default",
          "bg-gray-100 text-gray-800": variant === "secondary",
          "border border-gray-200 text-gray-700": variant === "outline",
          "bg-red-100 text-red-700": variant === "destructive",
          "bg-green-100 text-green-700": variant === "success",
          "bg-amber-100 text-amber-700": variant === "warning",
        },
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
