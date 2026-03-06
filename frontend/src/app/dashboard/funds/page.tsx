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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">AI Mutual Fund Ranking</h2>
                <p className="text-zinc-500">Discover ETFs and Mutual Funds ranked by Volatility and Alpha.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-zinc-500">Loading Fund Universe...</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Fund Name</th>
                                <th className="px-6 py-4 font-medium">Category</th>
                                <th className="px-6 py-4 font-medium text-right">AI Score</th>
                                <th className="px-6 py-4 font-medium text-right">Sharpe Ratio</th>
                                <th className="px-6 py-4 font-medium text-right">Alpha (%)</th>
                                <th className="px-6 py-4 font-medium text-right">Volatility (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {funds.sort((a, b) => b.score - a.score).map((fund) => (
                                <tr key={fund.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                        {fund.score > 90 && <ShieldCheck size={16} className="text-emerald-500" />}
                                        {fund.name}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">{fund.category}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2.5 py-1 rounded text-xs font-semibold ${fund.score > 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {fund.score}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-zinc-300">{fund.sharpe}</td>
                                    <td className="px-6 py-4 text-right text-emerald-400">+{fund.alpha}%</td>
                                    <td className="px-6 py-4 text-right text-zinc-400">{fund.volatility}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
