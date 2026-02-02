import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function BaseIcon({ size = 18, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function Plus(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  );
}

export function X(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  );
}

export function Search(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  );
}

export function Trash2(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l1 16h10l1-16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  );
}

export function Share2(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M18 8a3 3 0 1 0-2.83-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 14a3 3 0 1 0 2.83 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 6l-8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 14l8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="14" r="3" stroke="currentColor" strokeWidth="2" />
    </BaseIcon>
  );
}

export function CheckCircle2(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  );
}

export function KanbanSquare(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 8v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  );
}

export function Loader2(props: IconProps) {
  // Use CSS class "animate-spin" (Tailwind) when desired.
  return (
    <BaseIcon {...props}>
      <path
        d="M21 12a9 9 0 1 1-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </BaseIcon>
  );
}
