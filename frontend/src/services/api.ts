/* ── API client for the FastAPI backend ── */

import type {
  AuthUser,
  NegotiationResult,
  BatchResult,
  AppInfo,
  CustomAgentConfig,
  DealSummary,
  WSMessage,
} from '../types';

const BASE = '/api/v1';
const TOKEN_KEY = 'coordyn_access_token';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseErrorBody(res: Response): Promise<string> {
  const raw = await res.text();
  if (!raw) return `Request failed (${res.status})`;

  try {
    const parsed = JSON.parse(raw) as { detail?: string };
    return parsed.detail ?? raw;
  } catch {
    return raw;
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  const token = localStorage.getItem(TOKEN_KEY);
  const extraHeaders: Record<string, string> = {};
  if (token) {
    extraHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    signal: controller.signal,
    ...init,
  }).finally(() => {
    window.clearTimeout(timer);
  });

  if (!res.ok) {
    const message = await parseErrorBody(res);
    throw new ApiError(res.status, message);
  }

  return res.json();
}

export const api = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  signup: async (payload: {
    full_name: string;
    email: string;
    password: string;
    company?: string;
    use_case?: string;
  }) => {
    const res = await request<{ access_token: string; token_type: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    return res;
  },

  login: async (payload: { email: string; password: string }) => {
    const res = await request<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    return res;
  },

  me: () => request<AuthUser>('/auth/me'),

  getMarketContext: () => request<Record<string, unknown>>('/market-data/context'),

  getInfo: () => request<AppInfo>('/info'),

  startNegotiation: (opts: {
    scenario: string;
    strategy: string;
    include_warehouse: boolean;
    max_turns: number;
    custom_agents?: CustomAgentConfig[];
  }) =>
    request<NegotiationResult>('/negotiate', {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  batchCompare: (opts: {
    scenario: string;
    include_warehouse: boolean;
    runs_per_strategy: number;
  }) =>
    request<BatchResult>('/negotiate/batch', {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  getDeals: (limit = 20) =>
    request<DealSummary[]>(`/deals?limit=${limit}`),
};

/* ── WebSocket helper ── */

export function connectWebSocket(
  sessionId: string,
  onMessage: (msg: WSMessage) => void,
  onComplete: () => void,
  onError: (err: string) => void,
): { send: (data: Record<string, unknown>) => void; close: () => void } {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${window.location.host}/api/v1/ws/${sessionId}`);

  ws.onmessage = (event) => {
    try {
      const data: WSMessage = JSON.parse(event.data);
      if (data.type === 'completed' || data.type === 'stopped') {
        onComplete();
      } else if (data.type === 'error') {
        onError(data.message ?? 'Unknown error');
      } else {
        onMessage(data);
      }
    } catch {
      onError('Failed to parse WebSocket message');
    }
  };

  ws.onerror = () => onError('WebSocket connection error');
  ws.onclose = () => onComplete();

  return {
    send: (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    },
    close: () => ws.close(),
  };
}
