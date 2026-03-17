"use client";

import React, { useState, useRef, useEffect } from "react";

const BUYER_APP_URL = "https://buyerzzz.vercel.app/";

interface BuyerAppShellProps {
  darkMode?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function BuyerAppShell({ darkMode = true, isOpen, onClose }: BuyerAppShellProps) {
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <>
      {/* Non-blocking overlay - just for click handling, no blur */}
      <div 
        className="fixed inset-0 z-[39]"
        onClick={onClose}
      />

      {/* Draggable Mobile App Shell */}
      <div
        ref={dragRef}
        className="fixed z-[90] cursor-move"
        style={{
          left: position.x,
          top: position.y,
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="relative w-[360px] h-[650px] md:h-[700px] rounded-2xl overflow-hidden shadow-2xl transition-shadow"
          style={{
            backgroundColor: darkMode ? "#0f172a" : "#ffffff",
            border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
            boxShadow: isDragging 
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" 
              : "0 20px 40px -10px rgba(0, 0, 0, 0.3)"
          }}
        >
          {/* Draggable Header */}
          <div 
            className="h-12 flex items-center justify-between px-4"
            style={{
              backgroundColor: darkMode ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)",
              borderBottom: darkMode ? "1px solid #334155" : "1px solid #e2e8f0"
            }}
          >
            {/* Drag handle - only this area is draggable */}
            <div 
              className="flex items-center gap-3 flex-1 cursor-move"
            >
              <div 
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: "#f77f00" }}
              >
                BZ
              </div>
              <span 
                className="text-sm font-semibold"
                style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
              >
                Buyerzzz
              </span>
              <span 
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: darkMode ? "#15803d" : "#dcfce7",
                  color: darkMode ? "#4ade80" : "#166534"
                }}
              >
                LIVE
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-500/20 transition-colors z-50"
              style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              <span className="material-icons text-[18px]">close</span>
            </button>
          </div>

          {/* Drag handle indicator */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <div 
              className="w-12 h-1 rounded-full"
              style={{
                backgroundColor: darkMode ? "#475569" : "#cbd5e1"
              }}
            />
          </div>

          {/* Mobile notch simulation */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-36 rounded-b-2xl z-10"
            style={{
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
              borderBottomLeftRadius: "10px",
              borderBottomRightRadius: "10px"
            }}
          >
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-800" />
          </div>

          {/* iframe container */}
          <div className="absolute inset-0 pt-12">
            <iframe
              src={BUYER_APP_URL}
              className="w-full h-full"
              style={{ border: "none" }}
              title="Buyerzzz Mobile App"
              allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
            />
          </div>

          {/* Bottom home indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-6 flex items-center justify-center z-10">
            <div 
              className="w-28 h-1 rounded-full"
              style={{
                backgroundColor: darkMode ? "#475569" : "#cbd5e1"
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
