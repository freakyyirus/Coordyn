/* ── Results View ── */

import React from 'react';
import { useStore } from '../store/useStore';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ArrowLeft, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

export const ResultsView: React.FC = () => {
  const result = useStore((s) => s.lastResult);
  const setView = useStore((s) => s.setView);

  if (!result) {
    return (
      <div className="results-empty">
        <p>No results yet. Run a negotiation first!</p>
        <button className="btn btn-primary" onClick={() => setView('negotiate')}>Go to Negotiate</button>
      </div>
    );
  }

  const statusIcon = result.status === 'accepted'
    ? <CheckCircle size={20} style={{ color: 'var(--secondary)' }} />
    : result.status === 'rejected'
      ? <XCircle size={20} style={{ color: 'var(--primary)' }} />
      : <Clock size={20} style={{ color: 'var(--text-muted)' }} />;

  return (
    <div className="results-view">
      {/* Top bar */}
      <div className="results-topbar">
        <button className="btn btn-ghost" onClick={() => setView('negotiate')}>
          <ArrowLeft size={16} /> Back
        </button>
        <h2>Negotiation Analysis</h2>
        <span className="results-session">ID: {result.session_id.slice(0, 8)}…</span>
      </div>

      {/* Deal banner */}
      <div className={`results-banner ${result.status}`}>
        {statusIcon}
        <div>
          <strong>
            {result.status === 'accepted'
              ? `Deal Reached in ${result.rounds} Rounds`
              : result.status === 'rejected'
                ? 'Negotiation Failed'
                : 'Max Rounds Reached'}
          </strong>
          <span>{result.duration.toFixed(1)}s elapsed</span>
        </div>
        {result.blockchain_tx && (
          <span className="blockchain-badge">On-chain: {result.blockchain_tx.slice(0, 12)}…</span>
        )}
      </div>

      {/* Metric cards */}
      <div className="metrics-row">
        {[
          { label: 'Final Price', value: result.final_price ? `$${result.final_price.toLocaleString()}` : 'N/A' },
          { label: 'Shipper Utility', value: `${(result.shipper_utility * 100).toFixed(0)}%` },
          { label: 'Carrier Utility', value: `${(result.carrier_utility * 100).toFixed(0)}%` },
          { label: 'Pareto Efficiency', value: `${result.pareto_efficiency.toFixed(0)}%` },
        ].map((m) => (
          <div className="metric-card" key={m.label}>
            <span className="metric-label">{m.label}</span>
            <span className="metric-value">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      {result.price_trajectory && result.price_trajectory.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>💰 Price Trajectory</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={result.price_trajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="round" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--surface)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>📈 Utility Progression</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={result.utility_trajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="round" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--surface)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="shipper" stroke="var(--agent-shipper)" strokeWidth={2} name="Shipper" />
                <Line type="monotone" dataKey="carrier" stroke="var(--agent-carrier)" strokeWidth={2} name="Carrier" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Final utility comparison */}
      {result.final_price && (
        <div className="chart-card">
          <h3>🎯 Final Utility Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Shipper', value: result.shipper_utility },
              { name: 'Carrier', value: result.carrier_utility },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
