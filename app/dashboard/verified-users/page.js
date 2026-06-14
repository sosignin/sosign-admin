"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifiedUsersRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/users");
    }, [router]);

    return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-100 border-t-teal-600"></div>
                <p className="text-gray-500 font-medium">Redirecting to User Management...</p>
            </div>
        </div>
    );
}
