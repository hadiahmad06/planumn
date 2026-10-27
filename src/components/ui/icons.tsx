import type { SVGProps } from "react";

/** Small stroke icons (16px default). Add new ones here rather than pulling in an icon library. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ children, size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlusIcon = (p: IconProps) => <Icon {...p}><path d="M8 3.5v9M3.5 8h9" /></Icon>;
export const CloseIcon = (p: IconProps) => <Icon {...p}><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></Icon>;
export const DotsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="3.5" cy="8" r="0.6" fill="currentColor" />
    <circle cx="8" cy="8" r="0.6" fill="currentColor" />
    <circle cx="12.5" cy="8" r="0.6" fill="currentColor" />
  </Icon>
);
export const LockIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3.5" y="7" width="9" height="6" rx="1.2" /><path d="M5.5 7V5.2a2.5 2.5 0 015 0V7" /></Icon>
);
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="7" cy="7" r="4.25" /><path d="M10.2 10.2L13 13" /></Icon>
);
export const FilterIcon = (p: IconProps) => (
  <Icon {...p}><path d="M2.5 4h11M4.5 8h7M6.5 12h3" /></Icon>
);
export const GripIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="4" r="0.6" fill="currentColor" />
    <circle cx="10" cy="4" r="0.6" fill="currentColor" />
    <circle cx="6" cy="8" r="0.6" fill="currentColor" />
    <circle cx="10" cy="8" r="0.6" fill="currentColor" />
    <circle cx="6" cy="12" r="0.6" fill="currentColor" />
    <circle cx="10" cy="12" r="0.6" fill="currentColor" />
  </Icon>
);
export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="8" cy="8" r="2" /><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1" /></Icon>
);
export const AlertIcon = (p: IconProps) => (
  <Icon {...p}><path d="M8 2.2l6 10.6H2z" /><path d="M8 6.5v2.8M8 11.1v.1" /></Icon>
);
