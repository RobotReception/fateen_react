import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { FileText, Headphones, Film, MessageSquare, UserCheck, Users, Tag, XCircle, RefreshCw, ArrowRightLeft, MoreVertical, Copy, Reply, Download, X } from "lucide-react"
import type { Message, ActivityEventType } from "../../types/inbox.types"
import { useConversationStore } from "../../store/conversation.store"
import { toast } from "sonner"

function formatTime(dateStr?: string) {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Aden" })
}

function formatDate(dateStr?: string) {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("ar", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Aden" })
}

interface Props {
    message: Message
    isPending?: boolean
}

export function MessageBubble({ message: m, isPending }: Props) {
    // ─── Activity events → centered system row ───
    if (m.message_type === "activity") return <ActivityBubble message={m} />

    // ─── Comment → internal note ───
    if (m.message_type === "comment") return <CommentBubble message={m} />

    // ─── Regular messages ───
    const isOwn = m.direction === "outbound"
    const [hovered, setHovered] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const { setReplyTo } = useConversationStore()

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [menuOpen])

    const handleCopy = () => {
        const text = m.content?.text || m.content?.caption || ""
        if (text) {
            navigator.clipboard.writeText(text)
            toast.success("تم النسخ")
        }
        setMenuOpen(false)
    }

    const handleReply = () => {
        const preview = m.content?.text || m.content?.caption || `[${m.message_type}]`
        setReplyTo({
            messageId: m.id || m._key || "",
            text: preview.length > 80 ? preview.slice(0, 80) + "…" : preview,
            senderName: m.sender_info?.name || (isOwn ? "أنت" : "العميل"),
            messageType: m.message_type,
        })
        setMenuOpen(false)
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: isOwn ? "row" : "row-reverse",
                alignItems: "flex-end", gap: 6, marginBottom: 8,
                opacity: isPending ? 0.6 : 1,
                position: "relative",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); if (!menuOpen) setMenuOpen(false) }}
        >
            {/* Sender avatar for inbound */}
            {!isOwn && m.sender_info?.profile_picture && (
                <img src={m.sender_info.profile_picture} alt=""
                    style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            )}

            <div style={{
                maxWidth: "68%", padding: "8px 12px",
                borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: isOwn ? "var(--t-accent)" : "var(--t-card)",
                border: isOwn ? "none" : "1px solid var(--t-border-light)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                position: "relative",
            }}>
                {/* Three-dot menu */}
                {(hovered || menuOpen) && !isPending && (
                    <div ref={menuRef} style={{
                        position: "absolute",
                        top: 4,
                        [isOwn ? "left" : "right"]: -28,
                        zIndex: 20,
                    }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                            style={{
                                width: 24, height: 24, borderRadius: "50%",
                                border: "none", background: "var(--t-surface)",
                                cursor: "pointer", display: "flex",
                                alignItems: "center", justifyContent: "center",
                                color: "var(--t-text-muted)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                            }}
                        >
                            <MoreVertical size={13} />
                        </button>

                        {menuOpen && (
                            <div style={{
                                position: "absolute",
                                top: 28,
                                [isOwn ? "left" : "right"]: 0,
                                background: "var(--t-card, #fff)",
                                borderRadius: 10,
                                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                                border: "1px solid var(--t-border-light)",
                                minWidth: 120, overflow: "hidden", zIndex: 30,
                            }}>
                                <button onClick={handleCopy}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        width: "100%", padding: "9px 14px",
                                        border: "none", background: "none",
                                        cursor: "pointer", fontSize: 13, color: "var(--t-text)",
                                        fontFamily: "inherit",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "none" }}
                                >
                                    <Copy size={14} /> نسخ
                                </button>
                                <button onClick={handleReply}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        width: "100%", padding: "9px 14px",
                                        border: "none", background: "none",
                                        cursor: "pointer", fontSize: 13, color: "var(--t-text)",
                                        fontFamily: "inherit",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "none" }}
                                >
                                    <Reply size={14} /> رد
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Sender name for inbound (from AI/agent) */}
                {!isOwn && m.sender_info?.name && (
                    <p style={{
                        fontSize: 10, fontWeight: 700, marginBottom: 3,
                        color: isOwn ? "rgba(255,255,255,0.8)" : "var(--t-accent)",
                    }}>
                        {m.sender_info.name}
                    </p>
                )}

                <ContentRenderer message={m} isOwn={isOwn} />

                <p style={{
                    fontSize: 10,
                    color: isOwn ? "rgba(255,255,255,0.6)" : "var(--t-text-faint)",
                    marginTop: 4, textAlign: isOwn ? "left" : "right",
                    display: "flex", alignItems: "center", gap: 4,
                    justifyContent: isOwn ? "flex-start" : "flex-end",
                }}>
                    {formatTime(m.timestamp)}
                    {isPending && " · جاري الإرسال..."}
                    {m.status && !isPending && <StatusIcon status={m.status} />}
                </p>
            </div>

            {/* Sender avatar for outbound */}
            {isOwn && m.sender_info?.profile_picture && (
                <img src={m.sender_info.profile_picture} alt=""
                    style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            )}
        </div>
    )
}

// ── Status icons ──────────────────────────
function StatusIcon({ status }: { status: string }) {
    const map: Record<string, { text: string; color: string }> = {
        sent: { text: "✓", color: "inherit" },
        delivered: { text: "✓✓", color: "inherit" },
        read: { text: "✓✓", color: "#3b82f6" },
        failed: { text: "✗", color: "#ef4444" },
        received: { text: "", color: "inherit" },
    }
    const s = map[status]
    if (!s || !s.text) return null
    return <span style={{ color: s.color, fontSize: 11, fontWeight: 700 }}>{s.text}</span>
}

// ── Interactive message renderer (WhatsApp-style) ────
function InteractiveContent({ content: c, isOwn }: { content: any; isOwn: boolean }) {
    const [listOpen, setListOpen] = useState(false)
    const [hoveredRow, setHoveredRow] = useState<number | null>(null)
    const textColor = isOwn ? "rgba(255,255,255,0.95)" : "var(--t-text)"
    const mutedColor = isOwn ? "rgba(255,255,255,0.5)" : "var(--t-text-faint)"
    const btnColor = isOwn ? "#fff" : "var(--t-accent)"
    const borderColor = isOwn ? "rgba(255,255,255,0.15)" : "var(--t-border-light)"

    // ── Inbound interactive (customer selected from list/button) ──
    if (c.type === "interactive" && c.title) {
        return (
            <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 10px", borderRadius: 8,
                background: isOwn ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.06)",
                border: `1px solid ${isOwn ? "rgba(255,255,255,0.12)" : "rgba(99,102,241,0.15)"}`,
            }}>
                <span style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: isOwn ? "rgba(255,255,255,0.2)" : "var(--t-accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: "#fff", flexShrink: 0, fontWeight: 700,
                }}>✓</span>
                <span style={{
                    fontSize: 12, fontWeight: 600, color: textColor,
                }}>{c.title}</span>
            </div>
        )
    }

    // ── Extract interactive fields ──
    const interactiveType = c.interactive?.type
    const header = c.header || c.interactive?.header || c.list?.header
    const body = c.body || c.text || c.interactive?.body?.text || ""
    const footer = c.footer || c.interactive?.footer?.text || c.interactive?.footer || c.list?.footer
    const buttons: any[] = c.buttons || c.interactive?.action?.buttons || c.interactive?.buttons || []

    // List-specific
    const listRows: any[] = c.list?.rows || c.interactive?.options || c.interactive?.action?.sections?.[0]?.rows || []
    const listBtnLabel = c.interactive?.button || c.list?.button || c.interactive?.action?.button || c.button_text || "عرض القائمة"
    const isList = interactiveType === "list" || listRows.length > 0

    // Sections fallback
    const sections: any[] = c.sections || c.interactive?.action?.sections || []

    return (
        <div style={{ minWidth: isList ? 200 : 160, maxWidth: 280 }}>
            {/* Header */}
            {header && (
                typeof header === "object" && header.type === "image" && header.image?.link ? (
                    <img src={header.image.link} alt=""
                        style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 6, marginBottom: 4 }} />
                ) : (
                    <p style={{
                        fontSize: 12, fontWeight: 700, color: textColor,
                        margin: "0 0 3px", lineHeight: 1.3,
                        paddingBottom: 4,
                        borderBottom: `1.5px solid ${isOwn ? "rgba(255,255,255,0.15)" : "rgba(99,102,241,0.2)"}`,
                    }}>
                        {typeof header === "string" ? header : header.text || header}
                    </p>
                )
            )}

            {/* Body text */}
            {body && (
                <p style={{ fontSize: 12, color: textColor, lineHeight: 1.5, margin: "2px 0 0", whiteSpace: "pre-wrap" }}>
                    {typeof body === "string" ? body : body.text || ""}
                </p>
            )}

            {/* Footer */}
            {footer && (
                <p style={{ fontSize: 10, color: mutedColor, margin: "3px 0 0" }}>
                    {typeof footer === "string" ? footer : footer.text || ""}
                </p>
            )}

            {/* Reply Buttons */}
            {buttons.length > 0 && (
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                    {buttons.map((btn: any, i: number) => {
                        const label = btn.reply?.title || btn.title || btn.text || btn.label || `Button ${i + 1}`
                        const url = btn.url || btn.reply?.url
                        const id = btn.reply?.id || btn.id || i
                        return (
                            <div key={id} style={{
                                padding: "5px 10px", borderRadius: 6,
                                background: isOwn ? "rgba(255,255,255,0.1)" : "var(--t-surface)",
                                border: `1px solid ${borderColor}`,
                                textAlign: "center", fontSize: 11, fontWeight: 600,
                                color: btnColor, cursor: url ? "pointer" : "default",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                            }}
                                onClick={() => { if (url) window.open(url, "_blank") }}
                            >
                                {url && <span style={{ fontSize: 9 }}>🔗</span>}
                                {label}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── WhatsApp-style List ── */}
            {isList && listRows.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    {/* List toggle button — pill style */}
                    <button
                        onClick={() => setListOpen(!listOpen)}
                        style={{
                            width: "100%", padding: "7px 12px", borderRadius: 20,
                            background: isOwn ? "rgba(255,255,255,0.1)" : "transparent",
                            border: `1.5px solid ${isOwn ? "rgba(255,255,255,0.25)" : "var(--t-accent)"}`,
                            cursor: "pointer", fontSize: 11, fontWeight: 700,
                            color: isOwn ? "#fff" : "var(--t-accent)",
                            display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 6, fontFamily: "inherit",
                            transition: "all .2s ease",
                            letterSpacing: 0.3,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isOwn ? "rgba(255,255,255,0.18)" : "var(--t-accent)"
                            e.currentTarget.style.color = "#fff"
                            e.currentTarget.style.transform = "scale(1.02)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isOwn ? "rgba(255,255,255,0.1)" : "transparent"
                            e.currentTarget.style.color = isOwn ? "#fff" : "var(--t-accent)"
                            e.currentTarget.style.transform = "scale(1)"
                        }}
                    >
                        <span style={{ fontSize: 12 }}>☰</span>
                        {listBtnLabel}
                        <span style={{
                            fontSize: 8, transition: "transform .25s ease",
                            transform: listOpen ? "rotate(180deg)" : "rotate(0)",
                            opacity: 0.6,
                        }}>▼</span>
                    </button>

                    {/* Expandable list rows */}
                    {listOpen && (
                        <div style={{
                            marginTop: 5, borderRadius: 8, overflow: "hidden",
                            border: `1px solid ${borderColor}`,
                            background: isOwn ? "rgba(255,255,255,0.04)" : "var(--t-card)",
                        }}>
                            {listRows.map((row: any, ri: number) => (
                                <div
                                    key={row.id || ri}
                                    onMouseEnter={() => setHoveredRow(ri)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    style={{
                                        padding: "7px 10px",
                                        borderBottom: ri < listRows.length - 1
                                            ? `1px solid ${isOwn ? "rgba(255,255,255,0.06)" : "var(--t-border-light)"}`
                                            : "none",
                                        cursor: "default",
                                        display: "flex", alignItems: "center", gap: 8,
                                        transition: "all .15s ease",
                                        background: hoveredRow === ri
                                            ? (isOwn ? "rgba(255,255,255,0.08)" : "var(--t-surface)")
                                            : "transparent",
                                        borderRight: hoveredRow === ri
                                            ? `2px solid ${isOwn ? "rgba(255,255,255,0.5)" : "var(--t-accent)"}`
                                            : "2px solid transparent",
                                    }}
                                >
                                    {/* Dot indicator */}
                                    <span style={{
                                        width: 5, height: 5, borderRadius: "50%",
                                        background: hoveredRow === ri
                                            ? (isOwn ? "#fff" : "var(--t-accent)")
                                            : (isOwn ? "rgba(255,255,255,0.3)" : "var(--t-text-faint)"),
                                        flexShrink: 0,
                                        transition: "all .15s ease",
                                    }} />
                                    <p style={{
                                        fontSize: 12, fontWeight: 500,
                                        color: hoveredRow === ri ? (isOwn ? "#fff" : "var(--t-accent)") : textColor,
                                        margin: 0, flex: 1,
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        transition: "color .15s ease",
                                    }}>{row.title}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Sections-based list fallback */}
            {!isList && sections.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    <button
                        onClick={() => setListOpen(!listOpen)}
                        style={{
                            width: "100%", padding: "9px 12px", borderRadius: 8,
                            background: isOwn ? "rgba(255,255,255,0.1)" : "var(--t-surface)", border: `1px solid ${borderColor}`,
                            cursor: "pointer", fontSize: 13, fontWeight: 600,
                            color: btnColor, display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 6, fontFamily: "inherit",
                            transition: "all .15s",
                        }}
                    >
                        <span style={{ fontSize: 14 }}>📋</span>
                        {listBtnLabel}
                        <span style={{ fontSize: 10, transition: "transform .2s", transform: listOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                    </button>

                    {listOpen && (
                        <div style={{
                            marginTop: 6, borderRadius: 8, overflow: "hidden",
                            border: `1px solid ${borderColor}`, background: isOwn ? "rgba(255,255,255,0.1)" : "var(--t-surface)",
                        }}>
                            {sections.map((section: any, si: number) => (
                                <div key={si}>
                                    {section.title && (
                                        <p style={{
                                            fontSize: 11, fontWeight: 700, color: btnColor,
                                            padding: "8px 12px 4px", margin: 0,
                                            textTransform: "uppercase", letterSpacing: 0.5,
                                        }}>
                                            {section.title}
                                        </p>
                                    )}
                                    {(section.rows || []).map((row: any, ri: number) => (
                                        <div key={row.id || ri} style={{
                                            padding: "8px 12px",
                                            borderBottom: `1px solid ${borderColor}`,
                                            cursor: "default",
                                        }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: textColor, margin: 0 }}>{row.title}</p>
                                            {row.description && (
                                                <p style={{ fontSize: 11, color: mutedColor, margin: "2px 0 0" }}>{row.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Fallback: if no interactive content parsed, show raw text */}
            {!body && !buttons.length && !isList && !sections.length && c.text && (
                <p style={{ fontSize: 13, color: textColor, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{c.text}</p>
            )}
        </div>
    )
}

// ── Clickable media (image/video) with lightbox ────
function ClickableMedia({ url, type, caption, color, uploadStatus }: {
    url?: string; type: "image" | "video"; caption?: string; color: string; uploadStatus?: string
}) {
    const [open, setOpen] = useState(false)
    if (!url) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color }}>
                <Film size={18} /> <span style={{ fontSize: 12 }}>{type === "video" ? "فيديو" : "صورة"}</span>
            </div>
        )
    }
    return (
        <div>
            {type === "image" ? (
                <img src={url} alt={caption || ""} onClick={() => setOpen(true)}
                    style={{
                        maxWidth: "100%", maxHeight: 220, borderRadius: 8,
                        display: "block", objectFit: "cover", cursor: "pointer",
                        transition: "transform .15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                />
            ) : (
                <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setOpen(true)}>
                    <video src={url} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6, display: "block" }}
                        muted preload="metadata" />
                    <div style={{
                        position: "absolute", inset: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,0.3)", borderRadius: 6,
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: "50%",
                            background: "rgba(255,255,255,0.9)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <span style={{ fontSize: 20, marginLeft: 3 }}>▶</span>
                        </div>
                    </div>
                </div>
            )}
            {caption && <p style={{ fontSize: 12, color, marginTop: 4 }}>{caption}</p>}
            {uploadStatus === "pending" && <UploadBadge />}
            {open && <MediaLightbox url={url} type={type} caption={caption} onClose={() => setOpen(false)} />}
        </div>
    )
}

// ── Fullscreen media lightbox ────
function MediaLightbox({ url, type, caption, onClose }: {
    url: string; type: "image" | "video"; caption?: string; onClose: () => void
}) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
        document.addEventListener("keydown", handler)
        return () => document.removeEventListener("keydown", handler)
    }, [onClose])

    return createPortal(
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            animation: "fadeIn .2s ease",
        }}>
            {/* Top bar */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 20px", zIndex: 10,
            }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                    {caption || (type === "image" ? "صورة" : "فيديو")}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                    <a href={url} download target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "rgba(255,255,255,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", textDecoration: "none",
                        }}>
                        <Download size={18} />
                    </a>
                    <button onClick={onClose} style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "rgba(255,255,255,0.15)",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff",
                    }}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Media content */}
            <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh" }}>
                {type === "image" ? (
                    <img src={url} alt={caption || ""} style={{
                        maxWidth: "90vw", maxHeight: "85vh",
                        objectFit: "contain", borderRadius: 8,
                        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                    }} />
                ) : (
                    <video controls autoPlay src={url} style={{
                        maxWidth: "90vw", maxHeight: "85vh",
                        borderRadius: 8,
                        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                    }} />
                )}
            </div>

            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>,
        document.body
    )
}

// ── Content renderer (by message_type) ────
function ContentRenderer({ message: m, isOwn }: { message: Message; isOwn: boolean }) {
    const color = isOwn ? "rgba(255,255,255,0.95)" : "var(--t-text)"
    const c = m.content

    switch (m.message_type) {
        case "text":
            return <p style={{ fontSize: 13, color, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{c.text || ""}</p>

        case "interactive":
            return <InteractiveContent content={c} isOwn={isOwn} />

        case "image":
            return <ClickableMedia url={c.url} type="image" caption={c.caption} color={color} uploadStatus={c.upload_status} />

        case "video":
            return <ClickableMedia url={c.url} type="video" caption={c.caption} color={color} uploadStatus={c.upload_status} />

        case "audio":
            return (
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Headphones size={16} style={{ color, flexShrink: 0 }} />
                        {c.url ? (
                            <audio controls src={c.url} style={{ height: 32, maxWidth: 220 }} />
                        ) : (
                            <span style={{ fontSize: 12, color }}>مقطع صوتي</span>
                        )}
                    </div>
                    {c.transcript && <p style={{ fontSize: 11, color, marginTop: 4, fontStyle: "italic", opacity: 0.8 }}>{c.transcript}</p>}
                    {c.upload_status === "pending" && <UploadBadge />}
                </div>
            )

        case "document":
            return (
                <a href={c.url} download={c.filename} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color }}>
                    <FileText size={20} style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.filename || "مستند"}
                        </p>
                        {c.file_size && (
                            <p style={{ fontSize: 10, opacity: 0.7 }}>{(c.file_size / 1024).toFixed(0)} KB</p>
                        )}
                        {c.caption && <p style={{ fontSize: 11, opacity: 0.8 }}>{c.caption}</p>}
                    </div>
                </a>
            )

        default:
            return <p style={{ fontSize: 12, color, opacity: 0.7 }}>[{m.message_type}]</p>
    }
}

function UploadBadge() {
    return (
        <span style={{
            fontSize: 9, display: "inline-block", marginTop: 3,
            padding: "1px 6px", borderRadius: 10,
            background: "rgba(0,0,0,0.15)", color: "#fff",
        }}>
            ⏳ جاري الرفع...
        </span>
    )
}

// ── Activity bubble (system events) ───────
function ActivityBubble({ message: m }: { message: Message }) {
    const [expanded, setExpanded] = useState(false)
    const meta = m.content?.metadata || {}
    const evType = m.content?.event_type

    const { icon, text, details, color } = activityText(evType, meta)
    const hasDetails = details && details.length > 0

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "10px 0",
        }}>
            <div
                onClick={() => hasDetails && setExpanded(!expanded)}
                style={{
                    display: "inline-flex", flexDirection: "column",
                    alignItems: "center", gap: expanded ? 6 : 0,
                    padding: expanded ? "8px 16px 10px" : "5px 14px",
                    borderRadius: expanded ? 12 : 20,
                    background: color || "var(--t-surface, #f1f5f9)",
                    border: `1px solid ${expanded ? "var(--t-border-light)" : "var(--t-border-light, #e5e7eb)"}`,
                    cursor: hasDetails ? "pointer" : "default",
                    transition: "all .2s ease",
                    maxWidth: "80%",
                }}
            >
                {/* Main row */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, color: "var(--t-text-muted, #6b7280)",
                    fontWeight: 500,
                }}>
                    <span style={{ display: "flex", flexShrink: 0, opacity: .7 }}>{icon}</span>
                    <span>{text}</span>
                    {m.timestamp && (
                        <span style={{ fontSize: 9, color: "var(--t-text-faint)", marginRight: 4, whiteSpace: "nowrap" }}>
                            {formatDate(m.timestamp)} {formatTime(m.timestamp)}
                        </span>
                    )}
                    {hasDetails && (
                        <span style={{
                            fontSize: 9, color: "var(--t-accent, #6366f1)",
                            fontWeight: 600, whiteSpace: "nowrap",
                        }}>
                            {expanded ? "▲" : "▼"}
                        </span>
                    )}
                </div>

                {/* Expanded details */}
                {expanded && details && (
                    <div style={{
                        width: "100%",
                        borderTop: "1px solid var(--t-border-light, #e5e7eb)",
                        paddingTop: 6,
                        display: "flex", flexDirection: "column", gap: 3,
                    }}>
                        {details.map((d, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center",
                                justifyContent: "space-between", gap: 8,
                                fontSize: 10, color: "var(--t-text-muted)",
                            }}>
                                <span style={{ fontWeight: 600, color: "var(--t-text-faint)" }}>{d.label}</span>
                                <span style={{ fontWeight: 500, direction: "ltr" }}>{d.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

type DetailPair = { label: string; value: string }

function activityText(evType?: ActivityEventType, meta?: Record<string, any>): {
    icon: React.ReactNode; text: string; details?: DetailPair[]; color?: string
} {
    switch (evType) {
        case "customer_assigned": {
            const name = meta?.performed_by_name || meta?.assigned_to_username || "موظف"
            const isAssign = meta?.action === "assigned"
            return {
                icon: <UserCheck size={13} />,
                text: isAssign ? `تم تعيين ${name}` : `تم إلغاء التعيين بواسطة ${name}`,
                details: [
                    ...(meta?.assigned_to_username ? [{ label: "الموظف", value: meta.assigned_to_username }] : []),
                    ...(meta?.performed_by_name ? [{ label: "بواسطة", value: meta.performed_by_name }] : []),
                    ...(meta?.action ? [{ label: "الإجراء", value: isAssign ? "تعيين" : "إلغاء تعيين" }] : []),
                ],
                color: isAssign ? "rgba(34,197,94,.06)" : "rgba(239,68,68,.06)",
            }
        }
        case "teams_assigned": {
            const addedTeams: string[] = meta?.added_teams ?? []
            const removedTeams: string[] = meta?.removed_teams ?? []
            const teamNames = [...addedTeams, ...removedTeams]
            const displayNames = teamNames.map(t => meta?.[`team_name_${t}`] || t)
            const isAdd = addedTeams.length > 0
            return {
                icon: <Users size={13} />,
                text: isAdd
                    ? `تم تعيين فريق${addedTeams.length > 1 ? " (" + addedTeams.length + ")" : ""}`
                    : `تم إزالة فريق${removedTeams.length > 1 ? " (" + removedTeams.length + ")" : ""}`,
                details: [
                    ...(addedTeams.length > 0 ? [{ label: "تم إضافة", value: displayNames.slice(0, addedTeams.length).join("، ") }] : []),
                    ...(removedTeams.length > 0 ? [{ label: "تم إزالة", value: displayNames.slice(addedTeams.length).join("، ") }] : []),
                    ...(meta?.performed_by_name ? [{ label: "بواسطة", value: meta.performed_by_name }] : []),
                ],
                color: isAdd ? "rgba(99,102,241,.06)" : "rgba(239,68,68,.06)",
            }
        }
        case "lifecycle_changed": {
            const oldName = meta?.old_lifecycle_name || meta?.old_lifecycle || "—"
            const newName = meta?.new_lifecycle_name || meta?.new_lifecycle || "—"
            return {
                icon: <Tag size={13} />,
                text: `تم تحديث دورة الحياة`,
                details: [
                    { label: "من", value: oldName },
                    { label: "إلى", value: newName },
                    ...(meta?.performed_by_name ? [{ label: "بواسطة", value: meta.performed_by_name }] : []),
                ],
                color: "rgba(234,179,8,.06)",
            }
        }
        case "conversation_closed":
            return {
                icon: <XCircle size={13} />,
                text: `تم إغلاق المحادثة${meta?.performed_by_name ? ` بواسطة ${meta.performed_by_name}` : ""}`,
                details: [
                    ...(meta?.close_reason ? [{ label: "السبب", value: meta.close_reason }] : []),
                    ...(meta?.close_category ? [{ label: "التصنيف", value: meta.close_category }] : []),
                    ...(meta?.performed_by_name ? [{ label: "بواسطة", value: meta.performed_by_name }] : []),
                ],
                color: "rgba(239,68,68,.06)",
            }
        case "conversation_reopened":
            return {
                icon: <RefreshCw size={13} />,
                text: `تم إعادة فتح المحادثة${meta?.reopened_by_name ? ` بواسطة ${meta.reopened_by_name}` : ""}`,
                details: [
                    ...(meta?.reopened_by_name ? [{ label: "بواسطة", value: meta.reopened_by_name }] : []),
                ],
                color: "rgba(34,197,94,.06)",
            }
        case "session_status_changed":
            return {
                icon: <ArrowRightLeft size={13} />,
                text: `تغيير حالة الجلسة: ${meta?.old_status || "—"} ← ${meta?.new_status || "—"}`,
                details: [
                    { label: "من", value: meta?.old_status || "—" },
                    { label: "إلى", value: meta?.new_status || "—" },
                    ...(meta?.performed_by_name ? [{ label: "بواسطة", value: meta.performed_by_name }] : []),
                ],
                color: "rgba(99,102,241,.06)",
            }
        default:
            return {
                icon: <MessageSquare size={13} />,
                text: meta?.text ?? String(evType ?? "حدث"),
            }
    }
}

// ── Comment bubble (internal notes) ───────
function CommentBubble({ message: m }: { message: Message }) {
    return (
        <div style={{
            display: "flex", justifyContent: "center", margin: "8px 16px",
        }}>
            <div style={{
                maxWidth: "80%", padding: "8px 14px", borderRadius: 12,
                background: "#fffbeb",
                border: "1px solid #fde68a",
                position: "relative",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <MessageSquare size={12} style={{ color: "#b45309" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309" }}>
                        {m.sender_info?.name || "تعليق داخلي"}
                    </span>
                </div>
                <p style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
                    {m.content?.text || ""}
                </p>
                <p style={{ fontSize: 9, color: "#92400e", marginTop: 3, textAlign: "left", opacity: 0.6 }}>
                    {formatTime(m.timestamp)}
                </p>
            </div>
        </div>
    )
}
