import type { SVGProps } from "react";
import { Sprout } from "lucide-react";

import { cn } from "@/lib/utils";

type OutsightMarkProps = SVGProps<SVGSVGElement>;

export function OutsightMark({ className, ...props }: OutsightMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="4" width="56" height="56" rx="18" fill="#4F46E5" />
      <rect x="7" y="7" width="50" height="50" rx="15" fill="#EEF2FF" fillOpacity="0.12" />
      <Sprout
        x={10}
        y={10}
        width={44}
        height={44}
        color="#F8FAFC"
        strokeWidth={2.4}
        absoluteStrokeWidth
      />
    </svg>
  );
}
