import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/cn";

type ProductPhotoProps = {
  src: string | null;
  alt: string;
  loading?: boolean;
  className?: string;
  overlay?: boolean;
  onClear?: () => void;
  clearLabel?: string;
};

export function ProductPhoto({
  src,
  alt,
  loading = false,
  className,
  overlay = true,
  onClear,
  clearLabel,
}: ProductPhotoProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    src ? "loading" : "error",
  );

  useEffect(() => {
    setStatus(src ? "loading" : "error");
  }, [src]);

  const showSkeleton = loading || (Boolean(src) && status === "loading");
  const showImage = Boolean(src) && status !== "error" && !loading;
  const showFallback = !showSkeleton && (!src || status === "error");

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-900",
        className,
      )}
    >
      {showSkeleton ? (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 via-slate-700/80 to-slate-800"
          aria-hidden="true"
        >
          <div className="absolute inset-x-6 top-1/2 h-3 -translate-y-6 rounded-full bg-white/10" />
          <div className="absolute inset-x-10 top-1/2 h-3 translate-y-1 rounded-full bg-white/5" />
        </div>
      ) : null}

      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt={alt}
          width={800}
          height={450}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}

      {showFallback ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 px-4 text-center">
          <svg
            viewBox="0 0 64 64"
            width={48}
            height={48}
            className="size-12 text-slate-500"
            aria-hidden="true"
          >
            <rect
              x="8"
              y="14"
              width="48"
              height="36"
              rx="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <circle cx="22" cy="28" r="4" fill="currentColor" />
            <path
              d="M12 44l12-12 8 8 10-14 10 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {overlay ? (
            <p className="max-w-full truncate text-sm font-medium text-slate-200">
              {alt}
            </p>
          ) : (
            <Package className="size-5 text-slate-500" aria-hidden="true" />
          )}
        </div>
      ) : null}

      {onClear && src && !loading ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute end-3 top-3 z-10 rounded-full bg-slate-950/80 px-2 py-1 text-xs text-white hover:bg-slate-800"
          aria-label={clearLabel}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
