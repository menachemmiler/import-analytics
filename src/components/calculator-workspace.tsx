"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import {
  Calculator,
  defaultCalcInputs,
  type CalcInputs,
} from "@/components/calculator";
import { CostBreakdownChart } from "@/components/charts-panel";
import { Faq } from "@/components/faq";
import { useLanguage } from "@/components/language-provider";

export function CalculatorWorkspace() {
  const { t } = useLanguage();
  const [inputs, setInputs] = useState<CalcInputs>(defaultCalcInputs);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header />
      <main id="main" className="flex-1 pb-16">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Calculator inputs={inputs} onChange={setInputs} titleAs="h1" />
            <CostBreakdownChart inputs={inputs} />
          </div>
        </div>
        <Faq />
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        {t("footer")}
      </footer>
    </div>
  );
}
