export function englishSearchTerm(
  productName: string,
  englishProductName?: string,
): string {
  const provided = englishProductName?.trim();
  if (provided && /[A-Za-z]/.test(provided)) return provided;
  const latin = productName
    .replace(/[^\p{Script=Latin}\p{Number}\s+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return latin || productName.trim();
}

export function localSearchUrl(query: string): string {
  const encodedQuery = encodeURIComponent(`"${query.trim()}" מחיר`);
  return `https://www.google.com/search?q=${encodedQuery}`;
}

export function b2bSupplierSearchQuery(
  englishProductName: string,
  detectedCategoryEn?: string,
): string {
  const name = englishProductName.trim();
  const category = detectedCategoryEn?.trim() ?? "";
  if (!category) return name;
  const nameLower = name.toLowerCase();
  if (category && !nameLower.includes(category.toLowerCase())) {
    return `${name} ${category}`.trim();
  }
  return name;
}

export function isLocalIndustrialCategory(input: {
  isLocallyManufactured?: boolean;
  detectedCategory?: string;
  detectedCategoryEn?: string;
}): boolean {
  if (input.isLocallyManufactured) return true;
  const blob = `${input.detectedCategory ?? ""} ${input.detectedCategoryEn ?? ""}`.toLowerCase();
  return /building materials|construction|חומרי בנייה|חיפוי|בלוק|פאנל|insulated panel/.test(
    blob,
  );
}

export function israelIndustrialSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${query.trim()} מפעל OR "ספק תעשייתי" ישראל`)}`;
}

export function dunsGuideSearchUrl(query: string): string {
  return `https://www.dunsguide.co.il/?s=${encodeURIComponent(query.trim())}`;
}

export function globalSourcesSearchUrl(englishProductName: string): string {
  return `https://www.globalsources.com/searchList/products?query=${encodeURIComponent(englishProductName.trim())}`;
}

export function alibabaSupplierSearchUrl(englishProductName: string): string {
  return `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(englishProductName.trim())}`;
}

export function madeInChinaSupplierSearchUrl(englishProductName: string): string {
  return `https://www.made-in-china.com/multi-search/${encodeURIComponent(englishProductName.trim())}/F1/`;
}

export function buildMarketplaceSearchLinks(input: {
  zapQuery: string;
  englishProductName: string;
  detectedCategory?: string;
  detectedCategoryEn?: string;
  isLocallyManufactured?: boolean;
}): {
  localSearch: string;
  localStores: Array<{
    id: string;
    name: string;
    description: string;
    url: string;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    description: string;
    url: string;
  }>;
  supplierChannel: "local-industrial" | "global";
} {
  const productQuery = input.zapQuery.trim();
  const englishName = b2bSupplierSearchQuery(
    input.englishProductName.trim() || productQuery,
    input.detectedCategoryEn,
  );
  const localIndustrial = isLocalIndustrialCategory({
    isLocallyManufactured: input.isLocallyManufactured,
    detectedCategory: input.detectedCategory,
    detectedCategoryEn: input.detectedCategoryEn,
  });
  const localSearch = localSearchUrl(productQuery);

  return {
    localSearch,
    localStores: [
      {
        id: "google-il",
        name: "Google",
        description: "localSearch",
        url: localSearch,
      },
    ],
    supplierChannel: localIndustrial ? "local-industrial" : "global",
    suppliers: localIndustrial
      ? [
          {
            id: "israel-industrial",
            name: "Google",
            description: "israelIndustrial",
            url: israelIndustrialSearchUrl(productQuery || englishName),
          },
          {
            id: "dunsguide",
            name: "DunsGuide",
            description: "dunsGuide",
            url: dunsGuideSearchUrl(productQuery || englishName),
          },
        ]
      : [
          {
            id: "alibaba",
            name: "Alibaba",
            description: "alibaba",
            url: alibabaSupplierSearchUrl(englishName),
          },
          {
            id: "global-sources",
            name: "Global Sources",
            description: "globalSources",
            url: globalSourcesSearchUrl(englishName),
          },
        ],
  };
}
