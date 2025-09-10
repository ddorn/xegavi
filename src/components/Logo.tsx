"use client";
import { modelLogoName, niceModelName } from "@/lib/model-metadata";

import OpenAI from "@/components/logos/openai";
import Anthropic from "@/components/logos/anthropic";
import Google from "@/components/logos/gemini";
import xAI from "@/components/logos/xai";
import DeepSeek from "@/components/logos/deepseek";

const LOGO_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  openai: OpenAI,
  anthropic: Anthropic,
  gemini: Google,
  xai: xAI,
  deepseek: DeepSeek,
};

export interface LogoProps {
  model: string;
  size?: number;
  className?: string;
}
export function Logo({ model, size, className }: LogoProps) {
  const logoName = modelLogoName(model);
  if (!logoName) return null;

  const LogoComponent = LOGO_MAP[logoName];
  if (!LogoComponent) return null;

  const alt = `${niceModelName(model)} logo ${size ?? '2rem'}`;
  return (
    <div style={{ width: size ?? '2rem', height: size ?? '2rem' }} className={className}>
      <LogoComponent />
    </div>
  );
}
