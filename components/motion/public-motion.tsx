"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR = [
  "main > .section > .container",
  "main > .cta-band > .container",
  ".page-hero__content > *:not(.breadcrumb)",
  ".service-directory a",
  ".location-directory a",
  ".project-grid > *",
  ".faq details",
].join(",");

export function PublicMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const body = document.body;
    const progress = document.querySelector<HTMLElement>(".scroll-progress__bar");
    const hero = document.querySelector<HTMLElement>(".hero, .page-hero");
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    const depthTargets = Array.from(document.querySelectorAll<HTMLElement>(".feature-media, .project-grid .card"));

    body.classList.add("motion-enabled", "route-arriving");
    let routeFrame = window.requestAnimationFrame(() => {
      routeFrame = window.requestAnimationFrame(() => body.classList.remove("route-arriving"));
    });

    if (reducedMotion) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
      return () => {
        window.cancelAnimationFrame(routeFrame);
        body.classList.remove("motion-enabled", "route-arriving");
      };
    }

    revealTargets.forEach((element, index) => {
      element.classList.add("motion-reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });
    revealTargets.forEach((element) => observer.observe(element));

    let frame = 0;
    const updateScrollEffects = () => {
      frame = 0;
      const maximum = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      progress?.style.setProperty("--scroll-progress", String(Math.min(window.scrollY / maximum, 1)));
      hero?.style.setProperty("--parallax-y", `${Math.min(window.scrollY * 0.075, 64)}px`);
      body.classList.toggle("has-scrolled", window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScrollEffects);
    };
    updateScrollEffects();
    window.addEventListener("scroll", onScroll, { passive: true });

    const pointerCleanups = depthTargets.map((element) => {
      const move = (event: globalThis.PointerEvent) => {
        if (event.pointerType === "touch") return;
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.setProperty("--tilt-x", `${-y * 3.5}deg`);
        element.style.setProperty("--tilt-y", `${x * 4.5}deg`);
        element.style.setProperty("--glare-x", `${(x + 0.5) * 100}%`);
        element.style.setProperty("--glare-y", `${(y + 0.5) * 100}%`);
      };
      const leave = () => {
        element.style.setProperty("--tilt-x", "0deg");
        element.style.setProperty("--tilt-y", "0deg");
      };
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerleave", leave);
      return () => {
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerleave", leave);
      };
    });

    return () => {
      window.cancelAnimationFrame(routeFrame);
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      pointerCleanups.forEach((cleanup) => cleanup());
      body.classList.remove("motion-enabled", "route-arriving", "has-scrolled");
    };
  }, [pathname]);

  return <div className="scroll-progress" aria-hidden="true"><span className="scroll-progress__bar" /></div>;
}
