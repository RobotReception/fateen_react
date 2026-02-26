import { useState, useEffect, useRef } from "react"
import { Users, MessageSquare, UserCog, Radio } from "lucide-react"

interface HeroCard {
    label: string
    value: number
    icon: React.ElementType
    gradient: string
    iconBg: string
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
            // ease-out quad
            const eased = 1 - (1 - progress) * (1 - progress)
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

    return (
        <div
            style={{
                position: "relative",
                borderRadius: 16,
                padding: "24px 22px",
                background: card.gradient,
                overflow: "hidden",
                minHeight: 130,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s",
                cursor: "default",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)"
                e.currentTarget.style.boxShadow = "0 12px 32px -8px rgba(0,0,0,0.18)"
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
            }}
        >
            {/* Background decoration */}
            <div style={{
                position: "absolute", top: -20, left: -20,
                width: 100, height: 100, borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
            }} />
            <div style={{
                position: "absolute", bottom: -30, right: -30,
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
            }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
                        {card.label}
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                        {displayValue.toLocaleString("ar-SA")}
                    </p>
                </div>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: card.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <Icon size={22} color="#fff" strokeWidth={1.8} />
                </div>
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
        {
            label: "إجمالي العملاء",
            value: totalCustomers,
            icon: Users,
            gradient: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
            iconBg: "rgba(255,255,255,0.18)",
        },
        {
            label: "إجمالي الرسائل",
            value: totalMessages,
            icon: MessageSquare,
            gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
            iconBg: "rgba(255,255,255,0.18)",
        },
        {
            label: "المستخدمين",
            value: totalUsers,
            icon: UserCog,
            gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            iconBg: "rgba(255,255,255,0.18)",
        },
        {
            label: "القنوات",
            value: totalChannels,
            icon: Radio,
            gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            iconBg: "rgba(255,255,255,0.18)",
        },
    ]

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
        }}>
            {cards.map(card => (
                <HeroCardItem key={card.label} card={card} />
            ))}
        </div>
    )
}
