import { InboxNavSidebar } from "../components/sidebar/InboxNavSidebar"
import { ConversationListPanel } from "../components/sidebar/ConversationListPanel"
import { useInboxSocket } from "@/hooks/use-inbox-socket"

export function InboxPage() {
    // Live inbox events via WebSocket (messages, conversation updates)
    useInboxSocket()

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
                background: "var(--t-page)",
                overflow: "hidden",
            }}>
                <InboxEmptyState />
            </div>
        </div>
    )
}

function InboxEmptyState() {
    return (
        <div className="ie-root">
            {/* Animated illustration */}
            <div className="ie-illustration">
                {/* Background glow */}
                <div className="ie-glow" />

                {/* Chat icon container */}
                <div className="ie-icon-circle">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>

                {/* Floating dots */}
                <span className="ie-dot ie-dot-1" />
                <span className="ie-dot ie-dot-2" />
                <span className="ie-dot ie-dot-3" />
            </div>

            {/* Text */}
            <div className="ie-text">
                <h3 className="ie-title">اختر محادثة للبدء</h3>
                <p className="ie-subtitle">
                    اختر أي محادثة من القائمة لعرض الرسائل والرد عليها
                </p>
            </div>

            {/* Quick tips */}
            <div className="ie-tips">
                <div className="ie-tip">
                    <span className="ie-tip-icon">⌨️</span>
                    <span>اضغط على أي محادثة للبدء</span>
                </div>
                <div className="ie-tip">
                    <span className="ie-tip-icon">🔍</span>
                    <span>استخدم البحث للعثور على محادثة</span>
                </div>
            </div>

            <style>{`
                .ie-root {
                    display:flex; flex-direction:column;
                    align-items:center; justify-content:center;
                    gap:28px; padding:40px;
                    max-width:360px; text-align:center;
                }

                /* ── Illustration ── */
                .ie-illustration {
                    position:relative;
                    width:120px; height:120px;
                    display:flex; align-items:center; justify-content:center;
                }
                .ie-glow {
                    position:absolute; inset:-20px;
                    border-radius:50%;
                    background:radial-gradient(circle,
                        rgba(0,114,181,.1) 0%,
                        rgba(0,71,134,.04) 50%,
                        transparent 70%
                    );
                    animation:iePulseGlow 3s ease-in-out infinite;
                }
                .ie-icon-circle {
                    width:80px; height:80px; border-radius:50%;
                    background:linear-gradient(135deg, #004786, #0072b5);
                    display:flex; align-items:center; justify-content:center;
                    color:#fff;
                    box-shadow:0 6px 24px rgba(0,71,134,0.2);
                    animation:ieFloat 4s ease-in-out infinite;
                    position:relative; z-index:1;
                }

                /* Floating dots */
                .ie-dot {
                    position:absolute; border-radius:50%; z-index:0;
                }
                .ie-dot-1 {
                    width:10px; height:10px;
                    background:rgba(0,114,181,0.15); top:8px; right:14px;
                    animation:ieDotFloat 3.5s ease-in-out infinite;
                }
                .ie-dot-2 {
                    width:7px; height:7px;
                    background:rgba(0,71,134,0.12); bottom:14px; left:10px;
                    animation:ieDotFloat 4s ease-in-out infinite .5s;
                }
                .ie-dot-3 {
                    width:5px; height:5px;
                    background:rgba(0,114,181,0.1); top:28px; left:6px;
                    animation:ieDotFloat 3s ease-in-out infinite 1s;
                }

                /* ── Text ── */
                .ie-text { display:flex; flex-direction:column; gap:6px; }
                .ie-title {
                    font-size:18px; font-weight:800;
                    color:var(--t-text);
                    margin:0; letter-spacing:-.02em;
                }
                .ie-subtitle {
                    font-size:13px; font-weight:400;
                    color:var(--t-text-muted);
                    margin:0; line-height:1.6;
                }

                /* ── Tips ── */
                .ie-tips {
                    display:flex; flex-direction:column; gap:6px;
                    margin-top:4px;
                }
                .ie-tip {
                    display:flex; align-items:center; gap:8px;
                    font-size:11.5px; font-weight:500;
                    color:var(--t-text-faint);
                    padding:7px 14px; border-radius:9px;
                    background:var(--t-surface);
                    border:1px solid var(--t-border-light);
                    transition:all .18s;
                }
                .ie-tip:hover {
                    background:rgba(0,114,181,0.06);
                    border-color:rgba(0,114,181,0.15);
                    color:var(--t-text-muted);
                }
                .ie-tip-icon { font-size:13px; flex-shrink:0; }

                /* ── Animations ── */
                @keyframes ieFloat {
                    0%, 100% { transform:translateY(0); }
                    50% { transform:translateY(-8px); }
                }
                @keyframes iePulseGlow {
                    0%, 100% { transform:scale(1); opacity:1; }
                    50% { transform:scale(1.15); opacity:.6; }
                }
                @keyframes ieDotFloat {
                    0%, 100% { transform:translateY(0) scale(1); opacity:.7; }
                    50% { transform:translateY(-6px) scale(1.2); opacity:1; }
                }
            `}</style>
        </div>
    )
}
