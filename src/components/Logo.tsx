"use client";

import { useEffect, useMemo, useState } from "react";
import { modelLogoPath, niceModelName } from "@/lib/model-metadata";

export interface LogoProps {
  model: string;
  size?: number;
  className?: string;
}

export function Logo({ model, size, className }: LogoProps) {
  const src = modelLogoPath(model) ?? undefined;
  const alt = `${niceModelName(model)} logo`;

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
