"use client";

import { useState } from "react";

type IntegrationProviderLogoProps = {
  name: string;
  logoUrl: string;
  size?: "sm" | "md";
};

export function IntegrationProviderLogo({
  name,
  logoUrl,
  size = "md",
}: IntegrationProviderLogoProps) {
  const [hasError, setHasError] = useState(false);

  const boxSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  if (hasError) {
    return (
      <div
        className={`${boxSize} rounded-md bg-muted flex items-center justify-center font-semibold ${textSize}`}
        aria-label={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${name} logo`}
      className={`${boxSize} rounded-md object-contain bg-white p-1`}
      onError={() => setHasError(true)}
    />
  );
}
