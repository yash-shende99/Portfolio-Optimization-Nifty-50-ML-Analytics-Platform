"use client";

import { useEffect, useState } from "react";
import { TrendingUp, ShieldCheck } from "lucide-react";

export default function FundsPage() {
    const [funds, setFunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                    background: "rgba(10,22,40,0.8)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(0,212,255,0.12)",
                    borderRadius: "12px",
                    overflow: "hidden",
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
                                {funds.sort((a, b) => b.score - a.score).map((fund) => (
                                    <tr
                                        key={fund.id}
                                        style={{
                                            borderBottom: "1px solid rgba(0,212,255,0.04)",
                                            transition: "all 0.15s ease",
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
                                                color: "#E8F4FD",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
