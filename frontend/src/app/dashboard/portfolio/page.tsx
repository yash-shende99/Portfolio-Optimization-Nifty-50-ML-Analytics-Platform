"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, AlertCircle, ScanLine, ShieldAlert, Zap, Layers, Activity, TrendingUp, HeartPulse } from "lucide-react";

interface NetworkNode {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
}

export default function PortfolioPage() {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [holdings, setHoldings] = useState<{ ticker: string; quantity: string; buyPrice: string }[]>([
        { ticker: "TCS.NS", quantity: "15", buyPrice: "3500" },
        { ticker: "RELIANCE.NS", quantity: "20", buyPrice: "2400" }
    ]);

    // ── Animation states ──
    const [mounted, setMounted] = useState(false);
    const [btnHover, setBtnHover] = useState(false);
    const [resultsVisible, setResultsVisible] = useState(false);
    const [displayValue, setDisplayValue] = useState(0);
    const [displayHealth, setDisplayHealth] = useState(0);
    const [displayReturn, setDisplayReturn] = useState(0);
    const [barWidths, setBarWidths] = useState([0, 0, 0]);

    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const networkAnimRef = useRef<number>(0);
    const nodesRef = useRef<NetworkNode[]>([]);
    const gaugeCanvasRef = useRef<HTMLCanvasElement>(null);
    const gaugeAnimRef = useRef<number>(0);
    const countupAnimRef = useRef<number>(0);
    const countupDone = useRef(false);

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

    // ── Mount entrance ──
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    // ── Network canvas animation (input state) ──
    useEffect(() => {
        if (analysis) return;
        const canvas = bgCanvasRef.current;
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

        // Initialize nodes
        if (nodesRef.current.length === 0) {
            const nodes: NetworkNode[] = [];
            for (let i = 0; i < 40; i++) {
                nodes.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    radius: 1.5 + Math.random() * 2,
                });
            }
            nodesRef.current = nodes;
        }

        const animate = () => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.fillStyle = "rgba(2,5,15,0.15)";
            ctx.fillRect(0, 0, w, h);

            const nodes = nodesRef.current;
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;
                n.x = Math.max(0, Math.min(w, n.x));
                n.y = Math.max(0, Math.min(h, n.y));

                // Draw connections
                for (let j = i + 1; j < nodes.length; j++) {
                    const m = nodes[j];
                    const dx = n.x - m.x;
                    const dy = n.y - m.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        const opacity = 1 - dist / 120;
                        ctx.strokeStyle = `rgba(0,212,255,${opacity * 0.3})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(m.x, m.y);
                        ctx.stroke();
                    }
                }

                // Draw node
                const isGold = i < 3;
                ctx.fillStyle = isGold ? "rgba(240,185,66,0.8)" : "rgba(0,212,255,0.6)";
                ctx.beginPath();
                ctx.arc(n.x, n.y, isGold ? n.radius * 1.5 : n.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            networkAnimRef.current = requestAnimationFrame(animate);
        };
        // Clear canvas initially
        ctx.fillStyle = "rgba(2,5,15,1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        networkAnimRef.current = requestAnimationFrame(animate);

        window.addEventListener("resize", resize);
        return () => {
            cancelAnimationFrame(networkAnimRef.current);
            window.removeEventListener("resize", resize);
        };
    }, [analysis]);

    // ── Results animations ──
    useEffect(() => {
        if (!analysis) return;
        const t = setTimeout(() => setResultsVisible(true), 50);
        return () => clearTimeout(t);
    }, [analysis]);

    // ── Count-up animations for results ──
    useEffect(() => {
        if (!analysis || countupDone.current) return;
        countupDone.current = true;

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const duration = 1500;
        const startTime = performance.now();
        const targetValue = analysis.total_value || 0;
        const targetHealth = analysis.health_score || 0;
        const targetReturn = analysis.expected_return || 0;

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);

            setDisplayValue(Math.round(targetValue * eased));
            setDisplayHealth(Math.round(targetHealth * eased));
            setDisplayReturn(Number((targetReturn * eased).toFixed(1)));

            if (progress < 1) {
                countupAnimRef.current = requestAnimationFrame(animate);
            }
        };
        countupAnimRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(countupAnimRef.current);
    }, [analysis]);

    // ── Health gauge canvas ──
    useEffect(() => {
        if (!analysis || !gaugeCanvasRef.current) return;
        const canvas = gaugeCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = 200;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + "px";
        canvas.style.height = size + "px";
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const radius = 72;
        const lineWidth = 12;
        const score = analysis.health_score || 0;
        const targetAngle = (score / 100) * Math.PI * 2;

        const arcColor = score > 70 ? "#00FF88" : score > 40 ? "#F0B942" : "#FF4560";

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const duration = 1500;
        const startTime = performance.now();

        const draw = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            const currentAngle = targetAngle * eased;
            const currentScore = Math.round(score * eased);

            ctx.clearRect(0, 0, size, size);

            // Background arc
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(0,212,255,0.08)";
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            // Filled arc
            if (currentAngle > 0) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + currentAngle);
                ctx.strokeStyle = arcColor;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = "round";
                ctx.stroke();
            }

            // Center text
            ctx.fillStyle = arcColor;
            ctx.font = "42px 'Bebas Neue', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(currentScore), cx, cy - 4);

            ctx.fillStyle = "#3A5470";
            ctx.font = "9px 'IBM Plex Mono', monospace";
            ctx.letterSpacing = "3px";
            ctx.fillText("HEALTH", cx, cy + 22);

            if (progress < 1) {
                gaugeAnimRef.current = requestAnimationFrame(draw);
            }
        };
        gaugeAnimRef.current = requestAnimationFrame(draw);

        return () => cancelAnimationFrame(gaugeAnimRef.current);
    }, [analysis]);

    // ── Risk bars animation ──
    useEffect(() => {
        if (!analysis) return;
        const concentration = analysis.concentration_risk || "";
        const concWidth = concentration.toLowerCase().includes("high") ? 85
            : concentration.toLowerCase().includes("medium") ? 55
            : 25;
        const returnWidth = Math.min((analysis.expected_return || 0) * 5, 100);
        const sharpeWidth = analysis.health_score || 0;

        const t = setTimeout(() => {
            setBarWidths([returnWidth, sharpeWidth, concWidth]);
        }, 400);
        return () => clearTimeout(t);
    }, [analysis]);

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            cancelAnimationFrame(networkAnimRef.current);
            cancelAnimationFrame(gaugeAnimRef.current);
            cancelAnimationFrame(countupAnimRef.current);
        };
    }, []);

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

    const kpiCardEntrance = (i: number): React.CSSProperties => ({
        opacity: resultsVisible ? 1 : 0,
        transform: resultsVisible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${i * 120}ms, transform 0.5s ease ${i * 120}ms`,
    });

    const concentration = analysis?.concentration_risk || "";
    const concColor = concentration.toLowerCase().includes("high") ? "#FF4560"
        : concentration.toLowerCase().includes("medium") ? "#F0B942"
        : "#00FF88";

    const healthArcColor = (analysis?.health_score || 0) > 70 ? "#00FF88"
        : (analysis?.health_score || 0) > 40 ? "#F0B942" : "#FF4560";

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
                <>
                    <div
                        style={{
                            ...cardBase,
                            padding: "2rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? "translateY(0)" : "translateY(24px)",
                            transition: "opacity 0.6s ease, transform 0.6s ease",
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
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            gap: "1rem",
                                            alignItems: "center",
                                            opacity: mounted ? 1 : 0,
                                            transform: mounted ? "translateX(0)" : "translateX(-16px)",
                                            transition: `opacity 0.4s ease ${index * 100}ms, transform 0.4s ease ${index * 100}ms`,
                                        }}
                                    >
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
                            onMouseEnter={() => setBtnHover(true)}
                            onMouseLeave={() => setBtnHover(false)}
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
                                transition: "all 0.3s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: btnHover && !analyzing && holdings.length > 0
                                    ? "0 0 40px rgba(0,212,255,0.5), 0 0 80px rgba(0,212,255,0.2)"
                                    : "none",
                                transform: btnHover && !analyzing && holdings.length > 0
                                    ? "translateY(-1px)"
                                    : "translateY(0)",
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

                    {/* ── Network Canvas ── */}
                    <div
                        style={{
                            width: "100%",
                            height: "280px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "1px solid rgba(0,212,255,0.06)",
                            position: "relative",
                            opacity: mounted ? 1 : 0,
                            transition: "opacity 0.8s ease 0.3s",
                        }}
                    >
                        <canvas
                            ref={bgCanvasRef}
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
                            CORRELATION NETWORK · AWAITING INPUT
                        </span>
                    </div>
                </>
            ) : (
                /* ══════════ RESULTS STATE ══════════ */
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* KPI Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                        {/* Total Value */}
                        <div style={{ ...cardBase, padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", ...kpiCardEntrance(0) }}>
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
                                    ₹{displayValue.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Expected Return */}
                        <div style={{ ...cardBase, padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", ...kpiCardEntrance(1) }}>
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
                                <p style={{ ...kpiValue, color: "#00FF88" }}>{displayReturn}%</p>
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
                                ...kpiCardEntrance(2),
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
                        <div style={{ ...cardBase, padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", ...kpiCardEntrance(3) }}>
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
                                    {displayHealth}
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

                    {/* ── Risk Gauge + Breakdown ── */}
                    <div
                        style={{
                            ...cardBase,
                            padding: "1.5rem",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "2rem",
                            opacity: resultsVisible ? 1 : 0,
                            transform: resultsVisible ? "translateY(0)" : "translateY(12px)",
                            transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
                        }}
                    >
                        {/* Left — Health Gauge Ring */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <canvas
                                ref={gaugeCanvasRef}
                                style={{ width: "200px", height: "200px" }}
                            />
                        </div>

                        {/* Right — Risk Bars */}
                        <div>
                            <h4
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: "1rem",
                                    letterSpacing: "0.08em",
                                    color: "#E8F4FD",
                                    marginBottom: "1.25rem",
                                    lineHeight: 1.1,
                                }}
                            >
                                Risk Breakdown
                            </h4>

                            {/* Bar 1 — Expected Return */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "#3A5470", textTransform: "uppercase" }}>
                                        Expected Return
                                    </span>
                                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "#00FF88" }}>
                                        {analysis.expected_return}%
                                    </span>
                                </div>
                                <div style={{ height: "4px", background: "rgba(0,212,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${barWidths[0]}%`, background: "#00FF88", borderRadius: "2px", transition: "width 1s ease 0.2s" }} />
                                </div>
                            </div>

                            {/* Bar 2 — Sharpe Proxy */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "#3A5470", textTransform: "uppercase" }}>
                                        Sharpe Proxy
                                    </span>
                                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "#00D4FF" }}>
                                        {((analysis.health_score || 0) / 10).toFixed(1)}
                                    </span>
                                </div>
                                <div style={{ height: "4px", background: "rgba(0,212,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${barWidths[1]}%`, background: "#00D4FF", borderRadius: "2px", transition: "width 1s ease 0.4s" }} />
                                </div>
                            </div>

                            {/* Bar 3 — Concentration */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "#3A5470", textTransform: "uppercase" }}>
                                        Concentration
                                    </span>
                                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: concColor }}>
                                        {analysis.concentration_risk}
                                    </span>
                                </div>
                                <div style={{ height: "4px", background: "rgba(0,212,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${barWidths[2]}%`, background: concColor, borderRadius: "2px", transition: "width 1s ease 0.6s" }} />
                                </div>
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
                                        opacity: resultsVisible ? 1 : 0,
                                        transform: resultsVisible ? "translateX(0)" : "translateX(-12px)",
                                        transition: `opacity 0.5s ease ${i * 100}ms, transform 0.5s ease ${i * 100}ms`,
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
