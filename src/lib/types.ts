export type Locale = "he" | "en";

export type UserSession = {
  name: string;
  email: string;
  image?: string | null;
};

export type StockStatus = "in_stock" | "low" | "out";

export type SupplierChannel = "local-industrial" | "global";

export type MarketSearchLink = {
  id: string;
  name: string;
  description: string;
  url: string;
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
  category: string;
  detectedCategory: string;
  detectedCategoryEn: string;
  englishProductName: string;
  sourceCountry: string | null;
  isLocallyManufactured: boolean;
  estimatedFobUsd: number;
  estimatedRetailIls: number;
  estimatedRetailIlsMin: number;
  estimatedRetailIlsMax: number;
  estimatedRetailRangeIls: string;
  estimatedSourceRetailIls: number;
  estimatedSourceRetailRangeIls: string;
  priceConfidence: "low" | "medium" | "high" | "na";
  customsRatePercent: number;
  activeImportersCount: number;
  estimatedRoiPercent: number;
  totalUnitsImported: number;
  unitsDeltaPercent: number;
  customsIls: number;
  vatIls: number;
  vatRatePercent: number;
  localSearch: string;
  localStores: MarketSearchLink[];
  suppliers: MarketSearchLink[];
  supplierChannel: SupplierChannel;
  supplierNotice: string;
  freightForwarders: FreightForwarder[];
  importTrend: MonthlyVolume[];
  imageUrl: string | null;
  defaults: {
    purchaseUsd: number;
    freightUsd: number;
    customsPct: number;
    localFeesIls: number;
    targetRetailIls: number;
    usdIls: number;
  };
};
