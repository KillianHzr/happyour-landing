// Wrapper div for a shutter scroll transition. The script
// (initShutterScrollTransition) finds every [data-shutter-scroll-transition]
// and builds the rows inside; init is called once for the whole page from
// page.tsx, so this component only renders the configured wrapper.
//
// `color` is the shutter colour (the rows use currentColor) — set it to the
// background of the *next* section so the wipe blends seamlessly into it.
//
// `scrollStart` / `scrollEnd` are GSAP ScrollTrigger position strings ("trigger
// viewport"). The trigger is the host section. The defaults run the wipe deep
// in the section's exit (begins once its bottom has reached mid-viewport) so it
// doesn't fire too early. Push them lower (e.g. "bottom 35%") to start deeper.

import "@/app/shutter-transition.css";

type ShutterMode = "cover" | "reveal";

interface ShutterTransitionProps {
  color: string;
  rows?: number;
  rowsTablet?: number;
  rowsMobile?: number;
  mode?: ShutterMode;
  shutterHeight?: string;
  scrollStart?: string;
  scrollEnd?: string;
}

export default function ShutterTransition({
  color,
  rows = 16,
  rowsTablet = 10,
  rowsMobile = 6,
  mode,
  shutterHeight,
  scrollStart = "bottom 50%",
  scrollEnd = "bottom top",
}: ShutterTransitionProps) {
  return (
    <div
      data-shutter-scroll-transition=""
      data-rows={rows}
      data-rows-tablet={rowsTablet}
      data-rows-mobile={rowsMobile}
      data-mode={mode}
      data-shutter-height={shutterHeight}
      data-scroll-start={scrollStart}
      data-scroll-end={scrollEnd}
      className="shutter-scroll-transition"
      style={{ color }}
    />
  );
}
