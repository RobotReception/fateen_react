import { useState, useEffect, useRef } from "react"
import { Users, MessageSquare, UserCog, Radio } from "lucide-react"

interface HeroCard {
    label: string
    sublabel: string
    value: number
    icon: React.ElementType
    gradient: string
    glow: string
}

function useCountUp(end: number, duration = 1200) {
    const [count, setCount] = useState(0)
    const raf = useRef<number>(0)
    const start = useRef(0)
    useEffect(() => {
        if (!end) { setCount(0); return }
        start.current = performance.now()
        const step = (ts: number) => {
            const elapsed = ts - start.current
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * end))
            if (progress < 1) raf.current = requestAnimationFrame(step)
        }
        raf.current = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf.current)
    }, [end, duration])
    return count
}

function HeroCardItem({ card }: { card: HeroCard }) {
    const displayValue = useCountUp(card.value)
    const Icon = card.icon
    const [hovered, setHovered] = useState(false)

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "relative",
                borderRadius: 16,
                padding: "18px 18px 16px",
                background: card.gradient,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "default",
                transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
                boxShadow: hovered ? card.glow : "0 4px 16px -4px rgba(0,0,0,0.18)",
                transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s",
                minHeight: 100,
            }}
        >
            {/* Shine */}
            <div style={{
                position: "absolute", top: 0, left: "-100%",
                width: "60%", height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                transform: hovered ? "translateX(350%)" : "translateX(0%)",
                transition: "transform 0.55s ease",
                pointerEvents: "none",
            }} />
            {/* Orbs */}
            <div style={{ position: "absolute", top: -18, right: -18, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -22, left: -12, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

            {/* Top row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        {card.sublabel}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginTop: 1 }}>
                        {card.label}
                    </p>
                </div>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    <Icon size={18} color="#fff" strokeWidth={1.8} />
                </div>
            </div>

            {/* Value */}
            <div style={{ position: "relative", zIndex: 1, marginTop: 10 }}>
                <p style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {displayValue.toLocaleString("ar-SA")}
                </p>
            </div>
        </div>
    )
}

interface HeroCardsProps {
    totalCustomers: number
    totalMessages: number
    totalUsers: number
    totalChannels: number
}

export function HeroCards({ totalCustomers, totalMessages, totalUsers, totalChannels }: HeroCardsProps) {
    const cards: HeroCard[] = [
        { label: "إجمالي العملاء", sublabel: "contacts", value: totalCustomers, icon: Users, gradient: "linear-gradient(135deg, var(--t-info), #1E40AF)", glow: "0 14px 40px -8px rgba(59,130,246,0.5)" },
        { label: "إجمالي الرسائل", sublabel: "messages", value: totalMessages, icon: MessageSquare, gradient: "linear-gradient(135deg, #8B5CF6, #5B21B6)", glow: "0 14px 40px -8px rgba(139,92,246,0.5)" },
        { label: "المستخدمين", sublabel: "users", value: totalUsers, icon: UserCog, gradient: "linear-gradient(135deg, var(--t-success), #065F46)", glow: "0 14px 40px -8px rgba(16,185,129,0.5)" },
        { label: "القنوات", sublabel: "channels", value: totalChannels, icon: Radio, gradient: "linear-gradient(135deg, var(--t-warning), #B45309)", glow: "0 14px 40px -8px rgba(245,158,11,0.5)" },
    ]

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {cards.map(card => <HeroCardItem key={card.label} card={card} />)}
        </div>
    )
}
