import type { Conversation } from "../../types/inbox.types"
import { ConversationItem } from "./ConversationItem"

interface ConversationListProps {
    conversations: Conversation[]
    selectedId: string | null
    isLoading: boolean
}

function Skeleton() {
    return (
        <div style={{ padding: "0 8px" }}>
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                    display: "flex", gap: 10, padding: "10px 8px",
                    borderRadius: 10, marginBottom: 2,
                }}>
                    <div style={{
                        width: 38, height: 38, minWidth: 38,
                        borderRadius: "50%",
                        background: "var(--t-surface)",
                        animation: "pulse 1.5s infinite",
                    }} />
                    <div style={{ flex: 1 }}>
                        <div style={{
                            height: 12, width: "60%",
                            background: "var(--t-surface)",
                            borderRadius: 6, marginBottom: 8,
                            animation: "pulse 1.5s infinite",
                        }} />
                        <div style={{
                            height: 10, width: "80%",
                            background: "var(--t-surface)",
                            borderRadius: 6,
                            animation: "pulse 1.5s infinite",
                        }} />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function ConversationList({ conversations, selectedId, isLoading }: ConversationListProps) {
    if (isLoading) return <Skeleton />

    if (!conversations.length) {
        return (
            <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: 200,
                color: "var(--t-text-faint)", fontSize: 13,
            }}>
                لا توجد محادثات
            </div>
        )
    }

    return (
        <div style={{ padding: "0 6px", overflowY: "auto", flex: 1 }}>
            {conversations.map((convo) => (
                <ConversationItem
                    key={convo.id}
                    conversation={convo}
                    isSelected={convo.id === selectedId}
                />
            ))}
        </div>
    )
}
