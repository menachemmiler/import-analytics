export function zapSearchUrl(detectedProduct: string): string {
  return `https://www.zap.co.il/search.aspx?skeyword=${encodeURIComponent(detectedProduct.trim())}`;
}

export function alibabaSupplierSearchUrl(detectedProduct: string): string {
  return `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(`${detectedProduct.trim()} supplier`)}`;
}

export function madeInChinaSupplierSearchUrl(detectedProduct: string): string {
  return `https://www.made-in-china.com/productdirectory.do?word=${encodeURIComponent(`${detectedProduct.trim()} supplier`)}`;
}

export function buildMarketplaceSearchLinks(detectedProduct: string): {
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
} {
  const product = detectedProduct.trim();
  return {
    localStores: [
      {
        id: "zap",
        name: "Zap",
        description: "zap",
        url: zapSearchUrl(product),
      },
    ],
    suppliers: [
      {
        id: "alibaba",
        name: "Alibaba",
        description: "alibaba",
        url: alibabaSupplierSearchUrl(product),
      },
      {
        id: "made-in-china",
        name: "Made-in-China",
        description: "madeInChina",
        url: madeInChinaSupplierSearchUrl(product),
      },
    ],
  };
}
