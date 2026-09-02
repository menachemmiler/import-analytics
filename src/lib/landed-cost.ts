export type CalcInputs = {
  purchaseUsd: number;
  freightUsd: number;
  customsPct: number;
  localFeesIls: number;
  targetRetailIls: number;
  usdIls: number;
};

export const defaultCalcInputs: CalcInputs = {
  purchaseUsd: 0,
  freightUsd: 0,
  customsPct: 0,
  localFeesIls: 0,
  targetRetailIls: 0,
  usdIls: 3.7,
};

export function landedCost(inputs: CalcInputs) {
  const cifIls = (inputs.purchaseUsd + inputs.freightUsd) * inputs.usdIls;
  const duty = cifIls * (inputs.customsPct / 100);
  const pretax = cifIls + duty + inputs.localFeesIls;
  const vat = pretax * 0.18;
  const landed = pretax + vat;
  const profit = inputs.targetRetailIls - landed;
  const margin =
    inputs.targetRetailIls > 0 ? (profit / inputs.targetRetailIls) * 100 : 0;
  return { cifIls, duty, vat, pretax, landed, profit, margin };
}
