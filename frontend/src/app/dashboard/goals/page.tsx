"use client";

import { useState, useEffect, useRef } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Target, Calculator } from "lucide-react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    gold: boolean;
}

export default function GoalsPage() {
    const [targetAmount, setTargetAmount] = useState<number>(20000000); // 2 Crore
    const [years, setYears] = useState<number>(25);
    const [expectedReturn, setExpectedReturn] = useState<number>(12);

    const [result, setResult] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // ── Animation states ──
    const [mounted, setMounted] = useState(false);
    const [btnHover, setBtnHover] = useState(false);
    const [resultsVisible, setResultsVisible] = useState(false);
    const [displaySIP, setDisplaySIP] = useState(0);
    const [displayInvested, setDisplayInvested] = useState(0);
    const [displayGained, setDisplayGained] = useState(0);
    const [milestoneBars, setMilestoneBars] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const countupRef = useRef<number>(0);
    const countupDone = useRef(false);

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

    // ── Mount entrance ──
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    // ── Canvas particle animation (empty state) ──
    useEffect(() => {
        if (result) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
        };
        resize();

        if (particlesRef.current.length === 0) {
            const particles: Particle[] = [];
            for (let i = 0; i < 50; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    size: 1 + Math.random() * 2.5,
                    gold: Math.random() < 0.2,
                });
            }
            particlesRef.current = particles;
        }

        const animate = () => {
            const w = canvas.width;
            const h = canvas.height;
            frameCountRef.current++;

            ctx.fillStyle = "rgba(2,5,15,0.12)";
            ctx.fillRect(0, 0, w, h);

            // Faint trend line every 3rd frame
            if (frameCountRef.current % 3 === 0) {
                ctx.strokeStyle = "rgba(0,212,255,0.06)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, h * 0.85);
                ctx.bezierCurveTo(w * 0.3, h * 0.6, w * 0.6, h * 0.35, w, h * 0.15);
                ctx.stroke();
            }

            const particles = particlesRef.current;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                p.x = Math.max(0, Math.min(w, p.x));
                p.y = Math.max(0, Math.min(h, p.y));

                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j];
                    const dx = p.x - q.x;
                    const dy = p.y - q.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.strokeStyle = `rgba(0,212,255,${(1 - dist / 100) * 0.25})`;
                        ctx.lineWidth = 0.4;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.stroke();
                    }
                }

                ctx.fillStyle = p.gold ? "rgba(240,185,66,0.7)" : "rgba(0,212,255,0.4)";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            animFrameRef.current = requestAnimationFrame(animate);
        };

        ctx.fillStyle = "rgba(2,5,15,1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        animFrameRef.current = requestAnimationFrame(animate);

        window.addEventListener("resize", resize);
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener("resize", resize);
        };
    }, [result]);

    // ── Results entrance ──
    useEffect(() => {
        if (!result) return;
        const t = setTimeout(() => setResultsVisible(true), 50);
        const t2 = setTimeout(() => setMilestoneBars(true), 600);
        return () => { clearTimeout(t); clearTimeout(t2); };
    }, [result]);

    // ── Count-up animations ──
    useEffect(() => {
        if (!result || countupDone.current) return;
        countupDone.current = true;

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const duration = 1500;
        const startTime = performance.now();
        const tSIP = result.required_sip || 0;
        const tInvest = result.total_investment || 0;
        const tGain = result.estimated_wealth_gain || 0;

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);

            setDisplaySIP(Math.round(tSIP * eased));
            setDisplayInvested(Math.round(tInvest * eased));
            setDisplayGained(Math.round(tGain * eased));

            if (progress < 1) {
                countupRef.current = requestAnimationFrame(animate);
            }
        };
        countupRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(countupRef.current);
    }, [result]);

    // ── Cleanup ──
    useEffect(() => {
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            cancelAnimationFrame(countupRef.current);
        };
    }, []);

    // ── Milestones ──
    const milestones = (() => {
        if (!chartData || chartData.length < 2) return [];
        const totalYears = chartData.length - 1;
        const indices = [
            Math.round(totalYears * 0.25),
            Math.round(totalYears * 0.5),
            Math.round(totalYears * 0.75),
            totalYears,
        ];
        const labels = ["QUARTER MILESTONE", "HALFWAY POINT", "FINAL STRETCH", "TARGET ACHIEVED"];
        const colors = ["#3A5470", "#00D4FF", "#F0B942", "#00FF88"];
        return indices.map((idx, i) => ({
            year: idx,
            label: labels[i],
            corpus: chartData[idx]?.total || 0,
            color: colors[i],
            isFinal: i === 3,
        }));
    })();

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

    const kpiEntrance = (i: number): React.CSSProperties => ({
        opacity: resultsVisible ? 1 : 0,
        transform: resultsVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
        transition: `opacity 0.5s ease ${i * 120}ms, transform 0.5s ease ${i * 120}ms`,
    });

    const fieldEntrance = (i: number): React.CSSProperties => ({
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-16px)",
        transition: `opacity 0.4s ease ${i * 100}ms, transform 0.4s ease ${i * 100}ms`,
    });

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
                <div
                    style={{
                        ...cardBase,
                        padding: "1.5rem",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(24px)",
                        transition: "opacity 0.6s ease, transform 0.6s ease",
                    }}
                >
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
                        <div style={{ marginBottom: "1.25rem", ...fieldEntrance(0) }}>
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
                            <div style={fieldEntrance(1)}>
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
                            <div style={fieldEntrance(2)}>
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
                            onMouseEnter={() => setBtnHover(true)}
                            onMouseLeave={() => setBtnHover(false)}
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
                                transition: "all 0.3s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                boxShadow: btnHover && !loading
                                    ? "0 0 40px rgba(240,185,66,0.5), 0 0 80px rgba(240,185,66,0.2)"
                                    : "none",
                                transform: btnHover && !loading ? "translateY(-2px)" : "translateY(0)",
                            }}
                        >
                            <Calculator size={16} />
                            {loading ? "Calculating..." : "Calculate SIP"}
                        </button>
                    </form>
                </div>

                {/* ══════════ Right Panel ══════════ */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {result ? (
                        <>
                            {/* KPI Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                                {/* Required SIP */}
                                <div style={{ ...cardBase, padding: "1.25rem 1.5rem", textAlign: "center", ...kpiEntrance(0) }}>
                                    <p style={kpiLabel}>Required SIP</p>
                                    <p style={{ ...kpiValue, color: "#00D4FF" }}>
                                        ₹{displaySIP.toLocaleString("en-IN")}
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
                                <div style={{ ...cardBase, padding: "1.25rem 1.5rem", textAlign: "center", ...kpiEntrance(1) }}>
                                    <p style={kpiLabel}>Total Invested</p>
                                    <p style={{ ...kpiValue, color: "#E8F4FD" }}>
                                        ₹{displayInvested.toLocaleString("en-IN")}
                                    </p>
                                </div>

                                {/* Wealth Gained */}
                                <div style={{ ...cardBase, padding: "1.25rem 1.5rem", textAlign: "center", ...kpiEntrance(2) }}>
                                    <p style={kpiLabel}>Wealth Gained</p>
                                    <p style={{ ...kpiValue, color: "#00FF88" }}>
                                        +₹{displayGained.toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>

                            {/* Chart */}
                            <div
                                style={{
                                    ...cardBase,
                                    padding: "1.5rem",
                                    height: "420px",
                                    opacity: resultsVisible ? 1 : 0,
                                    transform: resultsVisible ? "translateY(0)" : "translateY(16px)",
                                    transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
                                }}
                            >
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
                                            <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(0,212,255,0.3)" stopOpacity={1} />
                                                <stop offset="100%" stopColor="rgba(0,212,255,0)" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(240,185,66,0.3)" stopOpacity={1} />
                                                <stop offset="100%" stopColor="rgba(240,185,66,0)" stopOpacity={1} />
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
                                            formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                                        />
                                        <Area type="monotone" dataKey="invested" stackId="1" stroke="#00D4FF" fill="url(#principalGradient)" strokeWidth={2} name="Principal" />
                                        <Area type="monotone" dataKey="growth" stackId="1" stroke="#F0B942" fill="url(#interestGradient)" strokeWidth={2} name="Interest" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* ── Milestone Tracker ── */}
                            {milestones.length > 0 && (
                                <div
                                    style={{
                                        ...cardBase,
                                        border: "1px solid rgba(240,185,66,0.15)",
                                        padding: "1.5rem",
                                    }}
                                >
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
                                        Wealth Milestones
                                    </h4>

                                    {milestones.map((ms, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "16px",
                                                padding: "12px 0",
                                                borderBottom: i < milestones.length - 1 ? "1px solid rgba(0,212,255,0.05)" : "none",
                                                opacity: resultsVisible ? 1 : 0,
                                                transform: resultsVisible ? "translateX(0)" : "translateX(-16px)",
                                                transition: `opacity 0.5s ease ${i * 120}ms, transform 0.5s ease ${i * 120}ms`,
                                            }}
                                        >
                                            {/* Year badge */}
                                            <span
                                                style={{
                                                    fontFamily: "'IBM Plex Mono', monospace",
                                                    fontSize: "0.7rem",
                                                    background: ms.isFinal ? "rgba(0,255,136,0.1)" : "rgba(0,212,255,0.08)",
                                                    border: ms.isFinal
                                                        ? "1px solid rgba(0,255,136,0.2)"
                                                        : "1px solid rgba(0,212,255,0.15)",
                                                    color: ms.isFinal ? "#00FF88" : "#00D4FF",
                                                    borderRadius: "4px",
                                                    padding: "4px 10px",
                                                    minWidth: "64px",
                                                    textAlign: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                YR {ms.year}
                                            </span>

                                            {/* Label + value */}
                                            <div style={{ minWidth: "160px", flexShrink: 0 }}>
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
                                                    {ms.label}
                                                </p>
                                                <p
                                                    style={{
                                                        fontFamily: "'Bebas Neue', sans-serif",
                                                        fontSize: "1.1rem",
                                                        color: ms.isFinal ? "#00FF88" : "#E8F4FD",
                                                        lineHeight: 1,
                                                        margin: "4px 0 0 0",
                                                    }}
                                                >
                                                    ₹{ms.corpus.toLocaleString("en-IN")}
                                                </p>
                                            </div>

                                            {/* Progress bar */}
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: "3px",
                                                    background: "rgba(0,212,255,0.06)",
                                                    borderRadius: "2px",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        borderRadius: "2px",
                                                        width: milestoneBars ? `${((i + 1) / 4) * 100}%` : "0%",
                                                        background: ms.color,
                                                        transition: `width 1s ease ${i * 150}ms`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        /* ══════════ Empty State ══════════ */
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {/* Canvas */}
                            <div
                                style={{
                                    height: "220px",
                                    width: "100%",
                                    borderRadius: "12px 12px 0 0",
                                    overflow: "hidden",
                                    position: "relative",
                                    border: "1px solid rgba(0,212,255,0.08)",
                                    borderBottom: "none",
                                }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    style={{ width: "100%", height: "100%", display: "block" }}
                                />
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "12px",
                                        left: "16px",
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.6rem",
                                        letterSpacing: "0.2em",
                                        color: "#1A3550",
                                        textTransform: "uppercase",
                                        pointerEvents: "none",
                                    }}
                                >
                                    WEALTH PROJECTION ENGINE
                                </span>
                            </div>

                            {/* Preview cards */}
                            <div
                                style={{
                                    ...cardBase,
                                    borderRadius: "0 0 12px 12px",
                                    border: "1px solid rgba(0,212,255,0.08)",
                                    borderTop: "none",
                                    padding: "1.25rem",
                                }}
                            >
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                                    {["MONTHLY SIP", "TOTAL CORPUS", "WEALTH GAIN"].map((label) => (
                                        <div
                                            key={label}
                                            style={{
                                                background: "rgba(2,5,15,0.5)",
                                                border: "1px solid rgba(0,212,255,0.06)",
                                                borderRadius: "8px",
                                                padding: "12px",
                                                textAlign: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily: "'IBM Plex Mono', monospace",
                                                    fontSize: "0.55rem",
                                                    letterSpacing: "0.2em",
                                                    color: "#1A3550",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                {label}
                                            </span>
                                            <div
                                                style={{
                                                    height: "28px",
                                                    borderRadius: "4px",
                                                    marginTop: "8px",
                                                    background:
                                                        "linear-gradient(90deg, rgba(0,212,255,0.04), rgba(0,212,255,0.1), rgba(0,212,255,0.04))",
                                                    backgroundSize: "200% 100%",
                                                    animation: "shimmer 2s infinite",
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p
                                    style={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: "0.62rem",
                                        letterSpacing: "0.12em",
                                        color: "#1A3550",
                                        textAlign: "center",
                                        marginTop: "12px",
                                    }}
                                >
                                    ENTER PARAMETERS TO ACTIVATE SIMULATION
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
