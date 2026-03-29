"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AudioSourceConfig } from "@/engines/audio";
import { StreamConfig, StreamQuality, DEFAULT_STREAM_CONFIGS } from "@/engines/streaming/types";
import {
  Volume2, VolumeX, Mic, Monitor, Music, Trash2,
  Headphones, Settings2, Video, SlidersHorizontal,
  ChevronDown, Cpu, Gauge, Film, Activity, Radio,
  Waves, Zap, BarChart3, RotateCcw, Grip
} from "lucide-react";

// ============================================
// Types
// ============================================

interface VideoAudioPanelProps {
  darkMode?: boolean;
  isOpen: boolean;
  onClose: () => void;
  // Audio props
  sources: AudioSourceConfig[];
  masterVolume: number;
  masterMuted: boolean;
  onSetSourceVolume: (sourceId: string, volume: number) => void;
  onSetSourcePan: (sourceId: string, pan: number) => void;
  onSetSourceMuted: (sourceId: string, muted: boolean) => void;
  onSetSourceSolo: (sourceId: string, solo: boolean) => void;
  onSetMasterVolume: (volume: number) => void;
  onSetMasterMuted: (muted: boolean) => void;
  onEnableNoiseReduction: (sourceId: string, enable: boolean) => void;
  onAddMicrophone: () => Promise<string | null>;
  onAddScreenShareAudio: () => Promise<string | null>;
  onRemoveSource: (sourceId: string) => void;
  // Video props
  streamConfig?: StreamConfig;
  onStreamConfigChange?: (config: Partial<StreamConfig>) => void;
  currentQuality?: StreamQuality;
  onQualityChange?: (quality: StreamQuality) => void;
}

// ============================================
// Audio Visualization Hook (Professional)
// ============================================

function useAudioLevels(sourceId: string, isActive: boolean) {
  const [level, setLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [dbLevel, setDbLevel] = useState(-60);

  useEffect(() => {
    if (!isActive) {
      setLevel(0);
      setPeakLevel(0);
      setDbLevel(-60);
      return;
    }

    const interval = setInterval(() => {
      const baseLevel = Math.random() * 0.45 + 0.1;
      const talkingSpike = Math.random() > 0.65 ? Math.random() * 0.35 : 0;
      const newLevel = Math.min(baseLevel + talkingSpike, 1);
      setLevel(prev => prev * 0.25 + newLevel * 0.75);

      if (newLevel > peakLevel) {
        setPeakLevel(newLevel);
      } else {
        setPeakLevel(prev => Math.max(0, prev - 0.02));
      }

      const newDb = newLevel > 0.001 ? 20 * Math.log10(newLevel) : -60;
      setDbLevel(prev => prev * 0.3 + newDb * 0.7);
    }, 50);

    return () => clearInterval(interval);
  }, [sourceId, isActive]);

  return { level, peakLevel, dbLevel };
}

// ============================================
// dB Conversion Utilities
// ============================================

function volumeToDb(vol: number): string {
  if (vol <= 0) return "-∞";
  const db = 20 * Math.log10(vol);
  if (db > 0) return `+${db.toFixed(1)}`;
  return db.toFixed(1);
}

function dbToColor(db: number): string {
  if (db >= 0) return "text-red-400";
  if (db >= -6) return "text-yellow-400";
  if (db >= -12) return "text-green-400";
  return "text-green-500";
}

// ============================================
// Professional Level Meter with dB Scale
// ============================================

interface LevelMeterProps {
  level: number;
  peakLevel?: number;
  showScale?: boolean;
  colorMode?: 'standard' | 'master';
}

const DB_MARKINGS = [
  { db: 0,   label: "0" },
  { db: -3,  label: "3" },
  { db: -6,  label: "6" },
  { db: -10, label: "10" },
  { db: -20, label: "20" },
  { db: -40, label: "40" },
];

function LevelMeter({ level, peakLevel, showScale = true, colorMode = 'standard' }: LevelMeterProps) {
  const segments = 30;
  const activeSegments = Math.floor(level * segments);
  const peakSegment = peakLevel !== undefined ? Math.floor(peakLevel * segments) : -1;
  const [heldPeak, setHeldPeak] = useState(-1);
  const [isClipping, setIsClipping] = useState(false);

  useEffect(() => {
    if (level > 0.95) {
      setIsClipping(true);
      const t = setTimeout(() => setIsClipping(false), 300);
      return () => clearTimeout(t);
    }
  }, [level]);

  useEffect(() => {
    if (peakSegment > heldPeak) {
      setHeldPeak(peakSegment);
      const timeout = setTimeout(() => setHeldPeak(-1), 2000);
      return () => clearTimeout(timeout);
    }
  }, [peakSegment, heldPeak]);

  // Convert dB position to segment index
  const dbToSegment = (db: number) => {
    // 0dB = top (segment 30), -60dB = bottom (segment 0)
    return Math.max(0, Math.min(segments, Math.round(((db + 60) / 60) * segments)));
  };

  return (
    <div className="flex gap-1 items-end">
      {/* dB Scale */}
      {showScale && (
        <div className="flex flex-col-reverse h-[156px] justify-between relative">
          {DB_MARKINGS.map((mark) => (
            <span
              key={mark.db}
              className="text-[7px] font-mono text-slate-600 text-right w-5 leading-none"
              style={{
                position: 'absolute',
                bottom: `${((mark.db + 60) / 60) * 100}%`,
                transform: 'translateY(50%)'
              }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      )}

      {/* Meter Bars */}
      <div className="flex flex-col-reverse gap-px h-[156px] w-4 relative">
        {[...Array(segments)].map((_, i) => {
          const isActive = i < activeSegments;
          const isPeak = (i === heldPeak && heldPeak >= 0) || i === peakSegment;
          const dbValue = ((i / segments) * 60) - 60;

          let bgColor = "bg-slate-800/80";
          if (isActive || isPeak) {
            if (dbValue >= -3) bgColor = "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]";
            else if (dbValue >= -6) bgColor = "bg-red-400 shadow-[0_0_3px_rgba(248,113,113,0.3)]";
            else if (dbValue >= -12) bgColor = "bg-yellow-400 shadow-[0_0_2px_rgba(250,204,21,0.3)]";
            else if (dbValue >= -24) bgColor = "bg-green-400";
            else bgColor = "bg-green-500/80";
          }

          return (
            <div
              key={i}
              className={`w-full rounded-[1px] transition-all duration-50 ${bgColor} ${isPeak ? 'brightness-150' : ''}`}
              style={{ height: `${100 / segments}%` }}
            />
          );
        })}

        {/* -6dB reference line */}
        <div
          className="absolute left-0 right-0 h-px bg-white/20 z-10"
          style={{ bottom: `${(( -6 + 60) / 60) * 100}%` }}
        />

        {/* Clip indicator */}
        {isClipping && (
          <div className="absolute -top-3 left-0 right-0 text-center">
            <span className="text-[8px] font-bold text-red-400 animate-pulse">CLIP</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Professional Fader with dB Scale
// ============================================

interface ProFaderProps {
  value: number;
  onChange: (value: number) => void;
  color?: string;
  disabled?: boolean;
  label?: string;
}

function ProFader({ value, onChange, color = "bg-cyan-500", disabled = false, label }: ProFaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !disabled) updateValue(e);
  }, [isDragging, disabled]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const updateValue = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    onChange(1 - Math.min(Math.max(y / rect.height, 0), 1));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const thumbPosition = (1 - value) * 100;
  const fillPercent = value * 100;
  const dbStr = volumeToDb(value);

  // dB markings on the fader track
  const faderDbMarks = [
    { db: 0, label: "0" },
    { db: -6, label: "" },
    { db: -10, label: "10" },
    { db: -20, label: "" },
    { db: -30, label: "30" },
    { db: -40, label: "" },
    { db: -50, label: "50" },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      {/* dB Readout */}
      <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
        dbToColor(parseFloat(dbStr) || -60)
      } ${value > 0.89 ? 'bg-red-500/20 animate-pulse' : 'bg-slate-800/80'}`}>
        {dbStr}
      </div>

      {/* Fader Track */}
      <div className="relative flex items-center gap-1">
        {/* dB Scale markings */}
        <div className="relative h-[156px] w-3 flex flex-col justify-between">
          {faderDbMarks.map((mark) => {
            const pos = ((-mark.db) / 60) * 100;
            return (
              <div
                key={mark.db}
                className="absolute right-0 flex items-center gap-px"
                style={{ top: `${pos}%`, transform: 'translateY(-50%)' }}
              >
                <div className="w-1.5 h-px bg-slate-600" />
                {mark.label && (
                  <span className="text-[6px] font-mono text-slate-600">{mark.label}</span>
                )}
              </div>
            );
          })}
        </div>

        <div
          ref={trackRef}
          className={`relative w-7 h-[156px] rounded cursor-pointer border border-slate-700 overflow-hidden ${
            disabled ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          style={{
            background: 'linear-gradient(to bottom, #1e293b 0%, #0f172a 50%, #020617 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Center reference line (0dB at 100% = top, but 0dB is at position ~0% from bottom) */}
          <div className="absolute left-0 right-0 h-px bg-red-500/30 z-[1]"
            style={{ bottom: '0%' }}
          />

          {/* -6dB reference */}
          <div className="absolute left-0 right-0 h-px bg-yellow-500/20 z-[1]"
            style={{ bottom: '10%' }}
          />

          {/* Fill gradient */}
          <div
            className={`absolute bottom-0 left-0 right-0 rounded-b transition-all duration-75`}
            style={{
              height: `${fillPercent}%`,
              background: `linear-gradient(to top, ${color.includes('amber') ? '#d97706' : color.includes('rose') ? '#e11d48' : color.includes('blue') ? '#2563eb' : color.includes('emerald') ? '#059669' : '#06b6d4'}88, ${color.includes('amber') ? '#d97706' : color.includes('rose') ? '#e11d48' : color.includes('blue') ? '#2563eb' : color.includes('emerald') ? '#059669' : '#06b6d4'}44)`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Fader Thumb */}
          <div
            className={`absolute left-[-2px] right-[-2px] h-5 rounded-sm z-10 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              top: `calc(${thumbPosition}% - 10px)`,
              background: 'linear-gradient(to bottom, #f8fafc, #cbd5e1)',
              boxShadow: isDragging
                ? '0 0 12px rgba(6,182,212,0.4), 0 2px 8px rgba(0,0,0,0.6)'
                : '0 2px 6px rgba(0,0,0,0.5)',
              border: isDragging ? '1px solid rgba(6,182,212,0.6)' : '1px solid #94a3b8'
            }}
          >
            {/* Grip lines */}
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-[2px] items-center">
              <div className="w-5 h-[1px] bg-slate-500 rounded" />
              <div className="w-5 h-[1px] bg-slate-500 rounded" />
              <div className="w-5 h-[1px] bg-slate-500 rounded" />
            </div>
          </div>
        </div>
      </div>

      {label && <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider">{label}</span>}
    </div>
  );
}

// ============================================
// Pan Knob (Improved)
// ============================================

interface PanKnobProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function PanKnob({ value, onChange, disabled = false }: PanKnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled) return;
      const delta = startY.current - e.clientY;
      const newValue = Math.max(-1, Math.min(1, startValue.current + delta / 80));
      onChange(Math.round(newValue * 100) / 100);
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onChange, disabled]);

  const rotation = value * 135;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[7px] text-slate-500 uppercase tracking-widest font-semibold">Pan</span>
      <div className="relative w-7 h-7">
        {/* Arc background */}
        <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#334155" strokeWidth="2.5"
            strokeDasharray="75 100" strokeLinecap="round" transform="rotate(135 20 20)" />
          <circle cx="20" cy="20" r="16" fill="none"
            stroke={value === 0 ? '#06b6d4' : value < 0 ? '#3b82f6' : '#f59e0b'}
            strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={`${Math.abs(value) * 37.5} 100`}
            transform="rotate(135 20 20)"
            className="transition-all duration-100"
          />
        </svg>
        {/* Knob body */}
        <div
          className={`absolute inset-1 rounded-full cursor-pointer ${
            disabled ? 'opacity-40' : ''
          }`}
          style={{
            background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)',
            transform: `rotate(${rotation}deg)`,
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] bg-white rounded-full shadow" />
        </div>
      </div>
      <span className={`text-[8px] font-mono font-bold ${
        value === 0 ? 'text-cyan-400' : 'text-slate-400'
      }`}>
        {value === 0 ? 'C' : value < 0 ? `L${Math.abs(Math.round(value * 100))}` : `R${Math.round(value * 100)}`}
      </span>
    </div>
  );
}

// ============================================
// EQ Mini Display
// ============================================

interface EQSettings {
  highGain: number;
  midGain: number;
  midFreq: number;
  lowGain: number;
}

interface EQDisplayProps {
  eq: EQSettings;
  onChange: (eq: EQSettings) => void;
  expanded: boolean;
  onToggle: () => void;
}

function EQDisplay({ eq, onChange, expanded, onToggle }: EQDisplayProps) {
  const bands = [
    { key: 'high', label: 'HI', value: eq.highGain, onChange: (v: number) => onChange({ ...eq, highGain: v }), color: '#f43f5e' },
    { key: 'mid', label: 'MID', value: eq.midGain, onChange: (v: number) => onChange({ ...eq, midGain: v }), color: '#eab308' },
    { key: 'low', label: 'LO', value: eq.lowGain, onChange: (v: number) => onChange({ ...eq, lowGain: v }), color: '#3b82f6' },
  ];

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[7px] text-slate-500 hover:text-slate-300 uppercase tracking-widest font-semibold"
      >
        <Waves className="w-2.5 h-2.5" />
        EQ
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="flex gap-1.5 bg-slate-900/80 rounded p-1.5 border border-slate-700/50">
          {bands.map((band) => (
            <div key={band.key} className="flex flex-col items-center gap-0.5">
              <span className="text-[7px] font-mono text-slate-500">{band.label}</span>
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-mono text-slate-400">
                  {band.value > 0 ? '+' : ''}{band.value}dB
                </span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={band.value}
                  onChange={(e) => band.onChange(parseInt(e.target.value))}
                  className="w-6 h-12 appearance-none bg-transparent cursor-pointer"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    accentColor: band.color,
                  }}
                  disabled={false}
                />
              </div>
              {/* Zero center marker */}
              <div className="w-4 h-px bg-slate-600" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Noise Gate Control
// ============================================

interface GateControlProps {
  enabled: boolean;
  threshold: number;
  onToggle: () => void;
  onThresholdChange: (v: number) => void;
  expanded: boolean;
  onExpandToggle: () => void;
}

function GateControl({ enabled, threshold, onToggle, onThresholdChange, expanded, onExpandToggle }: GateControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={onExpandToggle}
        className="flex items-center gap-1 text-[7px] uppercase tracking-widest font-semibold"
      >
        <Zap className={`w-2.5 h-2.5 ${enabled ? 'text-purple-400' : 'text-slate-500'}`} />
        <span className={enabled ? 'text-purple-400' : 'text-slate-500'}>Gate</span>
        <ChevronDown className={`w-2.5 h-2.5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="flex items-center gap-2 bg-slate-900/80 rounded p-1.5 border border-slate-700/50">
          <button
            onClick={onToggle}
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
              enabled ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
          <div className="flex flex-col items-center flex-1">
            <span className="text-[7px] text-slate-500">Threshold</span>
            <span className="text-[8px] font-mono text-slate-300">{threshold}dB</span>
            <input
              type="range"
              min="-60"
              max="0"
              value={threshold}
              onChange={(e) => onThresholdChange(parseInt(e.target.value))}
              className="w-full h-1 appearance-none bg-slate-700 rounded cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Compressor Control
// ============================================

interface CompressorControlProps {
  enabled: boolean;
  threshold: number;
  ratio: number;
  onToggle: () => void;
  onThresholdChange: (v: number) => void;
  onRatioChange: (v: number) => void;
  expanded: boolean;
  onExpandToggle: () => void;
}

function CompressorControl({ enabled, threshold, ratio, onToggle, onThresholdChange, onRatioChange, expanded, onExpandToggle }: CompressorControlProps) {
  const ratioLabels: Record<number, string> = { 2: '2:1', 3: '3:1', 4: '4:1', 6: '6:1', 8: '8:1', 10: '10:1', 20: '20:1' };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={onExpandToggle}
        className="flex items-center gap-1 text-[7px] uppercase tracking-widest font-semibold"
      >
        <BarChart3 className={`w-2.5 h-2.5 ${enabled ? 'text-orange-400' : 'text-slate-500'}`} />
        <span className={enabled ? 'text-orange-400' : 'text-slate-500'}>Comp</span>
        <ChevronDown className={`w-2.5 h-2.5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="flex flex-col gap-1.5 bg-slate-900/80 rounded p-1.5 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                enabled ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50' : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {enabled ? 'ON' : 'OFF'}
            </button>
            {/* Gain reduction meter placeholder */}
            <div className="flex-1 flex gap-px h-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`flex-1 rounded-[1px] ${enabled && i < 4 ? 'bg-orange-500/60' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-[7px] text-slate-500 block">Thresh</span>
              <span className="text-[8px] font-mono text-slate-300">{threshold}dB</span>
              <input
                type="range"
                min="-40"
                max="0"
                value={threshold}
                onChange={(e) => onThresholdChange(parseInt(e.target.value))}
                className="w-full h-1 appearance-none bg-slate-700 rounded cursor-pointer accent-orange-500"
              />
            </div>
            <div className="flex-1">
              <span className="text-[7px] text-slate-500 block">Ratio</span>
              <span className="text-[8px] font-mono text-slate-300">{ratioLabels[ratio] || `${ratio}:1`}</span>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={ratio}
                onChange={(e) => onRatioChange(parseInt(e.target.value))}
                className="w-full h-1 appearance-none bg-slate-700 rounded cursor-pointer accent-orange-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Professional Channel Strip
// ============================================

interface ChannelState {
  gain: number;
  eq: EQSettings;
  gateEnabled: boolean;
  gateThreshold: number;
  compEnabled: boolean;
  compThreshold: number;
  compRatio: number;
  expandedEQ: boolean;
  expandedGate: boolean;
  expandedComp: boolean;
}

interface ChannelStripProps {
  source: AudioSourceConfig;
  channelState: ChannelState;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onRemove: () => void;
  onChannelStateChange: (state: Partial<ChannelState>) => void;
}

function ChannelStrip({
  source, channelState, onVolumeChange, onPanChange,
  onMuteToggle, onSoloToggle, onRemove, onChannelStateChange
}: ChannelStripProps) {
  const { level, peakLevel, dbLevel } = useAudioLevels(source.id, !source.muted);
  const isMuted = source.muted;

  const getIcon = () => {
    switch (source.type) {
      case "microphone": return <Mic className="w-3.5 h-3.5" />;
      case "screenShare": return <Monitor className="w-3.5 h-3.5" />;
      case "backgroundMusic": return <Music className="w-3.5 h-3.5" />;
      default: return <Volume2 className="w-3.5 h-3.5" />;
    }
  };

  const getChannelColor = () => {
    switch (source.type) {
      case "microphone": return "border-l-rose-500";
      case "screenShare": return "border-l-blue-500";
      case "backgroundMusic": return "border-l-emerald-500";
      default: return "border-l-cyan-500";
    }
  };

  const getFaderColor = () => {
    switch (source.type) {
      case "microphone": return "bg-rose-500";
      case "screenShare": return "bg-blue-500";
      case "backgroundMusic": return "bg-emerald-500";
      default: return "bg-cyan-500";
    }
  };

  return (
    <div className={`flex flex-col gap-2 p-2.5 bg-gradient-to-b from-slate-800/90 to-slate-900/90 rounded-lg border border-slate-700/80 border-l-2 ${getChannelColor()} min-w-[120px] shadow-lg`}>
      {/* Channel Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-slate-700/60 text-slate-400">
            {getIcon()}
          </div>
          <span className="text-[10px] text-slate-200 font-semibold truncate max-w-[70px]" title={source.name}>
            {source.name}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="p-0.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Remove"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Gain Trim */}
      <div className="flex items-center gap-2">
        <span className="text-[7px] text-slate-500 uppercase tracking-wider font-semibold w-6">Gain</span>
        <input
          type="range"
          min="-12"
          max="12"
          value={channelState.gain}
          onChange={(e) => onChannelStateChange({ gain: parseInt(e.target.value) })}
          className="flex-1 h-1 appearance-none bg-slate-700 rounded cursor-pointer accent-cyan-500"
        />
        <span className="text-[8px] font-mono text-slate-400 w-7 text-right">
          {channelState.gain > 0 ? '+' : ''}{channelState.gain}
        </span>
      </div>

      {/* EQ, Gate, Comp Processors */}
      <div className="flex flex-col gap-1.5 border-t border-slate-700/50 pt-1.5">
        <EQDisplay
          eq={channelState.eq}
          onChange={(eq) => onChannelStateChange({ eq })}
          expanded={channelState.expandedEQ}
          onToggle={() => onChannelStateChange({ expandedEQ: !channelState.expandedEQ })}
        />
        <GateControl
          enabled={channelState.gateEnabled}
          threshold={channelState.gateThreshold}
          onToggle={() => onChannelStateChange({ gateEnabled: !channelState.gateEnabled })}
          onThresholdChange={(v) => onChannelStateChange({ gateThreshold: v })}
          expanded={channelState.expandedGate}
          onExpandToggle={() => onChannelStateChange({ expandedGate: !channelState.expandedGate })}
        />
        <CompressorControl
          enabled={channelState.compEnabled}
          threshold={channelState.compThreshold}
          ratio={channelState.compRatio}
          onToggle={() => onChannelStateChange({ compEnabled: !channelState.compEnabled })}
          onThresholdChange={(v) => onChannelStateChange({ compThreshold: v })}
          onRatioChange={(v) => onChannelStateChange({ compRatio: v })}
          expanded={channelState.expandedComp}
          onExpandToggle={() => onChannelStateChange({ expandedComp: !channelState.expandedComp })}
        />
      </div>

      {/* Pan & Fader Section */}
      <div className="flex gap-2 items-end justify-center border-t border-slate-700/50 pt-2">
        {/* Level Meter */}
        <LevelMeter level={isMuted ? 0 : level} peakLevel={peakLevel} showScale={false} />

        {/* Fader */}
        <ProFader
          value={source.volume}
          onChange={onVolumeChange}
          color={isMuted ? "bg-slate-600" : getFaderColor()}
          disabled={isMuted}
        />

        {/* Pan */}
        <PanKnob
          value={source.pan}
          onChange={onPanChange}
          disabled={isMuted}
        />
      </div>

      {/* Channel Buttons */}
      <div className="flex gap-1 justify-center">
        <button
          onClick={onMuteToggle}
          className={`h-6 px-2 rounded text-[9px] font-bold transition-all ${
            source.muted
              ? "bg-red-500 text-white shadow-[0_0_6px_rgba(239,68,68,0.4)]"
              : "bg-slate-700/80 text-slate-400 hover:bg-slate-600 border border-slate-600"
          }`}
        >
          MUTE
        </button>
        <button
          onClick={onSoloToggle}
          className={`h-6 px-2 rounded text-[9px] font-bold transition-all ${
            source.solo
              ? "bg-yellow-500 text-black shadow-[0_0_6px_rgba(234,179,8,0.4)]"
              : "bg-slate-700/80 text-slate-400 hover:bg-slate-600 border border-slate-600"
          }`}
        >
          SOLO
        </button>
      </div>
    </div>
  );
}

// ============================================
// Professional Master Section
// ============================================

interface MasterSectionProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (v: number) => void;
  onMuteToggle: () => void;
}

function MasterSection({ volume, muted, onVolumeChange, onMuteToggle }: MasterSectionProps) {
  const { level, peakLevel, dbLevel } = useAudioLevels("master", !muted);

  return (
    <div className="flex flex-col gap-2 p-3 bg-gradient-to-b from-amber-950/40 to-slate-900/90 rounded-lg border border-amber-500/30 shadow-lg">
      {/* Master Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-amber-500/20">
            <Headphones className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-amber-400 font-bold tracking-wider">MASTER</span>
            <span className="text-[8px] text-slate-500 font-mono">Stereo Out</span>
          </div>
        </div>

        {/* Master dB Readout */}
        <div className={`text-[12px] font-mono font-bold px-2 py-1 rounded ${
          dbToColor(dbLevel)
        } ${dbLevel > -3 ? 'bg-red-500/20' : 'bg-slate-800/80'}`}>
          {dbLevel > -60 ? `${dbLevel.toFixed(1)}` : '-∞'}
        </div>
      </div>

      {/* Large Level Meter + Fader */}
      <div className="flex gap-3 items-end justify-center">
        <LevelMeter level={muted ? 0 : level} peakLevel={peakLevel} showScale={true} colorMode="master" />
        <ProFader
          value={volume}
          onChange={onVolumeChange}
          color={muted ? "bg-slate-600" : "bg-amber-500"}
          disabled={muted}
          label="Output"
        />
      </div>

      {/* Master Controls */}
      <div className="flex gap-2 justify-center border-t border-amber-500/20 pt-2">
        <button
          onClick={onMuteToggle}
          className={`h-7 px-3 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
            muted
              ? "bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]"
              : "bg-amber-600/80 text-white hover:bg-amber-500 border border-amber-500/50"
          }`}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {muted ? "MUTED" : "MUTE"}
        </button>

        {/* Reset button */}
        <button
          onClick={() => onVolumeChange(0.75)}
          className="h-7 px-2 rounded text-[9px] font-medium bg-slate-700/60 text-slate-400 hover:bg-slate-600 border border-slate-600/50 transition-all"
          title="Reset to unity"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Audio Tab (Professional)
// ============================================

interface AudioTabProps {
  sources: AudioSourceConfig[];
  masterVolume: number;
  masterMuted: boolean;
  onSetSourceVolume: (id: string, v: number) => void;
  onSetSourcePan: (id: string, p: number) => void;
  onSetSourceMuted: (id: string, m: boolean) => void;
  onSetSourceSolo: (id: string, s: boolean) => void;
  onSetMasterVolume: (v: number) => void;
  onSetMasterMuted: (m: boolean) => void;
  onEnableNoiseReduction: (id: string, e: boolean) => void;
  onAddMicrophone: () => Promise<string | null>;
  onAddScreenShareAudio: () => Promise<string | null>;
  onRemoveSource: (id: string) => void;
}

function AudioTab({
  sources, masterVolume, masterMuted,
  onSetSourceVolume, onSetSourcePan, onSetSourceMuted, onSetSourceSolo,
  onSetMasterVolume, onSetMasterMuted,
  onEnableNoiseReduction, onAddMicrophone, onAddScreenShareAudio, onRemoveSource
}: AudioTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [channelStates, setChannelStates] = useState<Record<string, ChannelState>>({});

  const getChannelState = (id: string): ChannelState => {
    return channelStates[id] || {
      gain: 0,
      eq: { highGain: 0, midGain: 0, midFreq: 1000, lowGain: 0 },
      gateEnabled: false,
      gateThreshold: -40,
      compEnabled: false,
      compThreshold: -20,
      compRatio: 4,
      expandedEQ: false,
      expandedGate: false,
      expandedComp: false,
    };
  };

  const updateChannelState = (id: string, update: Partial<ChannelState>) => {
    setChannelStates(prev => ({
      ...prev,
      [id]: { ...getChannelState(id), ...update }
    }));
  };

  const handleAddMic = async () => { setIsAdding(true); await onAddMicrophone(); setIsAdding(false); };
  const handleAddScreen = async () => { setIsAdding(true); await onAddScreenShareAudio(); setIsAdding(false); };

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex gap-2 items-center">
        <button onClick={handleAddMic} disabled={isAdding}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-lg text-[10px] font-semibold text-slate-200 transition-all border border-slate-600 shadow-md">
          <Mic className="w-3.5 h-3.5" />
          <span>Add Mic</span>
        </button>
        <button onClick={handleAddScreen} disabled={isAdding}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-lg text-[10px] font-semibold text-slate-200 transition-all border border-slate-600 shadow-md">
          <Monitor className="w-3.5 h-3.5" />
          <span>Add Screen</span>
        </button>
      </div>

      {/* Routing Header */}
      {sources.length > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/60 rounded border border-slate-800">
          <Grip className="w-3 h-3 text-slate-600" />
          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Input Channels</span>
          <span className="text-[8px] text-slate-600 ml-auto font-mono">{sources.length}ch</span>
        </div>
      )}

      {/* Channel Strips */}
      <div className="flex flex-col gap-2">
        {sources.map((source) => (
          <ChannelStrip
            key={source.id}
            source={source}
            channelState={getChannelState(source.id)}
            onVolumeChange={(v) => onSetSourceVolume(source.id, v)}
            onPanChange={(p) => onSetSourcePan(source.id, p)}
            onMuteToggle={() => onSetSourceMuted(source.id, !source.muted)}
            onSoloToggle={() => onSetSourceSolo(source.id, !source.solo)}
            onRemove={() => {
              onRemoveSource(source.id);
              setChannelStates(prev => {
                const next = { ...prev };
                delete next[source.id];
                return next;
              });
            }}
            onChannelStateChange={(update) => updateChannelState(source.id, update)}
          />
        ))}
      </div>

      {/* Master Section */}
      {sources.length > 0 && (
        <MasterSection
          volume={masterVolume}
          muted={masterMuted}
          onVolumeChange={onSetMasterVolume}
          onMuteToggle={() => onSetMasterMuted(!masterMuted)}
        />
      )}

      {/* Empty State */}
      {sources.length === 0 && (
        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-lg">
          <Radio className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-[11px] font-medium">No audio sources</p>
          <p className="text-[9px] mt-1 text-slate-600">Add a mic or screen share to start mixing</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Quality Presets Display
// ============================================

const QUALITY_LABELS: Record<StreamQuality, { label: string; desc: string; color: string }> = {
  low:    { label: "480p",  desc: "24fps  ~800kbps",  color: "text-slate-400" },
  medium: { label: "720p",  desc: "30fps  ~2Mbps",   color: "text-green-400" },
  high:   { label: "1080p", desc: "30fps  ~4.5Mbps",  color: "text-blue-400" },
  ultra:  { label: "1080p", desc: "60fps  ~8Mbps",    color: "text-purple-400" },
};

const CODEC_OPTIONS = [
  { value: "h264", label: "H.264", desc: "Best compatibility" },
  { value: "h265", label: "H.265", desc: "Better quality, needs HW" },
  { value: "vp8",  label: "VP8",   desc: "Open source" },
  { value: "vp9",  label: "VP9",   desc: "Open source, efficient" },
];

const AUDIO_CODEC_OPTIONS = [
  { value: "aac",  label: "AAC",  desc: "Standard" },
  { value: "opus", label: "Opus", desc: "Low latency" },
];

// ============================================
// Video Tab
// ============================================

interface VideoTabProps {
  streamConfig?: StreamConfig;
  onStreamConfigChange?: (config: Partial<StreamConfig>) => void;
  currentQuality?: StreamQuality;
  onQualityChange?: (quality: StreamQuality) => void;
}

function VideoTab({ streamConfig, onStreamConfigChange, currentQuality, onQualityChange }: VideoTabProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!streamConfig) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Video className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-[11px]">Video engine not initialized</p>
      </div>
    );
  }

  const quality: StreamQuality = currentQuality || "medium";

  return (
    <div className="flex flex-col gap-3">
      {/* Quality Preset Selector */}
      <div>
        <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5 block">Quality Preset</label>
        <div className="grid grid-cols-4 gap-1.5">
          {(["low", "medium", "high", "ultra"] as StreamQuality[]).map((q) => {
            const info = QUALITY_LABELS[q];
            const isActive = quality === q;
            return (
              <button
                key={q}
                onClick={() => onQualityChange?.(q)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${
                  isActive
                    ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                <span className={`text-[11px] font-bold ${isActive ? "text-cyan-400" : info.color}`}>{info.label}</span>
                <span className="text-[8px] text-slate-500">{info.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resolution Selector */}
      <div>
        <label className="text-[10px] text-slate-400 font-semibold mb-1.5 block">
          <Film className="w-3 h-3 inline mr-1" />Resolution
        </label>
        <div className="grid grid-cols-4 gap-1">
          {([
            { w: 854, h: 480, label: "480p" },
            { w: 1280, h: 720, label: "720p" },
            { w: 1920, h: 1080, label: "1080p" },
            { w: 2560, h: 1440, label: "1440p" },
          ]).map((res) => {
            const isActive = streamConfig.resolution.width === res.w && streamConfig.resolution.height === res.h;
            return (
              <button
                key={res.label}
                onClick={() => onStreamConfigChange?.({ resolution: { width: res.w, height: res.h } })}
                className={`px-2 py-1.5 rounded-lg border text-center transition-all ${
                  isActive
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                <span className="text-[10px] font-bold">{res.label}</span>
                <span className="text-[7px] text-slate-500 block">{res.w}x{res.h}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Framerate Selector */}
      <div>
        <label className="text-[10px] text-slate-400 font-semibold mb-1.5 block">
          <Gauge className="w-3 h-3 inline mr-1" />Framerate
        </label>
        <div className="flex gap-1">
          {[15, 24, 30, 60].map((fps) => {
            const isActive = streamConfig.framerate === fps;
            return (
              <button
                key={fps}
                onClick={() => onStreamConfigChange?.({ framerate: fps })}
                className={`flex-1 px-2 py-1.5 rounded-lg border text-center transition-all ${
                  isActive
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                <span className="text-[11px] font-mono font-bold">{fps}</span>
                <span className="text-[7px] text-slate-500 block">fps</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bitrate Selector */}
      <div>
        <label className="text-[10px] text-slate-400 font-semibold mb-1.5 block">Bitrate</label>
        <div className="flex gap-1 mb-1.5">
          {[
            { target: 800, max: 1200, label: "800k" },
            { target: 2000, max: 3000, label: "2M" },
            { target: 4500, max: 6000, label: "4.5M" },
            { target: 8000, max: 10000, label: "8M" },
          ].map((br) => {
            const isActive = streamConfig.bitrate.target === br.target;
            return (
              <button
                key={br.label}
                onClick={() => onStreamConfigChange?.({ bitrate: { target: br.target, max: br.max, min: Math.round(br.target * 0.5) } })}
                className={`flex-1 px-2 py-1.5 rounded-lg border text-center transition-all ${
                  isActive
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                <span className="text-[10px] font-mono font-bold">{br.label}</span>
                <span className="text-[7px] text-slate-500 block">target</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 px-2 py-1 bg-slate-900/60 rounded border border-slate-800">
            <span className="text-[8px] text-slate-500">Target</span>
            <span className="text-[10px] text-slate-300 font-mono block">{streamConfig.bitrate.target} kbps</span>
          </div>
          <div className="flex-1 px-2 py-1 bg-slate-900/60 rounded border border-slate-800">
            <span className="text-[8px] text-slate-500">Max</span>
            <span className="text-[10px] text-slate-300 font-mono block">{streamConfig.bitrate.max} kbps</span>
          </div>
        </div>
      </div>

      {/* Video Codec */}
      <div>
        <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
          <Cpu className="w-3 h-3 inline mr-1" />Video Codec
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {CODEC_OPTIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => onStreamConfigChange?.({ codec: c.value as any })}
              className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                streamConfig.codec === c.value
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
              }`}
            >
              <span className={`text-[10px] font-bold ${streamConfig.codec === c.value ? "text-cyan-400" : "text-slate-300"}`}>{c.label}</span>
              <span className="text-[8px] text-slate-500 block">{c.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Toggle */}
      <button onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
        <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        Advanced Settings
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-2 pl-2 border-l-2 border-slate-700">
          {/* Audio Codec */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Audio Codec</label>
            <div className="flex gap-1.5">
              {AUDIO_CODEC_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onStreamConfigChange?.({ audioCodec: c.value as any })}
                  className={`flex-1 px-2 py-1.5 rounded-lg border text-left transition-all ${
                    streamConfig.audioCodec === c.value
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <span className={`text-[10px] font-bold ${streamConfig.audioCodec === c.value ? "text-cyan-400" : "text-slate-300"}`}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Bitrate */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Audio Bitrate</label>
            <div className="flex gap-1">
              {[64, 96, 128, 192].map((br) => (
                <button
                  key={br}
                  onClick={() => onStreamConfigChange?.({ audioBitrate: br })}
                  className={`flex-1 px-2 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                    streamConfig.audioBitrate === br
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {br}k
                </button>
              ))}
            </div>
          </div>

          {/* Keyframe Interval */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Keyframe Interval</label>
            <div className="flex gap-1">
              {[30, 48, 60, 120].map((ki) => (
                <button
                  key={ki}
                  onClick={() => onStreamConfigChange?.({ keyframeInterval: ki })}
                  className={`flex-1 px-2 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                    streamConfig.keyframeInterval === ki
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {ki}f
                </button>
              ))}
            </div>
          </div>

          {/* Profile */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">H.264 Profile</label>
            <div className="flex gap-1.5">
              {(["baseline", "main", "high"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onStreamConfigChange?.({ profile: p })}
                  className={`flex-1 px-2 py-1.5 rounded-lg border text-[10px] font-medium capitalize transition-all ${
                    streamConfig.profile === p
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Hardware Acceleration */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
              <Settings2 className="w-3 h-3 inline mr-1" />Hardware Accel
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(["software", "nvenc", "amf", "videotoolbox"] as const).map((hw) => (
                <button
                  key={hw}
                  onClick={() => onStreamConfigChange?.({ hardwareAccel: hw })}
                  className={`px-2 py-1.5 rounded-lg border text-[9px] font-medium capitalize transition-all ${
                    streamConfig.hardwareAccel === hw
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {hw === "videotoolbox" ? "VToolbox" : hw.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Panel
// ============================================

type Tab = "audio" | "video";

export function VideoAudioPanel({
  darkMode,
  isOpen,
  onClose,
  sources, masterVolume, masterMuted,
  onSetSourceVolume, onSetSourcePan, onSetSourceMuted, onSetSourceSolo,
  onSetMasterVolume, onSetMasterMuted,
  onEnableNoiseReduction, onAddMicrophone, onAddScreenShareAudio, onRemoveSource,
  streamConfig, onStreamConfigChange, currentQuality, onQualityChange,
}: VideoAudioPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("audio");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, .cursor-pointer")) return;
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStartRef.current) return;
    setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed right-4 top-20 z-[60] w-[380px] rounded-2xl border border-border shadow-2xl bg-background/95 backdrop-blur-xl cursor-move"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-bold text-white">Audio & Video</span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-icons text-slate-400 text-[18px]">close</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("audio")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${
            activeTab === "audio"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          Audio
        </button>
        <button
          onClick={() => setActiveTab("video")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${
            activeTab === "video"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Video
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {activeTab === "audio" ? (
          <AudioTab
            sources={sources}
            masterVolume={masterVolume}
            masterMuted={masterMuted}
            onSetSourceVolume={onSetSourceVolume}
            onSetSourcePan={onSetSourcePan}
            onSetSourceMuted={onSetSourceMuted}
            onSetSourceSolo={onSetSourceSolo}
            onSetMasterVolume={onSetMasterVolume}
            onSetMasterMuted={onSetMasterMuted}
            onEnableNoiseReduction={onEnableNoiseReduction}
            onAddMicrophone={onAddMicrophone}
            onAddScreenShareAudio={onAddScreenShareAudio}
            onRemoveSource={onRemoveSource}
          />
        ) : (
          <VideoTab
            streamConfig={streamConfig}
            onStreamConfigChange={onStreamConfigChange}
            currentQuality={currentQuality}
            onQualityChange={onQualityChange}
          />
        )}
      </div>
    </div>
  );
}
