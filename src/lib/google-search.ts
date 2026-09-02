export interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
}

type CustomSearchResponse = {
  error?: { message?: string; code?: number };
  items?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
  }>;
};

let didWarnMissingCredentials = false;

function getSearchCredentials(): { apiKey: string; engineId: string } | null {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY?.trim();
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID?.trim();
  if (!apiKey || !engineId) {
    if (!didWarnMissingCredentials) {
      didWarnMissingCredentials = true;
      console.warn(
        "[Google Search] GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID missing.",
      );
    }
    return null;
  }
  return { apiKey, engineId };
}

export function googleSearchFallbackUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query.trim() || "product")}`;
}

export async function fetchGoogleSearchLink(
  query: string,
): Promise<string | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const credentials = getSearchCredentials();
  if (!credentials) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", credentials.apiKey);
    url.searchParams.set("cx", credentials.engineId);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("num", "1");

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });

    const data = (await response.json()) as CustomSearchResponse;
    if (!response.ok || data.error) {
      console.error("[Google Search Error]:", {
        status: response.status,
        error: data.error,
      });
      return null;
    }

    const item = data.items?.[0];
    const link = item?.link?.trim();
    if (!link || !/^https?:\/\//i.test(link)) {
      return null;
    }

    const result: SearchResult = {
      title: item?.title?.trim() || trimmed,
      link,
      snippet: item?.snippet?.trim() || undefined,
    };
    return result.link;
  } catch (err) {
    console.error("[Google Search Error]:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
