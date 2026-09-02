export type Locale = "he" | "en";

export type UserSession = {
  name: string;
  email: string;
  image?: string | null;
};

export type StockStatus = "in_stock" | "low" | "out";

export type LocalStore = {
  id: string;
  name: string;
  city: string;
  priceIls: number;
  stock: StockStatus;
  channel: string;
  url: string;
  directLink?: string;
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
  url: string;
  directLink?: string;
};

export type FreightForwarder = {
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

export type AnalyzeRequest = {
  productName?: string;
  locale?: Locale;
  hasImage?: boolean;
};

export type AnalysisResult = {
  source: "mock" | "openai+mock" | "gemini+mock";
  productName: string;
  brand: string;
  hsCode: string;
  origin: string;
  estimatedFobUsd: number;
  customsRatePercent: number;
  activeImportersCount: number;
  estimatedRoiPercent: number;
  totalUnitsImported: number;
  unitsDeltaPercent: number;
  customsIls: number;
  vatIls: number;
  vatRatePercent: number;
  localStores: LocalStore[];
  suppliers: Supplier[];
  freightForwarders: FreightForwarder[];
  importTrend: MonthlyVolume[];
  imageUrl: string;
  defaults: {
    purchaseUsd: number;
    freightUsd: number;
    customsPct: number;
    localFeesIls: number;
    targetRetailIls: number;
    usdIls: number;
  };
};
