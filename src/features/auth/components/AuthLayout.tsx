import type { ReactNode } from "react"

interface AuthLayoutProps {
    children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col lg:flex-row" dir="rtl">

            {/* ═══════════════════════════════════════════════════════════
                 BRANDING PANEL
               ═══════════════════════════════════════════════════════════ */}

            {/* ── Tablet branding strip (md-lg only) ── */}
            <div
                className="hidden md:flex lg:hidden items-center justify-center gap-4 py-4 px-6"
                style={{
                    background: "linear-gradient(135deg, #1A6BCC, #2E8FE8, #5AB3FF)",
                }}
            >
                <img src="/darai_logo.png" alt="Dar AI" className="h-10 w-10 rounded-lg object-contain" />
                <div className="text-right">
                    <h2 className="text-white font-bold text-lg leading-tight">أهلاً بك في داري</h2>
                    <p className="text-white/60 text-xs">نظام إدارة المحادثات الذكية</p>
                </div>
            </div>

            {/* ── Desktop branding panel (lg+) ── */}
            <div
                className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden flex-col items-center justify-center"
                style={{
                    background: "#F5F7FA",
                }}
            >
                {/* ── Professional animated overlays ── */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">

                    {/* ▸ Aurora wave — flowing gradient */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "linear-gradient(120deg, transparent 20%, rgba(1,69,178,0.06) 35%, rgba(255,107,26,0.04) 50%, rgba(1,69,178,0.06) 65%, transparent 80%)",
                            backgroundSize: "300% 300%",
                            animation: "aurora-wave 8s ease-in-out infinite",
                        }}
                    />

                    {/* ▸ Blue blob - top right */}
                    <div
                        className="absolute"
                        style={{
                            width: "500px",
                            height: "500px",
                            top: "-100px",
                            right: "-80px",
                            background: "radial-gradient(circle, rgba(1,69,178,0.14), transparent 70%)",
                            borderRadius: "50%",
                            filter: "blur(50px)",
                            animation: "blob-drift-1 20s ease-in-out infinite",
                        }}
                    />

                    {/* ▸ Orange blob - bottom left */}
                    <div
                        className="absolute"
                        style={{
                            width: "400px",
                            height: "400px",
                            bottom: "-60px",
                            left: "40px",
                            background: "radial-gradient(circle, var(--t-brand-orange-soft), transparent 70%)",
                            borderRadius: "50%",
                            filter: "blur(50px)",
                            animation: "blob-drift-2 15s 5s ease-in-out infinite",
                        }}
                    />

                    {/* ▸ Orbiting rings around center */}
                    {[0, 1, 2].map((i) => (
                        <div
                            key={`ring-${i}`}
                            className="absolute"
                            style={{
                                width: `${200 + i * 60}px`,
                                height: `${200 + i * 60}px`,
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                border: `1px solid rgba(1,69,178,${0.12 - i * 0.03})`,
                                borderRadius: "50%",
                                animation: `orbit-spin ${12 + i * 4}s linear infinite${i === 1 ? ' reverse' : ''}`,
                            }}
                        >
                            {/* Orbiting dot */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "-4px",
                                    left: "50%",
                                    width: "8px",
                                    height: "8px",
                                    marginLeft: "-4px",
                                    borderRadius: "50%",
                                    background: i === 1 ? "var(--t-brand-orange)" : "#1A6BCC",
                                    boxShadow: i === 1
                                        ? "0 0 12px var(--t-brand-orange-soft)"
                                        : "0 0 12px rgba(1,69,178,0.5)",
                                }}
                            />
                        </div>
                    ))}

                    {/* ▸ Pulsing glow aura - center */}
                    <div
                        className="absolute"
                        style={{
                            width: "300px",
                            height: "300px",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            background: "radial-gradient(circle, rgba(1,69,178,0.08) 0%, rgba(255,107,26,0.03) 50%, transparent 70%)",
                            borderRadius: "50%",
                            animation: "logo-pulse 4s ease-in-out infinite",
                        }}
                    />

                    {/* ▸ Diagonal light sweep */}
                    <div
                        className="absolute"
                        style={{
                            width: "150%",
                            height: "200px",
                            top: "-20%",
                            left: "-50%",
                            background: "linear-gradient(180deg, transparent, rgba(1,69,178,0.03), transparent)",
                            transform: "rotate(-35deg)",
                            animation: "light-sweep 6s ease-in-out infinite",
                            filter: "blur(15px)",
                        }}
                    />

                    {/* ▸ Floating particles */}
                    {[
                        { size: 5, left: "15%", delay: "0s", dur: "8s", color: "rgba(1,69,178,0.35)" },
                        { size: 4, left: "35%", delay: "1.5s", dur: "10s", color: "var(--t-brand-orange-soft)" },
                        { size: 6, left: "55%", delay: "0.8s", dur: "9s", color: "rgba(1,69,178,0.25)" },
                        { size: 3, left: "75%", delay: "2.5s", dur: "11s", color: "rgba(90,179,255,0.35)" },
                        { size: 5, left: "45%", delay: "3s", dur: "7.5s", color: "var(--t-brand-orange-soft)" },
                        { size: 4, left: "85%", delay: "1s", dur: "12s", color: "rgba(1,69,178,0.3)" },
                    ].map((p, i) => (
                        <div
                            key={`p-${i}`}
                            className="absolute"
                            style={{
                                width: p.size,
                                height: p.size,
                                left: p.left,
                                bottom: "-5%",
                                borderRadius: "50%",
                                background: p.color,
                                animation: `particle-float ${p.dur} ease-in-out ${p.delay} infinite`,
                                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                            }}
                        />
                    ))}

                    {/* ▸ Dot grid */}
                    <div
                        className="absolute inset-0 opacity-[0.025]"
                        style={{
                            backgroundImage: "radial-gradient(rgba(1,69,178,0.8) 1px, transparent 1px)",
                            backgroundSize: "32px 32px",
                        }}
                    />
                </div>

                {/* ── Logo + Text ── */}
                <div
                    className="relative z-10 flex flex-col items-center justify-center gap-8"
                    style={{ animation: "auth-fade-in 0.8s ease-out" }}
                >
                    <img
                        src="/logo_verticaloginl.png"
                        alt="Dar AI"
                        style={{
                            height: 600,
                            objectFit: "contain",
                            filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.08))",
                        }}
                    />

                    <div className="text-center" style={{ maxWidth: 380 }}>
                        <h2
                            className="font-bold mb-3"
                            style={{
                                fontSize: "clamp(1.4rem, 2.2vw, 1.8rem)",
                                lineHeight: 1.4,
                                color: "#0D1526",
                            }}
                        >
                            أهلاً بك في داري
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: "#5A708A" }}>
                            نظام إدارة المحادثات الذكية — اتصل، أدر، وطوّر أعمالك
                        </p>
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap justify-center gap-2.5">
                        {["ذكاء اصطناعي", "محادثات موحدة", "تحليلات متقدمة"].map((text, i) => (
                            <span
                                key={text}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: i === 0 ? "var(--t-brand-orange)" : "#1A6BCC",
                                    background: i === 0 ? "#FFF3EC" : "#EBF4FF",
                                    border: i === 0 ? "1px solid var(--t-brand-orange-soft)" : "1px solid rgba(1,69,178,0.15)",
                                }}
                            >
                                {text}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Footer ── */}
                <p
                    className="absolute bottom-5 left-0 right-0 text-center text-xs"
                    style={{ color: "#94A8C0", animation: "auth-fade-in 1.2s ease-out" }}
                >
                    © {new Date().getFullYear()} داري — Dar AI
                </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                 FORM PANEL
               ═══════════════════════════════════════════════════════════ */}
            <div className="flex w-full flex-col lg:w-[48%] xl:w-[45%]">

                {/* ── Mobile-only dark background (< md) ── */}
                <div
                    className="fixed inset-0 md:hidden"
                    style={{
                        background: "linear-gradient(135deg, #0a1628 0%, #0d2847 35%, #0e3a6e 55%, #0d2847 75%, #0a1628 100%)",
                    }}
                />
                {/* Mobile floating blobs */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden md:hidden">
                    <div
                        className="absolute"
                        style={{
                            width: "min(400px, 80vw)",
                            height: "min(400px, 80vw)",
                            top: "-10%",
                            right: "-15%",
                            background: "radial-gradient(circle, rgba(1,69,178,0.2) 0%, transparent 70%)",
                            borderRadius: "50%",
                            animation: "blob-drift-1 18s ease-in-out infinite",
                            filter: "blur(40px)",
                        }}
                    />
                    <div
                        className="absolute"
                        style={{
                            width: "min(350px, 70vw)",
                            height: "min(350px, 70vw)",
                            bottom: "-10%",
                            left: "-10%",
                            background: "radial-gradient(circle, rgba(1,69,178,0.25) 0%, transparent 70%)",
                            borderRadius: "50%",
                            animation: "blob-drift-2 22s ease-in-out infinite",
                            filter: "blur(40px)",
                        }}
                    />
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
                            backgroundSize: "30px 30px",
                        }}
                    />
                </div>

                {/* ── Tablet/desktop clean bg (md+) ── */}
                <div className="hidden md:block fixed inset-0 lg:relative lg:hidden" style={{ background: "#F5F7FA" }} />

                {/* ── Form container ── */}
                <div className="relative z-10 flex flex-1 flex-col items-center justify-center auth-form-container">

                    {/* Card */}
                    <div
                        className="auth-card w-full"
                        style={{
                            animation: "auth-fade-up 0.5s ease-out",
                        }}
                    >
                        {children}
                    </div>

                    {/* Footer — mobile */}
                    <p
                        className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs text-white/40 md:hidden"
                        style={{ animation: "auth-fade-in 1s ease-out 0.3s both" }}
                    >
                        © {new Date().getFullYear()} داري — Dar AI
                    </p>

                    {/* Footer — tablet & desktop */}
                    <p
                        className="mt-6 hidden text-center text-xs text-gray-400 md:block"
                        style={{ animation: "auth-fade-in 1s ease-out 0.3s both" }}
                    >
                        © {new Date().getFullYear()} داري — Dar AI
                    </p>
                </div>
            </div>

            {/* ── Responsive styles + Keyframe animations ── */}
            <style>{`
                /* ── Form container responsive padding ── */
                .auth-form-container {
                    padding: 20px 16px;
                }
                @media (min-width: 400px) {
                    .auth-form-container {
                        padding: 28px 24px;
                    }
                }
                @media (min-width: 640px) {
                    .auth-form-container {
                        padding: 32px 40px;
                    }
                }
                @media (min-width: 768px) {
                    .auth-form-container {
                        padding: 40px 48px;
                    }
                }
                @media (min-width: 1024px) {
                    .auth-form-container {
                        padding: 40px 48px;
                    }
                }
                @media (min-width: 1280px) {
                    .auth-form-container {
                        padding: 48px 64px;
                    }
                }

                /* ── Card responsive styling ── */
                .auth-card {
                    max-width: 100%;
                    border-radius: 16px;
                    padding: 24px 20px;
                }

                @media (max-width: 399px) {
                    .auth-card {
                        border-radius: 14px;
                        padding: 20px 16px;
                    }
                }

                @media (min-width: 400px) and (max-width: 639px) {
                    .auth-card {
                        border-radius: 16px;
                        padding: 24px 20px;
                    }
                }

                @media (min-width: 640px) {
                    .auth-card {
                        max-width: 440px;
                        border-radius: 20px;
                        padding: 28px 28px;
                    }
                }

                @media (min-width: 768px) {
                    .auth-card {
                        max-width: 460px;
                        border-radius: 24px;
                        padding: 36px 32px;
                        background: #ffffff;
                        border: 1px solid var(--t-border);
                        box-shadow: 0 20px 50px -12px rgba(0,0,0,0.08), 0 4px 20px -4px rgba(0,0,0,0.04);
                    }
                }

                @media (min-width: 1024px) {
                    .auth-card {
                        max-width: 440px;
                        border-radius: 24px;
                        padding: 36px 32px;
                        background: #ffffff;
                        border: 1px solid #f0f0f0;
                        box-shadow: 0 20px 50px -12px rgba(0,0,0,0.06), 0 4px 20px -4px rgba(0,0,0,0.03);
                    }
                }

                @media (min-width: 1280px) {
                    .auth-card {
                        max-width: 460px;
                        padding: 40px 36px;
                    }
                }

                @media (max-width: 767px) {
                    .auth-card {
                        background: rgba(255,255,255,0.95);
                        border: 1px solid rgba(255,255,255,0.15);
                        box-shadow: 0 25px 60px rgba(0,0,0,0.3), 0 0 40px rgba(1,69,178,0.08);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                    }
                }

                /* ── Input field responsive sizing ── */
                .auth-card input[type="text"],
                .auth-card input[type="email"],
                .auth-card input[type="password"],
                .auth-card input[type="tel"] {
                    font-size: 15px !important;
                    padding: 10px 14px !important;
                    border-radius: 10px !important;
                }
                @media (min-width: 640px) {
                    .auth-card input[type="text"],
                    .auth-card input[type="email"],
                    .auth-card input[type="password"],
                    .auth-card input[type="tel"] {
                        font-size: 14px !important;
                        padding: 11px 16px !important;
                        border-radius: 12px !important;
                    }
                }

                /* ── Headings responsive ── */
                .auth-card h2, .auth-card h1 {
                    font-size: clamp(1.25rem, 4vw, 1.65rem);
                    line-height: 1.3;
                }

                /* ── Submit button responsive ── */
                .auth-card button[type="submit"] {
                    border-radius: 12px !important;
                    padding: 12px 24px !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                }
                @media (min-width: 640px) {
                    .auth-card button[type="submit"] {
                        padding: 13px 28px !important;
                        font-size: 15px !important;
                    }
                }

                /* ── Safe area for notched phones ── */
                @supports (padding-top: env(safe-area-inset-top)) {
                    .auth-form-container {
                        padding-top: max(20px, env(safe-area-inset-top));
                        padding-bottom: max(20px, env(safe-area-inset-bottom));
                    }
                }

                /* ── Landscape phone ── */
                @media (max-height: 600px) and (orientation: landscape) {
                    .auth-form-container {
                        padding-top: 12px;
                        padding-bottom: 12px;
                    }
                    .auth-card {
                        padding-top: 16px !important;
                        padding-bottom: 16px !important;
                    }
                }

                /* ═══ Keyframe animations ═══ */

                @keyframes aurora-wave {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes orbit-spin {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }

                @keyframes logo-pulse {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.5);
                        opacity: 0.15;
                    }
                }

                @keyframes light-sweep {
                    0%, 100% {
                        transform: rotate(-35deg) translateX(-100%);
                        opacity: 0;
                    }
                    15% { opacity: 1; }
                    50% {
                        transform: rotate(-35deg) translateX(100%);
                        opacity: 1;
                    }
                    65% { opacity: 0; }
                    66%, 99% {
                        transform: rotate(-35deg) translateX(-100%);
                        opacity: 0;
                    }
                }

                @keyframes particle-float {
                    0% {
                        transform: translateY(0) translateX(0) scale(1);
                        opacity: 0;
                    }
                    10% { opacity: 1; }
                    50% {
                        transform: translateY(-50vh) translateX(20px) scale(1.2);
                        opacity: 0.8;
                    }
                    90% { opacity: 0; }
                    100% {
                        transform: translateY(-105vh) translateX(-10px) scale(0.8);
                        opacity: 0;
                    }
                }

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
