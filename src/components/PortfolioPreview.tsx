import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewMode = "thumbnail" | "iframe" | "image_mockup" | "mixed" | "none";

interface PortfolioPreviewProps {
  title: string;
  systemUrl?: string | null;
  thumbnailUrl?: string | null;
  gallery?: string[] | null;
  mode?: PreviewMode;
  allowPreview?: boolean | null;
  openLabel?: string;
  onOpenSystem?: () => void;
  className?: string;
}

const IFRAME_TIMEOUT_MS = 3500;

export default function PortfolioPreview({
  title,
  systemUrl,
  thumbnailUrl,
  gallery,
  mode = "thumbnail",
  allowPreview = true,
  openLabel = "Abrir sistema",
  onOpenSystem,
  className,
}: PortfolioPreviewProps) {
  const galleryItems = useMemo(() => {
    const items = [thumbnailUrl, ...(gallery || [])].filter(Boolean) as string[];
    return Array.from(new Set(items));
  }, [thumbnailUrl, gallery]);

  const [selectedImage, setSelectedImage] = useState<string | null>(galleryItems[0] || null);
  const [iframeState, setIframeState] = useState<"idle" | "loading" | "ready" | "fallback">("idle");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setSelectedImage(galleryItems[0] || null);
  }, [galleryItems]);

  const shouldTryIframe = Boolean(
    allowPreview &&
    systemUrl &&
    (mode === "iframe" || mode === "mixed")
  );

  useEffect(() => {
    if (!shouldTryIframe) {
      setIframeState("fallback");
      return;
    }
    setIframeState("loading");
    const timeout = window.setTimeout(() => {
      setIframeState((current) => (current === "ready" ? current : "fallback"));
    }, IFRAME_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [shouldTryIframe, systemUrl, mode, retryKey]);

  const handleIframeLoad = () => {
    setIframeState("ready");
  };

  const handleIframeError = () => {
    setIframeState("fallback");
  };

  const fallbackImage = selectedImage || thumbnailUrl || galleryItems[0] || null;
  const showIframe = shouldTryIframe && iframeState !== "fallback";
  const showImage = mode === "thumbnail" || mode === "image_mockup" || !showIframe;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-2xl overflow-hidden border border-border bg-muted">
        {showIframe ? (
          <div className="aspect-video relative">
            <iframe
              key={retryKey}
              src={systemUrl || ""}
              className="absolute inset-0 w-full h-full"
              title={title}
              loading="lazy"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
            {iframeState === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-background/70">
                Carregando preview...
              </div>
            )}
          </div>
        ) : showImage ? (
          <div className="relative">
            {mode === "image_mockup" ? (
              <div className="bg-background">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/70">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-muted-foreground truncate">{title}</span>
                </div>
                {fallbackImage ? (
                  <img src={fallbackImage} alt={title} className="w-full h-full object-cover aspect-video" />
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <span className="font-display text-5xl font-bold text-primary/20">{title.charAt(0)}</span>
                  </div>
                )}
              </div>
            ) : fallbackImage ? (
              <img src={fallbackImage} alt={title} className="w-full h-full object-cover aspect-video" />
            ) : (
              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <span className="font-display text-5xl font-bold text-primary/20">{title.charAt(0)}</span>
              </div>
            )}
            {shouldTryIframe && iframeState === "fallback" && (
              <div className="absolute inset-0 flex items-end justify-end p-3">
                <span className="text-[11px] px-2 py-1 rounded-full bg-background/80 border border-border text-muted-foreground">
                  Preview incorporado indisponivel
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {galleryItems.length > 1 && mode !== "iframe" && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {galleryItems.map((url) => (
            <button
              key={url}
              onClick={() => setSelectedImage(url)}
              className={cn(
                "shrink-0 rounded-lg overflow-hidden border-2 transition",
                selectedImage === url ? "border-primary" : "border-border hover:border-primary/40",
              )}
            >
              <img src={url} alt="" className="h-14 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" className="gap-2" onClick={onOpenSystem} disabled={!systemUrl}>
          {openLabel} <ExternalLink className="h-4 w-4" />
        </Button>
        {shouldTryIframe && iframeState === "fallback" && (
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => {
              setRetryKey((current) => current + 1);
              setIframeState("loading");
            }}
          >
            Tentar preview <RefreshCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
