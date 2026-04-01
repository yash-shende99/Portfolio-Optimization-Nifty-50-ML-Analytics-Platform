"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [tab, setTab] = useState<"login" | "register">("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Profile Stats
    const [age, setAge] = useState(30);
    const [income, setIncome] = useState(100000);
    const [savings, setSavings] = useState(20000);
    const [risk, setRisk] = useState(5);

    // Cinematic State
    const [frameIndex, setFrameIndex] = useState(0);
    const [warping, setWarping] = useState(false);
    const [flashVisible, setFlashVisible] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const framesRef = useRef<HTMLImageElement[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const indexRef = useRef(0);

    const drawFrame = useCallback((idx: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const img = framesRef.current[idx];
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        ctx.scale(dpr, dpr);

        const scale = Math.max(
            window.innerWidth / img.naturalWidth,
            window.innerHeight / img.naturalHeight
        );
        const x = (window.innerWidth - img.naturalWidth * scale) / 2;
        const y = (window.innerHeight - img.naturalHeight * scale) / 2;
        ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
    }, []);

    useEffect(() => {
        let loadedCount = 0;
        const totalFrames = 80;
        let isUnmounted = false;

        for (let i = 1; i <= totalFrames; i++) {
            const img = new Image();
            const paddedIndex = i.toString().padStart(3, "0");
            img.src = `/frames/ezgif-frame-${paddedIndex}.jpg`;
            img.onload = () => {
                if (isUnmounted) return;
                loadedCount++;
                if (loadedCount === totalFrames) {
                    drawFrame(0);
                    startSlowInterval();
                }
            };
            framesRef.current.push(img);
        }

        const handleResize = () => {
            drawFrame(indexRef.current);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            isUnmounted = true;
            if (intervalRef.current) clearInterval(intervalRef.current);
            window.removeEventListener("resize", handleResize);
        };
    }, [drawFrame]);

    useEffect(() => {
        drawFrame(frameIndex);
    }, [frameIndex, drawFrame]);

    const startSlowInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            indexRef.current = (indexRef.current + 1) % 80;
            setFrameIndex(indexRef.current);
        }, 80);
    };

    const triggerWarpSequence = () => {
        setWarping(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            indexRef.current = (indexRef.current + 1) % 80;
            setFrameIndex(indexRef.current);
        }, 16);

        setTimeout(() => {
            setFlashVisible(true);
        }, 1000);

        setTimeout(() => {
            router.push("/dashboard");
        }, 1400);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const formData = new URLSearchParams();
            formData.append("username", username.trim());
            formData.append("password", password.trim());

            const res = await fetch("http://localhost:8000/auth/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
            });

            if (!res.ok) throw new Error("Invalid username or password");

            const data = await res.json();
            localStorage.setItem("token", data.access_token);

            triggerWarpSequence();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const regRes = await fetch("http://localhost:8000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password: password.trim() }),
            });

            if (!regRes.ok) throw new Error("Registration failed. Username may exist.");
            const regData = await regRes.json();
            const token = regData.access_token;
            localStorage.setItem("token", token);

            const profRes = await fetch("http://localhost:8000/auth/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    age: age,
                    income: income,
                    monthly_savings: savings,
                    risk_tolerance: risk,
                    goals: ["Wealth Generation"],
                }),
            });

            if (!profRes.ok) throw new Error("Failed to create profile");

            triggerWarpSequence();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    // ── Inline style objects ──

    const inputStyle: React.CSSProperties = {
        background: "rgba(2,5,15,0.6)",
        border: "1px solid rgba(0,212,255,0.15)",
        color: "#E8F4FD",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "0.9rem",
        borderRadius: "6px",
        padding: "11px 14px",
        width: "100%",
        outline: "none",
        transition: "all 0.2s ease",
        marginTop: "6px",
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.62rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#7A9BB5",
        display: "block",
    };

    const btnLoginStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px",
        background: "linear-gradient(135deg, #00D4FF 0%, #0088AA 100%)",
        color: "#02050F",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        border: "none",
        borderRadius: "6px",
        cursor: loading ? "not-allowed" : "pointer",
        marginTop: "1.25rem",
        transition: "all 0.2s ease",
        opacity: loading ? 0.5 : 1,
    };

    const btnRegisterStyle: React.CSSProperties = {
        ...btnLoginStyle,
        background: "linear-gradient(135deg, #F0B942 0%, #C8901A 100%)",
    };

    const tabBase: React.CSSProperties = {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "8px 0",
        flex: 1,
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        border: "none",
        outline: "none",
    };

    const tabActive: React.CSSProperties = {
        ...tabBase,
        background: "rgba(0,212,255,0.15)",
        color: "#00D4FF",
        border: "1px solid rgba(0,212,255,0.25)",
        borderRadius: "6px",
    };

    const tabInactive: React.CSSProperties = {
        ...tabBase,
        background: "transparent",
        color: "#3A5470",
    };

    return (
        <>
            {/* Canvas Background */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "fixed",
                    inset: 0,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 0,
                    filter: "contrast(1.1) saturate(1.2) brightness(1.05)",
                }}
            />

            {/* Dark Overlay */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 1,
                    background:
                        "linear-gradient(135deg, rgba(2,5,15,0.75) 0%, rgba(2,5,15,0.55) 100%)",
                    pointerEvents: "none",
                }}
            />

            {/* Watermark Cover */}
            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    right: 0,
                    width: "120px",
                    height: "48px",
                    background: "#000000",
                    zIndex: 999,
                }}
            />

            {/* White Flash */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 200,
                    background: "white",
                    opacity: flashVisible ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: "none",
                }}
            />

            {/* Login Form */}
            <div
                style={{
                    position: "relative",
                    zIndex: 10,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: "420px",
                        background: "rgba(2,5,15,0.75)",
                        backdropFilter: "blur(32px)",
                        WebkitBackdropFilter: "blur(32px)",
                        border: "1px solid rgba(0,212,255,0.25)",
                        borderRadius: "16px",
                        padding: "2.5rem 2rem",
                        boxShadow:
                            "0 0 0 1px rgba(0,212,255,0.05), 0 24px 64px rgba(0,0,0,0.7), 0 0 80px rgba(0,212,255,0.06)",
                    }}
                >
                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                marginBottom: "12px",
                            }}
                        >
                            <span
                                style={{
                                    width: "24px",
                                    height: "1px",
                                    background: "rgba(0,212,255,0.4)",
                                }}
                            />
                            <span
                                style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: "0.6rem",
                                    letterSpacing: "0.3em",
                                    color: "#00D4FF",
                                    textTransform: "uppercase",
                                }}
                            >
                                INSTITUTIONAL TERMINAL
                            </span>
                            <span
                                style={{
                                    width: "24px",
                                    height: "1px",
                                    background: "rgba(0,212,255,0.4)",
                                }}
                            />
                        </div>
                        <h1
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "2.8rem",
                                letterSpacing: "0.12em",
                                color: "#E8F4FD",
                                lineHeight: 1,
                                textShadow: "0 0 40px rgba(0,212,255,0.2)",
                                margin: 0,
                            }}
                        >
                            Wealth OS
                        </h1>
                    </div>

                    {/* Tab Switcher */}
                    <div
                        style={{
                            display: "flex",
                            background: "rgba(2,5,15,0.5)",
                            border: "1px solid rgba(0,212,255,0.12)",
                            borderRadius: "8px",
                            padding: "4px",
                            marginBottom: "1.75rem",
                        }}
                    >
                        <button
                            style={tab === "login" ? tabActive : tabInactive}
                            onClick={() => setTab("login")}
                            type="button"
                        >
                            Login
                        </button>
                        <button
                            style={tab === "register" ? tabActive : tabInactive}
                            onClick={() => setTab("register")}
                            type="button"
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            style={{
                                background: "rgba(255,69,96,0.08)",
                                border: "1px solid rgba(255,69,96,0.3)",
                                color: "#FF4560",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.7rem",
                                borderRadius: "6px",
                                padding: "10px 14px",
                                marginBottom: "1rem",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    {tab === "login" ? (
                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: "1.1rem" }}>
                                <label style={labelStyle}>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#00D4FF";
                                        e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(0,212,255,0.15)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: "1.1rem" }}>
                                <label style={labelStyle}>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#00D4FF";
                                        e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(0,212,255,0.15)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                style={btnLoginStyle}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        (e.target as HTMLElement).style.boxShadow = "0 0 32px rgba(0,212,255,0.45)";
                                        (e.target as HTMLElement).style.transform = "translateY(-1px)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLElement).style.boxShadow = "none";
                                    (e.target as HTMLElement).style.transform = "translateY(0)";
                                }}
                            >
                                {loading ? "Authenticating..." : "Sign In"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.1rem" }}>
                                <div>
                                    <label style={labelStyle}>Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        style={inputStyle}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "#00D4FF";
                                            e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "rgba(0,212,255,0.15)";
                                            e.target.style.boxShadow = "none";
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={inputStyle}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "#00D4FF";
                                            e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "rgba(0,212,255,0.15)";
                                            e.target.style.boxShadow = "none";
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Risk Profile Section */}
                            <div
                                style={{
                                    borderTop: "1px solid rgba(0,212,255,0.08)",
                                    paddingTop: "1.25rem",
                                    marginTop: "0.25rem",
                                }}
                            >
                                <h3
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: "1.2rem",
                                        letterSpacing: "0.08em",
                                        color: "#E8F4FD",
                                        marginBottom: "1rem",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    Risk Profile Assessment
                                </h3>

                                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.1rem" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Age</label>
                                        <input
                                            type="number"
                                            value={age}
                                            onChange={(e) => setAge(parseInt(e.target.value))}
                                            style={inputStyle}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "#00D4FF";
                                                e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = "rgba(0,212,255,0.15)";
                                                e.target.style.boxShadow = "none";
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Income (₹)</label>
                                        <input
                                            type="number"
                                            value={income}
                                            onChange={(e) => setIncome(parseInt(e.target.value))}
                                            style={inputStyle}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "#00D4FF";
                                                e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = "rgba(0,212,255,0.15)";
                                                e.target.style.boxShadow = "none";
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: "1.1rem" }}>
                                    <label style={labelStyle}>Target Monthly Savings (₹)</label>
                                    <input
                                        type="number"
                                        value={savings}
                                        onChange={(e) => setSavings(parseInt(e.target.value))}
                                        style={inputStyle}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "#00D4FF";
                                            e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "rgba(0,212,255,0.15)";
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: "1.1rem" }}>
                                    <label style={labelStyle}>Risk Tolerance: {risk}/10</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={risk}
                                        onChange={(e) => setRisk(parseInt(e.target.value))}
                                        style={{
                                            width: "100%",
                                            marginTop: "6px",
                                            accentColor: "#00D4FF",
                                        }}
                                    />
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginTop: "4px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: "'IBM Plex Mono', monospace",
                                                fontSize: "0.6rem",
                                                color: "#3A5470",
                                                letterSpacing: "0.1em",
                                            }}
                                        >
                                            Conservative
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: "'IBM Plex Mono', monospace",
                                                fontSize: "0.6rem",
                                                color: "#3A5470",
                                                letterSpacing: "0.1em",
                                            }}
                                        >
                                            Aggressive
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={btnRegisterStyle}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        (e.target as HTMLElement).style.boxShadow = "0 0 32px rgba(240,185,66,0.45)";
                                        (e.target as HTMLElement).style.transform = "translateY(-1px)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLElement).style.boxShadow = "none";
                                    (e.target as HTMLElement).style.transform = "translateY(0)";
                                }}
                            >
                                {loading ? "Creating Profile..." : "Initialize Portfolio"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
