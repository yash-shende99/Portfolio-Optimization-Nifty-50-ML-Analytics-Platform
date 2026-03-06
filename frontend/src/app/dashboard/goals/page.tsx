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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Goal-Based Investment Planner</h2>
                <p className="text-zinc-500">Calculate the SIP required to reach your targets.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Input Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
                    <div className="flex items-center gap-2 mb-6 text-white text-lg font-medium">
                        <Target size={20} className="text-blue-500" /> Goal Parameters
                    </div>

                    <form onSubmit={calculateGoal} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Target Amount (₹)</label>
                            <input
                                type="number"
                                value={targetAmount} onChange={e => setTargetAmount(Number(e.target.value))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Time Horizon (Yrs)</label>
                                <input
                                    type="number"
                                    value={years} onChange={e => setYears(Number(e.target.value))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Exp. Return (%)</label>
                                <input
                                    type="number"
                                    value={expectedReturn} onChange={e => setExpectedReturn(Number(e.target.value))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 mt-4"
                        >
                            <Calculator size={18} />
                            {loading ? "Calculating..." : "Calculate SIP"}
                        </button>
                    </form>
                </div>

                {/* Results & Chart */}
                <div className="lg:col-span-2 space-y-6">
                    {result ? (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl text-center">
                                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Required SIP</p>
                                    <p className="text-2xl font-bold text-white">₹{result.required_sip.toLocaleString()}<span className="text-sm font-normal text-zinc-500">/mo</span></p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl text-center">
                                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Total Invested</p>
                                    <p className="text-2xl font-bold text-white">₹{result.total_investment.toLocaleString()}</p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl text-center">
                                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Wealth Gained</p>
                                    <p className="text-2xl font-bold text-emerald-400">+₹{result.estimated_wealth_gain.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl h-[400px]">
                                <h3 className="text-sm font-medium text-white mb-6">Compounding Trajectory</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                        <XAxis dataKey="year" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                            itemStyle={{ color: '#e4e4e7' }}
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                        />
                                        <Area type="monotone" dataKey="invested" stackId="1" stroke="#3b82f6" fill="url(#colorInvested)" strokeWidth={2} name="Principal" />
                                        <Area type="monotone" dataKey="growth" stackId="1" stroke="#10b981" fill="url(#colorGrowth)" strokeWidth={2} name="Interest" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl h-full min-h-[400px] flex flex-col justify-center items-center text-center p-8">
                            <Calculator size={48} className="text-zinc-800 mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Awaiting Parameters</h3>
                            <p className="text-zinc-500 max-w-sm">Enter your financial goals on the left to activate the AI compounding simulation.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
