import React from 'react';

type RightRailProps = {
  scenario: string;
  normalizedStrategy: string;
  activeAgentsCount: number;
  currentRound: number;
  maxTurns: number;
  isNegotiating: boolean;
  successRate: number;
  dealsCount: number;
  marketLoading: boolean;
  isAuthenticated: boolean;
  onLoadMarketContext: () => void;
  marketContext: Record<string, unknown> | null;
};

export const RightRail: React.FC<RightRailProps> = ({
  scenario,
  normalizedStrategy,
  activeAgentsCount,
  currentRound,
  maxTurns,
  isNegotiating,
  successRate,
  dealsCount,
  marketLoading,
  isAuthenticated,
  onLoadMarketContext,
  marketContext,
}) => {
  const signals = (marketContext?.signals as Record<string, unknown> | undefined) ?? undefined;

  return (
    <aside className="right-rail">
      <article className="rail-card">
        <h4>Live Context</h4>
        <dl>
          <div>
            <dt>Scenario</dt>
            <dd>{scenario}</dd>
          </div>
          <div>
            <dt>Strategy</dt>
            <dd>{normalizedStrategy}</dd>
          </div>
          <div>
            <dt>Agents</dt>
            <dd>{activeAgentsCount}</dd>
          </div>
          <div>
            <dt>Round</dt>
            <dd>{isNegotiating ? `${currentRound}/${maxTurns}` : 'Idle'}</dd>
          </div>
        </dl>
      </article>

      <article className="rail-card">
        <h4>Deal Snapshot</h4>
        <div className="rail-metrics">
          <div>
            <span>Success Rate</span>
            <strong>{successRate}%</strong>
          </div>
          <div>
            <span>Recent Deals</span>
            <strong>{dealsCount}</strong>
          </div>
        </div>
      </article>

      <article className="rail-card">
        <h4>Runtime Status</h4>
        <p>
          {isNegotiating
            ? 'Agents are actively exchanging proposals. Keep this panel visible to monitor convergence.'
            : 'System is ready. Start a simulation to stream agent reasoning and utility changes.'}
        </p>
        <button className="action-btn mt-2 w-full" onClick={onLoadMarketContext} disabled={marketLoading || !isAuthenticated}>
          {marketLoading ? 'Fetching real data...' : 'Fetch Real Market Data'}
        </button>
        {signals && (
          <div className="mt-2 text-xs text-slate-300">
            <p className="m-0">Fuel proxy: {String(signals.fuel_proxy ?? 'n/a')}</p>
            <p className="m-0 mt-1">Volatility: {String(signals.macro_volatility ?? 'n/a')}</p>
          </div>
        )}
      </article>
    </aside>
  );
};
