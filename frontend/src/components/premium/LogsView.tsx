import React from 'react';
import { Clock3, ListFilter } from 'lucide-react';
import { motion } from 'framer-motion';

type LogRow = {
  timestamp: string;
  agent: string;
  round: string;
  action: string;
  details: string;
};

type LogsViewProps = {
  logAgentFilter: string;
  setLogAgentFilter: (value: string) => void;
  activeAgents: string[];
  logRoundFilter: string;
  setLogRoundFilter: (value: string) => void;
  rounds: string[];
  logRows: LogRow[];
};

export const LogsView: React.FC<LogsViewProps> = ({
  logAgentFilter,
  setLogAgentFilter,
  activeAgents,
  logRoundFilter,
  setLogRoundFilter,
  rounds,
  logRows,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="rounded-[28px] border-2 border-slate-900 bg-white p-4 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-6 lg:p-8 overflow-auto"
    >
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Control tower feed</div>
          <h3 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950">Negotiation logs</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Filter round-by-round messages across shipper, carrier, warehouse, and custom agents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 lg:min-w-[460px]">
          <div className="flex flex-1 items-center gap-3 rounded-full border-2 border-slate-900 bg-[#fcfcfb] px-4 py-2.5 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
            <ListFilter size={16} className="text-slate-400" />
            <select 
              value={logAgentFilter} 
              onChange={(e) => setLogAgentFilter(e.target.value)}
              className="flex-1 bg-transparent font-mono text-xs font-bold uppercase tracking-wider outline-none"
            >
              <option value="All">All Agents</option>
              {activeAgents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 items-center gap-3 rounded-full border-2 border-slate-900 bg-[#fcfcfb] px-4 py-2.5 shadow-[4px_4px_0_rgba(15,23,42,0.95)]">
            <Clock3 size={16} className="text-slate-400" />
            <select 
              value={logRoundFilter} 
              onChange={(e) => setLogRoundFilter(e.target.value)}
              className="flex-1 bg-transparent font-mono text-xs font-bold uppercase tracking-wider outline-none"
            >
              <option value="All">All Rounds</option>
              {rounds.map((round) => (
                <option key={round} value={round}>
                  Round {round}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-[26px] border-2 border-slate-900 bg-white shadow-[6px_6px_0_rgba(15,23,42,0.95)]">
      <table className="logs-table min-w-full">
        <thead className="bg-white">
          <tr>
            <th>Timestamp</th>
            <th>Round</th>
            <th>Agent</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logRows.length ? (
            logRows.map((row, idx) => (
              <tr key={`${row.timestamp}-${idx}`}>
                <td>{row.timestamp}</td>
                <td>{row.round}</td>
                <td>{row.agent}</td>
                <td>{row.action}</td>
                <td>{row.details}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="empty-msg py-10 text-center">No messages for the selected filters.</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </motion.section>
  );
};
