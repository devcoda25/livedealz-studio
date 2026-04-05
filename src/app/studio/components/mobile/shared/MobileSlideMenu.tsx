import React from "react";

interface MobileSlideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onToggleFilters: () => void;
    onToggleSceneManager: () => void;
    onToggleSources: () => void;
    onToggleAudioMixer: () => void;
    onToggleCoHosts: () => void;
    onToggleTranscription: () => void;
    onToggleProduction: () => void;
    transcriptionOn: boolean;
    filtersOpen: boolean;
    sourcesOpen: boolean;
    darkMode?: boolean;
}

export function MobileSlideMenu({
    isOpen,
    onClose,
    onToggleFilters,
    onToggleSceneManager,
    onToggleSources,
    onToggleAudioMixer,
    onToggleCoHosts,
    onToggleTranscription,
    onToggleProduction,
    transcriptionOn,
    filtersOpen,
    sourcesOpen,
    darkMode = true,
}: MobileSlideMenuProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 transition-all duration-300 ${darkMode ? "bg-black/60" : "bg-slate-900/40"}`}
                onClick={onClose}
            />

            {/* Bottom Sheet Menu */}
            <div className={`
                fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[32px] z-50 flex flex-col animate-in slide-in-from-bottom duration-300
                ${darkMode ? "bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl" : "bg-white/95 backdrop-blur-2xl border-t border-slate-200 shadow-xl"}
            `}>
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-2 cursor-pointer group" onClick={onClose}>
                    <div className={`w-12 h-1.5 rounded-full transition-colors ${darkMode ? "bg-white/10 group-hover:bg-white/20" : "bg-slate-200 group-hover:bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-2 border-b ${darkMode ? "border-white/5" : "border-slate-100"}`}>
                    <h2 className={`text-lg font-black uppercase tracking-widest ${darkMode ? "text-white" : "text-slate-900"}`}>Studio Tools</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-white/10 text-white/40" : "hover:bg-slate-100 text-slate-400"}`}
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    <MenuItem
                        icon="auto_awesome"
                        label="Enhance Filters"
                        onClick={() => {
                            onToggleFilters();
                            onClose();
                        }}
                        active={filtersOpen}
                        darkMode={darkMode}
                    />

                    <MenuItem
                        icon="view_carousel"
                        label="Scene Manager"
                        onClick={() => {
                            onToggleSceneManager();
                            onClose();
                        }}
                        darkMode={darkMode}
                    />

                    <MenuItem
                        icon="layers"
                        label="Source Layers"
                        onClick={() => {
                            onToggleSources();
                            onClose();
                        }}
                        active={sourcesOpen}
                        darkMode={darkMode}
                    />

                    <MenuItem
                        icon="equalizer"
                        label="Audio Mixer"
                        onClick={() => {
                            onToggleAudioMixer();
                            onClose();
                        }}
                        darkMode={darkMode}
                    />

                    <MenuItem
                        icon="closed_caption"
                        label="Live Captions"
                        onClick={() => {
                            onToggleTranscription();
                            onClose();
                        }}
                        active={transcriptionOn}
                        darkMode={darkMode}
                    />

                    <MenuItem
                        icon="group_add"
                        label="Co-host Session"
                        onClick={() => {
                            onToggleCoHosts();
                            onClose();
                        }}
                        darkMode={darkMode}
                    />

                    <MenuItem
                        icon="cameraswitch"
                        label="Multi-Camera"
                        onClick={() => {
                            onToggleProduction();
                            onClose();
                        }}
                        darkMode={darkMode}
                    />
                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${darkMode ? "border-white/5" : "border-slate-100"}`}>
                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] text-center ${darkMode ? "text-white/20" : "text-slate-300"}`}>
                        LiveDeals Studio Pro
                    </div>
                    <div className="h-safe" />
                </div>
            </div>
        </>
    );
}

// Menu Item component
function MenuItem({
    icon,
    label,
    onClick,
    active = false,
    darkMode = true,
}: {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
    darkMode?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-4 px-2 py-4 transition-all duration-300 group outline-none
                ${active ? "opacity-100" : "opacity-70 hover:opacity-100"}
            `}
        >
            <div className={`
                w-10 h-10 flex items-center justify-center transition-all duration-300
                ${active
                    ? "text-[#f77f00] scale-110"
                    : `${darkMode ? "text-white/40 group-hover:text-white" : "text-slate-400 group-hover:text-slate-900"}`
                }
            `}>
                <span className="material-icons text-[24px]">{icon}</span>
            </div>
            <span className={`
                font-black text-[15px] uppercase tracking-widest transition-colors
                ${active
                    ? "text-[#f77f00]"
                    : `${darkMode ? "text-white/60 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900"}`
                }
            `}>
                {label}
            </span>
            {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#f77f00] shadow-[0_0_8px_#f77f00] animate-pulse" />
            )}
        </button>
    );
}
