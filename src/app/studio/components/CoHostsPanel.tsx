import React from "react";

export function CoHostsPanel(props: { coHosts: { id: number; name: string; status: string }[]; onInvite: (name: string) => void }) {
    const { coHosts, onInvite } = props;
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-[11px]">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold">Co-host & crew</h3>
                <button className="text-[10px] text-[#f77f00] hover:underline" onClick={() => { const name = window.prompt("Enter co-host name (demo):"); if (name) onInvite(name); }}>
                    Invite
                </button>
            </div>
            <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                {coHosts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-100">
                                {c.name.split(" ").map((w) => w[0]).join("")}
                            </span>
                            <div className="min-w-0">
                                <div className="text-slate-100 truncate">{c.name}</div>
                                <div className="text-slate-500">{c.status}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button className="px-2 py-0.5 rounded-full border border-slate-700 text-slate-100 text-[9px]" onClick={() => alert("Accept (demo)")}>Accept</button>
                            <button className="px-2 py-0.5 rounded-full border border-slate-700 text-slate-300 text-[9px]" onClick={() => alert("Remove (demo)")}>Remove</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
