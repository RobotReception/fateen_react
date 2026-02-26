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
}

const ITEMS: StatItem[] = [
    { label: "الفرق", key: "total_teams", icon: UsersRound, color: "#3B82F6" },
    { label: "التاغات", key: "total_tags", icon: Tag, color: "#F59E0B" },
    { label: "الأقسام", key: "total_departments", icon: Building, color: "#10B981" },
    { label: "الفئات", key: "total_categories", icon: FolderOpen, color: "#8B5CF6" },
    { label: "وكلاء AI", key: "total_agents", icon: Bot, color: "#EC4899" },
    { label: "مراحل دورة الحياة", key: "total_lifecycles", icon: RefreshCw, color: "#06B6D4" },
    { label: "الردود الجاهزة", key: "total_snippets", icon: FileText, color: "#F97316" },
    { label: "القوائم", key: "total_menus", icon: ClipboardList, color: "#6366F1" },
    { label: "الحقول الديناميكية", key: "total_dynamic_fields", icon: Settings2, color: "#78716C" },
]

interface SecondaryStatsProps {
    data: AnalyticsData
}

export function SecondaryStats({ data }: SecondaryStatsProps) {
    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 14,
        }}>
            {ITEMS.map(item => {
                const Icon = item.icon
                const value = data[item.key] as number
                return (
                    <div
                        key={item.key}
                        style={{
                            background: "var(--t-card)",
                            borderRadius: 14,
                            border: "1px solid var(--t-border)",
                            padding: "18px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            transition: "transform 0.2s, box-shadow 0.2s",
                            cursor: "default",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = "translateY(-2px)"
                            e.currentTarget.style.boxShadow = "0 6px 20px -6px rgba(0,0,0,0.1)"
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = "translateY(0)"
                            e.currentTarget.style.boxShadow = "none"
                        }}
                    >
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: `${item.color}14`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <Icon size={18} color={item.color} strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={{ fontSize: 20, fontWeight: 700, color: "var(--t-text)", lineHeight: 1.2 }}>
                                {(value ?? 0).toLocaleString("ar-SA")}
                            </p>
                            <p style={{ fontSize: 12, color: "var(--t-text-faint)", marginTop: 2 }}>
                                {item.label}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
