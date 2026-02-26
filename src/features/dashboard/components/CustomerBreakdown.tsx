import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface CustomerBreakdownProps {
    assigned: number
    unassigned: number
    aiEnabled: number
}

const COLORS = {
    assigned: "#3B82F6",
    unassigned: "#CBD5E1",
    aiEnabled: "#A855F7",
}

export function CustomerBreakdown({ assigned, unassigned, aiEnabled }: CustomerBreakdownProps) {
    const total = assigned + unassigned

    const data = [
        { name: "مُعيّنين", value: assigned },
        { name: "غير مُعيّنين", value: unassigned },
    ]

    return (
        <div style={{
            background: "var(--t-card)",
            borderRadius: 16,
            border: "1px solid var(--t-border)",
            padding: "22px 20px",
            flex: 1,
            minWidth: 280,
        }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>
                تصنيف العملاء
            </h3>
            <p style={{ fontSize: 12, color: "var(--t-text-faint)", marginBottom: 16 }}>
                التوزيع حسب الحالة والتعيين
            </p>

            <div style={{ position: "relative", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell fill={COLORS.assigned} />
                            <Cell fill={COLORS.unassigned} />
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [value.toLocaleString("ar-SA"), ""]}
                            contentStyle={{
                                borderRadius: 10,
                                border: "1px solid var(--t-border)",
                                background: "var(--t-card)",
                                color: "var(--t-text)",
                                fontSize: 13,
                                direction: "rtl",
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center", pointerEvents: "none",
                }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: "var(--t-text)", lineHeight: 1.1 }}>
                        {total.toLocaleString("ar-SA")}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--t-text-faint)" }}>إجمالي</p>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginTop: 8 }}>
                {[
                    { label: "مُعيّنين", value: assigned, color: COLORS.assigned },
                    { label: "غير مُعيّنين", value: unassigned, color: COLORS.unassigned },
                    { label: "AI مُفعّل", value: aiEnabled, color: COLORS.aiEnabled },
                ].map(item => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: item.color,
                        }} />
                        <span style={{ fontSize: 12, color: "var(--t-text-muted)" }}>
                            {item.label} ({item.value.toLocaleString("ar-SA")})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
