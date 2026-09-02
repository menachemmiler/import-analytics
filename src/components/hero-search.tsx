import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLanguage } from "./language-provider";
import { ProductPhoto } from "./product-photo";

type HeroSearchProps = {
  query: string;
  onQueryChange: (value: string) => void;
  imageUrl: string | null;
  productName: string;
  imageLoading: boolean;
  onFile: (file: File | null) => void;
  canClear?: boolean;
  loading: boolean;
  error: string | null;
  onAnalyze: () => void;
};

export function HeroSearch({
  query,
  onQueryChange,
  imageUrl,
  productName,
  imageLoading,
  onFile,
  canClear = false,
  loading,
  error,
  onAnalyze,
}: HeroSearchProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) return;
    onFile(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function onSelect(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    onAnalyze();
  }

  const hasPreview = Boolean(imageUrl) || imageLoading;

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(16,185,129,0.12),_transparent_50%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          {t("heroEyebrow")}
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          {t("heroLead")}
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition",
              dragOver
                ? "border-emerald-400 bg-emerald-400/10"
                : "border-white/15 bg-slate-900/80 hover:border-blue-400/60",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={onSelect}
            />
            {hasPreview ? (
              <>
                <ProductPhoto
                  src={imageUrl}
                  alt={productName.trim() || query.trim() || t("dropTitle")}
                  loading={imageLoading}
                  className="absolute inset-0 size-full"
                />
                {canClear && imageUrl && !imageLoading ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFile(null);
                    }}
                    className="absolute end-3 top-3 z-10 rounded-full bg-slate-950/80 p-1.5 text-white hover:bg-slate-800"
                    aria-label={t("removeImage")}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <ImagePlus className="mb-3 size-8 text-blue-400" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-100">{t("dropTitle")}</p>
                <p className="mt-1 px-4 text-center text-xs text-slate-500">
                  {t("dropHint")}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col justify-center gap-3">
            <label className="sr-only" htmlFor="product-query">
              {t("productPlaceholder")}
            </label>
            <input
              id="product-query"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t("productPlaceholder")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3.5 text-base text-white outline-none ring-blue-500/40 placeholder:text-slate-500 focus:border-blue-400/40 focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {loading ? t("analyzing") : t("analyze")}
            </button>
            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm leading-relaxed text-rose-100"
              >
                {error}
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
