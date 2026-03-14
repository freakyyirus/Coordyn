import React from 'react';
import { ArrowRight, Bot, Truck, Warehouse } from 'lucide-react';
import { motion } from 'framer-motion';

type AgentConfig = {
  name: string;
  role: string;
  objective: string;
  constraints: string;
  strategy: string;
};

type AgentsViewProps = {
  newAgentName: string;
  setNewAgentName: (value: string) => void;
  newAgentRole: string;
  setNewAgentRole: (value: string) => void;
  newAgentObjective: string;
  setNewAgentObjective: (value: string) => void;
  newAgentConstraints: string;
  setNewAgentConstraints: (value: string) => void;
  addAgent: () => void;
  createdAgents: AgentConfig[];
  fallbackAgents: AgentConfig[];
};

export const AgentsView: React.FC<AgentsViewProps> = ({
  newAgentName,
  setNewAgentName,
  newAgentRole,
  setNewAgentRole,
  newAgentObjective,
  setNewAgentObjective,
  newAgentConstraints,
  setNewAgentConstraints,
  addAgent,
  createdAgents,
  fallbackAgents,
}) => {
  const agentsToRender = createdAgents.length ? createdAgents : fallbackAgents;
  const roleSummary = [
    { label: 'Senders', value: agentsToRender.filter((agent) => /sender|shipper/i.test(agent.role)).length, icon: Bot },
    { label: 'Suppliers', value: agentsToRender.filter((agent) => /supplier/i.test(agent.role)).length, icon: Truck },
    { label: 'Warehouses', value: agentsToRender.filter((agent) => /warehouse/i.test(agent.role)).length, icon: Warehouse },
    { label: 'Distributors', value: agentsToRender.filter((agent) => /distributor/i.test(agent.role)).length, icon: Truck },
    { label: 'Carriers', value: agentsToRender.filter((agent) => /carrier/i.test(agent.role)).length, icon: Truck },
  ];

  return (
    <section className="grid gap-5 overflow-auto p-4 xl:grid-cols-[1.05fr_1.2fr] xl:p-6">
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8"
      >
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Multi-agent logistics studio</div>
            <h3 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950">Configure participants</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Define shipper, carrier, warehouse, and custom operator roles for freight lane negotiation.</p>
          </div>
          <span className="rounded-full border-2 border-slate-900 bg-[#fff36d] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-900 shadow-[3px_3px_0_rgba(15,23,42,0.95)]">Agent Studio</span>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {roleSummary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[22px] border-2 border-slate-900 bg-[#fcfcfb] p-4 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                    <div className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-950">{item.value}</div>
                  </div>
                  <div className="rounded-2xl border-2 border-slate-900 bg-white p-2.5 text-slate-950 shadow-[2px_2px_0_rgba(15,23,42,0.95)]">
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="form-grid">
          <label>
            Agent Call Sign
            <input value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} placeholder="Carrier_West_01" />
          </label>
          <label>
            Logistics Role
            <select value={newAgentRole} onChange={(e) => setNewAgentRole(e.target.value)}>
              <option>Sender Agent</option>
              <option>Supplier Agent</option>
              <option>Warehouse Agent</option>
              <option>Distributor Agent</option>
              <option>Carrier Agent</option>
              <option>Custom Agent</option>
            </select>
          </label>
          <label>
            Negotiation Objective
            <input value={newAgentObjective} onChange={(e) => setNewAgentObjective(e.target.value)} placeholder="Secure 8 trucks for NCR lane while keeping cost under SLA budget" />
          </label>
          <label>
            Operating Constraints
            <input value={newAgentConstraints} onChange={(e) => setNewAgentConstraints(e.target.value)} placeholder="Max 3 trucks, reefer required, 12h delivery, no night unloading" />
          </label>
          <button className="action-btn start" onClick={addAgent}>Add Agent <ArrowRight size={14} /></button>
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut', delay: 0.05 }}
        className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8"
      >
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Active participants</div>
            <h3 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950">Lane roster</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Review each participant’s role, constraints, and negotiation posture before dispatch.</p>
          </div>
          <span className="rounded-full border-2 border-slate-900 bg-[#f8c7aa] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-900 shadow-[3px_3px_0_rgba(15,23,42,0.95)]">{agentsToRender.length} Agents</span>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {agentsToRender.map((agent, idx) => (
            <motion.article
              key={agent.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="rounded-[26px] border-2 border-slate-900 bg-[#fcfcfb] p-6 shadow-[6px_6px_0_rgba(15,23,42,0.95)] transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">{agent.role}</div>
                  <h4 className="mt-3 font-heading text-xl font-bold tracking-tight text-slate-950">{agent.name}</h4>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{agent.strategy}</div>
              </div>
              <div className="mt-5 grid gap-4 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Objective</span>
                  <span className="mt-2 block leading-7">{agent.objective}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Constraints</span>
                  <span className="mt-2 block leading-7">{agent.constraints}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.article>
    </section>
  );
};
