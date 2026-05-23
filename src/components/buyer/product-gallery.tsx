"use client";

import { useState } from "react";

// Amazon-style gallery: vertical thumbnail column on the left, main image
// on the right. Hover/click a thumb to swap the main image. No zoom (MVP).

export function ProductGallery({
  images,
  title,
}: {
  images: { url: string }[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const cover =
    images[active]?.url ??
    "https://placehold.co/800x800/png?text=No+Image";

  return (
    <div className="flex gap-3">
      {images.length > 1 ? (
        <div className="flex flex-col gap-2">
          {images.slice(0, 6).map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`h-12 w-12 cursor-pointer overflow-hidden rounded-sm border-2 transition-colors duration-150 ${
                i === active ? "border-accent" : "border-border hover:border-accent/60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex-1 overflow-hidden rounded-md border border-border bg-background">
        <div className="aspect-square w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
