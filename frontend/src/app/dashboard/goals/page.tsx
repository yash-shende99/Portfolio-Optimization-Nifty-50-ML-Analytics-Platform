"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Target, Calculator } from "lucide-react";

export default function GoalsPage() {
    const [targetAmount, setTargetAmount] = useState<number>(20000000); // 2 Crore
    const [years, setYears] = useState<number>(25);
    const [expectedReturn, setExpectedReturn] = useState<number>(12);

    const [result, setResult] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const calculateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target_amount: targetAmount,
                    years: years,
                    expected_return: expectedReturn / 100
                }),
            });

            const data = await res.json();
            setResult(data);

            // Generate projection data for Recharts
            const points = [];
            let currentPrincipal = 0;
            let currentWealth = 0;
            const monthlyRate = (expectedReturn / 100) / 12;
            const sip = data.required_sip;

            for (let y = 0; y <= years; y++) {
                if (y === 0) {
                    points.push({ year: `Year 0`, invested: 0, growth: 0, total: 0 });
                    continue;
                }

                const months = y * 12;
                currentPrincipal = sip * months;
                currentWealth = sip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

                points.push({
                    year: `Year ${y}`,
                    invested: Math.round(currentPrincipal),
                    growth: Math.round(currentWealth - currentPrincipal),
                    total: Math.round(currentWealth)
                });
            }
            setChartData(points);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
        color: "#E8F4FD",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "0.9rem",
        borderRadius: "6px",
        padding: "10px 14px",
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
        color: "#3A5470",
        display: "block",
        marginBottom: "6px",
    };

    const kpiLabel: React.CSSProperties = {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.6rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#3A5470",
        marginBottom: "6px",
    };

    const kpiValue: React.CSSProperties = {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "1.8rem",
        lineHeight: 1,
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
                    Calculate the SIP required to reach your targets
                </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
                {/* ══════════ Input Form Panel ══════════ */}
                <div style={{ ...cardBase, padding: "1.5rem" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <Target size={20} style={{ color: "#F0B942" }} />
                        <span
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "1.3rem",
                                letterSpacing: "0.1em",
                                color: "#E8F4FD",
                                lineHeight: 1.1,
                            }}
                        >
                            Goal Parameters
                        </span>
                    </div>

                    <form onSubmit={calculateGoal}>
                        <div style={{ marginBottom: "1.25rem" }}>
                            <label style={labelStyle}>Target Amount (₹)</label>
                            <input
                                type="number"
                                value={targetAmount}
                                onChange={e => setTargetAmount(Number(e.target.value))}
                                style={inputStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#00D4FF";
                                    e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "rgba(0,212,255,0.12)";
                                    e.target.style.boxShadow = "none";
                                }}
                                required
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                            <div>
                                <label style={labelStyle}>Time Horizon (Yrs)</label>
                                <input
                                    type="number"
                                    value={years}
                                    onChange={e => setYears(Number(e.target.value))}
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#00D4FF";
                                        e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(0,212,255,0.12)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Exp. Return (%)</label>
                                <input
                                    type="number"
                                    value={expectedReturn}
                                    onChange={e => setExpectedReturn(Number(e.target.value))}
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#00D4FF";
                                        e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(0,212,255,0.12)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "12px",
                                background: "linear-gradient(135deg, #F0B942, #C8901A)",
                                color: "#02050F",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                border: "none",
                                borderRadius: "6px",
                                cursor: loading ? "not-allowed" : "pointer",
                                marginTop: "1rem",
                                opacity: loading ? 0.5 : 1,
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(240,185,66,0.4)";
                                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                            }}
                        >
                            <Calculator size={16} />
                            {loading ? "Calculating..." : "Calculate SIP"}
                        </button>
                    </form>
                </div>

                {/* ══════════ Results / Empty State ══════════ */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {result ? (
                        <>
                            {/* KPI Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                                {/* Required SIP */}
                                <div style={{ ...cardBase, padding: "1.25rem 1.5rem", textAlign: "center" }}>
                                    <p style={kpiLabel}>Required SIP</p>
                                    <p style={{ ...kpiValue, color: "#00D4FF" }}>
                                        ₹{result.required_sip.toLocaleString()}
                                        <span
                                            style={{
                                                fontFamily: "'Space Grotesk', sans-serif",
                                                fontSize: "0.8rem",
                                                color: "#3A5470",
                                                marginLeft: "4px",
                                            }}
                                        >
                                            /mo
                                        </span>
                                    </p>
                                </div>

                                {/* Total Invested */}
                                <div style={{ ...cardBase, padding: "1.25rem 1.5rem", textAlign: "center" }}>
                                    <p style={kpiLabel}>Total Invested</p>
                                    <p style={{ ...kpiValue, color: "#E8F4FD" }}>
                                        ₹{result.total_investment.toLocaleString()}
                                    </p>
                                </div>

                                {/* Wealth Gained */}
                                <div style={{ ...cardBase, padding: "1.25rem 1.5rem", textAlign: "center" }}>
                                    <p style={kpiLabel}>Wealth Gained</p>
                                    <p style={{ ...kpiValue, color: "#00FF88" }}>
                                        +₹{result.estimated_wealth_gain.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Chart */}
                            <div style={{ ...cardBase, padding: "1.5rem", height: "420px" }}>
                                <h3
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: "1.1rem",
                                        letterSpacing: "0.08em",
                                        color: "#E8F4FD",
                                        marginBottom: "1.5rem",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    Compounding Trajectory
                                </h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F0B942" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#F0B942" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="year"
                                            stroke="#1A3550"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: "#3A5470", fontFamily: "'IBM Plex Mono', monospace" }}
                                        />
                                        <YAxis
                                            stroke="#1A3550"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: "#3A5470", fontFamily: "'IBM Plex Mono', monospace" }}
                                            tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(2,5,15,0.95)",
                                                border: "1px solid rgba(0,212,255,0.2)",
                                                borderRadius: "6px",
                                                fontFamily: "'IBM Plex Mono', monospace",
                                                fontSize: "11px",
                                            }}
                                            itemStyle={{ color: "#E8F4FD" }}
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                        />
                                        <Area type="monotone" dataKey="invested" stackId="1" stroke="#00D4FF" fill="url(#colorInvested)" strokeWidth={2} name="Principal" />
                                        <Area type="monotone" dataKey="growth" stackId="1" stroke="#F0B942" fill="url(#colorGrowth)" strokeWidth={2} name="Interest" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        /* Empty State */
                        <div
                            style={{
                                ...cardBase,
                                minHeight: "400px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                textAlign: "center",
                                padding: "2rem",
                            }}
                        >
                            <Calculator size={56} style={{ color: "rgba(0,212,255,0.1)", marginBottom: "1rem" }} />
                            <h3
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: "1.4rem",
                                    color: "#E8F4FD",
                                    letterSpacing: "0.08em",
                                    lineHeight: 1.1,
                                    marginBottom: "0.5rem",
                                }}
                            >
                                Awaiting Parameters
                            </h3>
                            <p
                                style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: "0.65rem",
                                    color: "#3A5470",
                                    letterSpacing: "0.1em",
                                    maxWidth: "280px",
                                }}
                            >
                                Enter your financial goals on the left to activate the AI compounding simulation.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
