"use client";

import { useRef, type ElementType, type HTMLAttributes, type PointerEvent } from "react";

type SpotlightCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div";
  spotlightColor?: string;
};

// Adapted from React Bits SpotlightCard with semantic element support.
export function SpotlightCard({ as = "article", className = "", spotlightColor = "rgba(255, 255, 255, 0.16)", children, onPointerMove, ...props }: SpotlightCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const Tag = as as ElementType;

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const element = ref.current;
    if (!element || event.pointerType === "touch") return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
    element.style.setProperty("--spotlight-color", spotlightColor);
    onPointerMove?.(event);
  };

  return <Tag ref={(node: HTMLElement | null) => { ref.current = node; }} className={`spotlight-card ${className}`} onPointerMove={handlePointerMove} {...props}>{children}</Tag>;
}
