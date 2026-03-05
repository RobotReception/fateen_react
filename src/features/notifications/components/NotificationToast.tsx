import { useEffect } from "react"
import { createPortal } from "react-dom"
import { Bell, X } from "lucide-react"

interface NotificationToastProps {
    notification: {
        id: string
        title: string
        body: string
    } | null
    onDismiss: () => void
}

export default function NotificationToast({
    notification,
    onDismiss,
}: NotificationToastProps) {
    // Auto-dismiss after 5 seconds
    useEffect(() => {
        if (!notification) return
        const timer = setTimeout(onDismiss, 5000)
        return () => clearTimeout(timer)
    }, [notification, onDismiss])

    if (!notification) return null

    return createPortal(
        <div
            dir="rtl"
            style={{
                position: "fixed",
                top: 20,
                left: 20,
                zIndex: 10000,
                maxWidth: 380,
                width: "calc(100vw - 40px)",
                borderRadius: 14,
                background: "var(--t-card, #fff)",
                border: "1px solid var(--t-border-light, #e5e7eb)",
                boxShadow:
                    "0 12px 40px -8px rgba(0,0,0,0.15), 0 4px 12px -4px rgba(0,0,0,0.08)",
                padding: "14px 16px",
                animation: "toastSlideIn .35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #004786, #0098d6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Bell size={16} style={{ color: "#fff" }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--t-text, #111827)",
                            marginBottom: 2,
                        }}
                    >
                        {notification.title}
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: "var(--t-text-faint, #6b7280)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {notification.body}
                    </div>
                </div>

                {/* Close */}
                <button
                    onClick={onDismiss}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--t-text-faint, #9ca3af)",
                        flexShrink: 0,
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--t-surface, #f3f4f6)"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none"
                    }}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    height: 3,
                    borderRadius: "0 0 14px 14px",
                    background: "linear-gradient(90deg, #004786, #0098d6)",
                    animation: "toastProgress 5s linear forwards",
                }}
            />

            <style>{`
                @keyframes toastSlideIn {
                    from { transform: translateX(-100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastProgress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>,
        document.body
    )
}
