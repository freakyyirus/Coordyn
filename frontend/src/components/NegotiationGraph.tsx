/* ── Agent Negotiation Graph Visualization ── */

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../store/useStore';

const AGENT_COLORS: Record<string, string> = {
  Shipper: '#3B82F6',
  Carrier: '#EF4444',
  Warehouse: '#10B981',
};

export const NegotiationGraph: React.FC = () => {
  const messages = useStore((s) => s.messages);
  const lastResult = useStore((s) => s.lastResult);

  // Create initial nodes for agents
  const initialNodes: Node[] = useMemo(() => {
    const agents = ['Shipper', 'Carrier'];
    if (lastResult?.transcript?.some((m) => m.sender === 'Warehouse')) {
      agents.push('Warehouse');
    }

    return agents.map((agent, idx) => ({
      id: agent,
      position: { x: 150 + idx * 200, y: 100 },
      data: {
        label: agent,
        agentType: agent,
        status: 'idle' as const,
        utility: undefined,
      },
      style: {
        background: AGENT_COLORS[agent] || '#6C63FF',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 20px',
        fontWeight: 600,
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }));
  }, [lastResult]);

  // Create edges based on message history
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    const agentSet = new Set<string>();

    messages.forEach((msg, idx) => {
      // Find the previous message to determine who was talking to whom
      if (idx > 0) {
        const prevMsg = messages[idx - 1];
        const edgeId = `${prevMsg.sender}-${msg.sender}-${idx}`;

        if (!agentSet.has(edgeId)) {
          agentSet.add(edgeId);
          edges.push({
            id: edgeId,
            source: prevMsg.sender,
            target: msg.sender,
            animated: true,
            style: { stroke: '#FF7A00', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#FF7A00',
            },
          });
        }
      }
    });

    return edges;
  }, [messages]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update node statuses based on messages
  React.useEffect(() => {
    if (messages.length > 0) {
      setNodes((nds) =>
        nds.map((node) => {
          const lastMsg = [...messages].reverse().find((m) => m.sender === node.id);
          const utility = lastMsg?.utility;

          // Check if negotiation ended
          const lastContent = messages[messages.length - 1]?.content || '';
          let status: 'idle' | 'negotiating' | 'agreed' | 'rejected' = 'negotiating';
          if (lastContent.includes('DEAL_ACCEPTED')) {
            status = 'agreed';
          } else if (lastContent.includes('DEAL_REJECTED')) {
            status = 'rejected';
          }

          return {
            ...node,
            data: { ...node.data, status, utility },
            style: {
              ...node.style,
              border: utility ? `3px solid ${AGENT_COLORS[node.id]}` : undefined,
              boxShadow: status === 'agreed'
                ? '0 0 20px rgba(16, 185, 129, 0.5)'
                : status === 'rejected'
                  ? '0 0 20px rgba(239, 68, 68, 0.5)'
                  : '0 4px 12px rgba(0,0,0,0.15)',
            },
          };
        })
      );
    }
  }, [messages, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (messages.length === 0) {
    return (
      <div className="graph-empty">
        <p>Start a negotiation to see agent interactions</p>
      </div>
    );
  }

  return (
    <div className="negotiation-graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#E5E7EB" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = node.data?.status;
            if (status === 'agreed') return '#10B981';
            if (status === 'rejected') return '#EF4444';
            return AGENT_COLORS[node.id] || '#6C63FF';
          }}
          maskColor="rgba(240, 240, 240, 0.8)"
        />
      </ReactFlow>
    </div>
  );
};
