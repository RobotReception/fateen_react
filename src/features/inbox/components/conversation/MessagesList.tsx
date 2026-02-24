import { useEffect, useRef } from "react"
import type { Message } from "../../types/inbox.types"
import { MessageBubble } from "./MessageBubble"

interface MessagesListProps {
    messages: Message[]
    pendingMessages?: Message[]
    isLoading: boolean
}

function msgKey(msg: Message, i: number) {
    return msg.id ?? msg.message_id ?? msg._key ?? `msg-${i}`
}

function getDateStr(ts?: string) {
    if (!ts) return ""
    return new Date(ts).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" })
}

function Skeleton() {
    return (
        <div style={{ padding: "12px 16px" }}>
            {[60, 80, 45, 70, 55].map((w, i) => (
                <div key={i} style={{
                    display: "flex",
                    justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
                    marginBottom: 12,
                }}>
                    <div style={{
                        width: `${w}%`, height: 44, borderRadius: 12,
                        background: "var(--t-surface)",
                        animation: "pulse 1.5s infinite",
                    }} />
                </div>
            ))}
        </div>
    )
}

export function MessagesList({ messages, pendingMessages = [], isLoading }: MessagesListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages.length, pendingMessages.length])

    if (isLoading) return <Skeleton />

    if (!messages.length && !pendingMessages.length) {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100%", fontSize: 13, color: "var(--t-text-faint)",
            }}>
                لا توجد رسائل بعد
            </div>
        )
    }

    let lastDate = ""

    return (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column" }}>
            {messages.map((msg, i) => {
                const dateStr = getDateStr(msg.timestamp)
                const showDate = dateStr && dateStr !== lastDate
                if (showDate) lastDate = dateStr
                return (
                    <div key={msgKey(msg, i)}>
                        {showDate && <DateSeparator date={dateStr} />}
                        <MessageBubble message={msg} />
                    </div>
                )
            })}
            {pendingMessages.map((msg, i) => (
                <MessageBubble key={msgKey(msg, i + messages.length)} message={msg} isPending />
            ))}
            <div ref={bottomRef} />
        </div>
    )
}

function DateSeparator({ date }: { date: string }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "12px 0 8px", gap: 10,
        }}>
            <div style={{ flex: 1, height: 1, background: "var(--t-border-light)" }} />
            <span style={{
                fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)",
                padding: "3px 10px", borderRadius: 10,
                background: "var(--t-surface)",
                border: "1px solid var(--t-border-light)",
                whiteSpace: "nowrap",
            }}>{date}</span>
            <div style={{ flex: 1, height: 1, background: "var(--t-border-light)" }} />
        </div>
    )
}
