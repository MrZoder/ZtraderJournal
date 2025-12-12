// src/components/SignedImage.jsx
import React, { useEffect, useState } from "react";
import { ensureSignedImageUrl, storagePathFromUrl } from "../utils/tradeService";

/**
 * SignedImage
 * ----------
 * Renders any Supabase Storage image (signed/public) and auto-refreshes the URL
 * if it has expired. Also accepts raw storage paths (e.g., "userId/1699999999.png")
 * and normal external URLs.
 *
 * Props:
 *  - src: string (signed URL | public URL | storage path)
 *  - alt: string
 *  - className, style, imgProps: pass-through to <img>
 *  - fallback: JSX shown when there is no src
 */
export default function SignedImage({
  src,
  alt = "",
  className = "",
  style,
  imgProps = {},
  fallback = null,
}) {
  const [url, setUrl] = useState(src || "");
  const [triedRefresh, setTriedRefresh] = useState(false);

  // Reset when src changes
  useEffect(() => {
    setUrl(src || "");
    setTriedRefresh(false);
  }, [src]);

  // If the image fails (likely expired signed URL), re-sign and retry once.
  const handleError = async () => {
    if (triedRefresh) return;
    setTriedRefresh(true);

    // If it's a Supabase storage URL, convert to path; or accept a raw path.
    const maybePath =
      typeof src === "string"
        ? storagePathFromUrl(src) || (src.startsWith("/") ? src.slice(1) : src)
        : null;

    // If not a Supabase storage path/URL, we can't refresh → bail.
    if (!maybePath) return;

    try {
      const fresh = await ensureSignedImageUrl(maybePath);
      if (fresh) setUrl(fresh);
    } catch {
      // keep broken state so devs notice issues; don't loop
    }
  };

  if (!url) return fallback;

  return (
    <img
      src={url}
      alt={alt}
      onError={handleError}
      className={className}
      style={style}
      {...imgProps}
    />
  );
}
