import Link from "next/link";
import { Globe, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import type { UserSession } from "@/lib/types";
import { useLanguage } from "./language-provider";

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      className="size-4"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.73.13-1.43.36-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

type HeaderProps = {
  user: UserSession | null;
  onSignIn: () => void;
  onSignOut: () => void;
};

export function Header({ user, onSignIn, onSignOut }: HeaderProps) {
  const { t, locale, setLocale, dir } = useLanguage();

  const nav = [
    { href: "/#dashboard", label: t("navDashboard") },
    { href: "/calculator", label: t("navCalculator") },
    { href: "/#market-tabs", label: t("navMarket") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 shadow-lg shadow-blue-500/20">
            <LayoutDashboard
              className="size-5 text-slate-950"
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight text-white">
              {t("brand")}
            </span>
            <span className="hidden truncate text-xs text-slate-400 sm:block">
              {t("brandSub")}
            </span>
          </span>
        </Link>

        <nav
          className="ms-auto hidden items-center gap-1 lg:flex"
          aria-label={t("brand")}
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <div
            className="flex items-center rounded-full border border-white/10 bg-slate-900 p-0.5"
            role="group"
            aria-label={t("langHe") + " / " + t("langEn")}
          >
            <Globe className="mx-2 size-3.5 text-slate-500" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setLocale("he")}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold transition",
                locale === "he"
                  ? "bg-blue-500 text-white shadow"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {t("langHe")}
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold transition",
                locale === "en"
                  ? "bg-blue-500 text-white shadow"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {t("langEn")}
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 py-1 ps-1 pe-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 text-xs font-bold text-slate-950">
                {user.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span className="hidden max-w-[9rem] truncate text-xs text-slate-200 sm:block">
                {user.name}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label={t("signOut")}
                title={t("signOut")}
              >
                <LogOut className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-lg shadow-white/10 transition hover:bg-slate-100"
              style={{ direction: "ltr" }}
            >
              <GoogleMark />
              <span dir={dir}>{t("signIn")}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
