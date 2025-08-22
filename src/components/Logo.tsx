"use client";

import { useEffect, useState } from "react";

export function Logo({ src, size, alt }: { src?: string; size: number; alt: string }) {
  const [ok, setOk] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setOk(false);
      return;
    }
    let mounted = true;
    const img = new Image();
    img.onload = () => mounted && setOk(true);
    img.onerror = () => mounted && setOk(false);
    img.src = src;
    return () => {
      mounted = false;
    };
  }, [src]);

  if (!src || !ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={size} height={size} style={{ width: size, height: size }} />
  );
}
