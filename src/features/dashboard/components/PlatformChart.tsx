import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface PlatformChartProps {
    platforms: Record<string, number>
}

const PLATFORM_META: Record<string, { label: string; color: string }> = {
    whatsapp: { label: "واتساب", color: "#25D366" },
    facebook: { label: "فيسبوك", color: "#1877F2" },
    instagram: { label: "إنستقرام", color: "#E4405F" },
    telegram: { label: "تلقرام", color: "#0088CC" },
    web: { label: "ويب", color: "#6B7280" },
}

function getPlatformInfo(key: string) {
    return PLATFORM_META[key.toLowerCase()] ?? { label: key, color: "#6B7280" }
}

export function PlatformChart({ platforms }: PlatformChartProps) {
    const entries = Object.entries(platforms)

    if (entries.length === 0) {
        return (
            <div style={{
                background: "var(--t-card)",
                borderRadius: 16,
                border: "1px solid var(--t-border)",
                padding: "28px 20px",
                textAlign: "center",
            }}>
                <p style={{ fontSize: 14, color: "var(--t-text-faint)" }}>لا يوجد بيانات منصات</p>
            </div>
        )
    }

    const data = entries
        .map(([key, value]) => {
            const info = getPlatformInfo(key)
            return { name: info.label, value, color: info.color, key }
        })
        .sort((a, b) => b.value - a.value)

    return (
        <div style={{
            background: "var(--t-card)",
            borderRadius: 16,
            border: "1px solid var(--t-border)",
            padding: "22px 20px",
        }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>
                توزيع المنصات
            </h3>
            <p style={{ fontSize: 12, color: "var(--t-text-faint)", marginBottom: 16 }}>
                عدد العملاء حسب المنصة
            </p>

            <div style={{ height: Math.max(data.length * 48, 120) }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            width={80}
                            tick={{ fontSize: 13, fill: "var(--t-text-muted)", fontWeight: 500 }}
                        />
                        <Tooltip
                            formatter={(value: number) => [value.toLocaleString("ar-SA"), "عميل"]}
                            contentStyle={{
                                borderRadius: 10,
                                border: "1px solid var(--t-border)",
                                background: "var(--t-card)",
                                color: "var(--t-text)",
                                fontSize: 13,
                                direction: "rtl",
                            }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={24}>
                            {data.map((entry) => (
                                <Cell key={entry.key} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
