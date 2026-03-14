/* ── Live Negotiation Dashboard (Command Center) ── */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { api, connectWebSocket } from '../services/api';
import { Play, Square, Activity, Settings2, BarChart4, ChevronRight, BrainCircuit } from 'lucide-react';
import type { WSMessage } from '../types';

const AGENT_META: Record<string, { color: string, badge: string }> = {
  Sender: { color: '#FF5A1F', badge: 'SN' },
  Supplier: { color: '#8B5CF6', badge: 'SU' },
  Warehouse: { color: '#10B981', badge: 'WH' },
  Distributor: { color: '#F59E0B', badge: 'DI' },
  Carrier: { color: '#3B82F6', badge: 'CA' },
};

export const NegotiateView: React.FC = () => {
  const {
    scenario, setScenario,
    strategy, setStrategy,
    includeWarehouse, setIncludeWarehouse,
    maxTurns, setMaxTurns,
    appInfo,
    isNegotiating, setIsNegotiating,
    messages, addMessage, clearMessages,
    setLastResult, setView, setError
  } = useStore();

  const [showReasoning, setShowReasoning] = useState(true);
  const [utilities, setUtilities] = useState<Record<string, number>>({});
  
  const feedRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const updateUtilities = (sender: string, runUtil?: number | null) => {
    if (runUtil != null && AGENT_META[sender]) {
      setUtilities(prev => ({ ...prev, [sender]: runUtil }));
    }
  };

  const handleStart = async () => {
    try {
      clearMessages();
      setLastResult(null);
      setUtilities({});
      setIsNegotiating(true);
      setError(null);

      const normalizedStrategy = strategy === 'aggressive' ? 'competitive' : strategy;
      const config = { scenario, strategy: normalizedStrategy, include_warehouse: includeWarehouse, max_turns: maxTurns };
      const sessionId = `live-${Date.now()}`;

      // Initialize WS Stream
      const ws = connectWebSocket(
        sessionId,
        (msg: WSMessage) => {
          if (msg.status === 'stopped') {
            addMessage({ round: 0, sender: 'System', content: 'Simulation Interrupted', timestamp: Date.now() / 1000, reasoning: null, price_mentioned: null, utility: null });
            setIsNegotiating(false);
            return;
          }
          if (msg.sender && msg.content) {
            addMessage({
              round: msg.round || 0,
              sender: msg.sender,
              content: msg.content,
              timestamp: msg.timestamp || (Date.now() / 1000),
              reasoning: msg.reasoning || null,
              utility: msg.utility || null,
              price_mentioned: msg.price || null
            });
            updateUtilities(msg.sender, msg.utility);
          }
        },
        () => {
          // On Complete, fetch final REST result for baseline metrics
          api.startNegotiation(config as any).then(res => {
            setLastResult(res);
            setIsNegotiating(false);
          }).catch(err => {
            setError(err.message);
            setIsNegotiating(false);
          });
        },
        (errorMsg) => {
          setError(errorMsg);
          setIsNegotiating(false);
        }
      );
      
      wsRef.current = ws as any;
      
      setTimeout(() => {
        ws.send({ command: 'start', ...config });
      }, 300);

    } catch (err: any) {
      setError(err.message);
      setIsNegotiating(false);
    }
  };

  const handleStop = () => {
    if (wsRef.current) {
      (wsRef.current as any).send({ command: 'stop' });
    }
    setIsNegotiating(false);
  };

  const activeAgents = Object.keys(AGENT_META).filter(a => includeWarehouse ? true : a !== 'Warehouse');
  const maxRounds = maxTurns;
  const currentRound = Math.min(Math.ceil((messages.filter(m => m.sender !== 'System').length) / activeAgents.length), maxRounds);

  return (
    <div className="cmd-center">
      {/* 1. Left Panel (Settings) */}
      <div className="glass-panel">
        <div className="glass-panel-header">
          <h3 className="glass-panel-title"><Settings2 size={16}/> Environment Config</h3>
        </div>
        <div className="glass-panel-content">
          <div className="form-group">
            <label className="form-label">Simulation Scenario</label>
            <select className="form-select" value={scenario} onChange={e => setScenario(e.target.value)} disabled={isNegotiating}>
              {appInfo?.scenarios?.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Agent Strategy Priority</label>
            <select className="form-select" value={strategy} onChange={e => setStrategy(e.target.value)} disabled={isNegotiating}>
              <option value="balanced">Balanced Compromise</option>
              <option value="competitive">Competitive (Firm)</option>
              <option value="cooperative">Cooperative (Yielding)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Max Negotiation Turns</label>
            <input type="number" className="form-input" min={2} max={30} value={maxTurns} onChange={e => setMaxTurns(parseInt(e.target.value))} disabled={isNegotiating} />
          </div>
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={includeWarehouse} onChange={e => setIncludeWarehouse(e.target.checked)} disabled={isNegotiating} />
              Include Warehouse Agent (Storage)
            </label>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={showReasoning} onChange={e => setShowReasoning(e.target.checked)} />
              Show AI Internal Monologue <code>[THINKING]</code>
            </label>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            {!isNegotiating ? (
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleStart}>
                <Play size={16} fill="currentColor"/> Start Simulation
              </button>
            ) : (
              <button className="btn btn-ghost" style={{ width: '100%', borderColor: 'var(--error)', color: 'var(--error)' }} onClick={handleStop}>
                <Square size={16} fill="currentColor"/> Stop Simulation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Center Panel (Graph + Feed) */}
      <div className="glass-panel">
        <div className="glass-panel-header">
          <h3 className="glass-panel-title"><Activity size={16}/> Live Negotiation Network</h3>
          {isNegotiating && (
            <div className="feed-header-meta">
              <span><div className="pulse-dot"></div> System Active (Round {currentRound}/{maxRounds})</span>
            </div>
          )}
        </div>
        
        {/* Abstract Agent Interaction Graph overlay */}
        <div className="interaction-graph">
          {activeAgents.map((agent) => (
            <div key={agent} className={`agent-node ${isNegotiating ? 'active' : ''}`} style={{ borderColor: AGENT_META[agent].color }}>
              <span>{agent}</span>
              <span className="util">Util: {(utilities[agent] || 0).toFixed(2)}</span>
            </div>
          ))}
          {/* Faux graph connection lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
            {activeAgents.length === 2 && (
              <line x1="30%" y1="50%" x2="70%" y2="50%" stroke="var(--border)" strokeWidth="2" strokeDasharray="4" />
            )}
            {activeAgents.length === 3 && (
              <>
                <line x1="25%" y1="50%" x2="50%" y2="50%" stroke="var(--border)" strokeWidth="2" strokeDasharray="4" />
                <line x1="50%" y1="50%" x2="75%" y2="50%" stroke="var(--border)" strokeWidth="2" strokeDasharray="4" />
                <path d="M 25% 45% Q 50% 10% 75% 45%" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4" />
              </>
            )}
          </svg>
        </div>

        {/* Chat Feed */}
        <div className="feed-messages" ref={feedRef}>
          {messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              Configuration loaded. Awaiting simulation start...
            </div>
          ) : (
            messages.map((msg, i) => (
              <div 
                key={i} 
                className="chat-bubble" 
                style={{ '--role-color': AGENT_META[msg.sender]?.color || 'var(--text-muted)' } as React.CSSProperties}
              >
                <div className="chat-meta">
                  <span className="chat-agent">
                    {msg.sender !== 'System' && <div style={{width:8, height:8, borderRadius:'50%', background: AGENT_META[msg.sender]?.color}}></div>}
                    {msg.sender}
                  </span>
                  {msg.utility != null && <span className="chat-util">UTL: {msg.utility.toFixed(2)}</span>}
                </div>
                
                {showReasoning && msg.reasoning && (
                  <div className="ai-thinking">
                    <div className="ai-thinking-label">
                      <BrainCircuit size={12}/> Agent Internal Monologue <div className="ai-cursor"/>
                    </div>
                    {msg.reasoning}
                  </div>
                )}
                
                <div className="chat-content">
                  {msg.content}
                </div>
              </div>
            ))
          )}
          
          {/* Post-Negotiation Banner */}
          {!isNegotiating && messages.length > 0 && messages[messages.length-1].sender !== 'System' && (
            <div className="deal-banner">
              <div>
                <h4>Simulation Concluded</h4>
                <p>All agents have reached terminal states or agreement.</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setView('results')}>
                Analytics Dashboard <ChevronRight size={16}/>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right Panel (Telemetry / Analytics) */}
      <div className="glass-panel">
        <div className="glass-panel-header">
          <h3 className="glass-panel-title"><BarChart4 size={16}/> System Telemetry</h3>
        </div>
        <div className="glass-panel-content">
          <div className="status-grid">
            <div className="status-item">
              <span className="val">{activeAgents.length}</span>
              <span className="lbl">Active Agents</span>
            </div>
            <div className="status-item">
              <span className="val">{currentRound} / {maxRounds}</span>
              <span className="lbl">Current Round</span>
            </div>
          </div>

          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '0.5px' }}>
            Live Utility Tracking
          </h4>
          
          <div className="agent-meters-box">
            {activeAgents.map(agent => (
              <div key={agent} className="meter">
                <div className="meter-head">
                  <span style={{color: AGENT_META[agent].color}}>{agent} Satisfaction</span>
                  <span className="text-mono">{(utilities[agent] || 0).toFixed(2)}</span>
                </div>
                <div className="meter-track">
                  <div 
                    className="meter-fill" 
                    style={{ 
                      width: `${Math.min(100, Math.max(0, (utilities[agent] || 0) * 10))}%`, // Scale 0-10 -> 0-100%
                      background: AGENT_META[agent].color 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-inset)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '8px' }}><BrainCircuit size={14} style={{display:'inline', marginBottom:'-2px'}}/> LLM Diagnostics</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Engine: AutoGen Multi-Agent<br/>
              Reasoning: Strict XML Parser<br/>
              Model: GPT-4o-mini (Proxied)<br/>
              Stream Status: {isNegotiating ? <span className="text-success">Connected (WSS)</span> : <span className="text-muted">Idle</span>}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
