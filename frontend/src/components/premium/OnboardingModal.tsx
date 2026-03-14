import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

type OnboardingModalProps = {
  open: boolean;
  onboardingStep: number;
  setOnboardingStep: (updater: (step: number) => number) => void;
  simulationType: string;
  setSimulationType: (value: string) => void;
  agentCount: number;
  setAgentCount: (value: number) => void;
  resourceType: string;
  setResourceType: (value: string) => void;
  simulationGoal: string;
  setSimulationGoal: (value: string) => void;
  onComplete: () => void;
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  onboardingStep,
  setOnboardingStep,
  simulationType,
  setSimulationType,
  agentCount,
  setAgentCount,
  resourceType,
  setResourceType,
  simulationGoal,
  setSimulationGoal,
  onComplete,
}) => {
  if (!open) return null;

  const progressPct = (onboardingStep / 4) * 100;

  return (
    <div className="modal-overlay" onClick={() => undefined}>
      <article className="modal-card onboarding-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-platform-accent/15 bg-platform-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-platform-accent">
              <Sparkles size={12} /> Setup flow
            </div>
            <h3 className="mt-4">Prepare your first simulation</h3>
            <p>Step {onboardingStep} of 4. These defaults shape your initial workspace.</p>
          </div>
          <div className="w-full max-w-[240px]">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
              <span>Progress</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-950 transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {onboardingStep === 1 && (
          <div className="onboarding-options md:grid-cols-2">
            {['Supply Chain', 'Financial Market', 'Resource Allocation', 'Custom Simulation'].map((type) => (
              <button key={type} className={`step-chip ${simulationType === type ? 'active' : ''}`} onClick={() => setSimulationType(type)}>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Simulation type</div>
                <p>{type}</p>
              </button>
            ))}
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="form-grid">
            <label>
              Choose Number of Agents ({agentCount})
              <input type="range" min={2} max={20} value={agentCount} onChange={(e) => setAgentCount(Number(e.target.value))} />
            </label>
          </div>
        )}

        {onboardingStep === 3 && (
          <div className="form-grid">
            <label>
              Choose Resource Type
              <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                <option>Transportation</option>
                <option>Capital</option>
                <option>Storage</option>
                <option>Energy</option>
                <option>Custom</option>
              </select>
            </label>
          </div>
        )}

        {onboardingStep === 4 && (
          <div className="form-grid">
            <label>
              Simulation Goal
              <select value={simulationGoal} onChange={(e) => setSimulationGoal(e.target.value)}>
                <option>Minimize cost</option>
                <option>Maximize utilization</option>
                <option>Meet deadlines</option>
                <option>Multi-objective</option>
              </select>
            </label>
          </div>
        )}

        <div className="modal-actions mt-6">
          {onboardingStep > 1 && <button className="action-btn" onClick={() => setOnboardingStep((s) => s - 1)}>Back</button>}
          {onboardingStep < 4 ? (
            <button className="action-btn start" onClick={() => setOnboardingStep((s) => s + 1)}>Next <ArrowRight size={14} /></button>
          ) : (
            <button className="action-btn start" onClick={onComplete}>Launch Dashboard <ArrowRight size={14} /></button>
          )}
        </div>
      </article>
    </div>
  );
};
