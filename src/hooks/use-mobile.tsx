import { useState, useEffect } from "react"

export type DeviceKind = "mobile" | "desktop";

export function useDeviceKind(): DeviceKind {
  const [kind, setKind] = useState<DeviceKind>("desktop");

  useEffect(() => {
    const detect = () => {
      if (typeof window === "undefined") return;
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const small = window.matchMedia("(max-width: 768px)").matches;
      setKind(uaMobile || small ? "mobile" : "desktop");
    };

    detect();
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  return kind;
}

export function useIsMobile() {
    const kind = useDeviceKind();
    return kind === 'mobile';
}
