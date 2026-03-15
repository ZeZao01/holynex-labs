/**
 * Logo loading utilities for PDF generation.
 * Loads agency logo from bundled assets and client logo from external URLs.
 */
import agencyLogoUrl from "@/assets/logo-transparent.png";

/** Load an image URL into a base64 data URL via canvas */
function loadImageAsBase64(url: string, maxSize = 120): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    // Timeout after 5s
    setTimeout(() => resolve(null), 5000);
    img.src = url;
  });
}

export interface PdfLogos {
  agencyLogo: string | null;
  clientLogo: string | null;
  agencyAspect: number; // width/height ratio
  clientAspect: number;
}

/** Extract likely favicon/logo URL from a website URL */
function getLogoUrlFromSite(siteUrl: string): string | null {
  if (!siteUrl) return null;
  try {
    const url = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
    // Try Google's favicon service (reliable, CORS-friendly)
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
  } catch {
    return null;
  }
}

/** Load both agency and client logos for PDF embedding */
export async function loadPdfLogos(clientSiteUrl?: string): Promise<PdfLogos> {
  const [agencyLogo, clientLogo] = await Promise.all([
    loadImageAsBase64(agencyLogoUrl, 200),
    clientSiteUrl ? loadImageAsBase64(getLogoUrlFromSite(clientSiteUrl) || "", 128) : Promise.resolve(null),
  ]);

  // Get aspect ratios
  const getAspect = (dataUrl: string | null): number => {
    if (!dataUrl) return 1;
    // Default square assumption
    return 1;
  };

  return {
    agencyLogo,
    clientLogo,
    agencyAspect: getAspect(agencyLogo),
    clientAspect: getAspect(clientLogo),
  };
}
