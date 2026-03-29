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
    const [clockTime, setClockTime] = useState("");

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

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setClockTime(
                now.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                    timeZone: "Asia/Kolkata",
                }) + " IST"
            );
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div
                style={{
                    background: "#02050F",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <Loader2
                        size={28}
                        style={{ color: "#00D4FF" }}
                        className="animate-spin"
                    />
                    <span
                        style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.65rem",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            color: "#3A5470",
                        }}
                    >
                        AUTHENTICATING...
                    </span>
                </div>
            </div>
        );
    }

    const navItems = [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "Portfolio Risk", href: "/dashboard/portfolio", icon: <PieChart size={16} /> },
        { label: "Mutual Funds", href: "/dashboard/funds", icon: <TrendingUp size={16} /> },
        { label: "Goal Planner", href: "/dashboard/goals", icon: <Target size={16} /> },
    ];

    const breadcrumbMap: Record<string, string> = {
        "/dashboard": "Command Center",
        "/dashboard/portfolio": "Portfolio Risk",
        "/dashboard/funds": "Fund Universe",
        "/dashboard/goals": "Goal Planner",
    };

    const riskLevel = profile?.risk_tolerance || 5;
    const riskPercent = (riskLevel / 10) * 100;

    const gridBg = {
        backgroundImage:
            "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        backgroundSize: "50px 50px",
    };

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                overflow: "hidden",
                background: "#02050F",
                color: "#E8F4FD",
                fontFamily: "'Space Grotesk', sans-serif",
            }}
        >
            {/* ── Sidebar ── */}
            <aside
                style={{
                    width: "240px",
                    flexShrink: 0,
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(10,22,40,0.95)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderRight: "1px solid rgba(0,212,255,0.12)",
                    position: "relative",
                    zIndex: 10,
                }}
            >
                {/* Sidebar glow line */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "1px",
                        height: "100%",
                        background:
                            "linear-gradient(180deg, transparent, rgba(0,212,255,0.4), transparent)",
                        pointerEvents: "none",
                    }}
                />

                {/* ── Sidebar Header ── */}
                <div
                    style={{
                        padding: "1.5rem 1.25rem",
                        borderBottom: "1px solid rgba(0,212,255,0.08)",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.55rem",
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            color: "#3A5470",
                            display: "block",
                            marginBottom: "8px",
                        }}
                    >
                        INSTITUTIONAL TERMINAL
                    </span>
                    <h1
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: "1.9rem",
                            letterSpacing: "0.15em",
                            lineHeight: 1,
                            color: "#E8F4FD",
                            textShadow: "0 0 30px rgba(0,212,255,0.25)",
                            margin: 0,
                        }}
                    >
                        WEALTH OS
                    </h1>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "10px",
                        }}
                    >
                        <span
                            className="pulse-dot"
                            style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#00FF88",
                                boxShadow: "0 0 6px rgba(0,255,136,0.8)",
                                display: "inline-block",
                            }}
                        />
                        <span
                            style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.6rem",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                color: "#00FF88",
                            }}
                        >
                            MARKET LIVE
                        </span>
                    </div>
                </div>

                {/* ── Nav Section ── */}
                <nav
                    style={{
                        flex: 1,
                        padding: "1rem 0.75rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        overflowY: "auto",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.55rem",
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            color: "#1A3550",
                            paddingLeft: "12px",
                            marginBottom: "8px",
                        }}
                    >
                        NAVIGATION
                    </span>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: isActive ? "10px 12px 10px 10px" : "10px 12px",
                                    borderRadius: "6px",
                                    color: isActive ? "#00D4FF" : "#3A5470",
                                    fontSize: "0.78rem",
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontWeight: 500,
                                    letterSpacing: "0.03em",
                                    transition: "all 0.2s ease",
                                    textDecoration: "none",
                                    border: isActive
                                        ? "1px solid rgba(0,212,255,0.2)"
                                        : "1px solid transparent",
                                    background: isActive
                                        ? "rgba(0,212,255,0.1)"
                                        : "transparent",
                                    boxShadow: isActive
                                        ? "0 0 12px rgba(0,212,255,0.08), inset 0 0 12px rgba(0,212,255,0.04)"
                                        : "none",
                                    borderLeft: isActive
                                        ? "2px solid #00D4FF"
                                        : "2px solid transparent",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.color = "#E8F4FD";
                                        (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.06)";
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.12)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.color = "#3A5470";
                                        (e.currentTarget as HTMLElement).style.background = "transparent";
                                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                                    }
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* ── Sidebar Footer ── */}
                <div
                    style={{
                        padding: "0.75rem",
                        borderTop: "1px solid rgba(0,212,255,0.08)",
                    }}
                >
                    {/* Risk Profile Card */}
                    <div
                        style={{
                            background: "rgba(2,5,15,0.6)",
                            border: "1px solid rgba(0,212,255,0.12)",
                            borderRadius: "8px",
                            padding: "10px 12px",
                            marginBottom: "8px",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.55rem",
                                letterSpacing: "0.25em",
                                color: "#3A5470",
                                textTransform: "uppercase",
                                display: "block",
                            }}
                        >
                            RISK PROFILE
                        </span>
                        <span
                            style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.85rem",
                                color: "#00D4FF",
                                marginTop: "4px",
                                display: "block",
                            }}
                        >
                            LEVEL {riskLevel} / 10
                        </span>
                        {/* Risk bar */}
                        <div
                            style={{
                                height: "3px",
                                background: "rgba(0,212,255,0.1)",
                                borderRadius: "2px",
                                marginTop: "8px",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: `${riskPercent}%`,
                                    height: "100%",
                                    background: "linear-gradient(90deg, #00FF88, #00D4FF)",
                                    borderRadius: "2px",
                                    transition: "width 0.4s ease",
                                }}
                            />
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            router.push("/login");
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            padding: "9px 12px",
                            background: "transparent",
                            border: "1px solid rgba(255,69,96,0.15)",
                            borderRadius: "6px",
                            color: "rgba(255,69,96,0.7)",
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.65rem",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,69,96,0.08)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,96,0.35)";
                            (e.currentTarget as HTMLElement).style.color = "#FF4560";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,96,0.15)";
                            (e.currentTarget as HTMLElement).style.color = "rgba(255,69,96,0.7)";
                        }}
                    >
                        <LogOut size={16} />
                        Secure Logout
                    </button>
                </div>
            </aside>

            {/* ── Right Column (Navbar + Main) ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* ── Top Navbar ── */}
                <div
                    style={{
                        height: "52px",
                        background: "rgba(10,22,40,0.8)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        borderBottom: "1px solid rgba(0,212,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 2.5rem",
                        flexShrink: 0,
                    }}
                >
                    {/* Left: Breadcrumb */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "1.1rem",
                                letterSpacing: "0.1em",
                                color: "#E8F4FD",
                            }}
                        >
                            {breadcrumbMap[pathname] || "Command Center"}
                        </span>
                    </div>

                    {/* Right: Clock + User */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span
                            style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.7rem",
                                color: "#3A5470",
                                letterSpacing: "0.1em",
                            }}
                        >
                            {clockTime}
                        </span>
                        <div
                            style={{
                                background: "rgba(0,212,255,0.08)",
                                border: "1px solid rgba(0,212,255,0.15)",
                                borderRadius: "4px",
                                padding: "4px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.65rem",
                                color: "#00D4FF",
                                letterSpacing: "0.1em",
                            }}
                        >
                            {(profile?.username || "OPERATOR").toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* ── Main Content ── */}
                <main
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        position: "relative",
                        background: "#02050F",
                        ...gridBg,
                    }}
                >
                    <div
                        style={{
                            padding: "2rem 2.5rem",
                            maxWidth: "1400px",
                            margin: "0 auto",
                        }}
                    >
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
