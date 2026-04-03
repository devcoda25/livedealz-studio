"use client";

import React, { useState, useEffect } from "react";
import { DesktopStudioView } from "./views/DesktopStudioView";
import { MobileStudioView } from "./views/MobileStudioView";
import { Spinner } from "@/components/ui/spinner";

/**
 * Unified Studio Page
 * 
 * Automatically detects device type and renders the appropriate view.
 * Defaults to a loading state on the server to prevent layout shift.
 */
export default function StudioPage() {
    const [deviceType, setDeviceType] = useState<"desktop" | "mobile" | null>(null);

    useEffect(() => {
        const detectDevice = () => {
            // Check screen width and user agent
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
            const isSmallScreen = window.innerWidth < 1024; // Tailwind 'lg' breakpoint

            if (isMobileUA || isSmallScreen) {
                setDeviceType("mobile");
            } else {
                setDeviceType("desktop");
            }
        };

        detectDevice();
        window.addEventListener("resize", detectDevice);
        return () => window.removeEventListener("resize", detectDevice);
    }, []);

    // Server-side and initial client-side loading state
    if (deviceType === null) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6">
                <img
                    src="/assets/logos/evlogovert.png"
                    alt="LiveDealz"
                    className="w-16 h-24 object-contain animate-pulse"
                />
                <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4 text-[#FF5C00]" />
                    <p className="text-slate-400 text-sm">Initializing Studio...</p>
                </div>
            </div>
        );
    }

    return deviceType === "mobile" ? <MobileStudioView /> : <DesktopStudioView />;
}
