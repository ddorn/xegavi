"use client";

import { useEffect, useState } from "react";

export interface LogoProps {
  src?: string;
  size?: number;
  alt: string;
  className?: string;
}

export function Logo({ src, size, alt, className }: LogoProps) {
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
    <img
      src={src}
      alt={alt}
      style={{
        width: size ?? '100%',
        height: size ?? '100%',
        objectFit: 'contain',
        aspectRatio: '1 / 1'
      }}
      className={className}
    />
  );
}
