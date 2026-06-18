// eved mark — a square take on the eve logo: three bars · slash · three bars.
// Single-color via currentColor, so it inherits the brand tile's foreground
// and adapts to light/dark automatically.
export function Logo({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="eved logo"
    >
      <rect x="2.5" y="5.3" width="6" height="2.4" rx="1.1" fill="currentColor" />
      <rect x="2.5" y="10.8" width="6" height="2.4" rx="1.1" fill="currentColor" />
      <rect x="2.5" y="16.3" width="6" height="2.4" rx="1.1" fill="currentColor" />
      <path d="M9 18.5 L15 5.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <rect x="15.5" y="5.3" width="6" height="2.4" rx="1.1" fill="currentColor" />
      <rect x="15.5" y="10.8" width="6" height="2.4" rx="1.1" fill="currentColor" />
      <rect x="15.5" y="16.3" width="6" height="2.4" rx="1.1" fill="currentColor" />
    </svg>
  );
}
