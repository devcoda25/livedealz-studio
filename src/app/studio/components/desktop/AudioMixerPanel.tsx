"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AudioSourceConfig } from "@/engines/audio";
import { Volume2, VolumeX, Mic, Monitor, Music, Trash2, Plus, Headphones } from "lucide-react";

interface AudioMixerPanelProps {
  darkMode?: boolean;
  isOpen: boolean;
  onClose: () => void;
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
}

// Audio visualization hook - simulates real audio levels with more realistic patterns
function useAudioLevels(sourceId: string, isActive: boolean) {
  const [level, setLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setLevel(0);
      setPeakLevel(0);
      return;
    }

    // More realistic audio level simulation
    let lastUpdate = Date.now();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdate;
      lastUpdate = now;
      
      // Simulate varying audio levels with some persistence
      const baseLevel = Math.random() * 0.5 + 0.1;
      const talkingSpike = Math.random() > 0.7 ? Math.random() * 0.3 : 0;
      const newLevel = Math.min(baseLevel + talkingSpike, 1);
      
      setLevel(prev => prev * 0.3 + newLevel * 0.7); // Smooth transition
      
      // Peak hold with decay
      if (newLevel > peakLevel) {
        setPeakLevel(newLevel);
      } else if (now - lastUpdate > 500) {
        setPeakLevel(prev => Math.max(0, prev - 0.05));
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [sourceId, isActive, peakLevel]);

  return { level, peakLevel };
}

// Professional Vertical Fader Component
interface FaderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
  color?: string;
  disabled?: boolean;
}

function VerticalFader({ value, onChange, label, showValue = true, color = "bg-cyan-500", disabled = false }: FaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !disabled) {
      updateValue(e);
    }
  }, [isDragging, disabled]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const updateValue = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = 1 - Math.min(Math.max(y / rect.height, 0), 1);
    onChange(percentage);
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

  return (
    <div className="flex flex-col items-center gap-1">
      {showValue && (
        <span className="text-[10px] text-slate-400 font-mono font-semibold">
          {Math.round(value * 100)}%
        </span>
      )}
      <div
        ref={trackRef}
        className={`relative w-10 h-40 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-lg cursor-pointer border border-slate-700 shadow-inner overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onMouseDown={handleMouseDown}
      >
        {/* dB Scale markings */}
        <div className="absolute inset-y-0 left-2 w-px bg-slate-700/50 flex flex-col justify-between py-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-2 h-px bg-slate-600" />
          ))}
        </div>

        {/* Fill gradient */}
        <div
          className={`absolute bottom-0 left-0 right-0 ${color} rounded-b-lg transition-all duration-75`}
          style={{ height: `${fillPercent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Thumb */}
        <div
          className={`absolute left-0 right-0 h-4 bg-gradient-to-b from-white via-slate-100 to-slate-300 rounded shadow-lg border border-slate-400 cursor-grab active:cursor-grabbing z-10 ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{
            top: `calc(${thumbPosition}% - 8px)`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
          }}
        >
          {/* Grip lines */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-center gap-1">
            <div className="w-4 h-0.5 bg-slate-400 rounded" />
          </div>
        </div>
        
        {/* Zero point indicator */}
        <div className="absolute left-0 right-0 h-0.5 bg-red-500/50" style={{ bottom: '0%' }} />
      </div>
      {label && <span className="text-[9px] text-slate-500 font-medium">{label}</span>}
    </div>
  );
}

// Level Meter Component with realistic audio visualization
interface LevelMeterProps {
  level: number;
  peakLevel?: number;
  orientation?: 'vertical' | 'horizontal';
}

function LevelMeter({ level, peakLevel, orientation = 'vertical' }: LevelMeterProps) {
  const segments = 20;
  const activeSegments = Math.floor(level * segments);
  const peakSegment = peakLevel !== undefined ? Math.floor(peakLevel * segments) : -1;
  const [heldPeak, setHeldPeak] = useState(-1);
  
  useEffect(() => {
    if (peakSegment > heldPeak) {
      setHeldPeak(peakSegment);
      const timeout = setTimeout(() => setHeldPeak(-1), 1500);
      return () => clearTimeout(timeout);
    }
  }, [peakSegment, heldPeak]);

  if (orientation === 'horizontal') {
    return (
      <div className="flex gap-0.5 h-4 w-32">
        {[...Array(segments)].map((_, i) => {
          const isActive = i < activeSegments;
          const isPeak = (i === heldPeak && heldPeak >= 0) || i === peakSegment;

          let bgColor = "bg-slate-800";
          if (isActive || isPeak) {
            if (i >= segments - 2) bgColor = "bg-red-500 shadow-red-500/50";
            else if (i >= segments - 5) bgColor = "bg-yellow-500 shadow-yellow-500/50";
            else bgColor = "bg-green-600 dark:bg-green-500 shadow-green-500/50";
          }

          return (
            <div
              key={i}
              className={`h-full flex-1 rounded-sm transition-all duration-75 ${bgColor} ${isActive ? 'shadow-sm' : ''}`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-px h-40 w-4">
      {[...Array(segments)].map((_, i) => {
        const isActive = i < activeSegments;
        const isPeak = (i === heldPeak && heldPeak >= 0) || i === peakSegment;

        let bgColor = "bg-slate-800";
        if (isActive || isPeak) {
          if (i >= segments - 3) bgColor = "bg-red-500 shadow-red-500/50";
          else if (i >= segments - 7) bgColor = "bg-yellow-500 shadow-yellow-500/50";
          else bgColor = "bg-green-600 dark:bg-green-500 shadow-green-500/50";
        }

        return (
          <div
            key={i}
            className={`h-1.5 w-full rounded-sm transition-all duration-75 ${bgColor} ${isActive ? 'shadow-sm' : ''}`}
          />
        );
      })}
    </div>
  );
}

// Pan Knob Component
interface PanKnobProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function PanKnob({ value, onChange, disabled = false }: PanKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
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
      const change = delta / 100;
      const newValue = Math.max(-1, Math.min(1, startValue.current + change));
      onChange(newValue);
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

  const rotation = value * 135; // -135 to 135 degrees

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[8px] text-slate-500 uppercase tracking-wider">Pan</span>
      <div
        ref={knobRef}
        className={`w-8 h-8 rounded-full bg-gradient-to-b from-slate-600 to-slate-800 border border-slate-500 cursor-pointer relative ${disabled ? 'opacity-50' : ''}`}
        style={{ transform: `rotate(${rotation}deg)` }}
        onMouseDown={handleMouseDown}
      >
        {/* Indicator dot */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow" 
             style={{ transform: `rotate(${-rotation}deg)` }} />
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-700 rounded-full" />
      </div>
      <span className="text-[9px] text-slate-400 font-mono">
        {value === 0 ? 'C' : value < 0 ? `L${Math.abs(Math.round(value * 100))}` : `R${Math.round(value * 100)}`}
      </span>
    </div>
  );
}

// Channel Strip Component
interface ChannelStripProps {
  source: AudioSourceConfig;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onNoiseReductionToggle: () => void;
  onRemove: () => void;
}

function ChannelStrip({
  source,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onNoiseReductionToggle,
  onRemove
}: ChannelStripProps) {
  const { level, peakLevel } = useAudioLevels(source.id, !source.muted);
  const isMuted = source.muted;

  const getSourceIcon = () => {
    switch (source.type) {
      case "microphone":
        return <Mic className="w-4 h-4" />;
      case "screenShare":
        return <Monitor className="w-4 h-4" />;
      case "backgroundMusic":
        return <Music className="w-4 h-4" />;
      default:
        return <Volume2 className="w-4 h-4" />;
    }
  };

  const getSourceColor = () => {
    switch (source.type) {
      case "microphone":
        return "text-rose-400";
      case "screenShare":
        return "text-blue-400";
      case "backgroundMusic":
        return "text-emerald-700 dark:text-emerald-400";
      default:
        return "text-cyan-400";
    }
  };

  const getBarColor = () => {
    switch (source.type) {
      case "microphone":
        return "bg-rose-500";
      case "screenShare":
        return "bg-blue-500";
      case "backgroundMusic":
        return "bg-emerald-600 dark:bg-emerald-500";
      default:
        return "bg-cyan-500";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-slate-700 min-w-[100px] shadow-lg">
      {/* Source Header */}
      <div className="flex flex-col items-center gap-2 w-full">
        <div className={`p-2 rounded-lg bg-slate-700/50 ${getSourceColor()}`}>
          {getSourceIcon()}
        </div>
        <span className="text-[11px] text-slate-200 font-semibold truncate max-w-[80px]" title={source.name}>
          {source.name}
        </span>
      </div>

      {/* Level Meter & Fader */}
      <div className="flex gap-3 items-end">
        <LevelMeter level={isMuted ? 0 : level} peakLevel={peakLevel} />
        <VerticalFader
          value={source.volume}
          onChange={onVolumeChange}
          color={isMuted ? "bg-slate-600" : getBarColor()}
          disabled={isMuted}
        />
      </div>

      {/* Pan Control */}
      <PanKnob
        value={source.pan}
        onChange={onPanChange}
        disabled={isMuted}
      />

      {/* Control Buttons */}
      <div className="flex gap-1.5 mt-1">
        <button
          onClick={onMuteToggle}
          className={`w-8 h-7 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
            source.muted
              ? "bg-red-500 text-white"
              : "bg-slate-700 text-slate-400 hover:bg-slate-600"
          }`}
          title={source.muted ? "Unmute" : "Mute"}
        >
          {source.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        
        <button
          onClick={onSoloToggle}
          className={`w-8 h-7 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
            source.solo
              ? "bg-yellow-500 text-black"
              : "bg-slate-700 text-slate-400 hover:bg-slate-600"
          }`}
          title="Solo"
        >
          S
        </button>
      </div>

      {/* Noise Reduction Toggle */}
      <button
        onClick={onNoiseReductionToggle}
        className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${
          source.noiseReductionEnabled
            ? "bg-purple-500/80 text-white"
            : "bg-slate-700/50 text-slate-500 hover:bg-slate-700"
        }`}
        title="Noise Reduction"
      >
        NR
      </button>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="mt-1 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        title="Remove Source"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Master Channel Component
interface MasterChannelProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

function MasterChannel({ volume, muted, onVolumeChange, onMuteToggle }: MasterChannelProps) {
  const { level, peakLevel } = useAudioLevels("master", !muted);

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gradient-to-b from-amber-900/30 to-slate-900 rounded-xl border border-amber-500/30 min-w-[120px] shadow-lg ml-4">
      {/* Master Header */}
      <div className="flex flex-col items-center gap-2">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <Headphones className="w-5 h-5 text-amber-400" />
        </div>
        <span className="text-[12px] text-amber-400 font-bold">MASTER</span>
      </div>

      {/* Level Meter & Fader */}
      <div className="flex gap-3 items-end">
        <LevelMeter level={muted ? 0 : level} peakLevel={peakLevel} />
        <VerticalFader
          value={volume}
          onChange={onVolumeChange}
          color={muted ? "bg-slate-600" : "bg-amber-500"}
          disabled={muted}
        />
      </div>

      {/* Mute Button */}
      <button
        onClick={onMuteToggle}
        className={`w-12 h-8 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
          muted
            ? "bg-red-500 text-white"
            : "bg-amber-600 text-white hover:bg-amber-500"
        }`}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : "MUTE"}
      </button>
    </div>
  );
}

// Main Audio Mixer Panel
export function AudioMixerPanel({
  isOpen,
  onClose,
  sources,
  masterVolume,
  masterMuted,
  onSetSourceVolume,
  onSetSourcePan,
  onSetSourceMuted,
  onSetSourceSolo,
  onSetMasterVolume,
  onSetMasterMuted,
  onEnableNoiseReduction,
  onAddMicrophone,
  onAddScreenShareAudio,
  onRemoveSource
}: AudioMixerPanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isAddingSource, setIsAddingSource] = useState(false);
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
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleAddMicrophone = async () => {
    setIsAddingSource(true);
    await onAddMicrophone();
    setIsAddingSource(false);
  };

  const handleAddScreenShare = async () => {
    setIsAddingSource(true);
    await onAddScreenShareAudio();
    setIsAddingSource(false);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed right-4 top-20 z-[60] w-auto rounded-2xl border border-border shadow-2xl bg-background/95 backdrop-blur-xl cursor-move"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20">
            <Volume2 className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-bold text-white">Audio Mixer</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-full transition-colors"
        >
          <span className="material-icons text-slate-400 text-[18px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Add Source Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleAddMicrophone}
            disabled={isAddingSource}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-medium text-slate-300 transition-colors border border-slate-700"
          >
            <Mic className="w-3.5 h-3.5" />
            Add Mic
          </button>
          <button
            onClick={handleAddScreenShare}
            disabled={isAddingSource}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-medium text-slate-300 transition-colors border border-slate-700"
          >
            <Monitor className="w-3.5 h-3.5" />
            Add Screen
          </button>
        </div>

        {/* Channels */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sources.map((source) => (
            <ChannelStrip
              key={source.id}
              source={source}
              onVolumeChange={(vol) => onSetSourceVolume(source.id, vol)}
              onPanChange={(pan) => onSetSourcePan(source.id, pan)}
              onMuteToggle={() => onSetSourceMuted(source.id, !source.muted)}
              onSoloToggle={() => onSetSourceSolo(source.id, !source.solo)}
              onNoiseReductionToggle={() => onEnableNoiseReduction(source.id, !source.noiseReductionEnabled)}
              onRemove={() => onRemoveSource(source.id)}
            />
          ))}

          {/* Master Channel */}
          <MasterChannel
            volume={masterVolume}
            muted={masterMuted}
            onVolumeChange={onSetMasterVolume}
            onMuteToggle={() => onSetMasterMuted(!masterMuted)}
          />
        </div>

        {sources.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-[12px]">No audio sources</p>
            <p className="text-[10px] mt-1">Add a microphone or screen share to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
