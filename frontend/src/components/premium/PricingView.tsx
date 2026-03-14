import React from 'react';
import { ArrowRight, Boxes, ShieldCheck, Waves } from 'lucide-react';
import { motion } from 'framer-motion';

type FeatureCard = {
  title: string;
  text: string;
};

type PricingViewProps = {
  features: FeatureCard[];
};

export const PricingView: React.FC<PricingViewProps> = ({ features }) => {
  const logisticsPackages = [
    {
      name: 'Dock Starter',
      subtitle: 'For small logistics simulations',
      points: ['2-5 independent actors per lane', 'Live decentralized negotiation board', 'Basic reasoning and trade-off traces'],
      accent: 'border-slate-200',
    },
    {
      name: 'Fleet Pro',
      subtitle: 'For active coordination teams',
      points: ['Shipper, carrier, warehouse, distributor teams', 'Strategy adaptation analytics', 'Round-by-round operational replay logs'],
      accent: 'border-slate-900 bg-slate-950 text-white',
    },
    {
      name: 'Network Enterprise',
      subtitle: 'For large multi-agent operations',
      points: ['Multi-network scenario orchestration', 'Custom backend integrations', 'Audit-friendly agreement and decision history'],
      accent: 'border-slate-200',
    },
  ];

  return (
    <section className="grid gap-5 overflow-auto p-4 xl:p-6">
      <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr] lg:items-end">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">Commercial packaging</div>
            <h3 className="mt-3 font-heading text-4xl tracking-tight text-slate-950">Multi-agent logistics plans</h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">Position Coordyn as a decentralized negotiation layer for supply chain actors operating with conflicting objectives and incomplete information.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200 bg-[#fcfcfb] p-4"><Boxes size={18} className="text-slate-500" /><div className="mt-3 font-heading text-xl tracking-tight text-slate-950">Role-based agents</div></div>
            <div className="rounded-[22px] border border-slate-200 bg-[#fcfcfb] p-4"><Waves size={18} className="text-slate-500" /><div className="mt-3 font-heading text-xl tracking-tight text-slate-950">Scenario orchestration</div></div>
            <div className="rounded-[22px] border border-slate-200 bg-[#fcfcfb] p-4"><ShieldCheck size={18} className="text-slate-500" /><div className="mt-3 font-heading text-xl tracking-tight text-slate-950">Explainable outcomes</div></div>
          </div>
        </div>
      </motion.article>

      <div className="grid gap-5 xl:grid-cols-3">
        {logisticsPackages.map((pkg, idx) => (
          <motion.article key={pkg.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: idx * 0.04 }} className={`rounded-[30px] border p-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)] ${pkg.accent}`}>
            <div className={`font-mono text-[10px] uppercase tracking-[0.22em] ${pkg.name === 'Fleet Pro' ? 'text-white/60' : 'text-slate-400'}`}>Plan</div>
            <h4 className={`mt-3 font-heading text-3xl tracking-tight ${pkg.name === 'Fleet Pro' ? 'text-white' : 'text-slate-950'}`}>{pkg.name}</h4>
            <p className={`mt-2 text-sm leading-6 ${pkg.name === 'Fleet Pro' ? 'text-white/70' : 'text-slate-600'}`}>{pkg.subtitle}</p>
            <ul className={`mt-6 space-y-3 text-sm ${pkg.name === 'Fleet Pro' ? 'text-white/85' : 'text-slate-700'}`}>
              {pkg.points.map((point) => (
                <li key={point} className="rounded-2xl border border-current/10 px-3 py-3">{point}</li>
              ))}
            </ul>
            <button className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${pkg.name === 'Fleet Pro' ? 'bg-white text-slate-950 hover:bg-slate-100' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950'}`}>
              Explore plan <ArrowRight size={14} />
            </button>
          </motion.article>
        ))}
      </div>

      <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.12 }} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">Advanced modules</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article className="rounded-[24px] border border-slate-200 bg-[#fcfcfb] p-5" key={feature.title}>
              <h4 className="font-heading text-xl tracking-tight text-slate-950">{feature.title}</h4>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.text}</p>
            </article>
          ))}
        </div>
      </motion.article>
    </section>
  );
};
