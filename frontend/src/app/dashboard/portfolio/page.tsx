"use client";

import { useState } from "react";
import { PieChart, AlertCircle, ScanLine, ShieldAlert, Zap, Layers, Activity, TrendingUp, HeartPulse } from "lucide-react";

export default function PortfolioPage() {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [holdings, setHoldings] = useState<{ ticker: string; quantity: string; buyPrice: string }[]>([
        { ticker: "TCS.NS", quantity: "15", buyPrice: "3500" },
        { ticker: "RELIANCE.NS", quantity: "20", buyPrice: "2400" }
    ]);

    const handleAddHolding = () => setHoldings([...holdings, { ticker: "", quantity: "", buyPrice: "" }]);
    const handleRemoveHolding = (index: number) => setHoldings(holdings.filter((_, i) => i !== index));
    const handleHoldingChange = (index: number, field: "ticker" | "quantity" | "buyPrice", value: string) => {
        const newHoldings = [...holdings];
        newHoldings[index][field] = field === "ticker" ? value.toUpperCase() : value;
        setHoldings(newHoldings);
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const newHoldings: { ticker: string; quantity: string; buyPrice: string }[] = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',');
                if (parts.length >= 3) {
                    newHoldings.push({
                        ticker: parts[0].trim(),
                        quantity: parts[1].trim(),
                        buyPrice: parts[2].trim()
                    });
                }
            }
            if (newHoldings.length > 0) {
                setHoldings(newHoldings);
            }
        };
        reader.readAsText(file);
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const formattedHoldings: Record<string, { quantity: number; buy_price: number }> = {};
            holdings.forEach(h => {
                if (h.ticker && h.quantity && h.buyPrice) {
                    formattedHoldings[h.ticker.includes(".NS") ? h.ticker : `${h.ticker}.NS`] = {
                        quantity: Number(h.quantity),
                        buy_price: Number(h.buyPrice)
                    };
                }
            });

            const res = await fetch("http://localhost:8000/portfolio_analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ holdings: formattedHoldings })
            });
            const data = await res.json();
            setAnalysis(data);
            localStorage.setItem("portfolioAnalysis", JSON.stringify(data));
        } catch (err) {
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    // ── Style helpers ──
    const cardBase: React.CSSProperties = {
        background: "rgba(10,22,40,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,212,255,0.12)",
        borderRadius: "12px",
    };

    const inputStyle: React.CSSProperties = {
        background: "rgba(2,5,15,0.6)",
        border: "1px solid rgba(0,212,255,0.12)",
        borderRadius: "6px",
        padding: "10px 14px",
        color: "#E8F4FD",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "0.9rem",
        outline: "none",
        transition: "all 0.2s ease",
    };

    const colHeader: React.CSSProperties = {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.6rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#3A5470",
    };

    const kpiLabel: React.CSSProperties = {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.6rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#3A5470",
        margin: 0,
    };

    const kpiValue: React.CSSProperties = {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "1.8rem",
        lineHeight: 1,
        margin: "6px 0 0 0",
    };

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
                    Deep dive into beta, sharpe, and component correlations
                </span>
            </div>

            {!analysis ? (
                /* ══════════ INPUT STATE ══════════ */
                <div
                    style={{
                        ...cardBase,
                        padding: "2rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <div style={{ width: "100%", maxWidth: "700px" }}>
                        <h3
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "1.6rem",
                                letterSpacing: "0.1em",
                                color: "#E8F4FD",
                                lineHeight: 1.1,
                                marginBottom: "4px",
                            }}
                        >
                            Configure Target Portfolio
                        </h3>
                        <p
                            style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.65rem",
                                letterSpacing: "0.15em",
                                color: "#3A5470",
                                textTransform: "uppercase",
                                marginBottom: "2rem",
                            }}
                        >
                            Enter your current custom positions below to run the ML Risk Matrix against your actual holdings.
                        </p>

                        {/* Column Headers */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                marginBottom: "0.75rem",
                                paddingLeft: "2px",
                            }}
                        >
                            <span style={{ ...colHeader, flex: 1 }}>Ticker</span>
                            <span style={{ ...colHeader, width: "100px" }}>Quantity</span>
                            <span style={{ ...colHeader, width: "140px" }}>Buy Price (₹)</span>
                            <span style={{ width: "28px" }} />
                        </div>

                        {/* Holdings Rows */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                            {holdings.map((holding, index) => (
                                <div key={index} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                    <input
                                        type="text"
                                        placeholder="Ticker (e.g. INFY)"
                                        style={{ ...inputStyle, flex: 1 }}
                                        value={holding.ticker.replace('.NS', '')}
                                        onChange={(e) => handleHoldingChange(index, "ticker", e.target.value)}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "#00D4FF";
                                            e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "rgba(0,212,255,0.12)";
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        style={{ ...inputStyle, width: "100px" }}
                                        value={holding.quantity}
                                        onChange={(e) => handleHoldingChange(index, "quantity", e.target.value)}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "#00D4FF";
                                            e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "rgba(0,212,255,0.12)";
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        style={{ ...inputStyle, width: "140px" }}
                                        value={holding.buyPrice}
                                        onChange={(e) => handleHoldingChange(index, "buyPrice", e.target.value)}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "#00D4FF";
                                            e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "rgba(0,212,255,0.12)";
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                    <button
                                        onClick={() => handleRemoveHolding(index)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#1A3550",
                                            fontSize: "1rem",
                                            cursor: "pointer",
                                            padding: "4px",
                                            transition: "color 0.2s ease",
                                            width: "28px",
                                            textAlign: "center",
                                        }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FF4560"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#1A3550"; }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Divider + Actions */}
                        <div
                            style={{
                                borderTop: "1px solid rgba(0,212,255,0.06)",
                                paddingTop: "1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "2rem",
                            }}
                        >
                            <button
                                onClick={handleAddHolding}
                                style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: "0.7rem",
                                    letterSpacing: "0.1em",
                                    color: "#00D4FF",
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "color 0.2s ease",
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#E8F4FD"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#00D4FF"; }}
                            >
                                + Add Asset
                            </button>
                            <div style={{ position: "relative" }}>
                                <input type="file" id="csv-upload" accept=".csv" onChange={handleCSVUpload} style={{ display: "none" }} />
                                <label
                                    htmlFor="csv-upload"
                                    style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.65rem",
                                        letterSpacing: "0.1em",
                                        background: "rgba(2,5,15,0.6)",
                                        border: "1px solid rgba(0,212,255,0.12)",
                                        color: "#7A9BB5",
                                        borderRadius: "6px",
                                        padding: "8px 14px",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.25)";
                                        (e.currentTarget as HTMLElement).style.color = "#E8F4FD";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.12)";
                                        (e.currentTarget as HTMLElement).style.color = "#7A9BB5";
                                    }}
                                >
                                    <ScanLine size={14} /> Upload CSV
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing || holdings.length === 0}
                        style={{
                            background: "linear-gradient(135deg, #00D4FF, #0088AA)",
                            color: "#02050F",
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            border: "none",
                            borderRadius: "6px",
                            padding: "14px 48px",
                            cursor: analyzing || holdings.length === 0 ? "not-allowed" : "pointer",
                            opacity: analyzing || holdings.length === 0 ? 0.5 : 1,
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                        onMouseEnter={(e) => {
                            if (!analyzing && holdings.length > 0) {
                                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(0,212,255,0.4)";
                                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = "none";
                            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        }}
                    >
                        {analyzing ? (
                            <>
                                <ScanLine className="animate-spin" size={16} />
                                Analyzing Network...
                            </>
                        ) : (
                            "Run ML Risk Assessment"
                        )}
                    </button>
                </div>
            ) : (
                /* ══════════ RESULTS STATE ══════════ */
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* KPI Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                        {/* Total Value */}
                        <div style={{ ...cardBase, padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div
                                style={{
                                    padding: "10px",
                                    background: "rgba(0,212,255,0.1)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Activity size={22} style={{ color: "#00D4FF" }} />
                            </div>
                            <div>
                                <p style={kpiLabel}>Total Value</p>
                                <p style={{ ...kpiValue, color: "#E8F4FD" }}>
                                    ₹{analysis.total_value ? analysis.total_value.toLocaleString() : "0"}
                                </p>
                            </div>
                        </div>

                        {/* Expected Return */}
                        <div style={{ ...cardBase, padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div
                                style={{
                                    padding: "10px",
                                    background: "rgba(0,255,136,0.1)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <TrendingUp size={22} style={{ color: "#00FF88" }} />
                            </div>
                            <div>
                                <p style={kpiLabel}>Expected Return</p>
                                <p style={{ ...kpiValue, color: "#00FF88" }}>{analysis.expected_return}%</p>
                            </div>
                        </div>

                        {/* Concentration */}
                        <div
                            style={{
                                ...cardBase,
                                padding: "1.25rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                borderColor: "rgba(240,185,66,0.2)",
                            }}
                        >
                            <div
                                style={{
                                    padding: "10px",
                                    background: "rgba(240,185,66,0.1)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ShieldAlert size={22} style={{ color: "#F0B942" }} />
                            </div>
                            <div>
                                <p style={{ ...kpiLabel, color: "#F0B942" }}>Concentration</p>
                                <p
                                    style={{
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: "0.85rem",
                                        color: "#F0B942",
                                        margin: "6px 0 0 0",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {analysis.concentration_risk}
                                </p>
                            </div>
                        </div>

                        {/* Health Score */}
                        <div style={{ ...cardBase, padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div
                                style={{
                                    padding: "10px",
                                    background: "rgba(123,97,255,0.1)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <HeartPulse size={22} style={{ color: "#7B61FF" }} />
                            </div>
                            <div>
                                <p style={kpiLabel}>Health Score</p>
                                <p style={{ ...kpiValue, color: "#E8F4FD" }}>
                                    {analysis.health_score}
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
                    </div>

                    {/* Recommendations */}
                    <div style={{ ...cardBase, padding: "1.5rem" }}>
                        <h3
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "1.3rem",
                                letterSpacing: "0.08em",
                                color: "#E8F4FD",
                                lineHeight: 1.1,
                                marginBottom: "1rem",
                            }}
                        >
                            <ScanLine size={20} style={{ color: "#00D4FF" }} />
                            AI Rebalancing Recommendations
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {analysis.recommendations.map((rec: string, i: number) => (
                                <div
                                    key={i}
                                    style={{
                                        background: "rgba(2,5,15,0.5)",
                                        border: "1px solid rgba(0,212,255,0.1)",
                                        borderLeft: "2px solid #00D4FF",
                                        borderRadius: "8px",
                                        padding: "1rem",
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: "0.82rem",
                                        color: "#7A9BB5",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {rec}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
