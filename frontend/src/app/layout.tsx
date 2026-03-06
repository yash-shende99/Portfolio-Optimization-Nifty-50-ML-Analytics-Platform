import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
    title: "AI Personal Wealth Manager",
    description: "Advanced Portfolios, Goals, and Multi-Asset Recommendations",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased dark:bg-zinc-950 dark:text-zinc-50 bg-white text-zinc-900 border-zinc-200 dark:border-zinc-800">
                {children}
            </body>
        </html>
    );
}
