import type { CopyKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";

const FAQ_ITEMS: Array<{ q: CopyKey; a: CopyKey }> = [
  { q: "faq1q", a: "faq1a" },
  { q: "faq2q", a: "faq2a" },
  { q: "faq3q", a: "faq3a" },
  { q: "faq4q", a: "faq4a" },
];

export function Faq() {
  const { t } = useLanguage();

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6"
    >
      <h2 id="faq-heading" className="text-lg font-semibold text-white">
        {t("faqTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-400">{t("faqLead")}</p>
      <div className="mt-6 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <article
            key={item.q}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          >
            <h3 className="text-sm font-semibold text-white">{t(item.q)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {t(item.a)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
