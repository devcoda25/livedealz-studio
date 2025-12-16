import { useState, useEffect } from "react";

export type DeviceKind = "mobile" | "desktop";

export function useDeviceKind(): DeviceKind {
  const [kind, setKind] = useState<DeviceKind>("desktop");

  useEffect(() => {
    const detect = () => {
      if (typeof window === "undefined") return;
      const small = window.matchMedia("(max-width: 767px)").matches;
      setKind(small ? "mobile" : "desktop");
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
