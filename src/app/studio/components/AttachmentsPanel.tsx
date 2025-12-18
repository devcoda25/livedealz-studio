import React from "react";

export function AttachmentsPanel(props: { attachments: { id: number; from: string; type: string; label: string; status: string }[]; onApprove: (id: number) => void; onReject: (id: number) => void }) {
    const { attachments, onApprove, onReject } = props;
    const pending = attachments.filter((a) => a.status === "Pending");
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-[11px]">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold">Attachments</h3>
                <span className="text-[10px] text-slate-500">{pending.length} pending</span>
            </div>
            <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                {pending.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-[10px] border border-slate-800 rounded-lg px-2 py-1 bg-slate-950">
                        <div className="min-w-0">
                            <div className="text-slate-100 truncate">{a.label}</div>
                            <div className="text-slate-500 truncate">{a.type.toUpperCase()} · {a.from}</div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px]" onClick={() => onApprove(a.id)}>Approve</button>
                            <button className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[9px]" onClick={() => onReject(a.id)}>Reject</button>
                        </div>
                    </div>
                ))}
                {pending.length === 0 && <div className="text-[10px] text-slate-500">No pending attachments.</div>}
            </div>
        </div>
    );
}
