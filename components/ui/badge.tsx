import * as React from "react";
import clsx from "clsx"; // if not installed, run: npm install clsx

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "success" | "danger" | "outline"; // ✅ added variants
}

export function Badge({ children, className = "", variant = "default" }: BadgeProps) {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={clsx(
        "inline-block px-3 py-1 text-xs font-medium rounded-full",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
