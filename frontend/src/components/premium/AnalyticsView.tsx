import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

type DashboardSeriesPoint = {
  round: string;
  utilization: number;
  success: number;
};

type AnalyticsSeriesPoint = {
  round: string;
  shipper: number;
  carrier: number;
};

type AnalyticsViewProps = {
  dashboardSeries: DashboardSeriesPoint[];
  analyticsSeries: AnalyticsSeriesPoint[];
  normalizedStrategy: string;
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ dashboardSeries, analyticsSeries, normalizedStrategy }) => {
  const summaryCards = [
    { label: 'Lane Fill Rate', value: `${dashboardSeries[dashboardSeries.length - 1]?.utilization ?? 0}%`, note: 'Current fleet and dock utilization' },
    { label: 'Deal Closure', value: `${dashboardSeries[dashboardSeries.length - 1]?.success ?? 0}%`, note: 'Current agreement conversion rate' },
    { label: 'Strategy Posture', value: normalizedStrategy, note: 'Current bargaining behavior profile' },
  ];

  return (
    <section className="grid gap-5 overflow-auto p-4 xl:p-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map((card, idx) => (
          <motion.article
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: idx * 0.04 }}
            className="rounded-[26px] border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0_rgba(15,23,42,0.95)]"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400 font-medium">{card.label}</div>
            <div className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-950">{card.value}</div>
            <div className="mt-2 text-sm text-slate-500 font-medium">{card.note}</div>
          </motion.article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
      <motion.article 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.22 }} 
        className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8"
      >
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">KPI trend</div>
          <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-950">Negotiation closure rate</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dashboardSeries}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="round" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            <Line type="monotone" dataKey="success" stroke="#4F46E5" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </motion.article>

      <motion.article 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.22, delay: 0.04 }} 
        className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8"
      >
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Speed profile</div>
          <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-950">Average decision rounds</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={[
              { name: 'Balanced', rounds: 5 },
              { name: 'Competitive', rounds: 8 },
              { name: 'Cooperative', rounds: 4 },
            ]}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            <Bar dataKey="rounds" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.article>

      <motion.article 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.22, delay: 0.08 }} 
        className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8"
      >
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Operational efficiency</div>
          <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-950">Fleet and dock utilization</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={[
              { name: 'Run 1', efficiency: 54 },
              { name: 'Run 2', efficiency: 63 },
              { name: 'Run 3', efficiency: 71 },
              { name: 'Run 4', efficiency: 69 },
            ]}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            <Area type="monotone" dataKey="efficiency" stroke="#10b981" fill="#10b98118" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.article>

      <motion.article 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.22, delay: 0.12 }} 
        className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8"
      >
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Party balance</div>
          <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-950">Shipper vs carrier satisfaction</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analyticsSeries}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="round" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            <Line type="monotone" dataKey="shipper" stroke="#4F46E5" strokeWidth={2} />
            <Line type="monotone" dataKey="carrier" stroke="#0EA5E9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.article>

      <motion.article 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.22, delay: 0.16 }} 
        className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8 xl:col-span-2"
      >
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Decision brief</div>
          <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-950">Why this lane negotiation resolved this way</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] border-2 border-slate-900 bg-[#fcfcfb] p-5 text-sm leading-7 text-slate-600 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
            <span className="mb-4 flex items-center gap-2 font-bold text-slate-950">
              <ShieldCheck size={16} className="text-emerald-600" /> Agreement signal
            </span>
            Pricing converged once both sides aligned on feasible delivery windows and committed load volume.
          </div>
          <div className="rounded-[22px] border-2 border-slate-900 bg-[#fcfcfb] p-5 text-sm leading-7 text-slate-600 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
            <span className="mb-4 flex items-center gap-2 font-bold text-slate-950">
              <ArrowRight size={16} className="text-platform-accent" /> Concession path
            </span>
            Carrier margin demands narrowed while shipper timing constraints softened to preserve committed capacity.
          </div>
          <div className="rounded-[22px] border-2 border-slate-900 bg-[#fcfcfb] p-5 text-sm leading-7 text-slate-600 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
            <span className="mb-4 flex items-center gap-2 font-bold text-slate-950">
              <Sparkles size={16} className="text-amber-500" /> Winning strategy
            </span>
            <span className="capitalize">{normalizedStrategy}</span> worked best because it balanced margin protection with delivery reliability.
          </div>
        </div>
      </motion.article>
      </div>
    </section>
  );
};
