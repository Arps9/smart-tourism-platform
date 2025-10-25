import * as React from "react";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({ className = "", children, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-white shadow-sm ${className}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string; // ✅ allow custom styling
}

export function CardHeader({ children, className = "" }: CardSectionProps) {
  return <div className={`p-4 border-b ${className}`}>{children}</div>; // ✅
}

export function CardTitle({ children, className = "" }: CardSectionProps) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>; // ✅
}

export function CardDescription({ children, className = "" }: CardSectionProps) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>; // ✅
}

export function CardContent({ children, className = "" }: CardSectionProps) {
  return <div className={`p-4 ${className}`}>{children}</div>; // ✅
}
