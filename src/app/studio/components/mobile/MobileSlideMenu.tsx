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
}: MobileSlideMenuProps) {
    if (!isOpen) return null;

    const MenuItem = ({
        icon,
        label,
        onClick,
        active = false,
    }: {
        icon: string;
        label: string;
        onClick: () => void;
        active?: boolean;
    }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-slate-800 text-slate-300"
            }`}
        >
            <span className="material-icons text-2xl">{icon}</span>
            <span className="font-medium">{label}</span>
            {active && <span className="ml-auto material-icons text-primary">check</span>}
        </button>
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-50"
                onClick={onClose}
            />

            {/* Bottom Sheet Menu */}
            <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-slate-900 rounded-t-3xl z-50 flex flex-col animate-in slide-in-from-bottom">
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white">Tools</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <MenuItem
                        icon="auto_awesome"
                        label="Filters"
                        onClick={() => {
                            onToggleFilters();
                            onClose();
                        }}
                        active={filtersOpen}
                    />

                    <MenuItem
                        icon="theaters"
                        label="Scenes"
                        onClick={() => {
                            onToggleSceneManager();
                            onClose();
                        }}
                    />

                    <MenuItem
                        icon="layers"
                        label="Sources"
                        onClick={() => {
                            onToggleSources();
                            onClose();
                        }}
                        active={sourcesOpen}
                    />

                    <MenuItem
                        icon="graphic_eq"
                        label="Audio Mixer"
                        onClick={() => {
                            onToggleAudioMixer();
                            onClose();
                        }}
                    />

                    <MenuItem
                        icon="closed_caption"
                        label="Captions"
                        onClick={() => {
                            onToggleTranscription();
                            onClose();
                        }}
                        active={transcriptionOn}
                    />

                    <MenuItem
                        icon="group"
                        label="Co-hosts"
                        onClick={() => {
                            onToggleCoHosts();
                            onClose();
                        }}
                    />

                    <MenuItem
                        icon="cameraswitch"
                        label="Multi-Cam"
                        onClick={() => {
                            onToggleProduction();
                            onClose();
                        }}
                    />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800">
                    <div className="text-xs text-slate-500 text-center">
                        LiveDeals Studio
                    </div>
                </div>
            </div>
        </>
    );
}
