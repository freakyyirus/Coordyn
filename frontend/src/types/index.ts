/* ── Types for the AutoNegotiate frontend ── */

export interface Proposal {
  price: number;
  delivery_time: string;
  capacity: number;
  conditions?: string[];
}

export interface NegotiationMessage {
  round: number;
  sender: string;
  content: string;
  reasoning: string | null;
  price_mentioned: number | null;
  timestamp: number;
  utility: number | null;
}

export interface PricePoint {
  round: number;
  agent: string;
  price: number;
}

export interface UtilityPoint {
  round: number;
  shipper: number;
  carrier: number;
}

export interface NegotiationResult {
  session_id: string;
  status: string;
  rounds: number;
  duration: number;
  final_price: number | null;
  deal_details: string;
  shipper_utility: number;
  carrier_utility: number;
  pareto_efficiency: number;
  transcript: NegotiationMessage[];
  price_trajectory: PricePoint[];
  utility_trajectory: UtilityPoint[];
  blockchain_tx: string | null;
  random_allocation_price: number | null;
  no_negotiation_price: number | null;
}

export interface BatchStrategyResult {
  strategy: string;
  label: string;
  runs: number;
  deal_rate: string;
  deal_pct: number;
  avg_rounds: number;
  avg_price: number;
  avg_pareto: number;
}

export interface BatchResult {
  scenario: string;
  results: BatchStrategyResult[];
}

export interface ScenarioInfo {
  name: string;
  description: string;
  shipper: Record<string, any>;
  carrier: Record<string, any>;
  warehouse: Record<string, any>;
}

export interface StrategyInfo {
  key: string;
  label: string;
  description: string;
}

export interface AppInfo {
  scenarios: ScenarioInfo[];
  strategies: StrategyInfo[];
}

export interface CustomAgentConfig {
  name: string;
  role: string;
  objective: string;
  constraints: string;
  strategy?: string;
}

export interface DealSummary {
  session_id: string;
  status: string;
  scenario: string;
  strategy: string;
  final_price: number | null;
  rounds: number | null;
  created_at: string | null;
}

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  company?: string | null;
  use_case?: string | null;
  is_active: boolean;
}

export type AppView =
  | 'landing'
  | 'dashboard'
  | 'agents'
  | 'negotiations'
  | 'environment'
  | 'analytics'
  | 'logs'
  | 'pricing'
  | 'home'
  | 'negotiate'
  | 'results'
  | 'batch';

/* WebSocket message from server */
export interface WSMessage {
  type: 'status' | 'message' | 'completed' | 'stopped' | 'error' | 'pong';
  round?: number;
  sender?: string;
  content?: string;
  reasoning?: string | null;
  price?: number | null;
  utility?: number | null;
  timestamp?: number;
  status?: string;
  message?: string;
}
