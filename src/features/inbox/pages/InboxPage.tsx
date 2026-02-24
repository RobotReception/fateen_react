import { InboxNavSidebar } from "../components/sidebar/InboxNavSidebar"
import { ConversationListPanel } from "../components/sidebar/ConversationListPanel"
import { EmptyState } from "../components/ui/EmptyState"

export function InboxPage() {
    return (
        <div style={{
            display: "flex",
            height: "100%",
            overflow: "hidden",
        }}>
            {/* Panel 1 — Nav sidebar */}
            <InboxNavSidebar />

            {/* Panel 2 — Conversation list */}
            <ConversationListPanel />

            {/* Panel 3 — Empty chat window */}
            <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--t-bg, #f8fafc)",
                overflow: "hidden",
            }}>
                <InboxEmptyIllustration />
            </div>
        </div>
    )
}

function InboxEmptyIllustration() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            color: "var(--t-text-faint)",
        }}>
            {/* Chat bubbles illustration */}
            <div style={{ position: "relative", width: 160, height: 120 }}>
                {/* Back bubble */}
                <div style={{
                    position: "absolute",
                    top: 0, right: 0,
                    width: 110, height: 70,
                    borderRadius: "16px 16px 4px 16px",
                    background: "var(--t-border)",
                    opacity: 0.4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "0 14px",
                }}>
                    {[20, 30, 20].map((w, i) => (
                        <div key={i} style={{
                            width: w, height: 8, borderRadius: 4,
                            background: "var(--t-text-faint)", opacity: 0.5,
                        }} />
                    ))}
                </div>
                {/* Front bubble */}
                <div style={{
                    position: "absolute",
                    bottom: 0, left: 0,
                    width: 100, height: 64,
                    borderRadius: "16px 16px 16px 4px",
                    background: "var(--t-border)",
                    opacity: 0.6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "0 12px",
                }}>
                    {[28, 16].map((w, i) => (
                        <div key={i} style={{
                            width: w, height: 7, borderRadius: 4,
                            background: "var(--t-text-faint)", opacity: 0.5,
                        }} />
                    ))}
                </div>
            </div>

            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text-secondary)", marginBottom: 6 }}>
                    Looks Like Your Inbox Is Empty
                </p>
                <p style={{ fontSize: 13, color: "var(--t-text-faint)" }}>
                    You can respond here once new messages arrive
                </p>
            </div>
        </div>
    )
}
