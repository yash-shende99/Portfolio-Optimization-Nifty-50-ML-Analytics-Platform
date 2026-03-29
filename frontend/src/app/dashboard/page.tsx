"use client";

import { useEffect, useState } from "react";
import { Activity, Layers, ShieldAlert, TrendingUp, AlertCircle, ScanLine } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ['#00D4FF', '#F0B942', '#00FF88', '#FF4560', '#7B61FF', '#FF8C00', '#00E5CC', '#FF6B9D', '#4ADE80', '#818CF8'];

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
                    style={{ ...cardBase, padding: "1.25rem 1.5rem" }}
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
                            ₹{(profile?.monthly_savings || 20000).toLocaleString()}
                        </span>
                        <span style={kpiSuffix}>/mo</span>
                    </div>
                </div>

                {/* AI Regime */}
                <div
                    style={{ ...cardBase, padding: "1.25rem 1.5rem" }}
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
                            background:
                                regime?.predicted_regime === "Bear"
                                    ? "linear-gradient(90deg, #FF4560, #F0B942)"
                                    : "linear-gradient(90deg, #00FF88, #00D4FF)",
                        }}
                    />
                </div>

                {/* News Sentiment */}
                <div
                    style={{ ...cardBase, padding: "1.25rem 1.5rem" }}
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
                    }}
                >
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
                        <div style={{ flex: 1, minHeight: "350px", zIndex: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allocations}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={130}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {allocations.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [`${value}%`, 'Target Weight']}
                                        contentStyle={{
                                            backgroundColor: "rgba(2,5,15,0.95)",
                                            border: "1px solid rgba(0,212,255,0.2)",
                                            borderRadius: "6px",
                                            color: "#E8F4FD",
                                            fontFamily: "'IBM Plex Mono', monospace",
                                            fontSize: "0.72rem",
                                        }}
                                    />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        wrapperStyle={{
                                            fontSize: "11px",
                                            color: "#7A9BB5",
                                            fontFamily: "'IBM Plex Mono', monospace",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
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
                                            transition: "background 0.2s ease",
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
