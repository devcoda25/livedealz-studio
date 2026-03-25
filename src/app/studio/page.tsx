"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudioPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to desktop version for now
        // Mobile version will be rebuilt after desktop features are complete
        router.replace("/studio/desktop");
    }, [router]);

    return null;
}
