"use client";

import { useState } from "react";

export default function FilamentDetailImage({
  image,
  alt,
  colorHex,
}: {
  image?: string;
  alt: string;
  colorHex?: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 sm:h-full">
      {image && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element -- image externe (CDN du catalogue), pas de config next/image pour ce domaine
        <img
          src={image}
          alt={alt}
          onError={() => setImageError(true)}
          className="h-full w-full object-contain p-6"
        />
      ) : (
        <span
          className="h-28 w-28 rounded-full border border-slate-200 dark:border-slate-700"
          style={{ backgroundColor: colorHex ?? "#cccccc" }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
