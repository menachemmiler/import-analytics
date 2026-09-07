export interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
}

type CustomSearchResponse = {
  error?: { message?: string; code?: number; status?: string };
  items?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
  }>;
};

let didWarnMissingCredentials = false;
let accessState: "unknown" | "available" | "denied" = "unknown";
let accessProbe: Promise<string | null> | null = null;
let accessProbeQuery: string | null = null;

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

export function isCustomSearchDenied(): boolean {
  return accessState === "denied";
}

function markDenied(status: number, error: CustomSearchResponse["error"]) {
  if (accessState === "denied") return;
  accessState = "denied";
  console.error(
    "[Google Search] Custom Search JSON API is not enabled for this Google Cloud project.",
    {
      status,
      error,
      enableAt:
        "https://console.cloud.google.com/apis/library/customsearch.googleapis.com",
      nextStep:
        "Enable the API, wait a few minutes, then restart npm run dev. Store and supplier cards will keep on-site search URLs until then.",
    },
  );
}

async function executeSearch(query: string): Promise<string | null> {
  const credentials = getSearchCredentials();
  if (!credentials) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", credentials.apiKey);
    url.searchParams.set("cx", credentials.engineId);
    url.searchParams.set("q", query);
    url.searchParams.set("num", "1");

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });

    const data = (await response.json()) as CustomSearchResponse;
    const permissionDenied =
      response.status === 403 ||
      data.error?.code === 403 ||
      data.error?.status === "PERMISSION_DENIED";

    if (permissionDenied) {
      markDenied(response.status, data.error);
      return null;
    }

    if (!response.ok || data.error) {
      console.error("[Google Search Error]:", {
        status: response.status,
        error: data.error,
      });
      return null;
    }

    accessState = "available";

    const item = data.items?.[0];
    const link = item?.link?.trim();
    if (!link || !/^https?:\/\//i.test(link)) {
      return null;
    }

    const result: SearchResult = {
      title: item?.title?.trim() || query,
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

export async function fetchGoogleSearchLink(
  query: string,
): Promise<string | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (accessState === "denied") return null;
  if (!getSearchCredentials()) return null;

  if (accessState === "unknown") {
    if (!accessProbe) {
      accessProbeQuery = trimmed;
      accessProbe = executeSearch(trimmed);
    }
    const probed = await accessProbe;
    if (accessState === "denied") return null;
    if (accessProbeQuery === trimmed) return probed;
  }

  return executeSearch(trimmed);
}
