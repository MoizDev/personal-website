export function LogoMark({
  className,
  mono = false,
}: {
  className?: string;
  /** render a flat, all-white version (e.g. on a dark footer) */
  mono?: boolean;
}) {
  // mono inherits the surrounding text color so it can invert with the theme
  const starFill = mono ? "currentColor" : "#03a5fc";
  const bodyFill = mono ? "currentColor" : "var(--fg)";
  return (
    <svg
      viewBox="0 0 398.88 303.7"
      className={className}
      role="img"
      aria-label="Moiz Hashmi logo"
    >
      {/* the star — rotates corner-to-corner unless mono */}
      <path
        className={mono ? undefined : "star-spin"}
        fill={starFill}
        d="M132,244.8l-13.89,9.09c-12.22,8-22.66,18.44-30.66,30.66l-9.09,13.89c-4.59,7.02-14.87,7.02-19.47,0l-9.09-13.89c-8-12.22-18.44-22.66-30.66-30.66l-13.89-9.09c-7.02-4.59-7.02-14.87,0-19.47l13.89-9.09c12.22-8,22.66-18.44,30.66-30.66l9.09-13.89c4.59-7.02,14.87-7.02,19.47,0l9.09,13.89c8,12.22,18.44,22.66,30.66,30.66l13.89,9.09c7.02,4.59,7.02,14.87,0,19.47Z"
      />
      <path
        fill={bodyFill}
        d="M257.66,172.05l-46.94,124.64c-3.56,9.44-16.96,9.3-20.32-.21L91.27,15.79c-2.72-7.7,2.99-15.79,11.17-15.79h91.32c5.15,0,9.74,3.27,11.42,8.14l52.64,152.84c1.24,3.6,1.18,7.51-.16,11.07Z"
      />
      <rect
        fill={bodyFill}
        x="295.74"
        width="103.14"
        height="296.08"
        rx="11.25"
        ry="11.25"
      />
    </svg>
  );
}
