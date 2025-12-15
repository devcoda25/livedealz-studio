'use client';

import React, { useState, useEffect } from 'react';
import type {
  Product, Scene, ChatMessage, QAItem, Viewer, CoHost, Attachment, RunOfShowItem, SalesEvent,
  CommerceGoal, Mode, AudienceTab, MomentMarker
} from '@/types/studio';
import { useStudioSocket } from '@/hooks/useStudioSocket';
import { formatTimer, getCountdownSeconds } from '@/lib/utils';
import { LocalMediaPreview } from './LocalMediaPreview';


const EV_ORANGE = "#f77f00";

export default function CreatorLiveStudio() {
  const { state, actions } = useStudioSocket('main-studio');
  const { mode, startedAt, chat, stats, salesEvents, commerceGoal, flashDeal, momentMarkers, aiPrompts } = state;

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState('intro');

  const [highlightedProductId, setHighlightedProductId] = useState('P-101');
  const [flashConfigOpen, setFlashConfigOpen] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [languagePanelOpen, setLanguagePanelOpen] = useState(false);

  const [mobilePanel, setMobilePanel] = useState<"products" | "chat">("products");
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("chat");

  const [chatDraft, setChatDraft] = useState("");
  
  const [liveTimer, setLiveTimer] = useState("–:–");
  const [flashDealSeconds, setFlashDealSeconds] = useState(0);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (mode === 'live' && startedAt) {
        const elapsedSeconds = (Date.now() - startedAt) / 1000;
        setLiveTimer(formatTimer(elapsedSeconds));
      } else {
        setLiveTimer("–:–");
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [mode, startedAt]);

  useEffect(() => {
    const flashInterval = setInterval(() => {
      if (flashDeal.active && flashDeal.endsAt) {
        setFlashDealSeconds(getCountdownSeconds(flashDeal.endsAt));
      } else {
        setFlashDealSeconds(0);
      }
    }, 1000);
    return () => clearInterval(flashInterval);
  }, [flashDeal]);


  const coHosts: CoHost[] = [
    { id: 1, name: 'Dacy (Producer)', status: 'Accepted' },
    { id: 2, name: 'Grace (Brand rep)', status: 'Pending' },
  ];

  const attachments: Attachment[] = [
    { id: 1, from: 'Viewer #238', type: 'image', label: 'Before/after photo', status: 'Pending' },
    { id: 2, from: 'Viewer #874', type: 'question', label: 'Skin type question', status: 'Pending' },
  ];

  const qaItems: QAItem[] = [
    { id: 1, question: 'How long until I see results?', from: 'Viewer #321', status: 'unanswered' },
    { id: 2, question: 'Is this safe for sensitive skin?', from: 'Viewer #119', status: 'pinned' },
  ];

  const viewersList: Viewer[] = [
    { id: 1, name: 'Dacy (Producer)', tag: 'Moderator' },
    { id: 2, name: 'Grace (Brand rep)', tag: 'VIP' },
    { id: 3, name: 'Viewer #238', tag: '' },
    { id: 4, name: 'Viewer #874', tag: '' },
  ];

  const scriptCues: string[] = [
    "Welcome + short intro (name, theme of show).",
    "Explain key benefits in plain language.",
    "Mention discount code + flash window.",
    "Ask for questions, highlight 2 top FAQs.",
    "Recommend best combo for beginners.",
    "Close with CTA + follow reminder.",
  ];

  const runOfShow: RunOfShowItem[] = [
    { id: 'shot-1', label: 'Intro + hook', window: '00:00–03:00', scene: 'intro' },
    { id: 'shot-2', label: 'Hero demo: Serum texture', window: '03:00–08:00', scene: 'product' },
    { id: 'shot-3', label: 'Before / After slides', window: '08:00–12:00', scene: 'offer' },
    { id: 'shot-4', label: 'Q&A + objections', window: '12:00–18:00', scene: 'split' },
  ];

  const scenes: Scene[] = [
    { id: 'intro', label: 'Intro + host', desc: 'Single camera, no overlay' },
    { id: 'product', label: 'Product close-up', desc: 'Camera 2 or crop, hero overlay' },
    { id: 'split', label: 'Split screen', desc: 'Host + product / co-host' },
    { id: 'offer', label: 'Flash offer', desc: 'Full-screen offer graphic + timer' },
  ];

  const products: Product[] = [
    { id: 'P-101', name: 'GlowUp Serum – 30ml', price: '$24', stock: '52 in stock', tag: 'Hero product' },
    { id: 'P-102', name: 'GlowUp Cleanser', price: '$14', stock: '86 in stock', tag: 'Bundle with serum' },
    { id: 'P-103', name: 'GlowUp Night Cream', price: '$29', stock: '34 in stock', tag: 'Upsell after serum' },
  ];

  const toggleLive = () => {
    actions.setMode(mode === 'lobby' ? 'live' : 'lobby');
  };

  const handleSendChat = () => {
    const txt = chatDraft.trim();
    if (!txt) return;
    actions.sendChat(txt);
    setChatDraft('');
  };

  const handleApproveAttachment = (id: number) => alert(`Approved attachment ${id} to show on stream (demo only).`);
  const handleRejectAttachment = (id: number) => alert(`Rejected attachment ${id} (demo only).`);
  const handleOpenFlashConfig = () => setFlashConfigOpen(true);
  
  const handleApplyFlashDeal = (durationMinutes: number, extraDiscount: number) => {
    actions.startFlashDeal(durationMinutes * 60, extraDiscount);
    setFlashConfigOpen(false);
  };
  
  const handleStopFlashDeal = () => actions.stopFlashDeal();
  const handleMarkMoment = () => actions.markMoment();

  const typeLabel = mode === "live" ? "Live" : "Pre-live lobby";
  const rootClass = "min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50";

  return (
    <div className={rootClass}>
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b backdrop-blur-sm border-slate-800/80 bg-slate-950/80 shadow-[0_8px_30px_rgba(15,23,42,0.7)]">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: EV_ORANGE }}>LD</div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-semibold truncate">Live Dealz Studio</span>
            <span className="text-[10px] text-slate-500 truncate">Autumn Beauty Flash · GlowUp Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] mr-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 text-slate-50 border border-slate-700">
              <span className={`h-1.5 w-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span>{typeLabel} · {liveTimer}</span>
            </span>
            <TopStat label="Viewers" value={stats.viewers.toLocaleString()} />
            <TopStat label="Sales" value={stats.sales.toString()} />
            <TopStat label="Connection" value={stats.connection} />
            <TopStat label="Bitrate" value={stats.bitrate} />
          </div>
          <button className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900 text-slate-100">
            <span className="text-sm" role="img" aria-label="theme">🌙</span>
            <span>Dark mode</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900 text-slate-100">
              <span className="material-icons text-sm">help_outline</span>
              Studio tips
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-400 flex items-center justify-center text-xs font-semibold text-white">CR</div>
          </div>
        </div>
      </header>

      <main className="hidden md:flex flex-1 p-3 md:p-4 gap-3 overflow-hidden">
        <section className="w-64 flex-shrink-0 flex flex-col gap-3">
          <ProductPanel products={products} highlightedProductId={highlightedProductId} onHighlight={setHighlightedProductId} flashDealActive={flashDeal.active} flashSeconds={flashDealSeconds} onConfigureFlash={handleOpenFlashConfig} onStopFlash={handleStopFlashDeal}/>
          <CoHostPanel coHosts={coHosts} />
          <AttachmentsPanel attachments={attachments} onApprove={handleApproveAttachment} onReject={handleRejectAttachment} />
        </section>

        <section className="flex-1 flex flex-col gap-3">
          <LiveVideoPanel mode={mode} micOn={micOn} camOn={camOn} screenShareOn={screenShareOn} activeSceneId={activeSceneId} scenes={scenes} setActiveSceneId={setActiveSceneId} />
          <TeleprompterPanel scriptCues={scriptCues} runOfShow={runOfShow} />
          <CommerceHudPanel commerceGoal={commerceGoal} salesEvents={salesEvents} momentMarkers={momentMarkers} />
        </section>

        <section className="w-80 flex-shrink-0 flex flex-col gap-3">
          <ChatPanel activeTab={audienceTab} onTabChange={setAudienceTab} messages={chat.messages} qaItems={qaItems} viewers={viewersList} draft={chatDraft} onDraftChange={setChatDraft} onSend={handleSendChat} />
          <AiPromptsPanel prompts={aiPrompts} />
        </section>
      </main>

      <StudioControlBar mode={mode} onToggleLive={toggleLive} micOn={micOn} onToggleMic={() => setMicOn(m => !m)} camOn={camOn} onToggleCam={() => setCamOn(c => !c)} screenShareOn={screenShareOn} onToggleScreenShare={() => setScreenShareOn(s => !s)} activeSceneId={activeSceneId} scenes={scenes} setActiveSceneId={setActiveSceneId} onMarkMoment={handleMarkMoment} onToggleFilters={() => setFiltersOpen(v => !v)} onOpenLanguagePanel={() => setLanguagePanelOpen(true)} />

      {filtersOpen && <FiltersTray />}
      {flashConfigOpen && <FlashDealControl onClose={() => setFlashConfigOpen(false)} onStart={handleApplyFlashDeal} />}
      {languagePanelOpen && <LanguagePanel onClose={() => setLanguagePanelOpen(false)} />}
      
      <MobileStudio mode={mode} typeLabel={typeLabel} products={products} highlightedProductId={highlightedProductId} setHighlightedProductId={setHighlightedProductId} flashDealActive={flashDeal.active} onOpenFlashConfig={handleOpenFlashConfig} onStopFlash={handleStopFlashDeal} chatMessages={chat.messages} chatDraft={chatDraft} setChatDraft={setChatDraft} onSendChat={handleSendChat} mobilePanel={mobilePanel} setMobilePanel={setMobilePanel} onToggleLive={toggleLive} />
    </div>
  );
}

function TopStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-col items-start px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px]">
      <span className="text-[9px] text-slate-400">{label}</span>
      <span className="text-[11px] font-semibold text-slate-50">{value}</span>
    </span>
  );
}

function ProductPanel({ products, highlightedProductId, onHighlight, flashDealActive, flashSeconds, onConfigureFlash, onStopFlash }: { products: Product[], highlightedProductId: string, onHighlight: (id: string) => void, flashDealActive: boolean, flashSeconds: number, onConfigureFlash: () => void, onStopFlash: () => void}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold">Products on this live</h3>
        <span className="text-[10px] text-slate-400">{products.length} items</span>
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {products.map((p) => {
          const active = p.id === highlightedProductId;
          return (
            <button key={p.id} className={"w-full text-left border rounded-xl px-2.5 py-1.5 flex flex-col gap-0.5 " + (active ? "bg-[#f77f00]/10 border-[#f77f00] text-slate-50" : "bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-600")} onClick={() => onHighlight(p.id)}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold truncate">{p.name}</span>
                <span className="text-[10px] text-emerald-400">{p.price}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{p.stock}</span>
                <span>{p.tag}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-1 border-t border-slate-800 pt-2 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-300">Pinned product overlay</span>
          <span className="text-slate-400 text-[9px]">{highlightedProductId ? "Active" : "None"}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <button className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700">Highlight now</button>
          <button className="px-2.5 py-1 rounded-full bg-slate-950 text-slate-200 border border-slate-800 hover:bg-slate-800">Remove overlay</button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col text-[10px] text-slate-300">
            <span>Flash deal</span>
            <span className="text-[9px] text-slate-500">Limited-time discount overlay with timer.</span>
          </div>
          <div className="flex items-center gap-1">
            {flashDealActive && (<span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px]">{flashSeconds}s left</span>)}
            <button className={"px-2.5 py-1 rounded-full text-[10px] text-white " + (flashDealActive ? "bg-red-500 hover:bg-red-600" : "bg-[#f77f00] hover:bg-[#e26f00]")} onClick={flashDealActive ? onStopFlash : onConfigureFlash}>
              {flashDealActive ? "Stop flash deal" : "Start flash deal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoHostPanel({ coHosts }: { coHosts: CoHost[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Co-host & crew</h3>
        <button className="text-[10px] text-[#f77f00] hover:underline">Invite</button>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {coHosts.map((c) => (
          <div key={c.id} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">{c.name.split(" ").map((w: string) => w[0]).join("")}</span>
              <div className="flex flex-col">
                <span className="text-slate-100">{c.name}</span>
                <span className="text-slate-500">{c.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-0.5 rounded-full border border-slate-700 text-slate-100 text-[9px]">Accept</button>
              <button className="px-2 py-0.5 rounded-full border border-slate-700 text-slate-400 text-[9px]">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttachmentsPanel({ attachments, onApprove, onReject }: { attachments: Attachment[]; onApprove: (id: number) => void; onReject: (id: number) => void; }) {
  const pending = attachments.filter((a) => a.status === "Pending");
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <h3 className="text-xs font-semibold">Attachments queue</h3>
      <p className="text-[10px] text-slate-500">Viewers can send images or questions. Nothing appears on screen until you approve.</p>
      <div className="space-y-1 max-h-28 overflow-y-auto">
        {pending.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-[10px] border border-slate-800 rounded-lg px-2 py-1">
            <div className="flex flex-col">
              <span className="text-slate-100">{a.label}</span>
              <span className="text-slate-500">{a.type.toUpperCase()} · {a.from}</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px]" onClick={() => onApprove(a.id)}>Approve</button>
              <button className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[9px]" onClick={() => onReject(a.id)}>Reject</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-[10px] text-slate-500">No pending attachments.</p>}
      </div>
    </div>
  );
}

function LiveVideoPanel({ mode, micOn, camOn, screenShareOn, activeSceneId, scenes, setActiveSceneId }: { mode: Mode, micOn: boolean, camOn: boolean, screenShareOn: boolean, activeSceneId: string, scenes: Scene[], setActiveSceneId: (id: string) => void }) {
  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  if (mode === 'lobby') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 md:p-4 flex flex-col gap-3 h-full">
        <LobbyPanel micOn={micOn} camOn={camOn} screenShareOn={screenShareOn} scenes={scenes} activeSceneId={activeSceneId} setActiveSceneId={setActiveSceneId} />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 md:p-4 flex flex-col gap-3 h-full">
      <div className="relative flex-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
        <LocalMediaPreview camOn={camOn} micOn={micOn} screenShareOn={screenShareOn} />
        <span className="text-[11px] text-slate-400 z-10">{!camOn && !screenShareOn ? `Live video preview · Scene: ${activeScene.label}` : ''}</span>
        {screenShareOn && <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-100 z-10">Screen sharing</span>}
        {!camOn && !screenShareOn && <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white z-10">Camera off</span>}
        <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] items-end z-10">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-emerald-200 border border-emerald-400/60"><span className="material-icons text-[14px]">graphic_eq</span><span>AI Audio: ON (Multi)</span></div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-sky-100 border border-sky-400/60"><span className="material-icons text-[14px]">subtitles</span><span>Captions: ON</span></div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Scene presets</span>
          <span>Active: {activeScene.label}</span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {scenes.map((s) => (<button key={s.id} className={"px-2.5 py-1 rounded-xl border text-[10px] min-w-[120px] text-left " + (s.id === activeSceneId ? "bg-[#f77f00] border-[#f77f00] text-white" : "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900")} onClick={() => setActiveSceneId(s.id)}>
            <span className="font-semibold">{s.label}</span>
            <span className="block text-[9px] text-slate-400">{s.desc}</span>
          </button>))}
        </div>
      </div>
    </div>
  );
}

function LobbyPanel({ micOn, camOn, screenShareOn, scenes, activeSceneId, setActiveSceneId }: { micOn: boolean, camOn: boolean, screenShareOn: boolean, scenes: Scene[], activeSceneId: string, setActiveSceneId: (id: string) => void }) {
    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="relative flex-1 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 overflow-hidden">
                <LocalMediaPreview camOn={camOn} micOn={micOn} screenShareOn={screenShareOn} />
                <div className="z-10 flex flex-col items-center justify-center gap-2">
                    <span className="text-[11px] text-slate-300 mb-1">Pre-live lobby · Device & scene check</span>
                    <div className="flex gap-2 text-[10px] text-slate-200">
                        <LobbyToggle label="Camera" on={camOn} />
                        <LobbyToggle label="Microphone" on={micOn} />
                        <LobbyToggle label="Screen share" on={screenShareOn} disabled />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 max-w-xs text-center">Check your framing, lighting and audio levels. You’re not live yet – only you and crew can see this.</p>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400">Scene presets</span>
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {scenes.map((s) => (
                        <button key={s.id} className={"px-2.5 py-1 rounded-xl border text-[10px] min-w-[120px] text-left " + (s.id === activeSceneId ? "bg-[#f77f00] border-[#f77f00] text-white" : "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900")} onClick={() => setActiveSceneId(s.id)}>
                            <span className="font-semibold">{s.label}</span>
                            <span className="block text-[9px] text-slate-400">{s.desc}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function LobbyToggle({ label, on, disabled }: { label: string; on: boolean; disabled?: boolean; }) {
  return (<button className={"px-2.5 py-1 rounded-full border text-[10px] " + (disabled ? "border-slate-700 text-slate-500 cursor-not-allowed" : on ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-900 border-slate-700 text-slate-300")} disabled={disabled}>{label}: {on ? "On" : "Off"}</button>);
}

function TeleprompterPanel({ scriptCues, runOfShow }: { scriptCues: string[], runOfShow: RunOfShowItem[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px] max-h-48">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-[13px]">📜</span><h3 className="text-xs font-semibold">Script teleprompter</h3></div>
        <span className="text-[10px] text-slate-500">Dynamic cues</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2">
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {scriptCues.map((cue: string, idx: number) => (<div key={idx} className={"text-[10px] px-2 py-1 rounded-lg " + (idx === 1 ? "bg-[#f77f00]/20 text-slate-50" : "bg-slate-950 text-slate-200")}>
            {idx === 1 && <span className="mr-1 text-[9px] uppercase tracking-wide text-[#f77f00]">Up next:</span>}
            {cue}
          </div>))}
        </div>
        <div className="border border-slate-800 rounded-xl p-2 bg-slate-950 text-[10px] text-slate-200 max-h-32 overflow-y-auto">
          <div className="flex items-center justify-between mb-1"><span>Run-of-show</span><span className="text-[9px] text-slate-500">Shot list</span></div>
          <ul className="space-y-1">{runOfShow.map((shot: any) => (<li key={shot.id} className="flex items-center justify-between gap-2">
            <div className="flex flex-col"><span className="font-medium">{shot.label}</span><span className="text-slate-500">Scene: {shot.scene}</span></div>
            <span className="text-slate-400 text-[9px]">{shot.window}</span>
          </li>))}</ul>
        </div>
      </div>
    </div>
  );
}

function CommerceHudPanel({ commerceGoal, salesEvents, momentMarkers }: { commerceGoal: CommerceGoal, salesEvents: SalesEvent[], momentMarkers: MomentMarker[] }) {
  const progress = Math.min(commerceGoal.soldUnits / (commerceGoal.targetUnits || 1), 1);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-[13px]">💰</span><div><h3 className="text-xs font-semibold">Commerce HUD</h3><p className="text-[10px] text-slate-500">Live sales, goal tracking and marked moments.</p></div></div>
        <span className="text-[10px] text-slate-400">Goal: {commerceGoal.targetUnits} units</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[10px]">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1"><span className="text-slate-400">Progress</span><span className="text-slate-100">{commerceGoal.soldUnits}/{commerceGoal.targetUnits} sold</span></div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: EV_ORANGE }} /></div>
        </div>
        <div className="flex flex-col items-end text-[10px]"><span className="text-slate-400">In carts</span><span className="text-slate-100 font-semibold">{commerceGoal.cartCount}</span><span className="text-slate-500">{commerceGoal.last5MinSales} sales · 5 min</span></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        <div className="border border-slate-800 rounded-xl p-2 bg-slate-950"><h4 className="text-[10px] font-semibold mb-1 text-slate-200">Live sales feed</h4>
          <ul className="space-y-1 max-h-24 overflow-y-auto text-[10px] text-slate-200">{salesEvents.map((e) => (<li key={e.id} className="flex items-center justify-between gap-2"><span>{e.label}</span><span className="text-slate-500 text-[9px]">{e.time}</span></li>))}</ul>
        </div>
        <div className="border border-slate-800 rounded-xl p-2 bg-slate-950"><h4 className="text-[10px] font-semibold mb-1 text-slate-200">Moments for replay</h4>
          {momentMarkers.length === 0 ? <p className="text-[10px] text-slate-500">Use “Mark moment” to flag highlights for clipping.</p> : <ul className="space-y-1 max-h-24 overflow-y-auto text-[10px] text-slate-200">{momentMarkers.map((m) => (<li key={m.id} className="flex items-center justify-between gap-2"><span>{m.label}</span><span className="text-slate-500 text-[9px]">{m.time}</span></li>))}</ul>}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ activeTab, onTabChange, messages, qaItems, viewers, draft, onDraftChange, onSend }: { activeTab: AudienceTab; onTabChange: (tab: AudienceTab) => void; messages: ChatMessage[]; qaItems: QAItem[]; viewers: Viewer[]; draft: string; onDraftChange: (v: string) => void; onSend: () => void; }) {
  const renderBody = () => {
    if (activeTab === "qa") {
      return (<div className="space-y-2">{qaItems.map((q) => (<div key={q.id} className="rounded-xl px-3 py-2 bg-slate-50/5 border border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-1"><span className="font-semibold truncate text-[11px] text-slate-100">{q.question}</span><span className="text-[10px] text-slate-500 truncate">{q.from}</span></div>
        <div className="flex items-center justify-between text-[10px]"><span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full " + (q.status === "pinned" ? "bg-emerald-100/10 text-emerald-300 border border-emerald-500/50" : "bg-slate-900 text-slate-300 border border-slate-700")}><span className="material-icons text-[13px]">{q.status === "pinned" ? "push_pin" : "help_outline"}</span>{q.status === "pinned" ? "Pinned" : "Waiting"}</span><button className="text-[10px] text-slate-400 hover:text-slate-100">Answer live</button></div>
      </div>))}</div>);
    } if (activeTab === "viewers") {
      return (<div className="space-y-1.5">{viewers.map((v) => (<div key={v.id} className="flex items-center justify-between gap-3 px-2 py-1 rounded-lg hover:bg-slate-900">
        <div className="flex items-center gap-2 min-w-0"><div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-100">{v.name.split(" ").map((p: string) => p[0]).join("")}</div>
          <div className="flex flex-col min-w-0"><span className="truncate text-[11px] text-slate-100">{v.name}</span>{v.tag && <span className="text-[10px] text-emerald-400">{v.tag}</span>}</div>
        </div>
        <div className="flex items-center gap-1 text-[10px]"><button className="px-2 py-0.5 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-900">Mute</button><button className="px-2 py-0.5 rounded-full border border-rose-500/70 text-rose-300 hover:bg-rose-900/40">Ban</button></div>
      </div>))}</div>);
    } return (<div className="space-y-1.5">{messages.map((m) => (<div key={m.id} className="text-[10px]"><span className={"font-semibold " + (m.system ? "text-slate-400" : "text-slate-100")}>{m.system ? "System" : m.from}</span><span className="text-slate-500 ml-1">· {m.time}</span><p className="text-slate-200 whitespace-pre-line">{m.body}</p></div>))}</div>);
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col h-full">
      <div className="mb-2"><h3 className="text-xs font-semibold mb-1">Live audience &amp; chat</h3>
        <div className="inline-flex rounded-full bg-slate-950 p-0.5 text-[10px]">
          <button className={"px-3 py-1 rounded-full " + (activeTab === 'chat' ? 'bg-slate-50 text-slate-900 shadow-sm' : 'bg-transparent text-slate-400')} onClick={() => onTabChange("chat")}>Chat</button>
          <button className={"px-3 py-1 rounded-full " + (activeTab === 'qa' ? 'bg-slate-50 text-slate-900 shadow-sm' : 'bg-transparent text-slate-400')} onClick={() => onTabChange("qa")}>Q&amp;A</button>
          <button className={"px-3 py-1 rounded-full " + (activeTab === 'viewers' ? 'bg-slate-50 text-slate-900 shadow-sm' : 'bg-transparent text-slate-400')} onClick={() => onTabChange("viewers")}>Viewers</button>
        </div>
      </div>
      <div className="flex-1 border border-slate-800 rounded-xl p-2.5 bg-slate-950 overflow-y-auto">{renderBody()}</div>
      <div className="mt-2 flex items-center gap-1 text-[10px]"><button className="h-7 w-7 rounded-full border border-slate-700 text-slate-200 flex items-center justify-center"><span className="material-icons text-[16px]">mic</span></button><button className="h-7 w-7 rounded-full border border-slate-700 text-slate-200 flex items-center justify-center"><span className="material-icons text-[16px]">attach_file</span></button>
        <input className="flex-1 border border-slate-700 rounded-full px-2 py-1 bg-slate-950 text-slate-100 outline-none" placeholder="Type a reply or pin a highlight…" value={draft} onChange={(e) => onDraftChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSend()}/>
        <button className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: EV_ORANGE }} onClick={onSend}>Send</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-[10px]"><button className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-700 text-slate-200 hover:bg-slate-900">Poll</button><button className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-700 text-slate-200 hover:bg-slate-900">Giveaway</button><button className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-700 text-slate-200 hover:bg-slate-900">Pinned message</button></div>
    </div>
  );
}

function AiPromptsPanel({ prompts }: { prompts: string[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-[13px]">💡</span><h3 className="text-xs font-semibold">Live AI prompts</h3></div><span className="text-[10px] text-slate-500">Real-time hints</span></div>
      <ul className="space-y-1 max-h-40 overflow-y-auto">{prompts.map((p, idx) => (<li key={idx} className="border border-slate-800 rounded-xl px-2.5 py-1.5 bg-slate-950 text-[10px] text-slate-200">{p}</li>))}</ul>
      <div className="mt-1 text-[10px] text-slate-500"><span className="font-semibold text-slate-300 mr-1">Sentiment:</span><span>Viewers are most engaged during visuals and pricing moments. Revisit shipping and bundles if questions keep repeating.</span></div>
    </div>
  );
}

function StudioControlBar({ mode, onToggleLive, micOn, onToggleMic, camOn, onToggleCam, screenShareOn, onToggleScreenShare, activeSceneId, scenes, setActiveSceneId, onMarkMoment, onToggleFilters, onOpenLanguagePanel, }: { mode: Mode; onToggleLive: () => void; micOn: boolean; onToggleMic: () => void; camOn: boolean; onToggleCam: () => void; screenShareOn: boolean; onToggleScreenShare: () => void; activeSceneId: string; scenes: Scene[]; setActiveSceneId: (id: string) => void; onMarkMoment: () => void; onToggleFilters: () => void; onOpenLanguagePanel: () => void; }) {
  return (
    <div className="hidden md:flex items-center justify-between px-3 md:px-6 py-2 border-t border-slate-800 bg-slate-950/95 text-[11px]">
      <div className="flex items-center gap-2">
        <button className={"px-4 py-1.5 rounded-full text-[11px] font-semibold text-white " + (mode === "live" ? "bg-red-600 hover:bg-red-700" : "bg-[#f77f00] hover:bg-[#e26f00]")} onClick={onToggleLive}>{mode === "live" ? "End live" : "Go live"}</button>
        <button className={"px-3 py-1.5 rounded-full border text-[10px] " + (micOn ? "bg-slate-900 border-slate-600 text-slate-100" : "bg-slate-950 border-slate-800 text-slate-400")} onClick={onToggleMic}>{micOn ? "Mic on" : "Mic off"}</button>
        <button className={"px-3 py-1.5 rounded-full border text-[10px] " + (camOn ? "bg-slate-900 border-slate-600 text-slate-100" : "bg-slate-950 border-slate-800 text-slate-400")} onClick={onToggleCam}>{camOn ? "Cam on" : "Cam off"}</button>
        <button className={"px-3 py-1.5 rounded-full border text-[10px] " + (screenShareOn ? "bg-slate-900 border-slate-600 text-slate-100" : "bg-slate-950 border-slate-800 text-slate-400")} onClick={onToggleScreenShare}>Screen share</button>
        <button className="px-3 py-1.5 rounded-full border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-900" onClick={onMarkMoment}>Mark moment</button>
        <button className="px-3 py-1.5 rounded-full border border-slate-600 text-[10px] text-slate-100 hover:bg-slate-900 inline-flex items-center gap-1.5" onClick={onToggleFilters}><span className="material-icons text-[14px]">auto_awesome</span>AR Filters</button>
      </div>
      <div className="flex items-center gap-2 text-[10px]"><button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 text-slate-100 hover:bg-slate-900" onClick={onOpenLanguagePanel}><span className="material-icons text-[14px]">translate</span>Language &amp; AI audio</button><span className="text-slate-400">Scene:</span>
        <select className="border border-slate-700 rounded-full px-2 py-0.5 bg-slate-950 text-slate-100" value={activeSceneId} onChange={(e) => setActiveSceneId(e.target.value)}>{scenes.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}</select>
      </div>
    </div>
  );
}

function FiltersTray() {
  const categories = ["Beauty", "Fun", "Background", "Brand"];
  const filters = [{ id: 1, label: "Soft Glam" }, { id: 2, label: "Studio Glow" }, { id: 3, label: "Neon Night" }, { id: 4, label: "Clean Backdrop" }, { id: 5, label: "Brand Frame" }];
  return (<div className="fixed left-1/2 -translate-x-1/2 bottom-4 md:bottom-5 w-full max-w-xl rounded-2xl border border-slate-800 shadow-xl px-3 py-2 md:px-4 md:py-3 bg-slate-950/95 z-40"><div className="flex items-center justify-between mb-2 text-[11px]"><span className="font-semibold inline-flex items-center gap-1"><span className="material-icons text-[14px] text-amber-500">auto_awesome</span>AR Filters</span><div className="flex gap-1 overflow-x-auto max-w-[60%] hide-scrollbar">{categories.map((c) => (<span key={c} className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-200 text-[10px] whitespace-nowrap">{c}</span>))}</div></div><div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">{filters.map((f) => (<div key={f.id} className="min-w-[80px] max-w-[80px] flex-shrink-0 rounded-xl bg-slate-800 border border-slate-600 flex flex-col items-center justify-center py-2 cursor-pointer hover:border-emerald-400"><div className="h-9 w-9 rounded-full bg-slate-700 mb-1" /><span className="text-[10px] text-center px-1 text-slate-100">{f.label}</span></div>))}</div></div>);
}

function FlashDealControl({ onClose, onStart }: { onClose: () => void; onStart: (duration: number, discount: number) => void; }) {
  const [duration, setDuration] = useState<number>(5); const [discount, setDiscount] = useState<number>(15); const durationOptions = [5, 10, 15];
  return (<div className="fixed right-4 top-20 z-50"><div className="w-72 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl px-3.5 py-3 text-[11px]"><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-1.5"><span className="material-icons text-[16px]" style={{ color: EV_ORANGE }}>bolt</span><div className="flex flex-col"><span className="text-[12px] font-semibold text-slate-50">Flash Deal Control</span></div></div><span className="text-[10px] text-slate-400">Live-only</span></div><p className="text-[11px] text-slate-300 mb-2">Configure a limited-time offer with a countdown overlay for viewers.</p><div className="mb-2"><span className="text-[10px] text-slate-400 mr-2">Duration</span>{durationOptions.map((d) => (<button key={d} className={"px-2 py-0.5 rounded-full text-[10px] mr-1 " + (duration === d ? "bg-slate-50 text-slate-900" : "bg-slate-800 text-slate-300")} onClick={() => setDuration(d)}>{d} min</button>))}</div><div className="flex items-center gap-2 mb-3"><span className="text-[10px] text-slate-400">Extra discount</span><input className="w-12 px-1 py-0.5 rounded border border-slate-700 bg-slate-900 text-[11px] text-slate-50" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} /><span className="text-[10px] text-slate-500">%</span></div><button className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: EV_ORANGE }} onClick={() => onStart(duration, discount)}><span className="material-icons text-[14px]">play_arrow</span>Start flash deal</button><button className="mt-2 text-[10px] text-slate-500 hover:text-slate-300 w-full text-center" onClick={onClose}>Cancel</button></div></div>);
}

function LanguagePanel({ onClose }: { onClose: () => void }) {
  return (<div className="fixed right-4 top-20 z-50"><div className="w-80 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl px-4 py-3 text-[11px] text-slate-50"><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-1.5"><span className="material-icons text-[16px] text-slate-300">translate</span><span className="text-[12px] font-semibold">Language &amp; AI audio</span></div><button className="text-[10px] text-slate-400 hover:text-slate-200" onClick={onClose}>Close</button></div><div className="mb-2"><span className="block text-[10px] font-semibold text-slate-300 mb-1">Stream language (creator)</span><div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-[10px] text-slate-200"><span className="material-icons text-[13px] text-slate-400">record_voice_over</span>English (source)</div></div><div className="mb-2"><span className="block text-[10px] font-semibold text-slate-300 mb-1">AI audio languages for viewers</span><div className="flex flex-wrap gap-1">{["French", "Arabic", "Swahili"].map((l) => (<span key={l} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-200">{l}</span>))}</div></div><div className="mb-2"><span className="block text-[10px] font-semibold text-slate-300 mb-1">Captions</span><label className="inline-flex items-center gap-1 text-[10px] text-slate-300"><input type="checkbox" defaultChecked /> Auto-enable captions</label></div><p className="text-[10px] text-slate-400">Viewers can still change their own language and choose between AI audio and captions in their app.</p></div></div>);
}

function MobileStudio({ mode, typeLabel, products, highlightedProductId, setHighlightedProductId, flashDealActive, onOpenFlashConfig, onStopFlash, chatMessages, chatDraft, setChatDraft, onSendChat, mobilePanel, setMobilePanel, onToggleLive, }: { mode: Mode, typeLabel: string, products: Product[], highlightedProductId: string, setHighlightedProductId: (id: string) => void, flashDealActive: boolean, onOpenFlashConfig: () => void, onStopFlash: () => void, chatMessages: ChatMessage[], chatDraft: string, setChatDraft: (d: string) => void, onSendChat: () => void, mobilePanel: "products" | "chat", setMobilePanel: (p: "products" | "chat") => void, onToggleLive: () => void }) {
  return (<div className="md:hidden fixed inset-x-0 bottom-0 top-14 flex flex-col bg-slate-950 z-30"><div className="h-1/3 border-b border-slate-800 flex items-center justify-center"><span className="text-[11px] text-slate-300">{typeLabel} · Mobile view (video placeholder)</span></div><div className="flex-1 flex flex-col"><div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px]"><div className="flex gap-1"><button className={"px-2.5 py-0.5 rounded-full " + (mobilePanel === "products" ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-300")} onClick={() => setMobilePanel("products")}>Products</button><button className={"px-2.5 py-0.5 rounded-full " + (mobilePanel === "chat" ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-300")} onClick={() => setMobilePanel("chat")}>Chat</button></div><span className="text-slate-400">Swipe up to browse</span></div><div className="flex-1 overflow-y-auto px-3 py-2">{mobilePanel === "products" ? (<div className="space-y-1">{products.map((p) => (<button key={p.id} className={"w-full text-left border rounded-xl px-2.5 py-1.5 text-[10px] mb-1 " + (p.id === highlightedProductId ? "bg-[#f77f00]/20 border-[#f77f00] text-slate-50" : "bg-slate-950 border-slate-800 text-slate-200")} onClick={() => setHighlightedProductId(p.id)}><div className="flex items-center justify-between"><span className="font-semibold">{p.name}</span><span className="text-emerald-400">{p.price}</span></div><div className="text-[9px] text-slate-400">{p.stock} · {p.tag}</div></button>))}</div>) : (<div className="space-y-1 max-h-full">{chatMessages.map((m) => (<div key={m.id} className="text-[10px] mb-1"><span className={"font-semibold " + (m.system ? "text-slate-400" : "text-slate-100")}>{m.system ? "System" : m.from}</span><span className="text-slate-500 ml-1">· {m.time}</span><p className="text-slate-200 whitespace-pre-line">{m.body}</p></div>))}</div>)}</div></div><div className="border-t border-slate-800 bg-slate-950 px-3 py-2 flex items-center justify-between gap-2 text-[10px]"><button className="px-2.5 py-1 rounded-full border border-slate-700 text-slate-100 flex-1">Highlight product</button><button className={"px-2.5 py-1 rounded-full flex-1 text-white " + (flashDealActive ? "bg-red-600" : "bg-[#f77f00]")} onClick={flashDealActive ? onStopFlash : onOpenFlashConfig}>{flashDealActive ? "Stop flash deal" : "Flash deal"}</button><button className={"px-2.5 py-1 rounded-full flex-1 " + (mode === "live" ? "bg-red-600 text-white" : "bg-slate-900 text-slate-100 border border-slate-700")} onClick={onToggleLive}>{mode === "live" ? "End live" : "Go live"}</button></div><div className="bg-slate-950 border-t border-slate-800 px-3 py-1 flex items-center gap-1 text-[10px]"><input className="flex-1 border border-slate-700 rounded-full px-2 py-1 bg-slate-950 text-slate-100 outline-none" placeholder="Reply to viewers…" value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSendChat()} /><button className="px-2.5 py-1 rounded-full bg-[#f77f00] text-white text-[10px]" onClick={onSendChat}>Send</button></div></div>);
}
