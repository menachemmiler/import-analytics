export type Locale = "he" | "en";

export type UserSession = {
  name: string;
  email: string;
  image?: string | null;
};

export type StockStatus = "in_stock" | "low" | "out";

export type Retailer = {
  id: string;
  name: string;
  city: string;
  priceIls: number;
  stock: StockStatus;
  channel: string;
};

export type Supplier = {
  id: string;
  name: string;
  country: string;
  fobUsd: number;
  moq: number;
  leadDays: number;
  email: string;
  verified: boolean;
};

export type Broker = {
  id: string;
  name: string;
  specialty: string;
  port: string;
  phone: string;
  rating: number;
};

export type MonthlyVolume = {
  month: string;
  units: number;
};

export type CostSlice = {
  name: string;
  value: number;
  fill: string;
};

export type AnalysisResult = {
  productName: string;
  brand: string;
  hsCode: string;
  origin: string;
  kpis: {
    totalUnits: number;
    unitsDelta: number;
    activeImporters: number;
    customsIls: number;
    vatIls: number;
    dutyRate: number;
    vatRate: number;
    estimatedRoi: number;
  };
  retailers: Retailer[];
  suppliers: Supplier[];
  brokers: Broker[];
  volume: MonthlyVolume[];
  defaults: {
    purchaseUsd: number;
    shippingUsd: number;
    customsPct: number;
    localFeesIls: number;
    targetRetailIls: number;
    usdIls: number;
  };
};
