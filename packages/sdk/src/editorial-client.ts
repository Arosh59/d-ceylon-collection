import type {
  GetJournalArticleBySlugV1Responses,
  GetJournalArticlesV1Responses,
  GetPromotionsV1Responses,
  JournalArticleDetail,
  JournalArticleSummary,
  PromotionResponse,
} from "./generated";

export type JournalArticle = JournalArticleDetail;
export type JournalPage = GetJournalArticlesV1Responses[200];
export type Promotion = PromotionResponse;

export interface EditorialClientOptions {
  baseUrl: string;
  correlationId?: string;
  fetch?: typeof globalThis.fetch;
}

export interface EditorialPagination {
  pageNumber?: number;
  pageSize?: number;
}

export interface EditorialClient {
  getJournal(query?: EditorialPagination): Promise<JournalPage>;
  getJournalArticle(slug: string): Promise<JournalArticle | null>;
  getPromotions(): Promise<Promotion[]>;
}

interface ProblemDetails {
  correlationId?: string;
  detail?: string;
  title?: string;
}

export class EditorialApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = "EditorialApiError";
  }
}

export function createEditorialClient(options: EditorialClientOptions): EditorialClient {
  const request = options.fetch ?? globalThis.fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  async function get<T>(path: string, allowNotFound = false): Promise<T | null> {
    const response = await request(new URL(path, baseUrl), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.correlationId ? { "X-Correlation-ID": options.correlationId } : {}),
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (allowNotFound && response.status === 404) return null;
    if (!response.ok) {
      const problem = await readProblem(response);
      throw new EditorialApiError(
        problem?.detail ??
          problem?.title ??
          `Editorial API request failed with ${response.status}.`,
        response.status,
        problem?.correlationId ?? response.headers.get("X-Correlation-ID") ?? undefined,
      );
    }
    return (await response.json()) as T;
  }

  const pagePath = (path: string, query: EditorialPagination = {}) => {
    const url = new URL(path, baseUrl);
    if (query.pageNumber !== undefined)
      url.searchParams.set("pageNumber", String(query.pageNumber));
    if (query.pageSize !== undefined) url.searchParams.set("pageSize", String(query.pageSize));
    return `${url.pathname}${url.search}`;
  };

  return {
    getJournal: async (query) =>
      (await get<JournalPage>(pagePath("/api/v1/editorial/journal", query)))!,
    getJournalArticle: (slug) =>
      get<GetJournalArticleBySlugV1Responses[200]>(
        `/api/v1/editorial/journal/${encodeURIComponent(slug)}`,
        true,
      ),
    getPromotions: async () =>
      (await get<GetPromotionsV1Responses[200]>("/api/v1/editorial/promotions"))!,
  };
}

function normalizeBaseUrl(value: string): URL {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new TypeError("The API base URL must use HTTP or HTTPS.");
  }
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

async function readProblem(response: Response): Promise<ProblemDetails | undefined> {
  if (!response.headers.get("content-type")?.includes("application/problem+json")) {
    return undefined;
  }
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return undefined;
  }
}
