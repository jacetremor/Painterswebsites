"use client";

import { useEffect, useRef, type CSSProperties, type ElementType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

type SplitTextProps = {
  text: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  duration?: number;
  start?: string;
  style?: CSSProperties;
};

// Adapted from React Bits SplitText; source is kept local so timing can follow each tenant theme.
export function SplitText({ text, tag = "h1", className = "", delay = 0.055, duration = 1.05, start = "top 92%", style }: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: GSAPSplitText | undefined;
    let animation: gsap.core.Tween | undefined;
    let cancelled = false;

    void document.fonts.ready.then(() => {
      if (cancelled || !ref.current) return;
      split = new GSAPSplitText(ref.current, { type: "words", wordsClass: "split-word", smartWrap: true });
      animation = gsap.fromTo(
        split.words,
        { yPercent: 115, opacity: 0, rotate: 2 },
        {
          yPercent: 0,
          opacity: 1,
          rotate: 0,
          duration,
          stagger: delay,
          ease: "power4.out",
          force3D: true,
          scrollTrigger: { trigger: ref.current, start, once: true },
        },
      );
    });

    return () => {
      cancelled = true;
      animation?.scrollTrigger?.kill();
      animation?.kill();
      split?.revert();
    };
  }, [delay, duration, start, text]);

  const Tag = tag as ElementType;
  return <Tag ref={(node: HTMLElement | null) => { ref.current = node; }} className={`split-text ${className}`} style={style}>{text}</Tag>;
}
