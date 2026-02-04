// BrandImage.jsx
// Image component with fallback support for branding assets
import React, { useState } from "react";
import { defaultBranding } from "../config/branding";

export default function BrandImage({
  src,
  fallbackSrc,
  alt = "",
  width,
  height,
  loading = "eager",
  className,
  style,
  ...props
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasFailed, setHasFailed] = useState(false);

  // Determine the fallback source
  const getFallback = () => {
    if (fallbackSrc) return fallbackSrc;
    // Default fallback based on which type of image this likely is
    return defaultBranding.logo;
  };

  const handleError = () => {
    if (!hasFailed && currentSrc !== getFallback()) {
      // Try fallback
      setCurrentSrc(getFallback());
      setHasFailed(true);
    }
  };

  // Reset state when src prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasFailed(false);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  );
}

// Convenience component for main logo with automatic fallback
export function BrandLogo({ branding, alt = "", ...props }) {
  return (
    <BrandImage
      src={branding?.logo || defaultBranding.logo}
      fallbackSrc={defaultBranding.logo}
      width={branding?.logoWidth || defaultBranding.logoWidth}
      height={branding?.logoHeight || defaultBranding.logoHeight}
      alt={alt}
      {...props}
    />
  );
}

// Convenience component for alternative logo with automatic fallback
export function BrandLogoAlt({ branding, alt = "", ...props }) {
  return (
    <BrandImage
      src={branding?.logoAlt || defaultBranding.logoAlt}
      fallbackSrc={defaultBranding.logoAlt}
      width={branding?.logoWidth || defaultBranding.logoWidth}
      height={branding?.logoHeight || defaultBranding.logoHeight}
      alt={alt}
      {...props}
    />
  );
}