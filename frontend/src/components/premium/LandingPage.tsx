import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const FEATURE_CARDS = [
  {
    title: 'Decentralized actor setup',
    text: 'Model independent suppliers, warehouses, and distributors with distinct goals and constraints.',
  },
  {
    title: 'Negotiation under limited visibility',
    text: 'Run agent bargaining when each participant has incomplete knowledge about other actors intent and limits.',
  },
  {
    title: 'Convergence and optimization',
    text: 'Track trade-offs and adaptation until agents converge on mutually acceptable and operationally efficient outcomes.',
  },
];

const PROMPT_CHIPS = [
  '3PL lane pricing for same-day delivery',
  'Cold-chain capacity allocation under deadline risk',
  'Port-to-warehouse drayage with dock constraints',
  'Regional carrier selection with fuel surcharge shock',
];

type LandingPageProps = {
  simulationPrompt: string;
  onSimulationPromptChange: (value: string) => void;
  onStartSimulation: () => void;
  onWatchDemo: () => void;
  onPushSuggestion: (text: string) => void;
};

export const LandingPage: React.FC<LandingPageProps> = ({
  simulationPrompt,
  onSimulationPromptChange,
  onStartSimulation,
  onWatchDemo,
  onPushSuggestion,
}) => {
  return (
    <div className="landing-wrap">
      <section className="overflow-hidden rounded-[22px] border-2 border-slate-900 bg-[#0f766e] px-4 py-3 text-center font-mono text-[12px] text-white shadow-[6px_6px_0_rgba(15,23,42,0.95)] md:px-6">
        Coordyn logistics preview is open for control-tower and operations teams.
        <button className="ml-2 inline-flex items-center gap-1 font-semibold text-white/90 underline underline-offset-4" onClick={onWatchDemo}>
          Explore the platform <ArrowRight size={13} />
        </button>
      </section>

      <section className="relative overflow-hidden px-2 pb-8 pt-10 md:px-6 md:pb-14 md:pt-14">
        <div className="pointer-events-none absolute left-[4%] top-10 hidden h-20 w-20 rotate-[-10deg] rounded-[22px] border-[3px] border-slate-900 bg-[#fff36d] shadow-[8px_8px_0_rgba(15,23,42,0.95)] lg:block" />
        <div className="pointer-events-none absolute right-[6%] top-24 hidden h-12 w-32 rotate-[8deg] rounded-full border-[3px] border-slate-900 bg-[#f8c7aa] shadow-[8px_8px_0_rgba(15,23,42,0.95)] lg:block" />
        <div className="pointer-events-none absolute bottom-10 left-[10%] hidden h-16 w-16 rounded-full border-[3px] border-slate-900 bg-[#c7f0d8] shadow-[6px_6px_0_rgba(15,23,42,0.95)] xl:block" />
        <div className="pointer-events-none absolute bottom-16 right-[12%] hidden border-l-[28px] border-r-[28px] border-b-[48px] border-l-transparent border-r-transparent border-b-[#b8dcff] drop-shadow-[6px_6px_0_rgba(15,23,42,0.95)] xl:block" />
        <div className="pointer-events-none absolute left-[18%] top-[46%] hidden h-6 w-28 rotate-[-12deg] rounded-full border-2 border-slate-900 bg-white xl:block" />
        <div className="pointer-events-none absolute right-[18%] top-[44%] hidden h-5 w-5 rounded-full bg-slate-900 xl:block" />
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] border-2 border-slate-900 bg-[#fff36d] text-slate-950 shadow-[6px_6px_0_rgba(15,23,42,0.95)]">
            <Sparkles size={26} strokeWidth={1.8} />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-400">Multi-agent coordination infrastructure</p>
          <h1 className="mt-6 max-w-5xl font-heading text-[clamp(3rem,7vw,5.75rem)] font-bold leading-[0.94] tracking-[-0.05em] text-slate-950">
            Run logistics negotiations where
            <br className="hidden md:block" /> agents coordinate real lane decisions.
          </h1>
          <p className="mt-7 max-w-3xl text-balance text-[18px] leading-8 text-slate-600 md:text-[20px]">
            Coordyn gives operations teams a decentralized control layer where independent agents propose actions, evaluate trade-offs, adapt strategy, and negotiate toward optimized agreements under incomplete information.
          </p>

          <div className="mt-12 w-full max-w-3xl rounded-[26px] border-[3px] border-slate-900 bg-white shadow-[10px_10px_0_rgba(15,23,42,0.95)]">
            <div className="border-b-2 border-slate-900 bg-[#fff7ec] px-6 py-3 text-left font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Agent instructions
            </div>
            <div className="p-4 md:p-6">
              <textarea
                value={simulationPrompt}
                onChange={(e) => onSimulationPromptChange(e.target.value)}
                rows={4}
                className="min-h-[120px] w-full resize-none border-0 bg-transparent font-mono text-base leading-7 text-slate-700 outline-none placeholder:text-slate-300"
                placeholder="Example: Negotiate 12 reefer loads from Delhi to Mumbai with 2 carriers, 1 warehouse, max budget 2.4M INR, 18h SLA."
              />
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-left text-[12px] text-slate-400">
                  <span className="mr-1 font-mono uppercase tracking-[0.2em]">Try</span>
                  {PROMPT_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      className="rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 font-mono text-[12px] text-slate-600 transition-transform hover:-translate-y-0.5 hover:bg-[#fff7ec]"
                      onClick={() => onPushSuggestion(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <button
                  className="inline-flex items-center justify-center gap-2 self-end rounded-full border-2 border-slate-900 bg-[#f8c7aa] px-6 py-3 font-heading text-sm font-semibold text-slate-950 shadow-[4px_4px_0_rgba(15,23,42,0.95)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(15,23,42,0.95)] md:self-auto"
                  onClick={onStartSimulation}
                >
                  Run <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURE_CARDS.map((card) => (
          <article key={card.title} className="rounded-[24px] border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0_rgba(15,23,42,0.95)] transition-transform duration-200 hover:-translate-y-1">
            <h3 className="font-heading text-xl font-semibold tracking-tight text-slate-900">{card.title}</h3>
            <p className="mt-3 text-[15px] leading-7 text-slate-600">{card.text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 overflow-hidden rounded-[28px] border-2 border-slate-900 bg-white shadow-[8px_8px_0_rgba(15,23,42,0.95)]">
        <div className="grid gap-px bg-slate-100 md:grid-cols-4">
          {[
            { value: '50K+', label: 'Negotiations Run' },
            { value: '99.9%', label: 'Uptime' },
            { value: '<50ms', label: 'Latency' },
            { value: '10x', label: 'Faster than Legacy' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 text-center">
              <div className="text-3xl font-heading font-bold text-slate-900">{stat.value}</div>
              <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-8 rounded-[28px] border-2 border-slate-900 bg-[#fcfcfb] p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:grid-cols-[1.1fr_1.4fr] md:p-10">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">How Coordyn works</p>
          <h2 className="mt-4 font-heading text-4xl leading-tight tracking-tight text-slate-950">
            One place to simulate decentralized multi-agent negotiation.
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-slate-600">
            Configure the shared environment, deploy independent actors, and inspect how conflicting objectives are resolved across rounds.
          </p>
          <button className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-colors hover:text-platform-accent" onClick={onWatchDemo}>
            Open the live dashboard <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { step: '01', title: 'Define shared environment', text: 'Set lane demand, capacity scarcity, budget limits, and deadline pressure.' },
            { step: '02', title: 'Activate independent actors', text: 'Deploy supplier, warehouse, distributor, and custom agents with distinct objectives.' },
            { step: '03', title: 'Observe convergence', text: 'Track proposals, trade-offs, and strategy adaptation toward acceptable outcomes.' },
          ].map((item) => (
            <article key={item.step} className="rounded-[22px] border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-platform-accent">{item.step}</div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-6 pt-10 text-center">
        <h2 className="font-heading text-4xl tracking-tight text-slate-950 md:text-5xl">Built for teams testing autonomous coordination.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-8 text-slate-600">
          Start with a real-world objective, open the dashboard, and evaluate how decentralized agents negotiate resource allocation.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-heading text-sm font-semibold text-white transition-colors hover:bg-slate-800" onClick={onStartSimulation}>
            Launch Coordyn <ArrowRight size={14} />
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-heading text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900" onClick={onWatchDemo}>
            View live system
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <a href="#">Product</a>
          <a href="#">Docs</a>
          <a href="#">API</a>
          <a href="#">Contact</a>
        </div>
        <div>© 2026 Coordyn</div>
      </footer>
    </div>
  );
};
