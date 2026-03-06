"use client";

import { useEffect, useState } from "react";
import { Activity, Layers, ShieldAlert, TrendingUp, AlertCircle, ScanLine } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e', '#6366f1'];

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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
                <p className="text-zinc-500">AI-driven real-time portfolio topology and market regime.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <Activity size={16} />
                        <h3 className="text-xs uppercase font-semibold tracking-wider">Investable Capital</h3>
                    </div>
                    <p className="text-2xl font-medium text-white">
                        ₹{(profile?.monthly_savings || 20000).toLocaleString()}
                        <span className="text-sm font-normal text-zinc-500 ml-1">/ mo</span>
                    </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <ShieldAlert size={16} />
                        <h3 className="text-xs uppercase font-semibold tracking-wider">AI Regime</h3>
                    </div>
                    <p className="text-2xl font-medium text-amber-500">
                        {regime?.predicted_regime || "Bull"}
                        <span className="text-sm font-normal text-zinc-500 ml-2">Market</span>
                    </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <TrendingUp size={16} />
                        <h3 className="text-xs uppercase font-semibold tracking-wider">News Sentiment</h3>
                    </div>
                    <p className={`text-2xl font-medium ${sentimentColor}`}>
                        {sentimentStr}
                    </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <Layers size={16} />
                        <h3 className="text-xs uppercase font-semibold tracking-wider">Positions</h3>
                    </div>
                    <p className="text-2xl font-medium text-white">
                        24
                        <span className="text-sm font-normal text-zinc-500 ml-2">Active</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-[400px] flex flex-col justify-center items-center relative p-6">
                    <h3 className="w-full text-left text-lg font-medium mb-4 text-white z-10">Current Target Allocation</h3>
                    {loadingAlloc ? (
                        <div className="flex flex-col items-center justify-center text-zinc-500 z-10">
                            <AlertCircle size={48} className="text-zinc-700 mb-4 animate-pulse" />
                            <p>Generating optimal weights...</p>
                        </div>
                    ) : allocations.length > 0 ? (
                        <div className="w-full h-full min-h-[350px] z-10 flex items-center justify-center">
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
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500 z-10">
                            <AlertCircle size={48} className="text-zinc-700 mb-4" />
                            <p>No valid portfolio weights found for current risk profile.</p>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
                </div>

                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-4 flex items-center justify-between">
                            AI Explainer (XAI)
                            <span className="text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-1 rounded">SHAP Values</span>
                        </h3>
                        <div className="space-y-4">
                            {loadingXAI ? (
                                <div className="text-zinc-500 text-sm animate-pulse">Computing feature attributions...</div>
                            ) : explanations.length > 0 ? (
                                explanations.map((exp: any, i: number) => (
                                    <div key={i} className="p-3 bg-zinc-950 rounded border border-zinc-800 text-sm text-zinc-300">
                                        <span className="text-blue-400 font-medium tracking-wide">{exp.ticker}:</span> {exp.justification}
                                    </div>
                                ))
                            ) : (
                                <div className="text-zinc-500 text-sm">No explanations available.</div>
                            )}
                            {regime && regime.predicted_regime === "Bear" && (
                                <div className="p-3 bg-red-950/20 border border-red-900/50 rounded text-sm text-zinc-300">
                                    <span className="text-red-400 font-medium tracking-wide">RL BANDIT:</span> Risk tolerance dynamically shifted downward to offset high Bear regime probabilities ({Math.round((regime.bear_prob || 0) * 100)}%).
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Portfolio Recommendations Panel */}
            {customAnalysis && customAnalysis.recommendations && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <ScanLine className="text-purple-500" size={20} /> AI Portfolio Doctor
                        </h3>
                        {customAnalysis.health_score !== undefined && (
                            <div className="flex gap-6 items-center">
                                <div className="text-right">
                                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Expected Return</p>
                                    <p className="text-xl font-bold text-emerald-400">{customAnalysis.expected_return}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Health Score</p>
                                    <p className="text-xl font-bold text-white">{customAnalysis.health_score} <span className="text-sm text-zinc-500">/ 100</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customAnalysis.recommendations.map((rec: string, i: number) => (
                            <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 relative overflow-hidden flex items-start gap-3">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                                <AlertCircle className="text-purple-500 mt-0.5 shrink-0" size={16} />
                                <span>{rec}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Portfolio Breakdown Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6">
                <div className="p-6 border-b border-zinc-800">
                    <h3 className="text-lg font-medium text-white">Target Stock Details & ML Explanations</h3>
                    <p className="text-sm text-zinc-500 mt-1">Full breakdown of algorithmic selection and asset sizing.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950/50 text-xs uppercase font-medium text-zinc-500 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4">Asset Ticker</th>
                                <th className="px-6 py-4">Target Weight</th>
                                <th className="px-6 py-4">Algorithm Justification (SHAP)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {allocations.map((alloc, idx) => {
                                const exp = allExplanations.find(e => e.ticker.replace('.NS', '') === alloc.name);
                                return (
                                    <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{alloc.name}</td>
                                        <td className="px-6 py-4 text-emerald-400 font-medium">{alloc.value}%</td>
                                        <td className="px-6 py-4">
                                            {exp ? (
                                                <span className="text-zinc-300">{exp.justification}</span>
                                            ) : (
                                                <span className="text-zinc-600 italic">No attribution data available</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {allocations.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">Pipeline analysis currently unavailable.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
