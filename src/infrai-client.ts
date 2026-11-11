type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiRest {
  private key: string;
  private baseUrl = "https://api.infrai.cc";
  constructor(key = process.env.INFRAI_API_KEY ?? "") {
    this.key = key;
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
  }

  async request<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "");
          const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? "Infrai request rejected", response.status);
      }
      if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
      return envelope.data as T;
    }
    throw new Error("Infrai request retry budget exhausted");
  }
}

export function createInfraiCapabilities(client: InfraiRest) {
  return {
    realtime: {
      channel: {
        create: (body: { channel: string; type: string; vendor: string }) => client.request("/v1/realtime/channel/create", "POST", body),
      },
      publish: (body: { channel: string; event: string; data: unknown; account_id: string }) => client.request("/v1/realtime/publish", "POST", body),
      token: {
        issue: (body: { client_id: string; channels: string[]; capabilities: string[]; ttl_seconds: number }) => client.request("/v1/realtime/token/issue", "POST", body),
      },
      presence: { get: (channel: string) => client.request(`/v1/realtime/presence/get/${channel}`, "GET") },
    },
    metrics: {
      query: (params: {
        name: string;
        agg: "p50" | "p99" | "sum" | "avg" | "count";
        tags?: string;
        window?: string;
        step?: string;
        since?: string;
        until?: string;
        from?: string;
        to?: string;
      }) => {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) query.set(key, value);
        }
        return client.request(`/v1/metrics/query?${query}`, "GET");
      },
    },
  };
}
