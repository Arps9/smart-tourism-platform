import * as React from "react";

export function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-${color}-100 text-${color}-800 text-xs font-medium px-3 py-1`}
    >
      {children}
    </span>
  );
}
