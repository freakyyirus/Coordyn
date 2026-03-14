import React from 'react';

type EnvironmentViewProps = {
  environmentName: string;
  setEnvironmentName: (value: string) => void;
  environmentDescription: string;
  setEnvironmentDescription: (value: string) => void;
  environmentType: string;
  setEnvironmentType: (value: string) => void;
  resourceType: string;
  setResourceType: (value: string) => void;
  totalResources: number;
  setTotalResources: (value: number) => void;
  setAvailableResources: React.Dispatch<React.SetStateAction<number>>;
  agentCount: number;
  setAgentCount: (value: number) => void;
  maxTurns: number;
  setMaxTurns: (value: number) => void;
  deadlineHours: number;
  setDeadlineHours: (value: number) => void;
};

export const EnvironmentView: React.FC<EnvironmentViewProps> = ({
  environmentName,
  setEnvironmentName,
  environmentDescription,
  setEnvironmentDescription,
  environmentType,
  setEnvironmentType,
  resourceType,
  setResourceType,
  totalResources,
  setTotalResources,
  setAvailableResources,
  agentCount,
  setAgentCount,
  maxTurns,
  setMaxTurns,
  deadlineHours,
  setDeadlineHours,
}) => {
  return (
    <section className="grid gap-6 overflow-auto p-4 md:grid-cols-2 md:p-6">
      <article className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8">
        <header className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Environment Studio</div>
          <h3 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950">Market context</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Define the operating market, lane profile, and shared resources for negotiation.</p>
        </header>
        <div className="form-grid">
          <label>
            Simulation / Lane Name
            <input value={environmentName} onChange={(e) => setEnvironmentName(e.target.value)} placeholder="North-South Lane 01" />
          </label>
          <label>
            Operational Description
            <input value={environmentDescription} onChange={(e) => setEnvironmentDescription(e.target.value)} placeholder="Perishable FMCG distribution with strict retail delivery windows..." />
          </label>
          <label>
            Market Type
            <select value={environmentType} onChange={(e) => setEnvironmentType(e.target.value)}>
              <option>Supply Chain</option>
              <option>Financial Market</option>
              <option>Energy Grid</option>
              <option>Custom</option>
            </select>
          </label>
          <label>
            Shared Capacity Resource
            <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
              <option>Transportation</option>
              <option>Capital</option>
              <option>Storage</option>
              <option>Energy</option>
              <option>Custom</option>
            </select>
          </label>
        </div>
      </article>

      <article className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8">
        <header className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Parameter tuning</div>
          <h3 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950">Simulation bounds</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Adjust run scale and urgency that drive bargaining intensity across rounds.</p>
        </header>
        <div className="grid gap-6">
          <div className="rounded-[24px] border-2 border-slate-900 bg-[#fcfcfb] p-5 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Total Capacity Units</span>
              <strong className="font-heading text-2xl text-slate-950">{totalResources}</strong>
            </div>
            <input
              type="range"
              min={3}
              max={20}
              value={totalResources}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTotalResources(value);
                setAvailableResources((prev) => Math.min(prev, value));
              }}
              className="mt-4"
            />
          </div>

          <div className="rounded-[24px] border-2 border-slate-900 bg-[#fcfcfb] p-5 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Negotiation Participants</span>
              <strong className="font-heading text-2xl text-slate-950">{agentCount}</strong>
            </div>
            <input type="range" min={2} max={20} value={agentCount} onChange={(e) => setAgentCount(Number(e.target.value))} className="mt-4" />
          </div>

          <div className="rounded-[24px] border-2 border-slate-900 bg-[#fcfcfb] p-5 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Max Bargaining Rounds</span>
              <strong className="font-heading text-2xl text-slate-950">{maxTurns}</strong>
            </div>
            <input type="range" min={4} max={20} value={maxTurns} onChange={(e) => setMaxTurns(Number(e.target.value))} className="mt-4" />
          </div>

          <div className="rounded-[24px] border-2 border-slate-900 bg-[#fcfcfb] p-5 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">SLA Deadline Offset</span>
              <strong className="font-heading text-2xl text-slate-950">{deadlineHours}h</strong>
            </div>
            <input type="range" min={12} max={120} step={6} value={deadlineHours} onChange={(e) => setDeadlineHours(Number(e.target.value))} className="mt-4" />
          </div>
        </div>
      </article>
    </section>
  );
};
