import { useEffect, useRef, useCallback, useState } from "react"
import type { Message } from "../../types/inbox.types"
import { MessageBubble } from "./MessageBubble"

interface MessagesListProps {
    messages: Message[]
    pendingMessages?: Message[]
    isLoading: boolean
    isFetchingMore?: boolean
    hasMore?: boolean
    onLoadMore?: () => void
}

function msgKey(msg: Message, i: number) {
    return msg.id ?? msg.message_id ?? msg._key ?? `msg-${i}`
}

function getDateStr(ts?: string) {
    if (!ts) return ""
    return new Date(ts).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Aden" })
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

export function MessagesList({
    messages, pendingMessages = [], isLoading,
    isFetchingMore, hasMore, onLoadMore,
}: MessagesListProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const topSentinelRef = useRef<HTMLDivElement>(null)
    const [isInitial, setIsInitial] = useState(true)
    const prevHeightRef = useRef(0)

    // Auto-scroll to bottom on first load and new messages
    useEffect(() => {
        if (isInitial && messages.length > 0) {
            bottomRef.current?.scrollIntoView()
            setIsInitial(false)
        }
    }, [messages.length, isInitial])

    // Scroll to bottom on new pending messages 
    useEffect(() => {
        if (pendingMessages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        }
    }, [pendingMessages.length])

    // Preserve scroll position when older messages are prepended
    useEffect(() => {
        const c = containerRef.current
        if (!c || isInitial) return
        const newHeight = c.scrollHeight
        if (prevHeightRef.current > 0 && newHeight > prevHeightRef.current) {
            c.scrollTop += (newHeight - prevHeightRef.current)
        }
        prevHeightRef.current = newHeight
    }, [messages.length, isInitial])

    // Intersection Observer for infinite scroll (scroll to top triggers load more)
    const loadMoreHandler = useCallback(() => {
        if (hasMore && !isFetchingMore && onLoadMore) {
            prevHeightRef.current = containerRef.current?.scrollHeight ?? 0
            onLoadMore()
        }
    }, [hasMore, isFetchingMore, onLoadMore])

    useEffect(() => {
        const sentinel = topSentinelRef.current
        if (!sentinel || !hasMore) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMoreHandler()
            },
            { root: containerRef.current, rootMargin: "100px 0px 0px 0px", threshold: 0.1 }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadMoreHandler, hasMore])

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
        <div ref={containerRef} style={{
            padding: "12px 16px", display: "flex", flexDirection: "column",
            height: "100%", overflowY: "auto",
        }}>
            {/* Sentinel + loading indicator for infinite scroll */}
            <div ref={topSentinelRef} style={{ minHeight: 1, flexShrink: 0 }} />
            {isFetchingMore && <LoadMoreIndicator />}

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

function LoadMoreIndicator() {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "10px 0 6px", gap: 6,
        }}>
            <div className="msg-load-dots">
                <span /><span /><span />
            </div>
            <style>{`
                .msg-load-dots { display:flex; gap:4px; }
                .msg-load-dots span {
                    width:6px; height:6px; border-radius:50%;
                    background:var(--t-accent, #6366f1);
                    animation:msgBounce .6s ease-in-out infinite;
                }
                .msg-load-dots span:nth-child(2) { animation-delay:.15s; }
                .msg-load-dots span:nth-child(3) { animation-delay:.3s; }
                @keyframes msgBounce{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
            `}</style>
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
