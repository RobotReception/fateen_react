import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts"

interface PlatformChartProps {
    platforms: Record<string, number>
}

const PLATFORM_META: Record<string, { label: string; color: string; gradient: [string, string] }> = {
    whatsapp: { label: "واتساب", color: "#25D366", gradient: ["#4ADE80", "#25D366"] },
    facebook: { label: "فيسبوك", color: "#1877F2", gradient: ["#60A5FA", "#1877F2"] },
    instagram: { label: "إنستقرام", color: "#E4405F", gradient: ["#F472B6", "#E4405F"] },
    telegram: { label: "تيليقرام", color: "#0088CC", gradient: ["#38BDF8", "#0088CC"] },
    webchat: { label: "ويب شات", color: "#6366F1", gradient: ["#A5B4FC", "#6366F1"] },
    web: { label: "ويب", color: "var(--t-text-muted)", gradient: ["var(--t-text-faint)", "var(--t-text-muted)"] },
}

function getPlatformInfo(key: string) {
    return PLATFORM_META[key.toLowerCase()] ?? { label: key, color: "var(--t-text-muted)", gradient: ["var(--t-text-faint)", "var(--t-text-muted)"] as [string, string] }
}


function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { color: string } }[]; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", borderRadius: 10, padding: "8px 12px", boxShadow: "0 6px 20px rgba(0,0,0,0.1)", direction: "rtl" }}>
            <p style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 3 }}>{label}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: payload[0].payload.color }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)" }}>{payload[0].value.toLocaleString("ar-SA")}</span>
                <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>عميل</span>
            </div>
        </div>
    )
}

export function PlatformChart({ platforms }: PlatformChartProps) {
    const entries = Object.entries(platforms)

    if (entries.length === 0) {
        return (
            <div style={{ background: "var(--t-card)", borderRadius: 16, border: "1px solid var(--t-border)", padding: "32px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--t-text-faint)" }}>لا يوجد بيانات منصات</p>
            </div>
        )
    }

    const data = entries
        .map(([key, value]) => { const info = getPlatformInfo(key); return { ...info, name: info.label, value, key } })
        .sort((a, b) => b.value - a.value)

    const maxVal = Math.max(...data.map(d => d.value), 1)

    return (
        <div style={{ background: "var(--t-card)", borderRadius: 16, border: "1px solid var(--t-border)", padding: "16px 18px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
                <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>توزيع المنصات</h3>
                    <p style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>عدد العملاء حسب كل منصة</p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {data.map(d => (
                        <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, background: `${d.color}14`, border: `1px solid ${d.color}30` }}>
                            <div style={{ width: 6, height: 6, borderRadius: 2, background: d.color }} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: d.color }}>{d.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div style={{ height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 6, left: -24, bottom: 0 }} barCategoryGap="35%">
                        <defs>
                            {data.map(d => (
                                <linearGradient key={d.key} id={`grad-${d.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={d.gradient[0]} stopOpacity={1} />
                                    <stop offset="100%" stopColor={d.gradient[1]} stopOpacity={0.9} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--t-border)" strokeDasharray="4 4" opacity={0.6} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--t-text-faint)", fontWeight: 500 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--t-text-faint)" }} tickCount={Math.min(maxVal + 1, 6)} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)", radius: 6 }} />
                        <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            isAnimationActive animationDuration={800} animationEasing="ease-out"
                        >
                            <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 800, fill: "var(--t-text)" }} formatter={(v: unknown) => (v as number).toLocaleString("ar-SA")} />
                            {data.map(entry => (
                                <Cell key={entry.key} fill={`url(#grad-${entry.key})`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
