import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import {
  ArrowRight,
  Bot,
  CircleGauge,
  Gauge,
  LayoutDashboard,
  ListFilter,
  Pause,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  TableProperties,
  TrendingUp,
} from 'lucide-react';
import {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from './store/useStore';
import { api, connectWebSocket } from './services/api';
import { AgentsView } from './components/premium/AgentsView';
import { AnalyticsView } from './components/premium/AnalyticsView';
import { AuthModal } from './components/premium/AuthModal';
import { DashboardView } from './components/premium/DashboardView';
import { EnvironmentView } from './components/premium/EnvironmentView';
import { LandingPage } from './components/premium/LandingPage';
import { LogsView } from './components/premium/LogsView';
import { NegotiationsView } from './components/premium/NegotiationsView';
import { OnboardingModal } from './components/premium/OnboardingModal';
import { PricingView } from './components/premium/PricingView';
import type { AppView, WSMessage } from './types';

const NAV_ITEMS: { key: AppView; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { key: 'negotiations', label: 'Simulations', icon: <CircleGauge size={16} /> },
  { key: 'agents', label: 'Agents', icon: <Bot size={16} /> },
  { key: 'analytics', label: 'Analytics', icon: <TrendingUp size={16} /> },
  { key: 'environment', label: 'Settings', icon: <Settings size={16} /> },
  { key: 'logs', label: 'Logs', icon: <TableProperties size={16} /> },
  { key: 'pricing', label: 'Pricing', icon: <Gauge size={16} /> },
];

const LANDING_NAV_ITEMS: Array<{ label: string; view: AppView }> = [
  { label: 'Integrations', view: 'agents' },
  { label: 'Pricing', view: 'pricing' },
  { label: 'Docs', view: 'analytics' },
  { label: 'Enterprise', view: 'dashboard' },
  { label: 'Resources', view: 'logs' },
];

const AGENT_COLORS: Record<string, string> = {
  Sender: '#FF5A1F',    // Orange - Shipping origin
  Supplier: '#8B5CF6',   // Purple - Raw materials
  Warehouse: '#10B981',  // Emerald - Storage
  Distributor: '#F59E0B', // Amber - Distribution
  Carrier: '#3B82F6',    // Blue - Transportation
};

const DEFAULT_AGENTS = ['Sender', 'Supplier', 'Warehouse', 'Distributor', 'Carrier'];


const ADVANCED_FEATURES = [
  {
    title: 'Strategy Learning',
    text: 'Agents adapt from prior simulations and build stronger negotiation policy profiles.',
  },
  {
    title: 'Reinforcement Loop',
    text: 'Every simulation outcome can become a feedback signal for policy improvement.',
  },
  {
    title: 'Market Shock Simulator',
    text: 'Inject fuel spikes, supply shortages, and capacity drops to stress-test strategies.',
  },
  {
    title: 'Human vs AI Mode',
    text: 'Let human operators negotiate against autonomous agents for benchmarking.',
  },
];

const speedToTurns = (speed: number): number => {
  if (speed === 5) return 8;
  if (speed === 2) return 10;
  return 12;
};

const App: React.FC = () => {
  const {
    view,
    setView,
    scenario,
    setScenario,
    strategy,
    setStrategy,
    includeWarehouse,
    setIncludeWarehouse,
    maxTurns,
    setMaxTurns,
    appInfo,
    setAppInfo,
    deals,
    setDeals,
    isNegotiating,
    setIsNegotiating,
    messages,
    addMessage,
    clearMessages,
    lastResult,
    setLastResult,
    error,
    setError,
  } = useStore();

  const [simulationPrompt, setSimulationPrompt] = useState(
    'Simulate negotiation between 3 logistics agents competing for 6 trucks.',
  );
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [showReasoning, setShowReasoning] = useState(true);
  const [paused, setPaused] = useState(false);
  const [utilityByAgent, setUtilityByAgent] = useState<Record<string, number>>({});

  const [totalResources, setTotalResources] = useState(6);
  const [availableResources, setAvailableResources] = useState(6);
  const [deadlineHours, setDeadlineHours] = useState(48);
  const [costModel, setCostModel] = useState('Dynamic market pricing');

  const [logAgentFilter, setLogAgentFilter] = useState('All');
  const [logRoundFilter, setLogRoundFilter] = useState('All');

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupUseCase, setSignupUseCase] = useState('Supply Chain');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [simulationType, setSimulationType] = useState('Supply Chain');
  const [agentCount, setAgentCount] = useState(3);
  const [resourceType, setResourceType] = useState('Transportation');
  const [simulationGoal, setSimulationGoal] = useState('Minimize cost');
  const [environmentName, setEnvironmentName] = useState('Rush Delivery Arena');
  const [environmentDescription, setEnvironmentDescription] = useState('Multi-agent supply chain negotiation under delivery pressure.');
  const [environmentType, setEnvironmentType] = useState('Supply Chain');
  const [newAgentName, setNewAgentName] = useState('Supplier_A');
  const [newAgentRole, setNewAgentRole] = useState('Supplier Agent');
  const [newAgentObjective, setNewAgentObjective] = useState('Minimize transportation cost');
  const [newAgentConstraints, setNewAgentConstraints] = useState('Max supply = 100 units');
  const [createdAgents, setCreatedAgents] = useState<Array<{
    name: string;
    role: string;
    objective: string;
    constraints: string;
    strategy: string;
  }>>([]);
  const [marketContext, setMarketContext] = useState<Record<string, unknown> | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  const normalizedStrategy = strategy === 'aggressive' ? 'competitive' : strategy;

  const feedRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<{ send: (data: Record<string, unknown>) => void; close: () => void } | null>(null);

  const activeAgents = useMemo(() => {
    if (createdAgents.length) {
      return createdAgents.map((agent) => agent.name);
    }
    return [...DEFAULT_AGENTS];
  }, [createdAgents]);

  const currentRound = useMemo(() => {
    const nonSystem = messages.filter((m) => m.sender !== 'System').length;
    const turns = Math.max(activeAgents.length, 1);
    return Math.max(1, Math.ceil(nonSystem / turns));
  }, [messages, activeAgents.length]);

  const successRate = useMemo(() => {
    if (!deals.length) return 0;
    const accepted = deals.filter((d) => d.status === 'accepted').length;
    return Math.round((accepted / deals.length) * 100);
  }, [deals]);

  const recentEvents = useMemo(() => {
    return messages.slice(-6).reverse();
  }, [messages]);

  const graphNodes: Node[] = useMemo(() => {
    return activeAgents.map((agent, idx) => ({
      id: agent,
      data: { label: agent },
      position:
        activeAgents.length === 2
          ? { x: 120 + idx * 280, y: 120 }
          : idx === 0
            ? { x: 80, y: 140 }
            : idx === 1
              ? { x: 280, y: 50 }
              : { x: 480, y: 140 },
      style: {
        background: '#ffffff',
        color: '#0f172a',
        border: '3px solid #0f172a',
        borderRadius: 24,
        boxShadow: '6px 6px 0 rgba(15,23,42,0.95)',
        fontWeight: 700,
        minWidth: 160,
        textAlign: 'center',
        padding: '12px 10px',
        fontFamily: 'Space Grotesk, sans-serif',
      },
    }));
  }, [activeAgents]);

  const graphEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < activeAgents.length; i += 1) {
      const source = activeAgents[i];
      const target = activeAgents[(i + 1) % activeAgents.length];
      if (source !== target) {
        edges.push({
          id: `${source}-${target}`,
          source,
          target,
          animated: isNegotiating,
          style: { stroke: '#0f172a', strokeWidth: 3 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#0f172a',
          },
        });
      }
    }
    return edges;
  }, [activeAgents, isNegotiating]);

  const offerRows = useMemo(() => {
    return messages
      .filter((m) => m.sender !== 'System')
      .map((m, idx) => ({
        id: `${m.timestamp}-${idx}`,
        agent: m.sender,
        requestedResources: Math.max(1, Math.floor(totalResources / activeAgents.length)),
        offerPrice: m.price_mentioned ?? 0,
        priority: m.utility != null && m.utility > 6 ? 'High' : m.utility != null && m.utility > 3 ? 'Medium' : 'Low',
        status: /accept/i.test(m.content)
          ? 'Accepted'
          : /reject|decline/i.test(m.content)
            ? 'Rejected'
            : 'Pending',
      }))
      .reverse();
  }, [messages, totalResources, activeAgents.length]);

  const rounds = useMemo(() => {
    const map = new Map<number, typeof messages>();
    messages.forEach((m) => {
      if (!map.has(m.round)) {
        map.set(m.round, []);
      }
      map.get(m.round)?.push(m);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [messages]);

  const dashboardSeries = useMemo(() => {
    const byRound = new Map<number, { round: string; utilization: number; success: number }>();
    messages.forEach((m) => {
      const key = m.round || 1;
      const roundKey = `R${key}`;
      const current = byRound.get(key) ?? { round: roundKey, utilization: 0, success: 0 };
      current.utilization = Math.min(100, current.utilization + 20);
      if (/accept/i.test(m.content)) current.success = Math.min(100, current.success + 35);
      byRound.set(key, current);
    });

    if (!byRound.size) {
      return [
        { round: 'R1', utilization: 32, success: 24 },
        { round: 'R2', utilization: 48, success: 38 },
        { round: 'R3', utilization: 63, success: 50 },
      ];
    }
    return [...byRound.values()];
  }, [messages]);

  const analyticsSeries = useMemo(() => {
    if (lastResult?.utility_trajectory?.length) {
      return lastResult.utility_trajectory.map((u) => ({
        round: `R${u.round}`,
        shipper: Math.round(u.shipper * 10),
        carrier: Math.round(u.carrier * 10),
      }));
    }
    return [
      { round: 'R1', shipper: 32, carrier: 27 },
      { round: 'R2', shipper: 45, carrier: 41 },
      { round: 'R3', shipper: 54, carrier: 52 },
      { round: 'R4', shipper: 68, carrier: 63 },
    ];
  }, [lastResult]);

  const logRows = useMemo(() => {
    const normalized = messages
      .filter((m) => m.sender !== 'System')
      .map((m) => ({
        timestamp: new Date(m.timestamp * 1000).toLocaleTimeString(),
        agent: m.sender,
        round: String(m.round),
        action: /accept/i.test(m.content)
          ? 'Accepted offer'
          : /counter|offer/i.test(m.content)
            ? 'Proposed offer'
            : 'Negotiation message',
        details: m.content,
      }));

    return normalized.filter((row) => {
      const passAgent = logAgentFilter === 'All' || row.agent === logAgentFilter;
      const passRound = logRoundFilter === 'All' || row.round === logRoundFilter;
      return passAgent && passRound;
    });
  }, [messages, logAgentFilter, logRoundFilter]);

  useEffect(() => {
    if (!appInfo) {
      api.getInfo().then(setAppInfo).catch(() => {
        setError('Failed to fetch simulation info.');
      });
    }
  }, [appInfo, setAppInfo, setError]);

  useEffect(() => {
    if (!api.getToken()) return;
    api
      .me()
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        api.clearToken();
        setIsAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setDeals([]);
      return;
    }
    api.getDeals(30).then(setDeals).catch(() => {
      setError('Failed to fetch recent deal history.');
    });
  }, [isAuthenticated, setDeals, setError]);

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.utility == null || !AGENT_COLORS[last.sender]) return;
    setUtilityByAgent((prev) => ({ ...prev, [last.sender]: last.utility as number }));
  }, [messages]);

  const pushSuggestion = (text: string) => {
    setSimulationPrompt(`Simulate ${text.toLowerCase()} between 3 AI agents with finite resources.`);
  };

  const startSimulation = () => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    clearMessages();
    setLastResult(null);
    setError(null);
    setPaused(false);
    setUtilityByAgent({});
    setMaxTurns(speedToTurns(simulationSpeed));
    setIsNegotiating(true);

    const sessionId = `session-${Date.now()}`;
    const config = {
      scenario,
      strategy: normalizedStrategy,
      include_warehouse: includeWarehouse,
      max_turns: speedToTurns(simulationSpeed),
      custom_agents: createdAgents.length ? createdAgents : undefined,
    };

    const ws = connectWebSocket(
      sessionId,
      (msg: WSMessage) => {
        if (paused) return;
        if (msg.sender && msg.content) {
          addMessage({
            round: msg.round || 1,
            sender: msg.sender,
            content: msg.content,
            reasoning: msg.reasoning ?? null,
            price_mentioned: msg.price ?? null,
            timestamp: msg.timestamp ?? Date.now() / 1000,
            utility: msg.utility ?? null,
          });
        }
      },
      () => {
        api
          .startNegotiation(config)
          .then((res) => {
            setLastResult(res);
            setIsNegotiating(false);
            api.getDeals(30).then(setDeals).catch(() => undefined);
          })
          .catch((err: Error) => {
            setError(err.message);
            setIsNegotiating(false);
          });
      },
      (err) => {
        setError(err);
        setIsNegotiating(false);
      },
    );

    wsRef.current = ws;
    setTimeout(() => {
      ws.send({ command: 'start', ...config });
    }, 250);
  };

  const pauseSimulation = () => {
    if (!wsRef.current || !isNegotiating) return;
    wsRef.current.send({ command: 'stop' });
    setPaused(true);
    setIsNegotiating(false);
  };

  const resetSimulation = () => {
    wsRef.current?.close();
    wsRef.current = null;
    clearMessages();
    setLastResult(null);
    setPaused(false);
    setIsNegotiating(false);
    setUtilityByAgent({});
  };

  const openDashboard = () => {
    setView('dashboard');
    if (!appInfo?.scenarios.length) return;
    const exact = appInfo.scenarios.find((s) => simulationPrompt.toLowerCase().includes(s.name.toLowerCase()));
    if (exact) {
      setScenario(exact.name);
    }
  };

  const handleStartSimulation = () => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    if (showOnboarding) return;
    setView('dashboard');
  };

  const handleAuthSuccess = async () => {
    try {
      setAuthLoading(true);
      setError(null);

      if (authMode === 'signup') {
        if (signupPassword !== signupConfirmPassword) {
          setError('Passwords do not match.');
          return;
        }

        await api.signup({
          full_name: signupName,
          email: signupEmail,
          password: signupPassword,
          company: signupCompany || undefined,
          use_case: signupUseCase,
        });
      } else {
        await api.login({ email: loginEmail, password: loginPassword });
      }

      await api.me();
      setIsAuthenticated(true);
      setShowAuth(false);
      setShowOnboarding(true);
      setOnboardingStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setView('dashboard');
    setIncludeWarehouse(agentCount >= 3);
  };

  const addAgent = () => {
    if (!newAgentName.trim()) return;
    setCreatedAgents((prev) => [
      ...prev,
      {
        name: newAgentName.trim(),
        role: newAgentRole,
        objective: newAgentObjective.trim() || 'Custom objective',
        constraints: newAgentConstraints.trim() || 'None',
        strategy: normalizedStrategy,
      },
    ]);
    setNewAgentName('');
  };

  const loadMarketContext = async () => {
    try {
      setMarketLoading(true);
      const data = await api.getMarketContext();
      setMarketContext(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market context');
    } finally {
      setMarketLoading(false);
    }
  };

  const renderLanding = () => (
    <LandingPage
      simulationPrompt={simulationPrompt}
      onSimulationPromptChange={setSimulationPrompt}
      onStartSimulation={handleStartSimulation}
      onWatchDemo={() => setView('dashboard')}
      onPushSuggestion={pushSuggestion}
    />
  );

  const renderDashboard = () => (
    <DashboardView
      activeAgents={activeAgents}
      graphNodes={graphNodes}
      graphEdges={graphEdges}
      isNegotiating={isNegotiating}
      utilityByAgent={utilityByAgent}
      newAgentName={newAgentName}
      setNewAgentName={setNewAgentName}
      newAgentRole={newAgentRole}
      setNewAgentRole={setNewAgentRole}
      addAgent={addAgent}
      showReasoning={showReasoning}
      setShowReasoning={setShowReasoning}
      currentRound={currentRound}
      maxTurns={maxTurns}
      startSimulation={startSimulation}
      pauseSimulation={pauseSimulation}
      resetSimulation={resetSimulation}
      recentEvents={recentEvents}
      feedRef={feedRef}
      dashboardSeries={dashboardSeries}
      totalResources={totalResources}
      availableResources={availableResources}
      successRate={successRate}
      deals={deals}
      strategy={strategy}
      setStrategy={setStrategy}
      includeWarehouse={includeWarehouse}
      setIncludeWarehouse={setIncludeWarehouse}
    />
  );

  const renderAgents = () => (
    <AgentsView
      newAgentName={newAgentName}
      setNewAgentName={setNewAgentName}
      newAgentRole={newAgentRole}
      setNewAgentRole={setNewAgentRole}
      newAgentObjective={newAgentObjective}
      setNewAgentObjective={setNewAgentObjective}
      newAgentConstraints={newAgentConstraints}
      setNewAgentConstraints={setNewAgentConstraints}
      addAgent={addAgent}
      createdAgents={createdAgents}
      fallbackAgents={activeAgents.map((agent) => ({
        name: `${agent}_Auto`,
        role: `${agent} Agent`,
        objective: 'Auto-generated objective',
        constraints: 'Context constraints applied',
        strategy: normalizedStrategy,
      }))}
    />
  );

  const renderNegotiations = () => <NegotiationsView rounds={rounds} offerRows={offerRows} />;

  const renderEnvironment = () => (
    <EnvironmentView
      environmentName={environmentName}
      setEnvironmentName={setEnvironmentName}
      environmentDescription={environmentDescription}
      setEnvironmentDescription={setEnvironmentDescription}
      environmentType={environmentType}
      setEnvironmentType={setEnvironmentType}
      resourceType={resourceType}
      setResourceType={setResourceType}
      totalResources={totalResources}
      setTotalResources={setTotalResources}
      setAvailableResources={setAvailableResources}
      agentCount={agentCount}
      setAgentCount={setAgentCount}
      maxTurns={maxTurns}
      setMaxTurns={setMaxTurns}
      deadlineHours={deadlineHours}
      setDeadlineHours={setDeadlineHours}
    />
  );

  const renderAnalytics = () => (
    <AnalyticsView
      dashboardSeries={dashboardSeries}
      analyticsSeries={analyticsSeries}
      normalizedStrategy={normalizedStrategy}
    />
  );

  const renderLogs = () => (
    <LogsView
      logAgentFilter={logAgentFilter}
      setLogAgentFilter={setLogAgentFilter}
      activeAgents={activeAgents}
      logRoundFilter={logRoundFilter}
      setLogRoundFilter={setLogRoundFilter}
      rounds={[...new Set(messages.map((message) => String(message.round)))]}
      logRows={logRows}
    />
  );

  const renderPricing = () => <PricingView features={ADVANCED_FEATURES} />;

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return renderDashboard();
      case 'agents':
        return renderAgents();
      case 'negotiations':
        return renderNegotiations();
      case 'environment':
        return renderEnvironment();
      case 'analytics':
        return renderAnalytics();
      case 'logs':
        return renderLogs();
      case 'pricing':
        return renderPricing();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="app-shell">
      {error && (
        <div className="toast-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <AuthModal
        open={showAuth}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authLoading={authLoading}
        signupName={signupName}
        setSignupName={setSignupName}
        signupEmail={signupEmail}
        setSignupEmail={setSignupEmail}
        signupPassword={signupPassword}
        setSignupPassword={setSignupPassword}
        signupConfirmPassword={signupConfirmPassword}
        setSignupConfirmPassword={setSignupConfirmPassword}
        signupCompany={signupCompany}
        setSignupCompany={setSignupCompany}
        signupUseCase={signupUseCase}
        setSignupUseCase={setSignupUseCase}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        onSubmit={handleAuthSuccess}
        onClose={() => setShowAuth(false)}
      />

      <OnboardingModal
        open={showOnboarding}
        onboardingStep={onboardingStep}
        setOnboardingStep={setOnboardingStep}
        simulationType={simulationType}
        setSimulationType={setSimulationType}
        agentCount={agentCount}
        setAgentCount={setAgentCount}
        resourceType={resourceType}
        setResourceType={setResourceType}
        simulationGoal={simulationGoal}
        setSimulationGoal={setSimulationGoal}
        onComplete={handleOnboardingComplete}
      />

      {view === 'landing' ? (
        <>
          <header className="sticky top-0 z-50 border-b-2 border-slate-900 bg-[#fffdf8]/95 px-4 py-3 backdrop-blur md:px-8">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <button className="flex items-center gap-3 text-slate-900" onClick={() => setView('landing')}>
              <strong className="font-heading text-[30px] font-bold tracking-[-0.05em] text-slate-950">Coordyn</strong>
            </button>
            <nav className="hidden items-center gap-2 rounded-full border-2 border-slate-900 bg-white p-1 shadow-[4px_4px_0_rgba(15,23,42,0.95)] lg:flex">
              {LANDING_NAV_ITEMS.map((item) => (
                <motion.button
                  key={item.label}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400 transition-colors hover:bg-[#fff36d] hover:text-slate-900"
                  onClick={() => setView(item.view)}
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <button className="hidden font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400 transition-colors hover:text-slate-700 md:inline-flex" onClick={() => { setAuthMode('login'); setShowAuth(true); }}>
                Sign in
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-[#f8c7aa] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-900 shadow-[4px_4px_0_rgba(15,23,42,0.95)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(15,23,42,0.95)]" onClick={handleStartSimulation}>
                {isAuthenticated ? 'Playground' : 'Get access'}
                <ArrowRight size={13} />
              </button>
            </div>
            </div>
          </header>
          {renderLanding()}
        </>
      ) : (
        <div className="flex flex-col h-screen w-full bg-platform-bgSoft text-slate-800 font-body overflow-hidden">
          {/* Top Navigation Bar */}
          <header className="z-50 shrink-0 border-b-2 border-slate-900 bg-[#fffdf8]/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-4">
            <button className="flex items-center gap-3 text-slate-900" onClick={() => setView('landing')}>
              <div className="grid h-9 w-9 place-items-center rounded-2xl border-2 border-slate-900 bg-[#fff36d] font-heading text-sm font-bold text-slate-950 shadow-[3px_3px_0_rgba(15,23,42,0.95)]">C</div>
              <div className="hidden flex-col text-left sm:flex">
                <strong className="text-sm font-heading tracking-tight leading-none text-slate-950">Coordyn</strong>
                <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Logistics control tower</span>
              </div>
            </button>
            <nav className="hidden flex-1 items-center justify-center lg:flex">
              <div className="flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white p-1.5 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
              {NAV_ITEMS.map((item) => (
                <motion.button
                  key={item.key}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    view === item.key ? 'bg-[#fff36d] text-slate-950 shadow-[2px_2px_0_rgba(15,23,42,0.95)]' : 'text-slate-500 hover:bg-[#fff7ec] hover:text-slate-900'
                  }`}
                  onClick={() => setView(item.key)}
                >
                  <span className={view === item.key ? 'text-platform-accent' : ''}>{item.icon}</span>
                  <span>{item.label}</span>
                </motion.button>
              ))}
              </div>
            </nav>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-mono text-slate-600 shadow-[3px_3px_0_rgba(15,23,42,0.95)]">
                <span className={`h-2 w-2 rounded-full ${isNegotiating ? 'bg-emerald-500 animate-pulseSlow' : 'bg-slate-300'}`}></span>
                {isNegotiating ? 'LIVE' : 'IDLE'}
              </span>
              {isAuthenticated && (
                <button className="rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-mono uppercase tracking-[0.14em] text-slate-500 shadow-[3px_3px_0_rgba(15,23,42,0.95)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_rgba(15,23,42,0.95)] hover:text-slate-700" onClick={() => { api.clearToken(); setIsAuthenticated(false); setView('landing'); }}>Logout</button>
              )}
            </div>
            </div>
          </header>

          <main className="flex-1 flex overflow-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                className="w-full h-full overflow-auto"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
