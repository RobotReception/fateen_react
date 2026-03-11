import {
    UsersRound, Tag, Building, FolderOpen, Bot,
    RefreshCw, FileText, ClipboardList, Settings2,
} from "lucide-react"
import type { AnalyticsData } from "../types"

interface StatItem {
    label: string
    key: keyof AnalyticsData
    icon: React.ElementType
    color: string
    gradient: string
}

const ITEMS: StatItem[] = [
    { label: "الفرق", key: "total_teams", icon: UsersRound, color: "var(--t-info)", gradient: "linear-gradient(135deg, var(--t-info), #1D4ED8)" },
    { label: "التاغات", key: "total_tags", icon: Tag, color: "var(--t-warning)", gradient: "linear-gradient(135deg, var(--t-warning), #D97706)" },
    { label: "الأقسام", key: "total_departments", icon: Building, color: "var(--t-success)", gradient: "linear-gradient(135deg, var(--t-success), #059669)" },
    { label: "الفئات", key: "total_categories", icon: FolderOpen, color: "#8B5CF6", gradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)" },
    { label: "وكلاء AI", key: "total_agents", icon: Bot, color: "#EC4899", gradient: "linear-gradient(135deg, #EC4899, #BE185D)" },
    { label: "دورة الحياة", key: "total_lifecycles", icon: RefreshCw, color: "#06B6D4", gradient: "linear-gradient(135deg, #06B6D4, #0E7490)" },
    { label: "الردود الجاهزة", key: "total_snippets", icon: FileText, color: "#F97316", gradient: "linear-gradient(135deg, #F97316, #C2410C)" },
    { label: "القوائم", key: "total_menus", icon: ClipboardList, color: "#6366F1", gradient: "linear-gradient(135deg, #6366F1, #4338CA)" },
    { label: "الحقول الديناميكية", key: "total_dynamic_fields", icon: Settings2, color: "#78716C", gradient: "linear-gradient(135deg, #78716C, #57534E)" },
]

interface SecondaryStatsProps { data: AnalyticsData }

export function SecondaryStats({ data }: SecondaryStatsProps) {
    return (
        <div style={{ background: "var(--t-card)", borderRadius: 16, border: "1px solid var(--t-border)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--t-border)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "linear-gradient(135deg, var(--t-info), #6366F1)" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>إحصائيات النظام</h3>
                <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>— تفاصيل مكونات المنصة</span>
            </div>

            {/* 3×3 grid */}
            {[0, 1, 2].map(rowIdx => (
                <div
                    key={rowIdx}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        borderBottom: rowIdx < 2 ? "1px solid var(--t-border)" : "none",
                    }}
                >
                    {ITEMS.slice(rowIdx * 3, rowIdx * 3 + 3).map((item, colIdx) => {
                        const Icon = item.icon
                        const value = data[item.key] as number
                        return (
                            <div
                                key={item.key}
                                style={{
                                    padding: "12px 14px",
                                    display: "flex", alignItems: "center", gap: 10,
                                    borderLeft: colIdx < 2 ? "1px solid var(--t-border)" : "none",
                                    transition: "background 0.18s ease",
                                    cursor: "default",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${item.color}08` }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: item.gradient,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                    boxShadow: `0 3px 10px ${item.color}44`,
                                }}>
                                    <Icon size={17} color="#fff" strokeWidth={1.8} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                                        {item.label}
                                    </p>
                                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--t-text)", lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                                        {(value ?? 0).toLocaleString("ar-SA")}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
