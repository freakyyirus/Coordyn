import React from 'react';

type RoundMessage = {
  timestamp: number;
  sender: string;
  content: string;
};

type OfferRow = {
  id: string;
  agent: string;
  requestedResources: number;
  offerPrice: number;
  priority: string;
  status: string;
};

type NegotiationsViewProps = {
  rounds: Array<[number, RoundMessage[]]>;
  offerRows: OfferRow[];
};

export const NegotiationsView: React.FC<NegotiationsViewProps> = ({ rounds, offerRows }) => {
  return (
    <section className="grid gap-6 overflow-auto p-4 xl:grid-cols-[1.2fr_1fr] xl:p-6">
      <article className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8">
        <header className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Transaction trail</div>
          <h3 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950">Round timeline</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">A sequential view of every offer, concession, and rejection across rounds.</p>
        </header>

        <div className="mt-8 flex flex-col gap-6">
          {rounds.length ? (
            rounds.map(([roundId, roundMessages]) => (
              <div key={roundId} className="relative rounded-[26px] border-2 border-slate-900 bg-[#fcfcfb] p-5 shadow-[5px_5px_0_rgba(15,23,42,0.95)]">
                <div className="absolute -left-3 -top-3 rounded-full border-2 border-slate-900 bg-white px-3 py-1 font-mono text-[10px] uppercase font-bold text-slate-950 shadow-[2px_2px_0_rgba(15,23,42,0.95)]">
                  Round {roundId}
                </div>
                <div className="mt-2 flex flex-col gap-4">
                  {roundMessages.map((message, idx) => (
                    <div key={`${message.timestamp}-${idx}`} className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-platform-accent uppercase tracking-wider">{message.sender}</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
               <span className="text-sm italic">No rounds recorded yet. Start a run from the dashboard to populate this timeline.</span>
            </div>
          )}
        </div>
      </article>

      <article className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_rgba(15,23,42,0.95)] md:p-8">
        <header className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Ledger details</div>
          <h3 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950">Active offers</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Current lane offers with requested capacity, price signals, and acceptance status.</p>
        </header>

        <div className="mt-8 overflow-hidden rounded-[26px] border-2 border-slate-900 bg-white shadow-[6px_6px_0_rgba(15,23,42,0.95)]">
          <table className="offer-table w-full border-collapse text-left">
            <thead className="bg-[#fcfcfb] border-b-2 border-slate-900">
              <tr>
                <th className="px-5 py-4 font-heading text-xs uppercase tracking-widest text-slate-500">Agent</th>
                <th className="px-5 py-4 font-heading text-xs uppercase tracking-widest text-slate-500">Capacity</th>
                <th className="px-5 py-4 font-heading text-xs uppercase tracking-widest text-slate-500">Price</th>
                <th className="px-5 py-4 font-heading text-xs uppercase tracking-widest text-slate-500">Priority</th>
                <th className="px-5 py-4 font-heading text-xs uppercase tracking-widest text-slate-500">Signal</th>
              </tr>
            </thead>
            <tbody>
              {offerRows.length ? (
                offerRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-950">{row.agent}</td>
                    <td className="px-5 py-4 font-mono text-sm">{row.requestedResources}</td>
                    <td className="px-5 py-4 font-mono text-sm">{row.offerPrice ? `$${row.offerPrice.toLocaleString()}` : '-'}</td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">{row.priority}</td>
                    <td className="px-5 py-4">
                      <span className={`status-pill ${row.status.toLowerCase()} rounded-full border-2 border-slate-900 px-3 py-1 text-[9px] font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(15,23,42,0.95)]`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-msg py-20 text-center font-mono text-sm text-slate-400 italic">No active offers on the table.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};
