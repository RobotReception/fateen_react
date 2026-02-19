import { Link } from "react-router-dom"
import type { ReactNode } from "react"

interface AuthLayoutProps {
    children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div
            className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
            dir="rtl"
        >
            {/* ── Bold gradient background ── */}
            <div
                className="fixed inset-0"
                style={{
                    background: "linear-gradient(135deg, #0a1628 0%, #0d2847 30%, #0e3a6e 50%, #0d2847 70%, #0a1628 100%)",
                }}
            />

            {/* ── Animated mesh blobs ── */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                {/* Top-right cyan blob */}
                <div
                    className="absolute"
                    style={{
                        width: "600px",
                        height: "600px",
                        top: "-15%",
                        right: "-10%",
                        background: "radial-gradient(circle, rgba(0,152,214,0.25) 0%, transparent 70%)",
                        borderRadius: "50%",
                        animation: "blob-drift-1 18s ease-in-out infinite",
                        filter: "blur(40px)",
                    }}
                />
                {/* Bottom-left deep blue blob */}
                <div
                    className="absolute"
                    style={{
                        width: "500px",
                        height: "500px",
                        bottom: "-12%",
                        left: "-8%",
                        background: "radial-gradient(circle, rgba(0,71,134,0.3) 0%, transparent 70%)",
                        borderRadius: "50%",
                        animation: "blob-drift-2 22s ease-in-out infinite",
                        filter: "blur(50px)",
                    }}
                />
                {/* Center-left teal accent */}
                <div
                    className="absolute"
                    style={{
                        width: "400px",
                        height: "400px",
                        top: "40%",
                        left: "20%",
                        background: "radial-gradient(circle, rgba(0,180,230,0.12) 0%, transparent 70%)",
                        borderRadius: "50%",
                        animation: "blob-drift-3 15s ease-in-out infinite",
                        filter: "blur(30px)",
                    }}
                />
                {/* Small floating sparkle */}
                <div
                    className="absolute"
                    style={{
                        width: "200px",
                        height: "200px",
                        top: "20%",
                        right: "30%",
                        background: "radial-gradient(circle, rgba(100,180,255,0.08) 0%, transparent 70%)",
                        borderRadius: "50%",
                        animation: "blob-drift-4 20s ease-in-out infinite",
                        filter: "blur(20px)",
                    }}
                />

                {/* Subtle dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
                        backgroundSize: "30px 30px",
                    }}
                />

                {/* Top glow line */}
                <div
                    className="absolute left-0 right-0 top-0 h-px"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(0,152,214,0.4), transparent)",
                    }}
                />
            </div>

            {/* ── Main content ── */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div
                    className="mb-8 flex justify-center"
                    style={{ animation: "auth-fade-down 0.6s ease-out" }}
                >
                    <Link to="/" className="transition-transform duration-300 hover:scale-105">
                        <img src="/logo.png" alt="فطين" className="h-16 object-contain drop-shadow-lg" />
                    </Link>
                </div>

                {/* Card */}
                <div
                    className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl"
                    style={{
                        animation: "auth-fade-up 0.5s ease-out",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 40px rgba(0,152,214,0.08)",
                    }}
                >
                    {children}
                </div>

                {/* Footer */}
                <p
                    className="mt-6 text-center text-xs text-white/40"
                    style={{ animation: "auth-fade-in 1s ease-out 0.3s both" }}
                >
                    © {new Date().getFullYear()} فطين — برايد آيديا
                </p>
            </div>

            {/* ── Keyframe animations ── */}
            <style>{`
                @keyframes blob-drift-1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(-40px, 30px) scale(1.1); }
                    50% { transform: translate(30px, -20px) scale(0.9); }
                    75% { transform: translate(-20px, -25px) scale(1.05); }
                }
                @keyframes blob-drift-2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(50px, -30px) scale(1.15); }
                    66% { transform: translate(-30px, 40px) scale(0.85); }
                }
                @keyframes blob-drift-3 {
                    0%, 100% { transform: translate(0, 0); }
                    25% { transform: translate(30px, 40px); }
                    50% { transform: translate(-20px, -30px); }
                    75% { transform: translate(-40px, 20px); }
                }
                @keyframes blob-drift-4 {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(45px, -35px) rotate(180deg); }
                }
                @keyframes auth-fade-up {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes auth-fade-down {
                    from { opacity: 0; transform: translateY(-16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes auth-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    )
}
