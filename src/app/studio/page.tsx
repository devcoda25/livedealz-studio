"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudioPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        if (isMobile) {
            router.replace("/studio/mobile");
        } else {
            router.replace("/studio/desktop");
        }
    }, [isMounted, router]);

    return null;
}
