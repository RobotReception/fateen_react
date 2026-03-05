import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { CheckCircle2, Clock3 } from "lucide-react"

interface SessionsChartProps { open: number; closed: number }

const COLORS = { open: "#22C55E", closed: "#64748B" }

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", borderRadius: 10, padding: "8px 12px", fontSize: 12, direction: "rtl", boxShadow: "0 6px 16px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: payload[0].payload.color }} />
                <span style={{ color: "var(--t-text-faint)" }}>{payload[0].name}</span>
                <span style={{ fontWeight: 700, color: "var(--t-text)" }}>{payload[0].value.toLocaleString("ar-SA")}</span>
            </div>
        </div>
    )
}

export function SessionsChart({ open, closed }: SessionsChartProps) {
    const total = open + closed
    const openPct = total > 0 ? Math.round((open / total) * 100) : 0
    const closedPct = total > 0 ? 100 - openPct : 0
    const data = [
        { name: "مفتوحة", value: open, color: COLORS.open },
        { name: "مغلقة", value: closed, color: COLORS.closed },
    ]

    return (
        <div style={{ background: "var(--t-card)", borderRadius: 16, border: "1px solid var(--t-border)", padding: "16px 18px" }}>
            <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>حالة الجلسات</h3>
                <p style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>توزيع الجلسات المفتوحة والمغلقة</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Donut */}
                <div style={{ position: "relative", height: 140, width: 140, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={44} outerRadius={62} paddingAngle={4} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                        <p style={{ fontSize: 20, fontWeight: 900, color: "var(--t-text)", lineHeight: 1 }}>{total.toLocaleString("ar-SA")}</p>
                        <p style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 2 }}>إجمالي</p>
                    </div>
                </div>

                {/* Bars */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                        { label: "مفتوحة", value: open, pct: openPct, color: COLORS.open, icon: Clock3 },
                        { label: "مغلقة", value: closed, pct: closedPct, color: COLORS.closed, icon: CheckCircle2 },
                    ].map(item => {
                        const ItemIcon = item.icon
                        return (
                            <div key={item.label}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                        <ItemIcon size={12} color={item.color} strokeWidth={2.5} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text)" }}>{item.label}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)" }}>{item.value.toLocaleString("ar-SA")}</span>
                                        <span style={{ fontSize: 10, color: "var(--t-text-faint)", marginRight: 3 }}>({item.pct}%)</span>
                                    </div>
                                </div>
                                <div style={{ height: 5, borderRadius: 5, background: "var(--t-border)", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${item.pct}%`, borderRadius: 5, background: item.color, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
