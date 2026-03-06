"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, PieChart, TrendingUp, Target, LogOut, Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await fetch("http://localhost:8000/auth/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Unauthorized");
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                localStorage.removeItem("token");
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        );
    }

    const navItems = [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { label: "Portfolio Risk", href: "/dashboard/portfolio", icon: <PieChart size={18} /> },
        { label: "Mutual Funds", href: "/dashboard/funds", icon: <TrendingUp size={18} /> },
        { label: "Goal Planner", href: "/dashboard/goals", icon: <Target size={18} /> },
    ];

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
                <div className="p-6 border-b border-zinc-800">
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Wealth OS
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1">Institutional Terminal</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === item.href
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <div className="px-3 py-2 mb-4 bg-zinc-900 rounded-lg border border-zinc-800">
                        <p className="text-xs text-zinc-500">Risk Profile</p>
                        <p className="font-medium text-sm text-zinc-300">Level {profile?.risk_tolerance || 5}/10</p>
                    </div>
                    <button
                        onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500/80 hover:bg-red-500/10 rounded-lg w-full transition-colors"
                    >
                        <LogOut size={18} />
                        Secure Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-zinc-950">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
