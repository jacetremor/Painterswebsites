"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProjectImage } from "@/lib/types";

export function BeforeAfter({ before, after, title }: { before: ProjectImage; after: ProjectImage; title: string }) {
  const [position, setPosition] = useState(50);
  return (
    <div className="comparison" style={{ "--position": `${position}%` } as React.CSSProperties}>
      <Image src={before.src} alt={before.alt} fill sizes="(max-width: 760px) 100vw, 50vw" />
      <div className="comparison__after"><Image src={after.src} alt={after.alt} fill sizes="(max-width: 760px) 100vw, 50vw" /></div>
      <div className="comparison__labels" aria-hidden="true"><span>Before</span><span>After</span></div>
      <label className="sr-only" htmlFor={`compare-${before.id}`}>Show before or after view for {title}</label>
      <input id={`compare-${before.id}`} type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} aria-valuetext={`${position}% after image visible`} />
    </div>
  );
}
