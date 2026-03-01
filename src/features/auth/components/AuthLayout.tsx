import { Link } from "react-router-dom"
import type { ReactNode } from "react"

interface AuthLayoutProps {
    children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col lg:flex-row" dir="rtl">

            {/* ═══════════════════════════════════════════════════════════
                 BRANDING PANEL
                 - Mobile:  Hidden (replaced by mobile-only background)
                 - Tablet:  Compact top strip with logo + tagline
                 - Desktop: Full 52% side panel with animations
               ═══════════════════════════════════════════════════════════ */}

            {/* ── Tablet branding strip (md-lg only) ── */}
            <div
                className="hidden md:flex lg:hidden items-center justify-center gap-4 py-4 px-6"
                style={{
                    background: "linear-gradient(135deg, #004786, #0072b5, #0098d6)",
                }}
            >
                <img src="/Fateen_02_short_logo.png" alt="فطين" className="h-10 w-10 rounded-lg object-contain" />
                <div className="text-right">
                    <h2 className="text-white font-bold text-lg leading-tight">أهلاً بك في فطين</h2>
                    <p className="text-white/60 text-xs">نظام إدارة المحادثات الذكية</p>
                </div>
            </div>

            {/* ── Desktop branding panel (lg+) ── */}
            <div
                className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden flex-col"
                style={{
                    backgroundImage: "url('/Fateen_with_background.jpeg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {/* ── Creative animated overlays ── */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">

                    {/* ▸ Aurora wave — flowing gradient that undulates */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "linear-gradient(120deg, transparent 20%, rgba(0,180,255,0.08) 35%, rgba(0,220,255,0.12) 50%, rgba(0,180,255,0.08) 65%, transparent 80%)",
                            backgroundSize: "300% 300%",
                            animation: "aurora-wave 8s ease-in-out infinite",
                        }}
                    />

                    {/* ▸ Second aurora layer — slower, offset */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "linear-gradient(240deg, transparent 25%, rgba(100,200,255,0.06) 40%, rgba(0,150,220,0.1) 55%, rgba(100,200,255,0.06) 70%, transparent 85%)",
                            backgroundSize: "200% 200%",
                            animation: "aurora-wave-2 12s ease-in-out infinite",
                        }}
                    />

                    {/* ▸ Pulsing rings — emanate from logo center */}
                    {[0, 1.3, 2.6].map((delay, i) => (
                        <div
                            key={i}
                            className="absolute"
                            style={{
                                width: "300px",
                                height: "300px",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -60%)",
                                border: `1px solid rgba(255,255,255,${0.15 - i * 0.035})`,
                                borderRadius: "50%",
                                animation: `pulse-ring 4s ease-out ${delay}s infinite`,
                            }}
                        />
                    ))}

                    {/* ▸ Floating particles — 8 particles drifting upward */}
                    {[
                        { size: 4, left: "15%", delay: "0s", dur: "7s", opacity: 0.4 },
                        { size: 3, left: "30%", delay: "1.2s", dur: "9s", opacity: 0.3 },
                        { size: 5, left: "50%", delay: "0.5s", dur: "8s", opacity: 0.35 },
                        { size: 3, left: "65%", delay: "2s", dur: "10s", opacity: 0.25 },
                        { size: 4, left: "80%", delay: "0.8s", dur: "7.5s", opacity: 0.3 },
                        { size: 2, left: "25%", delay: "3s", dur: "11s", opacity: 0.2 },
                        { size: 3, left: "70%", delay: "1.5s", dur: "8.5s", opacity: 0.35 },
                        { size: 5, left: "40%", delay: "2.5s", dur: "9.5s", opacity: 0.25 },
                    ].map((p, i) => (
                        <div
                            key={i}
                            className="absolute"
                            style={{
                                width: p.size,
                                height: p.size,
                                left: p.left,
                                bottom: "-5%",
                                borderRadius: "50%",
                                background: `rgba(255,255,255,${p.opacity})`,
                                animation: `particle-float ${p.dur} ease-in-out ${p.delay} infinite`,
                                boxShadow: `0 0 ${p.size * 2}px rgba(100,200,255,${p.opacity * 0.5})`,
                            }}
                        />
                    ))}

                    {/* ▸ Diagonal light beam sweep */}
                    <div
                        className="absolute"
                        style={{
                            width: "150%",
                            height: "200px",
                            top: "-20%",
                            left: "-50%",
                            background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.04), transparent)",
                            transform: "rotate(-35deg)",
                            animation: "light-sweep 6s ease-in-out infinite",
                            filter: "blur(20px)",
                        }}
                    />

                    {/* ▸ Dot grid */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
                            backgroundSize: "32px 32px",
                        }}
                    />

                    {/* ▸ Top edge glow */}
                    <div
                        className="absolute left-0 right-0 top-0 h-px"
                        style={{
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                        }}
                    />
                </div>

                {/* ── Bottom content overlay ── */}
                <div className="relative z-10 mt-auto">
                    <div
                        style={{
                            background: "linear-gradient(to top, rgba(0,30,60,0.85) 0%, rgba(0,40,80,0.5) 50%, transparent 100%)",
                            padding: "60px 40px 36px",
                        }}
                    >
                        <div
                            className="text-center"
                            style={{ animation: "auth-fade-in 0.8s ease-out" }}
                        >
                            <h2
                                className="text-white font-bold mb-3"
                                style={{
                                    fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                                    lineHeight: 1.3,
                                    textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                                }}
                            >
                                أهلاً بك في فطين
                            </h2>
                            <p
                                className="text-white/65 leading-relaxed"
                                style={{
                                    fontSize: "clamp(0.85rem, 1.2vw, 1rem)",
                                    maxWidth: 400,
                                    margin: "0 auto",
                                }}
                            >
                                نظام إدارة المحادثات الذكية — اتصل، أدر، وطوّر أعمالك
                            </p>

                            {/* Feature pills */}
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                {["ذكاء اصطناعي", "محادثات موحدة", "تحليلات متقدمة"].map((text) => (
                                    <span
                                        key={text}
                                        style={{
                                            padding: "6px 16px",
                                            borderRadius: 20,
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: "rgba(255,255,255,0.8)",
                                            background: "rgba(255,255,255,0.1)",
                                            border: "1px solid rgba(255,255,255,0.15)",
                                            backdropFilter: "blur(8px)",
                                        }}
                                    >
                                        {text}
                                    </span>
                                ))}
                            </div>

                            {/* Footer */}
                            <p className="mt-6 text-xs text-white/30">
                                © {new Date().getFullYear()} فطين — برايد آيديا
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                 FORM PANEL
                 - Mobile:   Full-screen with dark gradient bg
                 - Tablet:   Clean white bg, centered card, no split
                 - Desktop:  48%/45% side panel, white bg, card
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
                            background: "radial-gradient(circle, rgba(0,152,214,0.2) 0%, transparent 70%)",
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
                            background: "radial-gradient(circle, rgba(0,71,134,0.25) 0%, transparent 70%)",
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
                <div className="hidden md:block fixed inset-0 lg:relative lg:hidden" style={{ background: "#f8fafc" }} />

                {/* ── Form container ── */}
                <div className="relative z-10 flex flex-1 flex-col items-center justify-center auth-form-container">

                    {/* Logo — mobile only (< md) */}
                    <div
                        className="mb-6 sm:mb-8 md:hidden"
                        style={{ animation: "auth-fade-down 0.6s ease-out" }}
                    >
                        <Link to="/" className="transition-transform duration-300 hover:scale-105 block">
                            <img
                                src="/logo.png"
                                alt="فطين"
                                className="h-10 sm:h-12 object-contain"
                                style={{
                                    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
                                }}
                            />
                        </Link>
                    </div>

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
                        © {new Date().getFullYear()} فطين — برايد آيديا
                    </p>

                    {/* Footer — tablet & desktop */}
                    <p
                        className="mt-6 hidden text-center text-xs text-gray-400 md:block"
                        style={{ animation: "auth-fade-in 1s ease-out 0.3s both" }}
                    >
                        © {new Date().getFullYear()} فطين — برايد آيديا
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

                /* Small phones (< 400px) — extra compact */
                @media (max-width: 399px) {
                    .auth-card {
                        border-radius: 14px;
                        padding: 20px 16px;
                    }
                }

                /* Phones (400-639px) */
                @media (min-width: 400px) and (max-width: 639px) {
                    .auth-card {
                        border-radius: 16px;
                        padding: 24px 20px;
                    }
                }

                /* Small tablets+ (640px) */
                @media (min-width: 640px) {
                    .auth-card {
                        max-width: 440px;
                        border-radius: 20px;
                        padding: 28px 28px;
                    }
                }

                /* Tablets (768px+) - clean white card look */
                @media (min-width: 768px) {
                    .auth-card {
                        max-width: 460px;
                        border-radius: 24px;
                        padding: 36px 32px;
                        background: #ffffff;
                        border: 1px solid #e5e7eb;
                        box-shadow: 0 20px 50px -12px rgba(0,0,0,0.08), 0 4px 20px -4px rgba(0,0,0,0.04);
                    }
                }

                /* Desktop (1024px+) */
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

                /* Large desktop (1280px+) */
                @media (min-width: 1280px) {
                    .auth-card {
                        max-width: 460px;
                        padding: 40px 36px;
                    }
                }

                /* Mobile card (< 768px): glassmorphism on dark bg */
                @media (max-width: 767px) {
                    .auth-card {
                        background: rgba(255,255,255,0.95);
                        border: 1px solid rgba(255,255,255,0.15);
                        box-shadow: 0 25px 60px rgba(0,0,0,0.3), 0 0 40px rgba(0,152,214,0.08);
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

                /* ── Landscape phone — reduce vertical space ── */
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

                /* ── Aurora waves ── */
                @keyframes aurora-wave {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes aurora-wave-2 {
                    0%   { background-position: 100% 0%; }
                    50%  { background-position: 0% 100%; }
                    100% { background-position: 100% 0%; }
                }

                /* ── Pulsing rings from center ── */
                @keyframes pulse-ring {
                    0% {
                        transform: translate(-50%, -60%) scale(1);
                        opacity: 0.6;
                    }
                    100% {
                        transform: translate(-50%, -60%) scale(3.5);
                        opacity: 0;
                    }
                }

                /* ── Particles drifting upward ── */
                @keyframes particle-float {
                    0% {
                        transform: translateY(0) translateX(0) scale(1);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    50% {
                        transform: translateY(-50vh) translateX(20px) scale(1.2);
                        opacity: 0.8;
                    }
                    90% {
                        opacity: 0;
                    }
                    100% {
                        transform: translateY(-105vh) translateX(-10px) scale(0.8);
                        opacity: 0;
                    }
                }

                /* ── Diagonal light beam sweep ── */
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

                /* ── Blob drifts (mobile) ── */
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

                /* ── UI transitions ── */
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
