"use client";
import { inferCompany, niceModelName } from "@/lib/model-metadata";

import OpenAI from "@/components/logos/openai";
import Anthropic from "@/components/logos/anthropic";
import Google from "@/components/logos/gemini";
import xAI from "@/components/logos/xai";
import DeepSeek from "@/components/logos/deepseek";

const LOGO_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  OpenAI: OpenAI,
  Anthropic: Anthropic,
  Google: Google,
  xAI: xAI,
  DeepSeek: DeepSeek,
};

export interface LogoProps {
  model: string;
  size?: number;
  className?: string;
}
export function Logo({ model, size, className }: LogoProps) {
  const company = inferCompany(model);
  if (!company) return null;

  const LogoComponent = LOGO_MAP[company];
  if (!LogoComponent) return null;

  const alt = `${niceModelName(model)} logo`;
  return (
    <div style={{ width: size ?? '2rem', height: size ?? '2rem' }} className={className} aria-label={alt} role="img">
      <LogoComponent />
    </div>
  );
}
