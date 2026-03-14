/* ── Batch Strategy Comparison View ── */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { Loader2, GitCompare, Play } from 'lucide-react';

const COLORS = ['var(--teal)', 'var(--red)', 'var(--blue)'];

export const BatchView: React.FC = () => {
  const { scenario, includeWarehouse, appInfo, setAppInfo, batchResult, setBatchResult } = useStore();
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState(2);
  const [localScenario, setLocalScenario] = useState(scenario);

  React.useEffect(() => {
    if (!appInfo) api.getInfo().then(setAppInfo).catch(console.error);
  }, []);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await api.batchCompare({
        scenario: localScenario,
        include_warehouse: includeWarehouse,
        runs_per_strategy: runs,
      });
      setBatchResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="batch-view">
      <div className="batch-header">
        <GitCompare size={24} />
        <h2>Strategy Comparison</h2>
        <p>Run negotiations across all strategies and compare outcomes</p>
      </div>

      <div className="batch-controls">
        <div className="batch-field">
          <label>Scenario</label>
          <select value={localScenario} onChange={(e) => setLocalScenario(e.target.value)} className="field-select">
            {(appInfo?.scenarios ?? []).map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="batch-field">
          <label>Runs per Strategy</label>
          <input type="number" min={1} max={5} value={runs} onChange={(e) => setRuns(Number(e.target.value))} className="field-input" />
        </div>
        <button className="btn btn-primary" onClick={handleRun} disabled={loading}>
          {loading ? <><Loader2 size={16} className="spin" /> Running…</> : <><Play size={16} /> Run Comparison</>}
        </button>
      </div>

      {batchResult && (
        <>
          {/* Results table */}
          <div className="batch-table-wrap">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Runs</th>
                  <th>Deal Rate</th>
                  <th>Avg Rounds</th>
                  <th>Avg Price</th>
                  <th>Pareto %</th>
                </tr>
              </thead>
              <tbody>
                {batchResult.results.map((r, i) => (
                  <tr key={r.strategy}>
                    <td style={{ color: COLORS[i] }}>{r.label}</td>
                    <td>{r.runs}</td>
                    <td>
                      <span className={`rate-pill ${r.deal_pct >= 50 ? 'good' : 'bad'}`}>
                        {r.deal_rate} ({r.deal_pct}%)
                      </span>
                    </td>
                    <td>{r.avg_rounds}</td>
                    <td>{r.avg_price ? `$${r.avg_price.toLocaleString()}` : '—'}</td>
                    <td>{r.avg_pareto.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="batch-charts">
            <div className="chart-card">
              <h3>Deal Success Rate</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={batchResult.results}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" stroke="#666" />
                  <YAxis domain={[0, 100]} stroke="#666" tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip contentStyle={{ background: '#1a1d23', border: '1px solid #333', borderRadius: 8 }} />
                  <Bar dataKey="deal_pct" name="Deal %" radius={[6, 6, 0, 0]}>
                    {batchResult.results.map((_, i) => (
                      <rect key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Pareto Efficiency</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={batchResult.results}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" stroke="#666" />
                  <YAxis domain={[0, 100]} stroke="#666" tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip contentStyle={{ background: '#1a1d23', border: '1px solid #333', borderRadius: 8 }} />
                  <Bar dataKey="avg_pareto" name="Pareto %" radius={[6, 6, 0, 0]}>
                    {batchResult.results.map((_, i) => (
                      <rect key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card span-2">
              <h3>Strategy Profile Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={batchResult.results.map((r) => ({
                  strategy: r.label.replace(/[^\w\s]/g, '').trim(),
                  deals: r.deal_pct,
                  speed: Math.max(10, 100 - r.avg_rounds * 8),
                  efficiency: r.avg_pareto,
                  price: r.avg_price ? Math.min(100, (r.avg_price / 100)) : 0,
                }))}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="strategy" tick={{ fill: '#aaa', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="deals" name="Deal %" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
                  <Radar dataKey="efficiency" name="Pareto" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
