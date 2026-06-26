"use client";

// Animated CTA button (button-023). Pure-CSS hover animation: two background
// layers slide up (middle → end colour) while the label swaps. Renders the
// duplicated structure the effect needs; pass the label as children.

import type { CSSProperties, ReactNode } from "react";
import "@/app/button.css";

interface AnimatedButtonProps {
  children: ReactNode;
  /** Optional shorter label shown on mobile (≤768px) in place of children. */
  shortLabel?: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}

export default function AnimatedButton({
  children,
  shortLabel,
  onClick,
  className,
  type = "button",
}: AnimatedButtonProps) {
  // The label is rendered twice (once per animation layer), so build it once.
  const label =
    shortLabel != null ? (
      <>
        <span className="button-023__label-full">{children}</span>
        <span className="button-023__label-short">{shortLabel}</span>
      </>
    ) : (
      children
    );

  return (
    <button
      type={type}
      data-button-023=""
      className={`button-023${className ? ` ${className}` : ""}`}
      onClick={onClick}
    >
      <span className="button-023__bg">
        <span style={{ "--index": 0 } as CSSProperties} className="button-023__bg-inner is--first" />
        <span style={{ "--index": 1 } as CSSProperties} className="button-023__bg-inner is--second" />
      </span>
      <span className="button-023__inner">
        <span className="button-023__text is--first">{label}</span>
        <span aria-hidden="true" className="button-023__text is--second">
          {label}
        </span>
      </span>
    </button>
  );
}
