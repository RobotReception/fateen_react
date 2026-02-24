import { MessageSquare } from "lucide-react"

interface EmptyStateProps {
    title?: string
    description?: string
}

export function EmptyState({
    title = "لا توجد محادثات",
    description = "اختر محادثة من القائمة لعرضها هنا",
}: EmptyStateProps) {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 16,
            color: "var(--t-text-faint)",
        }}>
            <div style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "var(--t-surface)",
                border: "1.5px dashed var(--t-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                <MessageSquare size={30} style={{ color: "var(--t-text-faint)", opacity: 0.5 }} />
            </div>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--t-text-secondary)", marginBottom: 4 }}>
                    {title}
                </p>
                <p style={{ fontSize: 13, color: "var(--t-text-faint)" }}>{description}</p>
            </div>
        </div>
    )
}
