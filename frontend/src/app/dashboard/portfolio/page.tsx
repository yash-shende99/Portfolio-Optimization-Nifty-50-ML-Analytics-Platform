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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Portfolio Risk Analyzer</h2>
                <p className="text-zinc-500">Deep dive into Beta, Sharpe, and component correlations.</p>
            </div>

            {!analysis ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8">
                    <h3 className="text-xl font-medium text-white mb-2">Configure Target Portfolio</h3>
                    <p className="text-zinc-500 max-w-md text-center mb-8">Enter your current custom positions below to run the ML Risk Matrix against your actual holdings.</p>

                    <div className="w-full max-w-2xl space-y-4 mb-8">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <span className="text-sm font-semibold text-zinc-500 uppercase flex-1">Ticker</span>
                            <span className="text-sm font-semibold text-zinc-500 uppercase w-24 text-left">Quantity</span>
                            <span className="text-sm font-semibold text-zinc-500 uppercase w-32 text-left ml-4 mr-10">Buy Price (₹)</span>
                        </div>
                        {holdings.map((holding, index) => (
                            <div key={index} className="flex gap-4 items-center">
                                <input
                                    type="text"
                                    placeholder="Ticker (e.g. INFY)"
                                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white flex-1 focus:outline-none focus:border-blue-500"
                                    value={holding.ticker.replace('.NS', '')}
                                    onChange={(e) => handleHoldingChange(index, "ticker", e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white w-24 focus:outline-none focus:border-blue-500"
                                    value={holding.quantity}
                                    onChange={(e) => handleHoldingChange(index, "quantity", e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white w-32 focus:outline-none focus:border-blue-500"
                                    value={holding.buyPrice}
                                    onChange={(e) => handleHoldingChange(index, "buyPrice", e.target.value)}
                                />
                                <button onClick={() => handleRemoveHolding(index)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                                    ✕
                                </button>
                            </div>
                        ))}
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                            <button onClick={handleAddHolding} className="text-blue-500 text-sm font-medium hover:text-blue-400">
                                + Add Asset
                            </button>
                            <div className="relative">
                                <input type="file" id="csv-upload" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                                <label htmlFor="csv-upload" className="text-zinc-400 text-sm hover:text-white cursor-pointer transition-colors flex items-center gap-2 border border-zinc-800 px-3 py-1.5 rounded-lg bg-zinc-900">
                                    <ScanLine size={14} /> Upload CSV
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing || holdings.length === 0}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {analyzing ? <span className="flex items-center gap-2"><ScanLine className="animate-spin" size={18} /> Analyzing Network...</span> : "Run ML Risk Assessment"}
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Activity size={24} /></div>
                            <div>
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Total Value</p>
                                <p className="text-2xl font-bold text-white">₹{analysis.total_value ? analysis.total_value.toLocaleString() : "0"}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><TrendingUp size={24} /></div>
                            <div>
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Expected Return</p>
                                <p className="text-2xl font-bold text-emerald-400">{analysis.expected_return}%</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-red-500/50 p-5 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg"><ShieldAlert size={24} /></div>
                            <div>
                                <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest">Concentration</p>
                                <p className="text-sm font-bold text-white mt-1">{analysis.concentration_risk}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg"><HeartPulse size={24} /></div>
                            <div>
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Health Score</p>
                                <p className="text-2xl font-bold text-white">
                                    {analysis.health_score} <span className="text-sm font-normal text-zinc-500">/ 100</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <ScanLine className="text-blue-500" size={20} /> AI Rebalancing Recommendations
                        </h3>
                        <div className="space-y-3">
                            {analysis.recommendations.map((rec: string, i: number) => (
                                <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
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
