/* ── Zustand global store ── */

import { create } from 'zustand';
import type {
  AppView,
  AppInfo,
  NegotiationResult,
  NegotiationMessage,
  BatchResult,
  DealSummary,
} from '../types';

interface AppState {
  view: AppView;
  setView: (v: AppView) => void;

  // Config
  scenario: string;
  strategy: string;
  includeWarehouse: boolean;
  maxTurns: number;
  setScenario: (s: string) => void;
  setStrategy: (s: string) => void;
  setIncludeWarehouse: (b: boolean) => void;
  setMaxTurns: (n: number) => void;

  // App info
  appInfo: AppInfo | null;
  setAppInfo: (info: AppInfo) => void;

  // Negotiation state
  isNegotiating: boolean;
  setIsNegotiating: (b: boolean) => void;
  messages: NegotiationMessage[];
  addMessage: (m: NegotiationMessage) => void;
  clearMessages: () => void;

  // Results
  lastResult: NegotiationResult | null;
  setLastResult: (r: NegotiationResult | null) => void;

  // Deals history
  deals: DealSummary[];
  setDeals: (d: DealSummary[]) => void;

  // Batch
  batchResult: BatchResult | null;
  setBatchResult: (r: BatchResult | null) => void;

  // Error
  error: string | null;
  setError: (e: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  view: 'landing',
  setView: (v) => set({ view: v }),

  scenario: 'Rush Delivery',
  strategy: 'balanced',
  includeWarehouse: false,
  maxTurns: 12,
  setScenario: (s) => set({ scenario: s }),
  setStrategy: (s) => set({ strategy: s }),
  setIncludeWarehouse: (b) => set({ includeWarehouse: b }),
  setMaxTurns: (n) => set({ maxTurns: n }),

  appInfo: null,
  setAppInfo: (info) => set({ appInfo: info }),

  isNegotiating: false,
  setIsNegotiating: (b) => set({ isNegotiating: b }),
  messages: [],
  addMessage: (m) =>
    set((state) => ({ messages: [...state.messages, m] })),
  clearMessages: () => set({ messages: [] }),

  lastResult: null,
  setLastResult: (r) => set({ lastResult: r }),

  deals: [],
  setDeals: (d) => set({ deals: d }),

  batchResult: null,
  setBatchResult: (r) => set({ batchResult: r }),

  error: null,
  setError: (e) => set({ error: e }),
}));
