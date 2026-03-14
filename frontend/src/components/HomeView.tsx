/* ── Home View ── */

import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import {
  Package, Truck, Warehouse, ArrowRight, TrendingUp, Clock, Zap,
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const setView = useStore((s) => s.setView);
  const appInfo = useStore((s) => s.appInfo);
  const setAppInfo = useStore((s) => s.setAppInfo);
  const setScenario = useStore((s) => s.setScenario);
  const deals = useStore((s) => s.deals);
  const setDeals = useStore((s) => s.setDeals);

  useEffect(() => {
    if (!appInfo) {
      api.getInfo().then(setAppInfo).catch(console.error);
    }
    api.getDeals(5).then(setDeals).catch(() => {});
  }, []);

  const handleQuickStart = (scenario: string) => {
    setScenario(scenario);
    setView('negotiate');
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">
          AI-Powered <span className="highlight">Negotiation</span>
        </h1>
        <p className="hero-sub">
          Autonomous agents negotiate logistics contracts in real-time using LLM-powered 
          strategic reasoning and Pareto-efficient deal-making.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => setView('negotiate')}>
            Start Negotiation <ArrowRight size={18} />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => setView('batch')}>
            Compare Strategies
          </button>
        </div>
      </section>

      {/* Agent cards */}
      <section>
        <h2 className="section-title">The Agents</h2>
        <div className="agents-grid">
          {[
            { icon: <Package size={28} />, name: 'Sender Agent', desc: 'Initiates shipment requests, minimizes total cost', color: '#FF5A1F' },
            { icon: <Truck size={28} />, name: 'Supplier Agent', desc: 'Provides raw materials, maximizes revenue', color: '#8B5CF6' },
            { icon: <Warehouse size={28} />, name: 'Warehouse Agent', desc: 'Manages storage, maximizes utilization', color: '#10B981' },
            { icon: <Truck size={28} />, name: 'Distributor Agent', desc: 'Handles regional distribution', color: '#F59E0B' },
            { icon: <Truck size={28} />, name: 'Carrier Agent', desc: 'Transports goods, maximizes profit', color: '#3B82F6' },
          ].map((a) => (
            <div className="agent-card" key={a.name}>
              <div className="agent-card-icon" style={{ color: a.color }}>{a.icon}</div>
              <h3>{a.name}</h3>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          {[
            { num: '01', icon: <Zap size={20} />, title: 'Initialize', desc: 'LLM agents spawn with roles and objectives' },
            { num: '02', icon: <TrendingUp size={20} />, title: 'Negotiate', desc: 'Agents propose and counter-propose autonomously' },
            { num: '03', icon: <TrendingUp size={20} />, title: 'Converge', desc: 'Utility scoring drives optimal agreements' },
            { num: '04', icon: <Clock size={20} />, title: 'Verify', desc: 'Deals scored for efficiency and logged' },
          ].map((s) => (
            <div className="step-card" key={s.num}>
              <span className="step-num">{s.num}</span>
              <div className="step-icon">{s.icon}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick start scenarios */}
      {appInfo && (
        <section>
          <h2 className="section-title">Quick Start</h2>
          <div className="scenario-cards">
            {appInfo.scenarios.map((sc) => (
              <button
                key={sc.name}
                className="scenario-card"
                onClick={() => handleQuickStart(sc.name)}
              >
                <span className="scenario-emoji">
                  {sc.name === 'Rush Delivery' ? '⚡' : sc.name === 'Bulk Discount' ? '📦' : '🚨'}
                </span>
                <h4>{sc.name}</h4>
                <p>{sc.description.replace(/[⚡📦🚨]\s*/, '')}</p>
                <div className="scenario-meta">
                  <span><Clock size={12} /> {sc.shipper.deadline}</span>
                  <span>${sc.shipper.max_budget?.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recent deals */}
      {deals.length > 0 && (
        <section>
          <h2 className="section-title">Recent Negotiations</h2>
          <div className="deals-table">
            <div className="deals-header">
              <span>Status</span>
              <span>Scenario</span>
              <span>Strategy</span>
              <span>Price</span>
              <span>Rounds</span>
            </div>
            {deals.map((d) => (
              <div className="deals-row" key={d.session_id}>
                <span className={`status-badge ${d.status}`}>
                  {d.status === 'accepted' ? '✓' : d.status === 'rejected' ? '✗' : '⏱'} {d.status}
                </span>
                <span>{d.scenario}</span>
                <span>{d.strategy}</span>
                <span>{d.final_price ? `$${d.final_price.toLocaleString()}` : '—'}</span>
                <span>{d.rounds ?? '—'}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
