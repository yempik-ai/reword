"use client";

import { useEffect, useRef } from "react";
import { basePath } from "@/content/site";

/** The recorded session. It plays by itself unless the visitor asked for less motion. */
export default function DemoVideo({ label }: { label: string }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void video.current?.play().catch(() => undefined);
  }, []);

  return (
    <video
      ref={video}
      className="demo-video"
      aria-label={label}
      poster={`${basePath}/demo-poster.png`}
      width={1280}
      height={800}
      controls
      muted
      loop
      playsInline
      preload="metadata"
    >
      <source src={`${basePath}/demo.mp4`} type="video/mp4" />
    </video>
  );
}
