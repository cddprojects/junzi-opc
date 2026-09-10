"use client";

import { IntroCover, CaseCover } from "@/components/covers";
import type { CatalogVideo } from "@/lib/data";

export function VideoBlock({
  video,
  fallback,
}: {
  video?: CatalogVideo;
  fallback?: "intro" | "case";
}) {
  if (!video && fallback === "intro") return <IntroCover />;
  if (!video && fallback === "case") return <CaseCover />;
  if (!video) return null;

  if (video.videoUrl) {
    return (
      <div className="mp-media overflow-hidden bg-black">
        <video
          className="aspect-video w-full"
          controls
          preload="none"
          poster={video.poster}
          src={video.videoUrl}
        />
      </div>
    );
  }

  if (video.poster) {
    return (
      <div className="mp-media relative aspect-video overflow-hidden bg-[#2a3340] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.poster}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative flex h-full flex-col justify-end p-4">
          <p className="font-serif text-[18px] font-semibold md:text-[22px]">{video.overlay || video.title}</p>
          {video.duration && <p className="mt-2 self-end text-[11px] text-white/80">{video.duration}</p>}
        </div>
        <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-lg text-white">
          ▶
        </span>
      </div>
    );
  }

  if (fallback === "case") return <CaseCover />;
  return <IntroCover />;
}
