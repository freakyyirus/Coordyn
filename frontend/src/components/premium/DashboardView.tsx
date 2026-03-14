import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Background, Controls, Edge, Node, ReactFlow } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Bot, CircleGauge, Pause, Play, RotateCcw, Settings, Sparkles, TrendingUp, BarChart3, Activity } from 'lucide-react';
import type { DealSummary, NegotiationMessage } from '../../types';

type DashboardSeriesPoint = {
  round: string;
  utilization: number;
  success: number;
};

type DashboardViewProps = {
  activeAgents: string[];
  graphNodes: Node[];
  graphEdges: Edge[];
  isNegotiating: boolean;
  utilityByAgent: Record<string, number>;
  newAgentName: string;
  setNewAgentName: (value: string) => void;
  newAgentRole: string;
  setNewAgentRole: (value: string) => void;
  addAgent: () => void;
  showReasoning: boolean;
  setShowReasoning: (value: boolean) => void;
  currentRound: number;
  maxTurns: number;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  recentEvents: NegotiationMessage[];
  feedRef: React.Ref<HTMLDivElement>;
  dashboardSeries: DashboardSeriesPoint[];
  totalResources: number;
  availableResources: number;
  successRate: number;
  deals: DealSummary[];
  strategy: string;
  setStrategy: (value: string) => void;
  includeWarehouse: boolean;
  setIncludeWarehouse: (value: boolean) => void;
};

const AGENT_COLORS: Record<string, string> = {
  Sender: '#FF5A1F',     // Orange - Shipping origin
  Supplier: '#8B5CF6',  // Purple - Raw materials
  Warehouse: '#10B981',  // Emerald - Storage
  Distributor: '#F59E0B', // Amber - Distribution
  Carrier: '#3B82F6',    // Blue - Transportation
};

const AGENT_OBJECTIVES: Record<string, string> = {
  Sender: 'Minimize Total Cost',
  Supplier: 'Maximize Revenue',
  Warehouse: 'Maximize Utilization',
  Distributor: 'Optimize Delivery Speed',
  Carrier: 'Maximize Profit Margin',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeAgents,
  graphNodes,
  graphEdges,
  isNegotiating,
  utilityByAgent,
  newAgentName,
  setNewAgentName,
  newAgentRole,
  setNewAgentRole,
  addAgent,
  showReasoning,
  setShowReasoning,
  currentRound,
  maxTurns,
  startSimulation,
  pauseSimulation,
  resetSimulation,
  recentEvents,
  feedRef,
  dashboardSeries,
  totalResources,
  availableResources,
  successRate,
  deals,
  strategy,
  setStrategy,
  includeWarehouse,
  setIncludeWarehouse,
}) => {
  const allocatedResources = Math.max(0, totalResources - availableResources);
  const resourcePct = totalResources > 0 ? Math.round((allocatedResources / totalResources) * 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (resourcePct / 100) * circumference;
  const dashboardSignals = [
    {
      label: 'Negotiation State',
      value: isNegotiating ? 'Live run' : 'Ready',
      detail: `${deals.length} deals tracked`,
      icon: Activity,
      tone: isNegotiating ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-700 bg-slate-100 border-slate-200',
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      detail: `${currentRound}/${maxTurns} rounds`,
      icon: TrendingUp,
      tone: 'text-platform-accent bg-platform-accent/10 border-platform-accent/15',
    },
    {
      label: 'Resource Usage',
      value: `${allocatedResources}/${totalResources}`,
      detail: `${availableResources} remaining`,
      icon: BarChart3,
      tone: 'text-sky-700 bg-sky-50 border-sky-100',
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-[#fcfcfb] xl:flex-row xl:overflow-auto">
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex w-full shrink-0 flex-col gap-6 border-b-2 border-slate-900 bg-[#f7f7f5] p-5 md:p-6 xl:h-full xl:w-[320px] xl:overflow-y-auto xl:border-b-0 xl:border-r-2"
      >
        <header className="mb-1 rounded-[26px] border-2 border-slate-900 bg-white p-5 shadow-[6px_6px_0_rgba(15,23,42,0.95)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Agent Network</div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="font-heading text-[24px] font-semibold tracking-tight text-slate-950">Coordination graph</h3>
              <div className="mt-1 text-sm text-slate-500">Status, role signals, and utility under partial visibility.</div>
            </div>
            <div className="rounded-full border-2 border-slate-900 bg-[#fff36d] px-3 py-1 font-mono text-[11px] text-slate-900 shadow-[3px_3px_0_rgba(15,23,42,0.95)]">
              {activeAgents.length} active
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-4">
          {activeAgents.map((agent, idx) => (
            <motion.article
              key={agent}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative overflow-hidden rounded-[26px] border-2 border-slate-900 bg-white p-5 shadow-[6px_6px_0_rgba(15,23,42,0.95)] transition-all duration-200 hover:-translate-y-1"
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: AGENT_COLORS[agent] || '#4F46E5' }}></div>
              <div className="mb-4 flex items-start justify-between gap-3 pt-1">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">NODE_{agent.substring(0, 3).toUpperCase()}</span>
                  <strong className="mt-2 font-heading text-base font-semibold text-slate-950">{agent} Agent</strong>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${
                    isNegotiating
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {isNegotiating ? 'Active' : 'Standby'}
                </span>
              </div>
              <div
                className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-[11px] font-medium leading-5 text-slate-600"
                title={AGENT_OBJECTIVES[agent] || 'Optimize'}
              >
                Objective: {AGENT_OBJECTIVES[agent] || 'Optimize'}
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Capacity</span>
                  <strong className="font-mono text-slate-900">
                    {agent === 'Supplier' ? '85%' : agent === 'Warehouse' ? '72%' : agent === 'Distributor' ? '90%' : agent === 'Carrier' ? 'Full' : 'Available'}
                  </strong>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-right">
                  <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Yield</span>
                  <strong className="font-mono text-lg" style={{ color: AGENT_COLORS[agent] || '#4F46E5' }}>
                    {(utilityByAgent[agent] ?? 0).toFixed(2)}
                  </strong>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-2 rounded-[26px] border-2 border-slate-900 bg-white p-5 shadow-[6px_6px_0_rgba(15,23,42,0.95)]">
          <h4 className="flex items-center gap-2 text-[10px] font-heading uppercase tracking-[0.22em] text-slate-500">
            <Bot size={12} /> Deploy Agent
          </h4>
          <div className="mt-4 flex flex-col gap-3">
            <input
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-platform-accent focus:bg-white"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              placeholder="Agent_ID (e.g. S_01)"
            />
            <select
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-700 outline-none transition-colors focus:border-platform-accent focus:bg-white"
              value={newAgentRole}
              onChange={(e) => setNewAgentRole(e.target.value)}
            >
              <option>Sender Agent</option>
              <option>Supplier Agent</option>
              <option>Warehouse Agent</option>
              <option>Distributor Agent</option>
              <option>Carrier Agent</option>
            </select>
            <button
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-[#fff36d] py-3 font-heading text-xs font-semibold tracking-[0.2em] text-slate-950 shadow-[4px_4px_0_rgba(15,23,42,0.95)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(15,23,42,0.95)]"
              onClick={addAgent}
            >
              <Sparkles size={14} /> Add to Network
            </button>
          </div>
        </div>
      </motion.aside>

      <section className="flex min-w-0 flex-1 flex-col bg-[#f3f3f1] xl:min-h-0">
        <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-5 md:py-5">
          <div className="grid gap-3 lg:grid-cols-3">
            {dashboardSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <article key={signal.label} className="rounded-[24px] border-2 border-slate-900 bg-[#fcfcfb] p-4 shadow-[5px_5px_0_rgba(15,23,42,0.95)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">{signal.label}</div>
                      <div className="mt-3 font-heading text-2xl font-semibold tracking-tight text-slate-950">{signal.value}</div>
                      <div className="mt-1 text-sm text-slate-500">{signal.detail}</div>
                    </div>
                    <div className={`rounded-2xl border p-3 ${signal.tone}`}>
                      <Icon size={18} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="relative flex min-h-[360px] flex-1 flex-col overflow-hidden p-3 md:p-5 xl:flex-[3]">
          <div className="relative flex-1 overflow-hidden rounded-[30px] border-[3px] border-slate-900 bg-white shadow-[8px_8px_0_rgba(15,23,42,0.95)]">
            <header className="absolute left-3 top-3 z-10 md:left-5 md:top-5">
              <h3 className="flex items-center gap-2 rounded-full border-2 border-slate-900 bg-[#fff36d] px-4 py-2 font-heading text-sm tracking-wide text-slate-900 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
                <CircleGauge size={14} className="text-platform-accent" /> Decentralized Negotiation Graph
              </h3>
            </header>
            <ReactFlow nodes={graphNodes} edges={graphEdges} fitView minZoom={0.6} maxZoom={1.2} nodesDraggable={false}>
              <Background color="rgba(15,23,42,0.045)" gap={24} size={1} />
              <Controls showInteractive={false} className="!border-slate-200 !bg-white !fill-slate-600 !shadow-[0_6px_18px_rgba(15,23,42,0.08)]" />
            </ReactFlow>
          </div>
        </div>

        <div className="z-10 flex min-h-[320px] shrink-0 flex-col border-t border-slate-200 bg-white xl:h-[35%]">
          <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200 bg-[#fcfcfb] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5 md:py-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="flex items-center gap-2 rounded-full border-2 border-slate-900 bg-[#fff36d] px-4 py-2.5 font-heading text-xs font-bold tracking-[0.2em] text-slate-950 shadow-[4px_4px_0_rgba(15,23,42,0.95)] transition-all disabled:opacity-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(15,23,42,0.95)]"
                onClick={startSimulation}
                disabled={isNegotiating}
              >
                <Play size={14} fill="currentColor" /> START
              </button>
              <button
                className="flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2.5 font-heading text-xs font-bold tracking-[0.2em] text-slate-700 shadow-[4px_4px_0_rgba(15,23,42,0.95)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(15,23,42,0.95)] disabled:opacity-50"
                onClick={pauseSimulation}
                disabled={!isNegotiating}
              >
                <Pause size={14} fill="currentColor" /> PAUSE
              </button>
              <button
                className="flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2.5 font-heading text-xs font-bold tracking-[0.2em] text-slate-500 shadow-[4px_4px_0_rgba(15,23,42,0.95)] transition-all hover:bg-rose-50 hover:text-rose-500 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(15,23,42,0.95)]"
                onClick={resetSimulation}
              >
                <RotateCcw size={14} /> RESET
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-800">
                <input
                  type="checkbox"
                  checked={showReasoning}
                  onChange={(e) => setShowReasoning(e.target.checked)}
                  className="accent-platform-accent"
                />
                Show Logic
              </label>
              <div className="flex items-center gap-2 rounded-full border border-platform-accent/20 bg-platform-accent/10 px-3 py-2 font-mono text-xs text-platform-accent">
                <span className="opacity-60">ROUND</span> {currentRound} / {maxTurns}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-3 font-mono text-[11px] leading-relaxed md:p-4" ref={feedRef}>
            {recentEvents.length ? (
              recentEvents.slice().reverse().map((message, idx) => (
                <div
                  key={`${message.timestamp}-${idx}`}
                  className="mb-3 flex gap-4 rounded-[22px] border border-slate-100 bg-[#fcfcfb] px-3 py-3 transition-colors hover:border-slate-200 hover:bg-white"
                  style={{ borderColor: AGENT_COLORS[message.sender] || 'rgba(0,0,0,0.2)' }}
                >
                  <div className="w-16 shrink-0 rounded-2xl bg-slate-100 px-2 py-1 text-center text-slate-400">R{message.round}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold tracking-wide" style={{ color: AGENT_COLORS[message.sender] || '#4F46E5' }}>
                        {message.sender}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-300">message</span>
                    </div>
                    <div className="mt-1 text-slate-600">{message.content}</div>
                    {showReasoning && message.reasoning && (
                      <div className="mt-3 whitespace-pre-wrap rounded-[18px] border border-slate-100 bg-slate-50 p-3 text-slate-500">
                        <span className="mr-2 select-none text-slate-400">&darr;</span>
                        {message.reasoning}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-slate-200 bg-[#fcfcfb] font-body text-slate-400">
                <Bot size={30} className="opacity-30" />
                <span className="tracking-wide">System initialized. Awaiting simulation start...</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="flex w-full shrink-0 flex-col gap-6 border-t border-slate-200 bg-[#f7f7f5] p-5 xl:h-full xl:w-[320px] xl:overflow-y-auto xl:border-l xl:border-t-0">
        <header className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Resource Market</div>
          <h3 className="mt-3 font-heading text-[24px] font-semibold tracking-tight text-slate-950">Live supply pulse</h3>
          <div className="mt-1 text-sm text-slate-500">Capacity, utilization, and conversion in one rail.</div>
        </header>

        <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-[11px] font-heading uppercase tracking-[0.22em] text-slate-500">System Status</h4>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-mono ${isNegotiating ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {isNegotiating ? 'Negotiating' : 'Ready'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="block uppercase tracking-wider text-slate-400">Total Agents</span>
              <strong className="mt-1 block font-heading text-xl text-slate-900">{activeAgents.length}</strong>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="block uppercase tracking-wider text-slate-400">Active Runs</span>
              <strong className="mt-1 block font-heading text-xl text-slate-900">{isNegotiating ? 1 : 0}</strong>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="block uppercase tracking-wider text-slate-400">Resources Left</span>
              <strong className="mt-1 block font-heading text-xl text-slate-900">{availableResources}</strong>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="block uppercase tracking-wider text-slate-400">Success Rate</span>
              <strong className="mt-1 block font-heading text-xl text-slate-900">{successRate}%</strong>
            </div>
          </div>
        </article>

        <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-[11px] font-heading uppercase tracking-widest text-platform-accent">Resource Pool</h4>
            <span className="rounded border border-platform-accent/20 bg-platform-accent/10 px-2 py-0.5 font-mono text-[10px] text-platform-accent">
              {allocatedResources}/{totalResources} allocated
            </span>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg viewBox="0 0 140 140" className="h-32 w-32 -rotate-90">
                <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <strong className="font-heading text-2xl text-slate-900">{resourcePct}%</strong>
                <span className="text-[10px] uppercase tracking-widest text-slate-400">Utilized</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 text-[11px] font-mono">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="block text-slate-400">Total trucks</span>
                <strong className="mt-1 block text-base text-slate-900">{totalResources}</strong>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="block text-slate-400">Remaining capacity</span>
                <strong className="mt-1 block text-base text-slate-900">{availableResources}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <h4 className="mb-4 flex items-center justify-between text-[11px] font-heading uppercase tracking-widest text-slate-700">
            Truck Capacity
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-500">{totalResources} Max</span>
          </h4>
          <div className="relative mb-4 flex h-28 w-full items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardSeries}>
                <defs>
                  <linearGradient id="truckFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <Area type="monotone" dataKey="utilization" stroke="#4F46E5" strokeWidth={2} fill="url(#truckFill)" isAnimationActive={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', fontSize: '11px', borderRadius: '8px' }} itemStyle={{ color: '#4F46E5' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-mono text-[11px] text-slate-500">
            <span>Alloc: {dashboardSeries[dashboardSeries.length - 1]?.utilization || 0}%</span>
            <span>Avail: {availableResources}</span>
          </div>
        </article>

        <article className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <h4 className="mb-4 flex items-center justify-between text-[11px] font-heading uppercase tracking-widest text-slate-700">
            Conv. Rate
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-500">{successRate}% Live</span>
          </h4>
          <div className="relative mb-4 flex h-28 w-full items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <Line type="monotone" dataKey="success" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: '#0EA5E9' }} isAnimationActive={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', fontSize: '11px', borderRadius: '8px' }} itemStyle={{ color: '#0EA5E9' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-mono text-[11px] text-slate-500">
            <span>Active: {isNegotiating ? 1 : 0}</span>
            <span>Deals: {deals.length}</span>
          </div>
        </article>

        <article className="mt-auto rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <h4 className="mb-3 flex items-center gap-2 text-[9px] font-heading uppercase tracking-widest text-slate-400">
            <Settings size={12} /> Settings
          </h4>
          <div className="flex flex-col gap-4 text-[11px]">
            <label className="flex flex-col gap-1.5 text-slate-600">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Strategy Mode</span>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="cursor-pointer rounded border border-slate-200 bg-white px-2 py-2 font-mono text-slate-800 outline-none transition-colors focus:border-platform-accent"
              >
                <option value="balanced">Balanced</option>
                <option value="competitive">Competitive</option>
                <option value="cooperative">Cooperative</option>
              </select>
            </label>
            <label className="mt-1 flex cursor-pointer items-center gap-2 rounded border border-slate-100 bg-slate-50 p-2 text-slate-600 transition-colors hover:text-slate-900">
              <input type="checkbox" checked={includeWarehouse} onChange={(e) => setIncludeWarehouse(e.target.checked)} className="accent-platform-accent" />
              Include Warehouse Agent
            </label>
          </div>
        </article>
      </aside>
    </div>
  );
};
