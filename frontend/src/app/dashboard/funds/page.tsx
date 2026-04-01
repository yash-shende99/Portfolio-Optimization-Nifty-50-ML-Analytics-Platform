"use client";

import { useEffect, useState } from "react";
import { TrendingUp, ShieldCheck } from "lucide-react";

const MARKET_STATS = [
    { label: "NIFTY 50", value: "22,456.80", change: "+1.24%", positive: true },
    { label: "SENSEX", value: "73,961.30", change: "+0.98%", positive: true },
    { label: "INDIA VIX", value: "14.23", change: "-2.1%", positive: false },
    { label: "USD/INR", value: "83.42", change: "+0.12%", positive: false },
];

export default function FundsPage() {
    const [funds, setFunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Animation states ──
    const [tableVisible, setTableVisible] = useState(false);
    const [barsVisible, setBarsVisible] = useState(false);
    const [chartVisible, setChartVisible] = useState(false);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    useEffect(() => {
        fetch("http://localhost:8000/funds")
            .then(res => res.json())
            .then(data => {
                setFunds(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load funds", err);
                setLoading(false);
            });
    }, []);

    // ── Cascade animation triggers ──
    useEffect(() => {
        if (loading || funds.length === 0) return;
        const t1 = setTimeout(() => setTableVisible(true), 100);
        const t2 = setTimeout(() => setBarsVisible(true), 400);
        const t3 = setTimeout(() => setChartVisible(true), 300);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [loading, funds]);

    const cardBase: React.CSSProperties = {
        background: "rgba(10,22,40,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,212,255,0.12)",
        borderRadius: "12px",
    };

    const thStyle: React.CSSProperties = {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.6rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#3A5470",
        padding: "16px 24px",
        fontWeight: 500,
        textAlign: "left",
    };

    const thRight: React.CSSProperties = { ...thStyle, textAlign: "right" };

    const sortedFunds = [...funds].sort((a, b) => b.score - a.score);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* ── Status Bar ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                    Discover ETFs and mutual funds ranked by volatility and alpha
                </span>
            </div>

            {/* ── Table Container ── */}
            <div
                style={{
                    ...cardBase,
                    overflow: "hidden",
                    opacity: loading ? 1 : tableVisible ? 1 : 0,
                    transform: loading ? "none" : tableVisible ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.6s ease, transform 0.6s ease",
                }}
            >
                {loading ? (
                    <div
                        style={{
                            padding: "3rem",
                            textAlign: "center",
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.7rem",
                            letterSpacing: "0.2em",
                            color: "#3A5470",
                            textTransform: "uppercase",
                        }}
                    >
                        LOADING FUND UNIVERSE...
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr
                                    style={{
                                        background: "rgba(2,5,15,0.7)",
                                        borderBottom: "1px solid rgba(0,212,255,0.1)",
                                    }}
                                >
                                    <th style={thStyle}>Fund Name</th>
                                    <th style={thStyle}>Category</th>
                                    <th style={thRight}>AI Score</th>
                                    <th style={thRight}>Sharpe Ratio</th>
                                    <th style={thRight}>Alpha (%)</th>
                                    <th style={thRight}>Volatility (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedFunds.map((fund, index) => {
                                    const isHovered = hoveredRow === index;
                                    return (
                                        <tr
                                            key={fund.id}
                                            onMouseEnter={() => setHoveredRow(index)}
                                            onMouseLeave={() => setHoveredRow(null)}
                                            style={{
                                                borderBottom: "1px solid rgba(0,212,255,0.04)",
                                                transition: "all 0.15s ease",
                                                opacity: tableVisible ? 1 : 0,
                                                transform: tableVisible ? "translateX(0)" : "translateX(-12px)",
                                                transitionDelay: `${index * 80}ms`,
                                                background: isHovered ? "rgba(0,212,255,0.04)" : "transparent",
                                                borderLeft: isHovered ? "2px solid #00D4FF" : "2px solid transparent",
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: isHovered ? "14px 24px 14px 22px" : "14px 24px",
                                                    fontFamily: "'IBM Plex Mono', monospace",
                                                    fontSize: "0.8rem",
                                                    color: "#E8F4FD",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    transition: "padding 0.15s ease",
                                                }}
                                            >
                                                {fund.score > 90 && <ShieldCheck size={14} style={{ color: "#00FF88" }} />}
                                                {fund.name}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "14px 24px",
                                                    fontFamily: "'Space Grotesk', sans-serif",
                                                    fontSize: "0.8rem",
                                                    color: "#3A5470",
                                                }}
                                            >
                                                {fund.category}
                                            </td>
                                            <td style={{ padding: "14px 24px", textAlign: "right" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                                                    {/* Mini progress bar */}
                                                    <div
                                                        style={{
                                                            width: "60px",
                                                            height: "4px",
                                                            background: "rgba(0,212,255,0.08)",
                                                            borderRadius: "2px",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                height: "100%",
                                                                width: barsVisible ? `${fund.score}%` : "0%",
                                                                transition: `width 1s ease ${index * 80}ms`,
                                                                background: fund.score > 85
                                                                    ? "linear-gradient(90deg, #00FF88, #00D4FF)"
                                                                    : "linear-gradient(90deg, #00D4FF, #7B61FF)",
                                                                borderRadius: "2px",
                                                            }}
                                                        />
                                                    </div>
                                                    {/* Score badge */}
                                                    <span
                                                        style={{
                                                            fontFamily: "'IBM Plex Mono', monospace",
                                                            fontSize: "0.7rem",
                                                            padding: "4px 10px",
                                                            borderRadius: "4px",
                                                            ...(fund.score > 85
                                                                ? {
                                                                      background: "rgba(0,255,136,0.1)",
                                                                      border: "1px solid rgba(0,255,136,0.2)",
                                                                      color: "#00FF88",
                                                                  }
                                                                : {
                                                                      background: "rgba(0,212,255,0.08)",
                                                                      border: "1px solid rgba(0,212,255,0.15)",
                                                                      color: "#00D4FF",
                                                                  }),
                                                        }}
                                                    >
                                                        {fund.score}
                                                    </span>
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "14px 24px",
                                                    textAlign: "right",
                                                    fontFamily: "'IBM Plex Mono', monospace",
                                                    fontSize: "0.78rem",
                                                    color: "#7A9BB5",
                                                }}
                                            >
                                                {fund.sharpe}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "14px 24px",
                                                    textAlign: "right",
                                                    fontFamily: "'IBM Plex Mono', monospace",
                                                    fontSize: "0.78rem",
                                                    color: "#00FF88",
                                                }}
                                            >
                                                +{fund.alpha}%
                                            </td>
                                            <td
                                                style={{
                                                    padding: "14px 24px",
                                                    textAlign: "right",
                                                    fontFamily: "'IBM Plex Mono', monospace",
                                                    fontSize: "0.78rem",
                                                    color: "#3A5470",
                                                }}
                                            >
                                                {fund.volatility}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Bottom Panels (only when data loaded) ── */}
            {!loading && funds.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    {/* ── Left: AI Score Comparison Chart ── */}
                    <div style={{ ...cardBase, padding: "1.5rem" }}>
                        <h4
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "1.2rem",
                                letterSpacing: "0.08em",
                                color: "#E8F4FD",
                                marginBottom: "1.5rem",
                                lineHeight: 1.1,
                            }}
                        >
                            AI Score Comparison
                        </h4>

                        {sortedFunds.map((fund, index) => (
                            <div
                                key={fund.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginBottom: "14px",
                                    opacity: chartVisible ? 1 : 0,
                                    transition: `opacity 0.4s ease ${index * 60}ms`,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.65rem",
                                        color: "#7A9BB5",
                                        width: "140px",
                                        flexShrink: 0,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {fund.name}
                                </span>
                                <div
                                    style={{
                                        flex: 1,
                                        height: "6px",
                                        background: "rgba(0,212,255,0.06)",
                                        borderRadius: "3px",
                                        overflow: "hidden",
                                        position: "relative",
                                    }}
                                >
                                    <div
                                        style={{
                                            height: "100%",
                                            borderRadius: "3px",
                                            width: chartVisible ? `${fund.score}%` : "0%",
                                            transition: `width 1.2s ease ${index * 100}ms`,
                                            background:
                                                fund.score > 85
                                                    ? "linear-gradient(90deg, #00FF88, #00D4FF)"
                                                    : fund.score > 70
                                                    ? "linear-gradient(90deg, #00D4FF, #7B61FF)"
                                                    : "linear-gradient(90deg, #F0B942, #FF8C00)",
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.7rem",
                                        color: "#E8F4FD",
                                        width: "32px",
                                        textAlign: "right",
                                        flexShrink: 0,
                                    }}
                                >
                                    {fund.score}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* ── Right: Market Snapshot ── */}
                    <div style={{ ...cardBase, padding: "1.5rem" }}>
                        <h4
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "1.2rem",
                                letterSpacing: "0.08em",
                                color: "#E8F4FD",
                                marginBottom: "1.5rem",
                                lineHeight: 1.1,
                            }}
                        >
                            Market Snapshot
                        </h4>

                        {MARKET_STATS.map((stat, i) => (
                            <div
                                key={stat.label}
                                style={{
                                    padding: "12px 0",
                                    borderBottom: i < MARKET_STATS.length - 1 ? "1px solid rgba(0,212,255,0.06)" : "none",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    opacity: chartVisible ? 1 : 0,
                                    transform: chartVisible ? "translateY(0)" : "translateY(8px)",
                                    transition: `opacity 0.5s ease ${i * 100}ms, transform 0.5s ease ${i * 100}ms`,
                                }}
                            >
                                <div>
                                    <p
                                        style={{
                                            fontFamily: "'IBM Plex Mono', monospace",
                                            fontSize: "0.6rem",
                                            letterSpacing: "0.15em",
                                            color: "#3A5470",
                                            textTransform: "uppercase",
                                            margin: 0,
                                        }}
                                    >
                                        {stat.label}
                                    </p>
                                    <p
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            fontSize: "1.4rem",
                                            color: "#00D4FF",
                                            lineHeight: 1,
                                            margin: "4px 0 0 0",
                                        }}
                                    >
                                        {stat.value}
                                    </p>
                                </div>
                                <span
                                    style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.65rem",
                                        borderRadius: "4px",
                                        padding: "3px 8px",
                                        background: stat.positive
                                            ? "rgba(0,255,136,0.1)"
                                            : "rgba(255,69,96,0.1)",
                                        border: stat.positive
                                            ? "1px solid rgba(0,255,136,0.2)"
                                            : "1px solid rgba(255,69,96,0.2)",
                                        color: stat.positive ? "#00FF88" : "#FF4560",
                                    }}
                                >
                                    {stat.change}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
