"use client";

import { useState } from "react";
import { Play } from "lucide-react";

// Amazon-style gallery: vertical thumbnail column on the left, main image
// on the right. When an avatar try-on video is present it becomes the first
// slot (poster thumbnail with a play badge); selecting it plays muted-loop.

type GalleryVideo = { url: string; poster: string | null };

export function ProductGallery({
  images,
  title,
  video,
}: {
  images: { url: string }[];
  title: string;
  video?: GalleryVideo | null;
}) {
  // Slot 0 is the video when present; image slots follow.
  const [active, setActive] = useState(0);
  const hasVideo = !!video?.url;
  const fallback = "https://placehold.co/800x800/F4E9E1/BE185D/png?text=No+Image";
  const cover = images[0]?.url ?? fallback;

  // Thumbnails: video first (if any), then images.
  const thumbs: Array<{ kind: "video" | "image"; url: string }> = [
    ...(hasVideo ? [{ kind: "video" as const, url: video!.poster ?? cover }] : []),
    ...images.map((img) => ({ kind: "image" as const, url: img.url })),
  ];

  const showVideo = hasVideo && active === 0;
  const imageIndex = hasVideo ? active - 1 : active;
  const mainImage = images[imageIndex]?.url ?? cover;

  return (
    <div className="flex gap-3">
      {thumbs.length > 1 ? (
        <div className="flex flex-col gap-2">
          {thumbs.slice(0, 7).map((t, i) => (
            <button
              key={t.url + i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={t.kind === "video" ? "Show try-on video" : `Show image ${i + 1}`}
              className={`relative h-12 w-12 cursor-pointer overflow-hidden rounded-lg border-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                i === active ? "border-accent" : "border-border hover:border-accent/60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              {t.kind === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-4 w-4 fill-white text-white" aria-hidden />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card">
        <div className="aspect-square w-full">
          {showVideo ? (
            <video
              src={video!.url}
              poster={video!.poster ?? cover}
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              className="h-full w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={title} className="h-full w-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}
