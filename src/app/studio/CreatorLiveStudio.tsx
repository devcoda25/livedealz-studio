
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type {
  Product, Scene, ChatMessage, QAItem, Viewer, CoHost, Attachment, RunOfShowItem, SalesEvent,
  CommerceGoal, Mode, AudienceTab, MomentMarker
} from '@/types/studio';
import { useStudioSocket } from '@/hooks/useStudioSocket';
import { useToast } from "@/hooks/use-toast";
import { formatTimer, getCountdownSeconds } from '@/lib/utils';
import { LocalMediaPreview } from './LocalMediaPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";


const EV_ORANGE = "#f77f00";

type RightPanelTab = "audience" | "script" | "commerce";

export default function CreatorLiveStudio() {
  const { state, actions } = useStudioSocket('main-studio');
  const { toast } = useToast();
  const { mode, startedAt, chat, stats, salesEvents, commerceGoal, flashDeal, momentMarkers, aiPrompts } = state;

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState('intro');

  const [highlightedProductId, setHighlightedProductId] = useState('P-101');
  const [flashConfigOpen, setFlashConfigOpen] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [languagePanelOpen, setLanguagePanelOpen] = useState(false);
  const [activeFilterPath, setActiveFilterPath] = useState<string | null>(null);

  const [mobilePanel, setMobilePanel] = useState<"products" | "chat">("products");
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("chat");
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("audience");

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
  
  const handleToggleCam = () => {
    if (screenShareOn) {
      setScreenShareOn(false);
    }
    setCamOn(c => !c);
  };

  const handleToggleScreenShare = () => {
    if (camOn) {
      setCamOn(false);
    }
    setScreenShareOn(s => !s);
  };


  const handleSendChat = () => {
    const txt = chatDraft.trim();
    if (!txt) return;
    actions.sendChat(txt);
    setChatDraft('');
  };

  const handleApproveAttachment = (id: number) => actions.moderateAttachment(id, 'approved');
  const handleRejectAttachment = (id: number) => actions.moderateAttachment(id, 'rejected');
  const handleOpenFlashConfig = () => setFlashConfigOpen(true);
  
  const handleApplyFlashDeal = (durationMinutes: number, extraDiscount: number) => {
    actions.startFlashDeal(durationMinutes * 60, extraDiscount);
    setFlashConfigOpen(false);
  };
  
  const handleStopFlashDeal = () => actions.stopFlashDeal();
  const handleMarkMoment = () => actions.markMoment();

  const handleFilterChange = (path: string | null) => {
    // A path of 'none' means we should clear the filter.
    const newPath = path === 'none' ? null : path;
    setActiveFilterPath(activeFilterPath === newPath ? null : newPath);
  };


  const typeLabel = mode === "live" ? "Live" : "Pre-live lobby";
  const rootClass = "min-h-screen flex flex-col bg-background text-foreground";

  return (
    <div className={rootClass}>
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b backdrop-blur-sm border-border bg-background/80 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: EV_ORANGE }}>LD</div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-semibold truncate text-foreground">Live Dealz Studio</span>
            <span className="text-[10px] text-muted-foreground truncate">Autumn Beauty Flash · GlowUp Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] mr-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
              <span className={`h-1.5 w-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
              <span>{typeLabel} · {liveTimer}</span>
            </span>
            <TopStat label="Viewers" value={stats.viewers.toLocaleString()} />
            <TopStat label="Sales" value={stats.sales.toString()} />
            <TopStat label="Connection" value={stats.connection} />
            <TopStat label="Bitrate" value={stats.bitrate} />
          </div>
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-border bg-secondary text-secondary-foreground">
              <span className="material-icons text-sm">help_outline</span>
              Studio tips
            </button>
            <div className="h-8 w-8 rounded-full bg-muted-foreground flex items-center justify-center text-xs font-semibold text-background">CR</div>
          </div>
        </div>
      </header>

      <main className="hidden md:grid flex-1 p-3 md:p-4 gap-3 overflow-hidden grid-cols-[256px_1fr_384px]">
        <section className="w-64 flex-shrink-0 flex flex-col gap-3">
          <ProductPanel products={products} highlightedProductId={highlightedProductId} onHighlight={setHighlightedProductId} flashDealActive={flashDeal.active} flashSeconds={flashDealSeconds} onConfigureFlash={handleOpenFlashConfig} onStopFlash={handleStopFlashDeal}/>
          <CoHostPanel coHosts={coHosts} />
          <AttachmentsPanel attachments={state.attachments} onApprove={handleApproveAttachment} onReject={handleRejectAttachment} />
        </section>

        <section className="flex-1 flex flex-col gap-3 min-h-0">
          <LiveVideoPanel mode={mode} micOn={micOn} camOn={camOn} screenShareOn={screenShareOn} activeSceneId={activeSceneId} scenes={scenes} setActiveSceneId={setActiveSceneId} activeFilterPath={activeFilterPath} />
        </section>

        <section className="flex-shrink-0 flex flex-col gap-3 min-h-0">
          <Tabs defaultValue="audience" value={rightPanelTab} onValueChange={(v) => setRightPanelTab(v as RightPanelTab)} className="w-full flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary border border-border h-10 p-1">
              <TabsTrigger value="audience" className="text-xs">Audience</TabsTrigger>
              <TabsTrigger value="script" className="text-xs">Script</TabsTrigger>
              <TabsTrigger value="commerce" className="text-xs">Commerce</TabsTrigger>
            </TabsList>
            <TabsContent value="audience" className="flex-1 flex flex-col min-h-0 mt-3">
              <ChatPanel activeTab={audienceTab} onTabChange={setAudienceTab} messages={chat.messages} qaItems={qaItems} viewers={viewersList} draft={chatDraft} onDraftChange={setChatDraft} onSend={handleSendChat} onAttachment={actions.sendAttachment} />
              <AiPromptsPanel prompts={aiPrompts} />
            </TabsContent>
            <TabsContent value="script" className="flex-1 min-h-0 mt-3">
              <TeleprompterPanel scriptCues={scriptCues} runOfShow={runOfShow} />
            </TabsContent>
            <TabsContent value="commerce" className="flex-1 min-h-0 mt-3">
               <CommerceHudPanel commerceGoal={commerceGoal} salesEvents={salesEvents} momentMarkers={momentMarkers} />
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <StudioControlBar mode={mode} onToggleLive={toggleLive} micOn={micOn} onToggleMic={() => setMicOn(m => !m)} camOn={camOn} onToggleCam={handleToggleCam} screenShareOn={screenShareOn} onToggleScreenShare={handleToggleScreenShare} activeSceneId={activeSceneId} scenes={scenes} setActiveSceneId={setActiveSceneId} onMarkMoment={handleMarkMoment} onToggleFilters={() => setFiltersOpen(v => !v)} onOpenLanguagePanel={() => setLanguagePanelOpen(true)} />

      {filtersOpen && <FiltersTray onFilterSelect={handleFilterChange} activeFilterPath={activeFilterPath} />}
      {flashConfigOpen && <FlashDealControl onClose={() => setFlashConfigOpen(false)} onStart={handleApplyFlashDeal} />}
      {languagePanelOpen && <LanguagePanel onClose={() => setLanguagePanelOpen(false)} />}
      
      <MobileStudio mode={mode} typeLabel={typeLabel} products={products} highlightedProductId={highlightedProductId} setHighlightedProductId={setHighlightedProductId} flashDealActive={flashDeal.active} onOpenFlashConfig={handleOpenFlashConfig} onStopFlash={handleStopFlashDeal} chatMessages={chat.messages} chatDraft={chatDraft} setChatDraft={setChatDraft} onSendChat={handleSendChat} mobilePanel={mobilePanel} setMobilePanel={setMobilePanel} onToggleLive={toggleLive} />
    </div>
  );
}

function TopStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-col items-start px-2 py-0.5 rounded-lg bg-secondary border border-border text-[10px]">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-semibold text-foreground">{value}</span>
    </span>
  );
}

function ProductPanel({ products, highlightedProductId, onHighlight, flashDealActive, flashSeconds, onConfigureFlash, onStopFlash }: { products: Product[], highlightedProductId: string, onHighlight: (id: string) => void, flashDealActive: boolean, flashSeconds: number, onConfigureFlash: () => void, onStopFlash: () => void}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-foreground">Products on this live</h3>
        <span className="text-[10px] text-muted-foreground">{products.length} items</span>
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {products.map((p) => {
          const active = p.id === highlightedProductId;
          return (
            <button key={p.id} className={"w-full text-left border rounded-xl px-2.5 py-1.5 flex flex-col gap-0.5 " + (active ? "bg-primary/10 border-primary text-foreground" : "bg-secondary border-border text-foreground hover:border-muted-foreground")} onClick={() => onHighlight(p.id)}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold truncate">{p.name}</span>
                <span className="text-[10px] text-emerald-500">{p.price}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{p.stock}</span>
                <span>{p.tag}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-1 border-t border-border pt-2 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-foreground">Pinned product overlay</span>
          <span className="text-muted-foreground text-[9px]">{highlightedProductId ? "Active" : "None"}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <button className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border hover:bg-muted">Highlight now</button>
          <button className="px-2.5 py-1 rounded-full bg-card text-foreground border border-border hover:bg-secondary">Remove overlay</button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col text-[10px] text-foreground">
            <span>Flash deal</span>
            <span className="text-[9px] text-muted-foreground">Limited-time discount overlay with timer.</span>
          </div>
          <div className="flex items-center gap-1">
            {flashDealActive && (<span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px]">{flashSeconds}s left</span>)}
            <button className={"px-2.5 py-1 rounded-full text-[10px] text-white " + (flashDealActive ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90")} onClick={flashDealActive ? onStopFlash : onConfigureFlash}>
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
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Co-host & crew</h3>
        <button className="text-[10px] text-primary hover:underline">Invite</button>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {coHosts.map((c) => (
          <div key={c.id} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px]">{c.name.split(" ").map((w: string) => w[0]).join("")}</span>
              <div className="flex flex-col">
                <span className="text-foreground">{c.name}</span>
                <span className="text-muted-foreground">{c.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-0.5 rounded-full border border-border text-foreground text-[9px]">Accept</button>
              <button className="px-2 py-0.5 rounded-full border border-border text-muted-foreground text-[9px]">Remove</button>
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
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <h3 className="text-xs font-semibold text-foreground">Attachments queue</h3>
      <p className="text-[10px] text-muted-foreground">Viewers can send images or questions. Nothing appears on screen until you approve.</p>
      <div className="space-y-1 max-h-28 overflow-y-auto">
        {pending.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-[10px] border border-border rounded-lg px-2 py-1">
            <div className="flex flex-col">
              <span className="text-foreground">{a.label}</span>
              <span className="text-muted-foreground">{a.type.toUpperCase()} · {a.from}</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px]" onClick={() => onApprove(a.id)}>Approve</button>
              <button className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[9px]" onClick={() => onReject(a.id)}>Reject</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-[10px] text-muted-foreground">No pending attachments.</p>}
      </div>
    </div>
  );
}

function LiveVideoPanel({ mode, micOn, camOn, screenShareOn, activeSceneId, scenes, setActiveSceneId, activeFilterPath }: { mode: Mode, micOn: boolean, camOn: boolean, screenShareOn: boolean, activeSceneId: string, scenes: Scene[], setActiveSceneId: (id: string) => void, activeFilterPath: string | null }) {
  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  if (mode === 'lobby') {
    return (
      <div className="bg-card border border-border rounded-3xl p-3 md:p-4 flex flex-col gap-3 h-full">
        <LobbyPanel micOn={micOn} camOn={camOn} screenShareOn={screenShareOn} scenes={scenes} activeSceneId={activeSceneId} setActiveSceneId={setActiveSceneId} activeFilterPath={activeFilterPath}/>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-3 md:p-4 flex flex-col gap-3 h-full">
      <div className="relative flex-1 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden">
        <LocalMediaPreview camOn={camOn} micOn={micOn} screenShareOn={screenShareOn} activeFilterPath={activeFilterPath} />
        <span className="text-[11px] text-muted-foreground z-10">{!camOn && !screenShareOn ? `Live video preview · Scene: ${activeScene.label}` : ''}</span>
        {screenShareOn && <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-background/60 border border-border text-foreground z-10">Screen sharing</span>}
        {!camOn && !screenShareOn && <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white z-10">Camera off</span>}
        <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] items-end z-10">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/60 text-emerald-400 border border-emerald-400/60"><span className="material-icons text-[14px]">graphic_eq</span><span>AI Audio: ON (Multi)</span></div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/60 text-sky-400 border border-sky-400/60"><span className="material-icons text-[14px]">subtitles</span><span>Captions: ON</span></div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Scene presets</span>
          <span>Active: {activeScene.label}</span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {scenes.map((s) => (<button key={s.id} className={"px-2.5 py-1 rounded-xl border text-[10px] min-w-[120px] text-left " + (s.id === activeSceneId ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border text-foreground hover:bg-muted")} onClick={() => setActiveSceneId(s.id)}>
            <span className="font-semibold">{s.label}</span>
            <span className="block text-[9px] text-muted-foreground">{s.desc}</span>
          </button>))}
        </div>
      </div>
    </div>
  );
}

function LobbyPanel({ micOn, camOn, screenShareOn, scenes, activeSceneId, setActiveSceneId, activeFilterPath }: { micOn: boolean, camOn: boolean, screenShareOn: boolean, scenes: Scene[], activeSceneId: string, setActiveSceneId: (id: string) => void, activeFilterPath: string | null }) {
    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="relative flex-1 rounded-2xl bg-secondary border border-border flex flex-col items-center justify-center gap-2 overflow-hidden">
                <LocalMediaPreview camOn={camOn} micOn={micOn} screenShareOn={screenShareOn} activeFilterPath={activeFilterPath} />
                <div className="z-10 flex flex-col items-center justify-center gap-2">
                    <span className="text-[11px] text-foreground mb-1">Pre-live lobby · Device & scene check</span>
                    <div className="flex gap-2 text-[10px] text-foreground">
                        <LobbyToggle label="Camera" on={camOn} />
                        <LobbyToggle label="Microphone" on={micOn} />
                        <LobbyToggle label="Screen share" on={screenShareOn} disabled />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 max-w-xs text-center">Check your framing, lighting and audio levels. You’re not live yet – only you and crew can see this.</p>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">Scene presets</span>
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {scenes.map((s) => (
                        <button key={s.id} className={"px-2.5 py-1 rounded-xl border text-[10px] min-w-[120px] text-left " + (s.id === activeSceneId ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border text-foreground hover:bg-muted")} onClick={() => setActiveSceneId(s.id)}>
                            <span className="font-semibold">{s.label}</span>
                            <span className="block text-[9px] text-muted-foreground">{s.desc}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function LobbyToggle({ label, on, disabled }: { label: string; on: boolean; disabled?: boolean; }) {
  return (<button className={"px-2.5 py-1 rounded-full border text-[10px] " + (disabled ? "border-border text-muted-foreground cursor-not-allowed" : on ? "bg-emerald-500 border-emerald-500 text-white" : "bg-muted border-border text-foreground")} disabled={disabled}>{label}: {on ? "On" : "Off"}</button>);
}

function TeleprompterPanel({ scriptCues, runOfShow }: { scriptCues: string[], runOfShow: RunOfShowItem[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px] h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-[13px]">📜</span><h3 className="text-xs font-semibold text-foreground">Script teleprompter</h3></div>
        <span className="text-[10px] text-muted-foreground">Dynamic cues</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2 flex-1 min-h-0">
        <div className="space-y-1 overflow-y-auto">
          {scriptCues.map((cue: string, idx: number) => (<div key={idx} className={"text-[10px] px-2 py-1 rounded-lg " + (idx === 1 ? "bg-primary/20 text-foreground" : "bg-secondary text-foreground")}>
            {idx === 1 && <span className="mr-1 text-[9px] uppercase tracking-wide text-primary">Up next:</span>}
            {cue}
          </div>))}
        </div>
        <div className="border border-border rounded-xl p-2 bg-secondary text-[10px] text-foreground overflow-y-auto">
          <div className="flex items-center justify-between mb-1"><span>Run-of-show</span><span className="text-[9px] text-muted-foreground">Shot list</span></div>
          <ul className="space-y-1">{runOfShow.map((shot: any) => (<li key={shot.id} className="flex items-center justify-between gap-2">
            <div className="flex flex-col"><span className="font-medium">{shot.label}</span><span className="text-muted-foreground">Scene: {shot.scene}</span></div>
            <span className="text-muted-foreground text-[9px]">{shot.window}</span>
          </li>))}</ul>
        </div>
      </div>
    </div>
  );
}

function CommerceHudPanel({ commerceGoal, salesEvents, momentMarkers }: { commerceGoal: CommerceGoal, salesEvents: SalesEvent[], momentMarkers: MomentMarker[] }) {
  const progress = Math.min(commerceGoal.soldUnits / (commerceGoal.targetUnits || 1), 1);
  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px] h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-[13px]">💰</span><div><h3 className="text-xs font-semibold text-foreground">Commerce HUD</h3><p className="text-[10px] text-muted-foreground">Live sales, goal tracking and marked moments.</p></div></div>
        <span className="text-[10px] text-muted-foreground">Goal: {commerceGoal.targetUnits} units</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[10px]">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1"><span className="text-muted-foreground">Progress</span><span className="text-foreground">{commerceGoal.soldUnits}/{commerceGoal.targetUnits} sold</span></div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} /></div>
        </div>
        <div className="flex flex-col items-end text-[10px]"><span className="text-muted-foreground">In carts</span><span className="text-foreground font-semibold">{commerceGoal.cartCount}</span><span className="text-muted-foreground">{commerceGoal.last5MinSales} sales · 5 min</span></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 flex-1 min-h-0">
        <div className="border border-border rounded-xl p-2 bg-secondary flex flex-col"><h4 className="text-[10px] font-semibold mb-1 text-foreground">Live sales feed</h4>
          <ul className="space-y-1 overflow-y-auto text-[10px] text-foreground flex-1">{salesEvents.map((e) => (<li key={e.id} className="flex items-center justify-between gap-2"><span>{e.label}</span><span className="text-muted-foreground text-[9px]">{e.time}</span></li>))}</ul>
        </div>
        <div className="border border-border rounded-xl p-2 bg-secondary flex flex-col"><h4 className="text-[10px] font-semibold mb-1 text-foreground">Moments for replay</h4>
          {momentMarkers.length === 0 ? <p className="text-[10px] text-muted-foreground flex-1">Use “Mark moment” to flag highlights for clipping.</p> : <ul className="space-y-1 overflow-y-auto text-[10px] text-foreground flex-1">{momentMarkers.map((m) => (<li key={m.id} className="flex items-center justify-between gap-2"><span>{m.label}</span><span className="text-muted-foreground text-[9px]">{m.time}</span></li>))}</ul>}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ activeTab, onTabChange, messages, qaItems, viewers, draft, onDraftChange, onSend, onAttachment }: { activeTab: AudienceTab; onTabChange: (tab: AudienceTab) => void; messages: ChatMessage[]; qaItems: QAItem[]; viewers: Viewer[]; draft: string; onDraftChange: (v: string) => void; onSend: () => void; onAttachment: (file: File) => void; }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAttachment(file);
      toast({
          title: "Attachment Sent",
          description: `"${file.name}" was sent for approval.`,
      });
    }
    // Reset file input
    if(event.target) event.target.value = '';
  };

  const renderBody = () => {
    if (activeTab === "qa") {
      return (<div className="space-y-2">{qaItems.map((q) => (<div key={q.id} className="rounded-xl px-3 py-2 bg-background/50 border border-border">
        <div className="flex items-center justify-between gap-2 mb-1"><span className="font-semibold truncate text-[11px] text-foreground">{q.question}</span><span className="text-[10px] text-muted-foreground truncate">{q.from}</span></div>
        <div className="flex items-center justify-between text-[10px]"><span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full " + (q.status === "pinned" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50" : "bg-secondary text-foreground border border-border")}><span className="material-icons text-[13px]">{q.status === "pinned" ? "push_pin" : "help_outline"}</span>{q.status === "pinned" ? "Pinned" : "Waiting"}</span><button className="text-[10px] text-muted-foreground hover:text-foreground">Answer live</button></div>
      </div>))}</div>);
    } if (activeTab === "viewers") {
      return (<div className="space-y-1.5">{viewers.map((v) => (<div key={v.id} className="flex items-center justify-between gap-3 px-2 py-1 rounded-lg hover:bg-muted">
        <div className="flex items-center gap-2 min-w-0"><div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-semibold text-foreground">{v.name.split(" ").map((p: string) => p[0]).join("")}</div>
          <div className="flex flex-col min-w-0"><span className="truncate text-[11px] text-foreground">{v.name}</span>{v.tag && <span className="text-[10px] text-emerald-400">{v.tag}</span>}</div>
        </div>
        <div className="flex items-center gap-1 text-[10px]"><button className="px-2 py-0.5 rounded-full border border-border text-foreground hover:bg-secondary">Mute</button><button className="px-2 py-0.5 rounded-full border border-destructive/70 text-destructive hover:bg-destructive/10">Ban</button></div>
      </div>))}</div>);
    } return (<div className="space-y-1.5">{messages.map((m) => (<div key={m.id} className="text-[10px]"><span className={"font-semibold " + (m.system ? "text-muted-foreground" : "text-foreground")}>{m.system ? "System" : m.from}</span><span className="text-muted-foreground ml-1">· {m.time}</span><p className="text-foreground whitespace-pre-line">{m.body}</p></div>))}</div>);
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col h-full">
      <div className="mb-2"><h3 className="text-xs font-semibold mb-1 text-foreground">Live audience &amp; chat</h3>
        <div className="inline-flex rounded-full bg-secondary p-0.5 text-[10px]">
          <button className={"px-3 py-1 rounded-full " + (activeTab === 'chat' ? 'bg-background text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')} onClick={() => onTabChange("chat")}>Chat</button>
          <button className={"px-3 py-1 rounded-full " + (activeTab === 'qa' ? 'bg-background text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')} onClick={() => onTabChange("qa")}>Q&amp;A</button>
          <button className={"px-3 py-1 rounded-full " + (activeTab === 'viewers' ? 'bg-background text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')} onClick={() => onTabChange("viewers")}>Viewers</button>
        </div>
      </div>
      <div className="flex-1 border border-border rounded-xl p-2.5 bg-secondary overflow-y-auto">{renderBody()}</div>
      <div className="mt-2 flex items-center gap-1 text-[10px]">
        <button className="h-7 w-7 rounded-full border border-border text-foreground flex items-center justify-center"><span className="material-icons text-[16px]">mic</span></button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
        <button className="h-7 w-7 rounded-full border border-border text-foreground flex items-center justify-center" onClick={handleAttachmentClick}>
          <span className="material-icons text-[16px]">attach_file</span>
        </button>
        <input className="flex-1 border border-border rounded-full px-2 py-1 bg-secondary text-foreground outline-none" placeholder="Type a reply or pin a highlight…" value={draft} onChange={(e) => onDraftChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSend()}/>
        <button className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-primary-foreground bg-primary" onClick={onSend}>Send</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-[10px]"><button className="px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground hover:bg-muted">Poll</button><button className="px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground hover:bg-muted">Giveaway</button><button className="px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground hover:bg-muted">Pinned message</button></div>
    </div>
  );
}

function AiPromptsPanel({ prompts }: { prompts: string[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px] mt-3">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-[13px]">💡</span><h3 className="text-xs font-semibold text-foreground">Live AI prompts</h3></div><span className="text-[10px] text-muted-foreground">Real-time hints</span></div>
      <ul className="space-y-1 max-h-40 overflow-y-auto">{prompts.map((p, idx) => (<li key={idx} className="border border-border rounded-xl px-2.5 py-1.5 bg-secondary text-[10px] text-foreground">{p}</li>))}</ul>
      <div className="mt-1 text-[10px] text-muted-foreground"><span className="font-semibold text-foreground mr-1">Sentiment:</span><span>Viewers are most engaged during visuals and pricing moments. Revisit shipping and bundles if questions keep repeating.</span></div>
    </div>
  );
}

function StudioControlBar({ mode, onToggleLive, micOn, onToggleMic, camOn, onToggleCam, screenShareOn, onToggleScreenShare, activeSceneId, scenes, setActiveSceneId, onMarkMoment, onToggleFilters, onOpenLanguagePanel, }: { mode: Mode; onToggleLive: () => void; micOn: boolean; onToggleMic: () => void; camOn: boolean; onToggleCam: () => void; screenShareOn: boolean; onToggleScreenShare: () => void; activeSceneId: string; scenes: Scene[]; setActiveSceneId: (id: string) => void; onMarkMoment: () => void; onToggleFilters: () => void; onOpenLanguagePanel: () => void; }) {
  return (
    <div className="hidden md:flex items-center justify-between px-3 md:px-6 py-2 border-t border-border bg-background/95 text-[11px]">
      <div className="flex items-center gap-2">
        <button className={"px-4 py-1.5 rounded-full text-[11px] font-semibold text-white " + (mode === "live" ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90")} onClick={onToggleLive}>{mode === "live" ? "End live" : "Go live"}</button>
        <button className={"px-3 py-1.5 rounded-full border text-[10px] " + (micOn ? "bg-secondary border-border text-foreground" : "bg-card border-border text-muted-foreground")} onClick={onToggleMic}>{micOn ? "Mic on" : "Mic off"}</button>
        <button className={"px-3 py-1.5 rounded-full border text-[10px] " + (camOn ? "bg-secondary border-border text-foreground" : "bg-card border-border text-muted-foreground")} onClick={onToggleCam}>{camOn ? "Cam on" : "Cam off"}</button>
        <button className={"px-3 py-1.5 rounded-full border text-[10px] " + (screenShareOn ? "bg-secondary border-border text-foreground" : "bg-card border-border text-muted-foreground")} onClick={onToggleScreenShare}>Screen share</button>
        <button className="px-3 py-1.5 rounded-full border border-border text-[10px] text-foreground hover:bg-secondary" onClick={onMarkMoment}>Mark moment</button>
        <button className="px-3 py-1.5 rounded-full border border-border text-[10px] text-foreground hover:bg-secondary inline-flex items-center gap-1.5" onClick={onToggleFilters}><span className="material-icons text-[14px]">auto_awesome</span>AR Filters</button>
      </div>
      <div className="flex items-center gap-2 text-[10px]"><button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-secondary" onClick={onOpenLanguagePanel}><span className="material-icons text-[14px]">translate</span>Language &amp; AI audio</button><span className="text-muted-foreground">Scene:</span>
        <select className="border border-border rounded-full px-2 py-0.5 bg-secondary text-foreground" value={activeSceneId} onChange={(e) => setActiveSceneId(e.target.value)}>{scenes.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}</select>
      </div>
    </div>
  );
}

function FiltersTray({ onFilterSelect, activeFilterPath }: { onFilterSelect: (path: string) => void; activeFilterPath: string | null; }) {
  const categories = ["Beauty", "Fun", "Background", "Brand"];
  const filters = [
    { id: 6, label: "No Filter", path: 'none' },
    { id: 1, label: "Soft Glam", path: 'effects/beauty' },
    { id: 2, label: "Studio Glow", path: 'effects/studio_glow' },
    { id: 3, label: "Neon Night", path: 'effects/neon_night' },
    { id: 4, label: "Clean Backdrop", path: 'backgrounds/clean_backdrop' },
    { id: 5, label: "Brand Frame", path: 'effects/brand_frame' },
  ];
  return (<div className="fixed left-1/2 -translate-x-1/2 bottom-4 md:bottom-20 w-full max-w-xl rounded-2xl border border-border shadow-xl px-3 py-2 md:px-4 md:py-3 bg-background/95 z-40"><div className="flex items-center justify-between mb-2 text-[11px]"><span className="font-semibold inline-flex items-center gap-1"><span className="material-icons text-[14px] text-amber-500">auto_awesome</span>AR Filters</span><div className="flex gap-1 overflow-x-auto max-w-[60%] hide-scrollbar">{categories.map((c) => (<span key={c} className="px-2 py-0.5 rounded-full bg-secondary text-foreground text-[10px] whitespace-nowrap">{c}</span>))}</div></div><div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">{filters.map((f) => (<div key={f.id} className={"min-w-[80px] max-w-[80px] flex-shrink-0 rounded-xl flex flex-col items-center justify-center py-2 cursor-pointer " + (activeFilterPath === f.path || (f.path === 'none' && activeFilterPath === null) ? "border-emerald-400 border-2" : "border-border border bg-muted ")} onClick={() => onFilterSelect(f.path)}><div className="h-9 w-9 rounded-full bg-secondary mb-1" /><span className="text-[10px] text-center px-1 text-foreground">{f.label}</span></div>))}</div></div>);
}

function FlashDealControl({ onClose, onStart }: { onClose: () => void; onStart: (duration: number, discount: number) => void; }) {
  const [duration, setDuration] = useState<number>(5); const [discount, setDiscount] = useState<number>(15); const durationOptions = [5, 10, 15];
  return (<div className="fixed right-4 top-20 z-50"><div className="w-72 rounded-2xl border border-border bg-card shadow-xl px-3.5 py-3 text-[11px]"><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-1.5"><span className="material-icons text-[16px] text-primary">bolt</span><div className="flex flex-col"><span className="text-[12px] font-semibold text-foreground">Flash Deal Control</span></div></div><span className="text-[10px] text-muted-foreground">Live-only</span></div><p className="text-[11px] text-foreground mb-2">Configure a limited-time offer with a countdown overlay for viewers.</p><div className="mb-2"><span className="text-[10px] text-muted-foreground mr-2">Duration</span>{durationOptions.map((d) => (<button key={d} className={"px-2 py-0.5 rounded-full text-[10px] mr-1 " + (duration === d ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")} onClick={() => setDuration(d)}>{d} min</button>))}</div><div className="flex items-center gap-2 mb-3"><span className="text-[10px] text-muted-foreground">Extra discount</span><input className="w-12 px-1 py-0.5 rounded border border-border bg-secondary text-[11px] text-foreground" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} /><span className="text-[10px] text-muted-foreground">%</span></div><button className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-primary-foreground bg-primary" onClick={() => onStart(duration, discount)}><span className="material-icons text-[14px]">play_arrow</span>Start flash deal</button><button className="mt-2 text-[10px] text-muted-foreground hover:text-foreground w-full text-center" onClick={onClose}>Cancel</button></div></div>);
}

function LanguagePanel({ onClose }: { onClose: () => void }) {
  return (<div className="fixed right-4 top-20 z-50"><div className="w-80 rounded-2xl border border-border bg-card shadow-xl px-4 py-3 text-[11px] text-foreground"><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-1.5"><span className="material-icons text-[16px] text-muted-foreground">translate</span><span className="text-[12px] font-semibold">Language &amp; AI audio</span></div><button className="text-[10px] text-muted-foreground hover:text-foreground" onClick={onClose}>Close</button></div><div className="mb-2"><span className="block text-[10px] font-semibold text-foreground mb-1">Stream language (creator)</span><div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-[10px] text-foreground"><span className="material-icons text-[13px] text-muted-foreground">record_voice_over</span>English (source)</div></div><div className="mb-2"><span className="block text-[10px] font-semibold text-foreground mb-1">AI audio languages for viewers</span><div className="flex flex-wrap gap-1">{["French", "Arabic", "Swahili"].map((l) => (<span key={l} className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-foreground">{l}</span>))}</div></div><div className="mb-2"><span className="block text-[10px] font-semibold text-foreground mb-1">Captions</span><label className="inline-flex items-center gap-1 text-[10px] text-foreground"><input type="checkbox" defaultChecked /> Auto-enable captions</label></div><p className="text-[10px] text-muted-foreground">Viewers can still change their own language and choose between AI audio and captions in their app.</p></div></div>);
}

function MobileStudio({ mode, typeLabel, products, highlightedProductId, setHighlightedProductId, flashDealActive, onOpenFlashConfig, onStopFlash, chatMessages, chatDraft, setChatDraft, onSendChat, mobilePanel, setMobilePanel, onToggleLive, }: { mode: Mode, typeLabel: string, products: Product[], highlightedProductId: string, setHighlightedProductId: (id: string) => void, flashDealActive: boolean, onOpenFlashConfig: () => void, onStopFlash: () => void, chatMessages: ChatMessage[], chatDraft: string, setChatDraft: (d: string) => void, onSendChat: () => void, mobilePanel: "products" | "chat", setMobilePanel: (p: "products" | "chat") => void, onToggleLive: () => void }) {
  return (<div className="md:hidden fixed inset-x-0 bottom-0 top-14 flex flex-col bg-background z-30"><div className="h-1/3 border-b border-border flex items-center justify-center"><span className="text-[11px] text-muted-foreground">{typeLabel} · Mobile view (video placeholder)</span></div><div className="flex-1 flex flex-col"><div className="flex items-center justify-between px-3 py-1 bg-secondary border-b border-border text-[10px]"><div className="flex gap-1"><button className={"px-2.5 py-0.5 rounded-full " + (mobilePanel === "products" ? "bg-background text-foreground" : "bg-secondary text-muted-foreground")} onClick={() => setMobilePanel("products")}>Products</button><button className={"px-2.5 py-0.5 rounded-full " + (mobilePanel === "chat" ? "bg-background text-foreground" : "bg-secondary text-muted-foreground")} onClick={() => setMobilePanel("chat")}>Chat</button></div><span className="text-muted-foreground">Swipe up to browse</span></div><div className="flex-1 overflow-y-auto px-3 py-2">{mobilePanel === "products" ? (<div className="space-y-1">{products.map((p) => (<button key={p.id} className={"w-full text-left border rounded-xl px-2.5 py-1.5 text-[10px] mb-1 " + (p.id === highlightedProductId ? "bg-primary/20 border-primary text-foreground" : "bg-secondary border-border text-foreground")} onClick={() => setHighlightedProductId(p.id)}><div className="flex items-center justify-between"><span className="font-semibold">{p.name}</span><span className="text-emerald-400">{p.price}</span></div><div className="text-[9px] text-muted-foreground">{p.stock} · {p.tag}</div></button>))}</div>) : (<div className="space-y-1 max-h-full">{chatMessages.map((m) => (<div key={m.id} className="text-[10px] mb-1"><span className={"font-semibold " + (m.system ? "text-muted-foreground" : "text-foreground")}>{m.system ? "System" : m.from}</span><span className="text-muted-foreground ml-1">· {m.time}</span><p className="text-foreground whitespace-pre-line">{m.body}</p></div>))}</div>)}</div></div><div className="border-t border-border bg-background px-3 py-2 flex items-center justify-between gap-2 text-[10px]"><button className="px-2.5 py-1 rounded-full border border-border text-foreground flex-1">Highlight product</button><button className={"px-2.5 py-1 rounded-full flex-1 text-white " + (flashDealActive ? "bg-red-600" : "bg-primary")} onClick={flashDealActive ? onStopFlash : onOpenFlashConfig}>{flashDealActive ? "Stop flash deal" : "Flash deal"}</button><button className={"px-2.5 py-1 rounded-full flex-1 " + (mode === "live" ? "bg-red-600 text-white" : "bg-secondary text-foreground border border-border")} onClick={onToggleLive}>{mode === "live" ? "End live" : "Go live"}</button></div><div className="bg-background border-t border-border px-3 py-1 flex items-center gap-1 text-[10px]"><input className="flex-1 border border-border rounded-full px-2 py-1 bg-secondary text-foreground outline-none" placeholder="Reply to viewers…" value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSendChat()} /><button className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px]" onClick={onSendChat}>Send</button></div></div>);
}
