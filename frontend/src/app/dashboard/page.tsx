"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Activity, Layers, ShieldAlert, TrendingUp, AlertCircle, ScanLine } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";

const COLORS = ['#00D4FF', '#F0B942', '#00FF88', '#7B61FF', '#FF6B9D', '#00E5CC', '#FF8C00', '#4ADE80', '#818CF8', '#FF4560'];

const TICKER_DATA = [
    { name: "RELIANCE", value: "+1.2%", positive: true },
    { name: "TCS", value: "-0.4%", positive: false },
    { name: "INFY", value: "+0.8%", positive: true },
    { name: "HDFC", value: "+2.1%", positive: true },
    { name: "ICICI", value: "+0.3%", positive: true },
    { name: "WIPRO", value: "-1.1%", positive: false },
    { name: "MARUTI", value: "+1.7%", positive: true },
    { name: "ITC", value: "+0.5%", positive: true },
    { name: "ADANIENT", value: "+3.2%", positive: true },
    { name: "CIPLA", value: "-0.2%", positive: false },
    { name: "HINDUNILVR", value: "+0.9%", positive: true },
    { name: "BAJFINANCE", value: "+1.4%", positive: true },
];

export default function DashboardPage() {
    const [profile, setProfile] = useState<any>(null);
    const [regime, setRegime] = useState<any>(null);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [explanations, setExplanations] = useState<any[]>([]);
    const [allExplanations, setAllExplanations] = useState<any[]>([]);
    const [sentimentStr, setSentimentStr] = useState("Neutral");
    const [sentimentColor, setSentimentColor] = useState("text-zinc-400");
    const [customAnalysis, setCustomAnalysis] = useState<any>(null);
    const [loadingAlloc, setLoadingAlloc] = useState(true);
    const [loadingXAI, setLoadingXAI] = useState(true);

    // ── Animation states ──
    const [mounted, setMounted] = useState(false);
    const [displayCapital, setDisplayCapital] = useState(0);
    const [regimeBarWidth, setRegimeBarWidth] = useState(0);
    const [allocationsVisible, setAllocationsVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const capitalAnimated = useRef(false);

    // ── Scrolljack refs ──
    const trackRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const framesRef = useRef<HTMLImageElement[]>([]);
    const frameIndexRef = useRef(0);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const profRes = await fetch("http://localhost:8000/auth/profile", { headers: { Authorization: `Bearer ${token}` } });
                let profData = null;
                if (profRes.ok) {
                    profData = await profRes.json();
                    setProfile(profData);
                }

                const regimeRes = await fetch("http://localhost:8000/regime");
                if (regimeRes.ok) {
                    setRegime(await regimeRes.json());
                }

                // Fetch Portfolio Allocations
                const riskLevel = profData?.risk_tolerance ? profData.risk_tolerance / 10 : 0.5;
                const portRes = await fetch("http://localhost:8000/portfolio", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ risk_tolerance: riskLevel })
                });

                let fetchedAllocations: any[] = [];
                if (portRes.ok) {
                    const portData = await portRes.json();
                    const allocs = portData.allocations;
                    fetchedAllocations = Object.keys(allocs)
                        .map(ticker => ({ name: ticker.replace('.NS', ''), value: Number((allocs[ticker] * 100).toFixed(2)) }))
                        .filter(item => item.value > 0)
                        .sort((a, b) => b.value - a.value);

                    setAllocations(fetchedAllocations);
                }

                // Fetch XAI Explanations
                const expRes = await fetch("http://localhost:8000/explain");
                if (expRes.ok) {
                    const expData = await expRes.json();
                    // Filter explanations to only show stocks the user actually holds
                    const allocatedTickers = fetchedAllocations ? fetchedAllocations.map((item: any) => item.name) : [];
                    const relevantExplanations = expData.filter((exp: any) =>
                        allocatedTickers.includes(exp.ticker.replace('.NS', ''))
                    );
                    setExplanations(relevantExplanations.slice(0, 3));
                    setAllExplanations(relevantExplanations);
                }

                // Fetch News Sentiment
                const sentRes = await fetch("http://localhost:8000/sentiment");
                if (sentRes.ok) {
                    const sentData = await sentRes.json();
                    if (sentData.length > 0) {
                        const avgSent = sentData.reduce((acc: number, curr: any) => acc + curr.sentiment_score, 0) / sentData.length;
                        if (avgSent > 0.2) {
                            setSentimentStr("Bullish");
                            setSentimentColor("text-emerald-400");
                        } else if (avgSent < -0.2) {
                            setSentimentStr("Bearish");
                            setSentimentColor("text-red-400");
                        } else {
                            setSentimentStr("Neutral");
                            setSentimentColor("text-zinc-400");
                        }
                    }
                }

                // Check LocalStorage for Custom Portfolio Analysis
                const savedAnalysis = localStorage.getItem("portfolioAnalysis");
                if (savedAnalysis) {
                    setCustomAnalysis(JSON.parse(savedAnalysis));
                }

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoadingAlloc(false);
                setLoadingXAI(false);
            }
        };
        fetchDashboardData();
    }, []);

    // ── Count-up animation for Investable Capital ──
    useEffect(() => {
        if (!profile || capitalAnimated.current) return;
        capitalAnimated.current = true;
        const target = profile.monthly_savings || 20000;
        const duration = 1200;
        const startTime = performance.now();

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            setDisplayCapital(Math.round(target * easedProgress));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [profile]);

    // ── Regime bar animation ──
    useEffect(() => {
        if (!regime) return;
        const t = setTimeout(() => setRegimeBarWidth(100), 300);
        return () => clearTimeout(t);
    }, [regime]);

    // ── Table row reveal ──
    useEffect(() => {
        if (allocations.length === 0) return;
        const t = setTimeout(() => setAllocationsVisible(true), 100);
        return () => clearTimeout(t);
    }, [allocations]);

    // ── Scrolljack: Preload frames ──
    useEffect(() => {
        const total = 64;
        const loaded: HTMLImageElement[] = [];
        let count = 0;
        for (let i = 1; i <= total; i++) {
            const img = new Image();
            const n = String(i).padStart(3, '0');
            img.src = `/frames-dashboard/ezgif-frame-${n}.jpg`;
            img.onload = () => {
                count++;
                if (count === total) {
                    framesRef.current = loaded;
                    drawFrame(0);
                }
            };
            loaded.push(img);
        }
    }, []);

    const drawFrame = useCallback((index: number) => {
        const canvas = canvasRef.current;
        const img = framesRef.current[index];
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const scale = Math.max(
            canvas.width / img.naturalWidth,
            canvas.height / img.naturalHeight
        );
        const x = (canvas.width - img.naturalWidth * scale) / 2;
        const y = (canvas.height - img.naturalHeight * scale) / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
        ctx.fillStyle = 'rgba(2,5,15,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const vignette = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.height * 0.2,
            canvas.width / 2, canvas.height / 2, canvas.height * 0.9
        );
        vignette.addColorStop(0, 'rgba(2,5,15,0)');
        vignette.addColorStop(1, 'rgba(2,5,15,0.85)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    // ── Scrolljack: Scroll listener ──
    useEffect(() => {
        const handleScroll = () => {
            const track = trackRef.current;
            if (!track || !framesRef.current.length) return;

            const rect = track.getBoundingClientRect();
            const trackH = track.offsetHeight - window.innerHeight;
            const scrolled = -rect.top;

            if (scrolled < 0 || scrolled > track.offsetHeight) return;

            const progress = Math.max(0, Math.min(1, scrolled / trackH));
            const idx = Math.min(63, Math.floor(progress * 63));

            if (idx !== frameIndexRef.current) {
                frameIndexRef.current = idx;
                drawFrame(idx);
            }
        };

        // Try ALL possible scroll containers
        const containers = [
            document.querySelector('main'),
            document.querySelector('[class*="overflow"]'),
            document.querySelector('[style*="overflow"]'),
            document.querySelector('[style*="overflow-y"]'),
            document.documentElement,
            document.body,
        ].filter(Boolean) as HTMLElement[];

        containers.forEach(el =>
            el.addEventListener('scroll', handleScroll, { passive: true })
        );
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Also fire on RAF for sticky scroll
        let rafId: number;
        let lastScroll = 0;
        const rafCheck = () => {
            const main = document.querySelector('main');
            if (main && main.scrollTop !== lastScroll) {
                lastScroll = main.scrollTop;
                handleScroll();
            }
            rafId = requestAnimationFrame(rafCheck);
        };
        rafId = requestAnimationFrame(rafCheck);

        return () => {
            containers.forEach(el =>
                el.removeEventListener('scroll', handleScroll)
            );
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    // ── Derived values ──
    const regimeColor = (() => {
        const r = regime?.predicted_regime;
        if (r === "Bull") return "#F0B942";
        if (r === "Bear") return "#FF4560";
        return "#7A9BB5";
    })();

    const sentColor = (() => {
        if (sentimentStr === "Bullish") return "#00FF88";
        if (sentimentStr === "Bearish") return "#FF4560";
        return "#7A9BB5";
    })();

    // ── Style helpers ──
    const cardBase: React.CSSProperties = {
        background: "rgba(10,22,40,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,212,255,0.12)",
        borderRadius: "12px",
        transition: "all 0.3s ease",
    };

    const sectionTitle: React.CSSProperties = {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "1.3rem",
        letterSpacing: "0.08em",
        color: "#E8F4FD",
        lineHeight: 1.1,
    };

    const cyanBadge: React.CSSProperties = {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.6rem",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        background: "rgba(0,212,255,0.08)",
        border: "1px solid rgba(0,212,255,0.15)",
        color: "#00D4FF",
        borderRadius: "4px",
        padding: "3px 10px",
    };

    const goldBadge: React.CSSProperties = {
        ...cyanBadge,
        background: "rgba(240,185,66,0.08)",
        border: "1px solid rgba(240,185,66,0.2)",
        color: "#F0B942",
    };

    const kpiLabel: React.CSSProperties = {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.6rem",
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "#3A5470",
    };

    const kpiValue: React.CSSProperties = {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "2.2rem",
        letterSpacing: "0.05em",
        lineHeight: 1,
    };

    const kpiSuffix: React.CSSProperties = {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "0.8rem",
        color: "#3A5470",
        marginLeft: "6px",
    };

    const kpiCardEntrance = (delay: number): React.CSSProperties => ({
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    });

    const tickerItemStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* ── Status Bar ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0rem" }}>
                <span
                    className="pulse-dot"
                    style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#00FF88",
                        boxShadow: "0 0 8px rgba(0,255,136,0.8)",
                        flexShrink: 0,
                    }}
                />
                <span
                    style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.65rem",
                        letterSpacing: "0.15em",
                        color: "#3A5470",
                        textTransform: "uppercase",
                    }}
                >
                    AI-driven real-time portfolio topology and market regime.
                </span>
            </div>

            {/* ── KPI Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                {/* Investable Capital */}
                <div
                    style={{ ...cardBase, padding: "1.25rem 1.5rem", ...kpiCardEntrance(0) }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.3)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(0,212,255,0.08)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.12)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={kpiLabel}>Investable Capital</span>
                        <Activity size={14} style={{ color: "#3A5470" }} />
                    </div>
                    <div style={{ height: "1px", background: "rgba(0,212,255,0.06)", margin: "0.75rem 0" }} />
                    <div>
                        <span style={{ ...kpiValue, color: "#E8F4FD" }}>
                            ₹{displayCapital.toLocaleString()}
                        </span>
                        <span style={kpiSuffix}>/mo</span>
                    </div>
                </div>

                {/* AI Regime */}
                <div
                    style={{ ...cardBase, padding: "1.25rem 1.5rem", ...kpiCardEntrance(100) }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.3)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(0,212,255,0.08)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.12)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={kpiLabel}>AI Regime</span>
                        <ShieldAlert size={14} style={{ color: "#3A5470" }} />
                    </div>
                    <div style={{ height: "1px", background: "rgba(0,212,255,0.06)", margin: "0.75rem 0" }} />
                    <div>
                        <span style={{ ...kpiValue, color: regimeColor }}>
                            {regime?.predicted_regime || "Bull"}
                        </span>
                        <span style={kpiSuffix}>Market</span>
                    </div>
                    <div
                        style={{
                            height: "2px",
                            borderRadius: "1px",
                            marginTop: "0.75rem",
                            width: `${regimeBarWidth}%`,
                            transition: "width 1.5s ease",
                            background:
                                regime?.predicted_regime === "Bear"
                                    ? "linear-gradient(90deg, #FF4560, #F0B942)"
                                    : "linear-gradient(90deg, #00FF88, #00D4FF)",
                        }}
                    />
                </div>

                {/* News Sentiment */}
                <div
                    style={{ ...cardBase, padding: "1.25rem 1.5rem", ...kpiCardEntrance(200) }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.3)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(0,212,255,0.08)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.12)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={kpiLabel}>News Sentiment</span>
                        <TrendingUp size={14} style={{ color: "#3A5470" }} />
                    </div>
                    <div style={{ height: "1px", background: "rgba(0,212,255,0.06)", margin: "0.75rem 0" }} />
                    <div>
                        <span style={{ ...kpiValue, color: sentColor }}>
                            {sentimentStr}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Live Ticker Strip ── */}
            <div
                style={{
                    overflow: "hidden",
                    height: "32px",
                    background: "rgba(2,5,15,0.6)",
                    border: "1px solid rgba(0,212,255,0.08)",
                    borderRadius: "6px",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        gap: "48px",
                        animation: "tickerScroll 25s linear infinite",
                        whiteSpace: "nowrap",
                        padding: "0 24px",
                    }}
                >
                    {[...TICKER_DATA, ...TICKER_DATA].map((item, i) => (
                        <span key={i} style={tickerItemStyle}>
                            <span style={{ color: "#7A9BB5" }}>{item.name}</span>
                            <span style={{ color: item.positive ? "#00FF88" : "#FF4560" }}>{item.value}</span>
                            {i < TICKER_DATA.length * 2 - 1 && (
                                <span style={{ color: "#1A3550", marginLeft: "4px" }}>·</span>
                            )}
                        </span>
                    ))}
                </div>
            </div>

            {/* ══════════ SCROLLJACK SECTION ══════════ */}
            <div
                ref={trackRef}
                style={{ height: '250vh', position: 'relative' }}
            >
                <div style={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                    borderRadius: '0',
                }}>
                    {/* CANVAS */}
                    <canvas ref={canvasRef} style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                    }} />

                    {/* TOP FADE IN */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '30vh',
                        background: 'linear-gradient(to bottom, #02050F 0%, transparent 100%)',
                        zIndex: 20,
                        pointerEvents: 'none',
                    }} />

                    {/* BOTTOM FADE OUT */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        height: '30vh',
                        background: 'linear-gradient(to top, #02050F 0%, transparent 100%)',
                        zIndex: 20,
                        pointerEvents: 'none',
                    }} />

                    {/* CENTER CONTENT */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        gap: '1rem',
                        pointerEvents: 'none',
                    }}>
                        {/* BADGE */}
                        <div style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.62rem',
                            letterSpacing: '0.3em',
                            color: 'rgba(0,212,255,0.7)',
                            border: '1px solid rgba(0,212,255,0.2)',
                            padding: '5px 18px',
                            borderRadius: '4px',
                            background: 'rgba(2,5,15,0.6)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textTransform: 'uppercase' as const,
                        }}>
                            <span style={{
                                width: 6, height: 6,
                                borderRadius: '50%',
                                background: '#00FF88',
                                boxShadow: '0 0 8px rgba(0,255,136,0.8)',
                                flexShrink: 0,
                            }} />
                            AI MARKET TOPOLOGY ANALYSIS
                        </div>

                        {/* MAIN HEADING */}
                        <div style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(3rem, 7vw, 6rem)',
                            letterSpacing: '0.08em',
                            color: '#E8F4FD',
                            textAlign: 'center',
                            lineHeight: 1,
                            textShadow: '0 0 60px rgba(0,212,255,0.25)',
                        }}>
                            PORTFOLIO INTELLIGENCE
                        </div>

                        {/* SUBTITLE */}
                        <div style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.7rem',
                            letterSpacing: '0.2em',
                            color: 'rgba(122,155,181,0.7)',
                            textTransform: 'uppercase' as const,
                        }}>
                            Neural network analyzing 50 assets in real time
                        </div>

                        {/* STAT PILLS */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginTop: '0.5rem',
                            flexWrap: 'wrap' as const,
                            justifyContent: 'center',
                        }}>
                            {[
                                { label: 'REGIME', value: regime?.predicted_regime || 'BULL', color: '#F0B942' },
                                { label: 'RETURN', value: '1.57%', color: '#00FF88' },
                                { label: 'HEALTH', value: '70 / 100', color: '#00D4FF' },
                            ].map((s) => (
                                <div key={s.label} style={{
                                    background: 'rgba(2,5,15,0.75)',
                                    border: `1px solid ${s.color}25`,
                                    borderTop: `1px solid ${s.color}60`,
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    textAlign: 'center',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    minWidth: '120px',
                                }}>
                                    <div style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: '0.55rem',
                                        letterSpacing: '0.25em',
                                        color: 'rgba(122,155,181,0.5)',
                                        textTransform: 'uppercase' as const,
                                        marginBottom: '6px',
                                    }}>
                                        {s.label}
                                    </div>
                                    <div style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: '1.6rem',
                                        letterSpacing: '0.05em',
                                        color: s.color,
                                        lineHeight: 1,
                                    }}>
                                        {s.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SCROLL HINT */}
                        <div style={{
                            position: 'absolute',
                            bottom: '4rem',
                            display: 'flex',
                            flexDirection: 'column' as const,
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <div style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.55rem',
                                letterSpacing: '0.25em',
                                color: 'rgba(58,84,112,0.6)',
                                textTransform: 'uppercase' as const,
                            }}>
                                SCROLL TO CONTINUE
                            </div>
                            <div style={{
                                width: '1px',
                                height: '32px',
                                background: 'linear-gradient(180deg, rgba(0,212,255,0.5), transparent)',
                            }} />
                        </div>
                    </div>

                    {/* WATERMARK COVER */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0, right: 0,
                        width: '80px', height: '30px',
                        background: '#02050F',
                        zIndex: 30,
                    }} />
                </div>
            </div>

            {/* CYAN GOLD SEAM LINE */}
            <div style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), rgba(240,185,66,0.3), transparent)',
                margin: '0 0 2rem 0',
            }} />

            {/* ── Allocation Chart + XAI Panel ── */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
                {/* Allocation Chart */}
                <div
                    style={{
                        ...cardBase,
                        padding: "1.5rem",
                        minHeight: "420px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        borderTop: "1px solid rgba(0,212,255,0.3)",
                    }}
                >
                    {/* Top accent glow line */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "1px",
                            background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.6), rgba(240,185,66,0.4), transparent)",
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", zIndex: 1 }}>
                        <span style={sectionTitle}>Current Target Allocation</span>
                        <span style={cyanBadge}>LIVE WEIGHTS</span>
                    </div>

                    {loadingAlloc ? (
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "12px",
                                zIndex: 1,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: "0.7rem",
                                    letterSpacing: "0.2em",
                                    textTransform: "uppercase",
                                    color: "#3A5470",
                                }}
                            >
                                GENERATING OPTIMAL WEIGHTS...
                            </span>
                            <div
                                style={{
                                    width: "200px",
                                    height: "2px",
                                    background: "linear-gradient(90deg, transparent, #00D4FF, transparent)",
                                    backgroundSize: "200% 100%",
                                    animation: "shimmer 1.5s infinite",
                                    borderRadius: "1px",
                                }}
                            />
                        </div>
                    ) : allocations.length > 0 ? (
                        <div
                            style={{
                                flex: 1,
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "1rem",
                                zIndex: 1,
                                opacity: allocations.length > 0 ? 1 : 0,
                                transform: allocations.length > 0 ? "scale(1) rotate(0deg)" : "scale(0.8) rotate(-20deg)",
                                transition: "opacity 0.8s ease, transform 0.8s ease",
                            }}
                        >
                            {/* Chart with center label */}
                            <div style={{ position: "relative", minHeight: "350px" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <defs>
                                            <filter id="glow">
                                                <feGaussianBlur stdDeviation="3" result="blur" />
                                                <feMerge>
                                                    <feMergeNode in="blur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        <Pie
                                            data={allocations}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={85}
                                            outerRadius={140}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                            strokeWidth={0}
                                            startAngle={90}
                                            endAngle={-270}
                                            isAnimationActive={true}
                                            animationBegin={200}
                                            animationDuration={1000}
                                            activeIndex={activeIndex ?? undefined}
                                            onMouseEnter={(_, index) => setActiveIndex(index)}
                                            onMouseLeave={() => setActiveIndex(null)}
                                            activeShape={(props: any) => {
                                                const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                                                return (
                                                    <g>
                                                        <Sector
                                                            cx={cx}
                                                            cy={cy}
                                                            innerRadius={innerRadius - 4}
                                                            outerRadius={outerRadius + 8}
                                                            startAngle={startAngle}
                                                            endAngle={endAngle}
                                                            fill={fill}
                                                            opacity={0.95}
                                                            filter="url(#glow)"
                                                        />
                                                    </g>
                                                );
                                            }}
                                        >
                                            {allocations.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }: any) => {
                                                if (active && payload?.length) {
                                                    return (
                                                        <div
                                                            style={{
                                                                background: "rgba(2,5,15,0.95)",
                                                                border: "1px solid rgba(0,212,255,0.25)",
                                                                borderRadius: "8px",
                                                                padding: "10px 14px",
                                                                fontFamily: "'IBM Plex Mono', monospace",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize: "0.7rem",
                                                                    letterSpacing: "0.15em",
                                                                    color: "#00D4FF",
                                                                    marginBottom: "4px",
                                                                }}
                                                            >
                                                                {payload[0].name}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: "1.1rem",
                                                                    color: "#E8F4FD",
                                                                    fontFamily: "'Bebas Neue', sans-serif",
                                                                    letterSpacing: "0.05em",
                                                                }}
                                                            >
                                                                {payload[0].value}%
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center label */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        textAlign: "center",
                                        pointerEvents: "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            fontSize: "2.5rem",
                                            color: "#00D4FF",
                                            lineHeight: 1,
                                        }}
                                    >
                                        {allocations.length}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "'IBM Plex Mono', monospace",
                                            fontSize: "0.55rem",
                                            letterSpacing: "0.25em",
                                            color: "#3A5470",
                                            textTransform: "uppercase",
                                            marginTop: "2px",
                                        }}
                                    >
                                        HOLDINGS
                                    </div>
                                </div>
                            </div>

                            {/* Custom Legend */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0px",
                                    justifyContent: "center",
                                    paddingLeft: "0.5rem",
                                    overflowY: "auto",
                                    maxHeight: "350px",
                                }}
                            >
                                {allocations.map((entry, index) => (
                                    <div
                                        key={`legend-${index}`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "12px",
                                            padding: "6px 0",
                                            borderBottom: index < allocations.length - 1 ? "1px solid rgba(0,212,255,0.04)" : "none",
                                            opacity: activeIndex !== null && activeIndex !== index ? 0.4 : 1,
                                            transition: "opacity 0.2s ease",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "2px",
                                                    background: COLORS[index % COLORS.length],
                                                    boxShadow: `0 0 6px ${COLORS[index % COLORS.length]}60`,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontFamily: "'IBM Plex Mono', monospace",
                                                    fontSize: "0.7rem",
                                                    color: "#7A9BB5",
                                                    letterSpacing: "0.08em",
                                                }}
                                            >
                                                {entry.name}
                                            </span>
                                        </div>
                                        <span
                                            style={{
                                                fontFamily: "'IBM Plex Mono', monospace",
                                                fontSize: "0.7rem",
                                                color: "#E8F4FD",
                                                fontWeight: 500,
                                            }}
                                        >
                                            {entry.value}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "12px",
                                zIndex: 1,
                            }}
                        >
                            <AlertCircle size={40} style={{ color: "#1A3550" }} />
                            <span
                                style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: "0.7rem",
                                    letterSpacing: "0.15em",
                                    color: "#3A5470",
                                    textTransform: "uppercase",
                                }}
                            >
                                No valid portfolio weights found for current risk profile.
                            </span>
                        </div>
                    )}

                    {/* Subtle gradient overlay */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(135deg, rgba(0,212,255,0.02) 0%, rgba(123,97,255,0.02) 100%)",
                            pointerEvents: "none",
                            borderRadius: "12px",
                        }}
                    />
                </div>

                {/* XAI Explainer */}
                <div style={{ ...cardBase, padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <span style={sectionTitle}>AI Explainer (XAI)</span>
                        <span style={goldBadge}>SHAP VALUES</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {loadingXAI ? (
                            <span
                                style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: "0.65rem",
                                    color: "#3A5470",
                                    letterSpacing: "0.2em",
                                    textTransform: "uppercase",
                                }}
                            >
                                COMPUTING ATTRIBUTIONS...
                            </span>
                        ) : explanations.length > 0 ? (
                            explanations.map((exp: any, i: number) => (
                                <div
                                    key={i}
                                    style={{
                                        background: "rgba(2,5,15,0.6)",
                                        border: "1px solid rgba(0,212,255,0.1)",
                                        borderRadius: "8px",
                                        padding: "12px",
                                        borderLeft: "2px solid #00D4FF",
                                        opacity: explanations.length > 0 ? 1 : 0,
                                        transform: explanations.length > 0 ? "translateX(0)" : "translateX(20px)",
                                        transition: "opacity 0.5s ease, transform 0.5s ease",
                                        transitionDelay: `${i * 150}ms`,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'IBM Plex Mono', monospace",
                                            fontSize: "0.7rem",
                                            letterSpacing: "0.15em",
                                            color: "#00D4FF",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {exp.ticker}
                                    </span>
                                    <p
                                        style={{
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            fontSize: "0.8rem",
                                            color: "#7A9BB5",
                                            marginTop: "4px",
                                            lineHeight: 1.5,
                                            margin: "4px 0 0 0",
                                        }}
                                    >
                                        {exp.justification}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <span
                                style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: "0.7rem",
                                    color: "#3A5470",
                                }}
                            >
                                No explanations available.
                            </span>
                        )}

                        {regime && regime.predicted_regime === "Bear" && (
                            <div
                                style={{
                                    background: "rgba(255,69,96,0.05)",
                                    border: "1px solid rgba(255,69,96,0.15)",
                                    borderRadius: "8px",
                                    padding: "12px",
                                    borderLeft: "2px solid #FF4560",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.7rem",
                                        letterSpacing: "0.15em",
                                        color: "#FF4560",
                                        fontWeight: 600,
                                    }}
                                >
                                    RL BANDIT
                                </span>
                                <p
                                    style={{
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: "0.8rem",
                                        color: "#7A9BB5",
                                        marginTop: "4px",
                                        lineHeight: 1.5,
                                        margin: "4px 0 0 0",
                                    }}
                                >
                                    Risk tolerance dynamically shifted downward to offset high Bear regime probabilities ({Math.round((regime.bear_prob || 0) * 100)}%).
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── AI Portfolio Doctor ── */}
            {customAnalysis && customAnalysis.recommendations && (
                <div
                    style={{
                        ...cardBase,
                        border: "1px solid rgba(123,97,255,0.2)",
                        padding: "1.5rem",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <ScanLine size={20} style={{ color: "#7B61FF" }} />
                            <span style={sectionTitle}>AI Portfolio Doctor</span>
                        </div>
                        {customAnalysis.health_score !== undefined && (
                            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                                <div style={{ textAlign: "right" }}>
                                    <p
                                        style={{
                                            fontFamily: "'IBM Plex Mono', monospace",
                                            fontSize: "0.55rem",
                                            letterSpacing: "0.25em",
                                            color: "#3A5470",
                                            textTransform: "uppercase",
                                            margin: 0,
                                        }}
                                    >
                                        Expected Return
                                    </p>
                                    <p
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            fontSize: "1.8rem",
                                            color: "#00FF88",
                                            lineHeight: 1,
                                            margin: "4px 0 0 0",
                                        }}
                                    >
                                        {customAnalysis.expected_return}%
                                    </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <p
                                        style={{
                                            fontFamily: "'IBM Plex Mono', monospace",
                                            fontSize: "0.55rem",
                                            letterSpacing: "0.25em",
                                            color: "#3A5470",
                                            textTransform: "uppercase",
                                            margin: 0,
                                        }}
                                    >
                                        Health Score
                                    </p>
                                    <p
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            fontSize: "1.8rem",
                                            color: "#E8F4FD",
                                            lineHeight: 1,
                                            margin: "4px 0 0 0",
                                        }}
                                    >
                                        {customAnalysis.health_score}
                                        <span
                                            style={{
                                                fontFamily: "'Space Grotesk', sans-serif",
                                                fontSize: "0.8rem",
                                                color: "#3A5470",
                                                marginLeft: "4px",
                                            }}
                                        >
                                            / 100
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        {customAnalysis.recommendations.map((rec: string, i: number) => (
                            <div
                                key={i}
                                style={{
                                    background: "rgba(2,5,15,0.5)",
                                    border: "1px solid rgba(123,97,255,0.15)",
                                    borderLeft: "2px solid #7B61FF",
                                    borderRadius: "8px",
                                    padding: "1rem",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                }}
                            >
                                <AlertCircle size={16} style={{ color: "#7B61FF", marginTop: "2px", flexShrink: 0 }} />
                                <span
                                    style={{
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: "0.82rem",
                                        color: "#7A9BB5",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {rec}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Target Stock Details Table ── */}
            <div
                style={{
                    ...cardBase,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "1.25rem 1.5rem",
                        borderBottom: "1px solid rgba(0,212,255,0.08)",
                    }}
                >
                    <h3 style={{ ...sectionTitle, fontSize: "1.2rem" }}>
                        Target Stock Details & ML Explanations
                    </h3>
                    <p
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: "0.78rem",
                            color: "#3A5470",
                            marginTop: "4px",
                        }}
                    >
                        Full breakdown of algorithmic selection and asset sizing.
                    </p>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr
                                style={{
                                    background: "rgba(2,5,15,0.6)",
                                    borderBottom: "1px solid rgba(0,212,255,0.08)",
                                }}
                            >
                                <th
                                    style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.6rem",
                                        letterSpacing: "0.2em",
                                        textTransform: "uppercase",
                                        color: "#3A5470",
                                        padding: "14px 24px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Asset Ticker
                                </th>
                                <th
                                    style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.6rem",
                                        letterSpacing: "0.2em",
                                        textTransform: "uppercase",
                                        color: "#3A5470",
                                        padding: "14px 24px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Target Weight
                                </th>
                                <th
                                    style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.6rem",
                                        letterSpacing: "0.2em",
                                        textTransform: "uppercase",
                                        color: "#3A5470",
                                        padding: "14px 24px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Algorithm Justification (SHAP)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {allocations.map((alloc, idx) => {
                                const exp = allExplanations.find(e => e.ticker.replace('.NS', '') === alloc.name);
                                return (
                                    <tr
                                        key={idx}
                                        style={{
                                            borderBottom: "1px solid rgba(0,212,255,0.05)",
                                            transition: "background 0.2s ease, opacity 0.4s ease, transform 0.4s ease",
                                            transitionDelay: `${idx * 80}ms`,
                                            opacity: allocationsVisible ? 1 : 0,
                                            transform: allocationsVisible ? "translateY(0)" : "translateY(8px)",
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.03)";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.background = "transparent";
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "14px 24px",
                                                fontFamily: "'IBM Plex Mono', monospace",
                                                fontSize: "0.8rem",
                                                color: "#00D4FF",
                                                letterSpacing: "0.1em",
                                            }}
                                        >
                                            {alloc.name}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px 24px",
                                                fontFamily: "'IBM Plex Mono', monospace",
                                                fontSize: "0.8rem",
                                                color: "#00FF88",
                                            }}
                                        >
                                            {alloc.value}%
                                        </td>
                                        <td style={{ padding: "14px 24px" }}>
                                            {exp ? (
                                                <span
                                                    style={{
                                                        fontFamily: "'Space Grotesk', sans-serif",
                                                        fontSize: "0.78rem",
                                                        color: "#7A9BB5",
                                                    }}
                                                >
                                                    {exp.justification}
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        fontFamily: "'IBM Plex Mono', monospace",
                                                        fontSize: "0.7rem",
                                                        color: "#1A3550",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    No attribution data available
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {allocations.length === 0 && (
                        <div
                            style={{
                                padding: "2rem",
                                textAlign: "center",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.7rem",
                                color: "#3A5470",
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                            }}
                        >
                            Pipeline analysis currently unavailable.
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
}
