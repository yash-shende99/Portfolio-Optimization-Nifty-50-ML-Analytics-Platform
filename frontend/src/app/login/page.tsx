"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [tab, setTab] = useState<"login" | "register">("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Profile Stats
    const [age, setAge] = useState(30);
    const [income, setIncome] = useState(100000);
    const [savings, setSavings] = useState(20000);
    const [risk, setRisk] = useState(5);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);

            const res = await fetch("http://localhost:8000/auth/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
            });

            if (!res.ok) throw new Error("Invalid username or password");

            const data = await res.json();
            localStorage.setItem("token", data.access_token);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Register User
            const regRes = await fetch("http://localhost:8000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!regRes.ok) throw new Error("Registration failed. Username may exist.");
            const regData = await regRes.json();
            const token = regData.access_token;
            localStorage.setItem("token", token);

            // 2. Set Profile
            const profRes = await fetch("http://localhost:8000/auth/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    age: age,
                    income: income,
                    monthly_savings: savings,
                    risk_tolerance: risk,
                    goals: ["Wealth Generation"]
                }),
            });

            if (!profRes.ok) throw new Error("Failed to create profile");

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-light tracking-tight text-white mb-2">Wealth OS</h1>
                    <p className="text-zinc-400 text-sm">Institutional-Grade Portfolio Management</p>
                </div>

                <div className="flex bg-zinc-950 rounded-lg p-1 mb-6 border border-zinc-800">
                    <button
                        className={`flex-1 text-sm py-2 rounded-md transition-colors ${tab === "login" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                        onClick={() => setTab("login")}
                        type="button"
                    >
                        Login
                    </button>
                    <button
                        className={`flex-1 text-sm py-2 rounded-md transition-colors ${tab === "register" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                        onClick={() => setTab("register")}
                        type="button"
                    >
                        Create Account
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {tab === "login" ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Username</label>
                            <input
                                type="text"
                                value={username} onChange={e => setUsername(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                            <input
                                type="password"
                                value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-medium py-2 rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-4"
                        >
                            {loading ? "Authenticating..." : "Sign In"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={username} onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                            <h3 className="text-sm font-medium text-white mb-4">Risk Profile Assessment</h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Age</label>
                                        <input
                                            type="number"
                                            value={age} onChange={e => setAge(parseInt(e.target.value))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Income (₹)</label>
                                        <input
                                            type="number"
                                            value={income} onChange={e => setIncome(parseInt(e.target.value))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Target Monthly Savings (₹)</label>
                                    <input
                                        type="number"
                                        value={savings} onChange={e => setSavings(parseInt(e.target.value))}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                                        Risk Tolerance: {risk}/10
                                    </label>
                                    <input
                                        type="range" min="1" max="10"
                                        value={risk} onChange={e => setRisk(parseInt(e.target.value))}
                                        className="w-full accent-blue-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                                        <span>Conservative</span>
                                        <span>Aggressive</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 mt-4"
                        >
                            {loading ? "Creating Profile..." : "Initialize Portfolio"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
