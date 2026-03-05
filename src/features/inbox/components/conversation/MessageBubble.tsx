import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { FileText, Headphones, Film, MessageSquare, UserCheck, Users, Tag, XCircle, RefreshCw, ArrowRightLeft, MoreVertical, Copy, Reply, Download, X, StickyNote, AtSign } from "lucide-react"
import type { Message, ActivityEventType } from "../../types/inbox.types"
import { useConversationStore } from "../../store/conversation.store"
import { toast } from "sonner"
import { formatTime, formatDate } from "../../../../utils/time"



interface Props {
    message: Message
    isPending?: boolean
}

export function MessageBubble({ message: m, isPending }: Props) {
    // ─── All hooks must be called unconditionally (Rules of Hooks) ───
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

    // ─── Activity events → centered system row ───
    if (m.message_type === "activity") return <ActivityBubble message={m} />

    // ─── Comment → internal note ───
    if (m.message_type === "comment") return <CommentBubble message={m} />

    // ─── Regular messages ───
    const isOwn = m.direction === "outbound"

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
                maxWidth: "68%", padding: "9px 13px",
                borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: isOwn
                    ? "linear-gradient(135deg, #004786, #0072b5)"
                    : "var(--t-card)",
                border: isOwn ? "none" : "1px solid var(--t-border-light)",
                boxShadow: isOwn
                    ? "0 2px 10px rgba(0,71,134,0.28)"
                    : "0 1px 4px rgba(0,0,0,0.05)",
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
    const mutedColor = isOwn ? "rgba(255,255,255,0.55)" : "var(--t-text-faint)"
    // Fateen brand accent colours
    const brandMain = isOwn ? "#fff" : "#004786"
    const brandLight = isOwn ? "rgba(255,255,255,0.14)" : "rgba(0,71,134,0.07)"
    const borderColor = isOwn ? "rgba(255,255,255,0.16)" : "rgba(0,71,134,0.14)"

    // ── Inbound interactive: customer selected an option ──
    if (c.type === "interactive" && c.title) {
        return (
            <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "5px 12px 5px 6px", borderRadius: 20,
                background: isOwn
                    ? "rgba(255,255,255,0.12)"
                    : "linear-gradient(135deg, rgba(0,71,134,0.07), rgba(0,114,181,0.07))",
                border: `1.5px solid ${isOwn ? "rgba(255,255,255,0.18)" : "rgba(0,71,134,0.18)"}`,
            }}>
                <span style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    background: isOwn
                        ? "rgba(255,255,255,0.25)"
                        : "linear-gradient(135deg, #004786, #0072b5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: "#fff", fontWeight: 700,
                }}>✓</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: textColor }}>{c.title}</span>
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
        <div style={{ minWidth: isList ? 210 : 170, maxWidth: 290 }}>
            {/* ── Header ── */}
            {header && (
                typeof header === "object" && header.type === "image" && header.image?.link ? (
                    <img src={header.image.link} alt=""
                        style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 8, marginBottom: 6 }} />
                ) : (
                    <p style={{
                        fontSize: 12, fontWeight: 700, color: textColor,
                        margin: "0 0 4px", lineHeight: 1.3, paddingBottom: 5,
                        borderBottom: `1.5px solid ${borderColor}`,
                    }}>
                        {typeof header === "string" ? header : header.text || header}
                    </p>
                )
            )}

            {/* ── Body ── */}
            {body && (
                <p style={{ fontSize: 12, color: textColor, lineHeight: 1.55, margin: "2px 0 0", whiteSpace: "pre-wrap" }}>
                    {typeof body === "string" ? body : body.text || ""}
                </p>
            )}

            {/* ── Footer ── */}
            {footer && (
                <p style={{ fontSize: 10, color: mutedColor, margin: "4px 0 0", fontStyle: "italic" }}>
                    {typeof footer === "string" ? footer : footer.text || ""}
                </p>
            )}

            {/* ── Reply Buttons ── */}
            {buttons.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {buttons.map((btn: any, i: number) => {
                        const label = btn.reply?.title || btn.title || btn.text || btn.label || `زر ${i + 1}`
                        const url = btn.url || btn.reply?.url
                        const id = btn.reply?.id || btn.id || i
                        return (
                            <div key={id}
                                onClick={() => { if (url) window.open(url, "_blank") }}
                                style={{
                                    padding: "6px 12px", borderRadius: 8,
                                    background: brandLight,
                                    border: `1.5px solid ${isOwn ? "rgba(255,255,255,0.22)" : "rgba(0,71,134,0.2)"}`,
                                    textAlign: "center", fontSize: 12, fontWeight: 600,
                                    color: brandMain, cursor: url ? "pointer" : "default",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                    transition: "all .15s ease",
                                    userSelect: "none",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isOwn ? "rgba(255,255,255,0.22)" : "linear-gradient(135deg, #004786, #0072b5)"
                                    e.currentTarget.style.color = "#fff"
                                    e.currentTarget.style.borderColor = "transparent"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = brandLight
                                    e.currentTarget.style.color = brandMain
                                    e.currentTarget.style.borderColor = isOwn ? "rgba(255,255,255,0.22)" : "rgba(0,71,134,0.2)"
                                }}
                            >
                                {url && <span style={{ fontSize: 10 }}>🔗</span>}
                                {label}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── WhatsApp-style List ── */}
            {isList && listRows.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    <button
                        onClick={() => setListOpen(!listOpen)}
                        style={{
                            width: "100%", padding: "7px 14px", borderRadius: 20,
                            background: listOpen
                                ? (isOwn ? "rgba(255,255,255,0.22)" : "linear-gradient(135deg, #004786, #0072b5)")
                                : brandLight,
                            border: `1.5px solid ${isOwn ? "rgba(255,255,255,0.25)" : "rgba(0,71,134,0.25)"}`,
                            cursor: "pointer", fontSize: 11, fontWeight: 700,
                            color: listOpen ? "#fff" : brandMain,
                            display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 6, fontFamily: "inherit",
                            transition: "all .2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isOwn ? "rgba(255,255,255,0.22)" : "linear-gradient(135deg, #004786, #0072b5)"
                            e.currentTarget.style.color = "#fff"
                            e.currentTarget.style.transform = "scale(1.01)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = listOpen ? (isOwn ? "rgba(255,255,255,0.22)" : "linear-gradient(135deg, #004786, #0072b5)") : brandLight
                            e.currentTarget.style.color = listOpen ? "#fff" : brandMain
                            e.currentTarget.style.transform = "scale(1)"
                        }}
                    >
                        <span style={{ fontSize: 12 }}>☰</span>
                        {listBtnLabel}
                        <span style={{
                            fontSize: 8, transition: "transform .25s ease",
                            transform: listOpen ? "rotate(180deg)" : "rotate(0)", opacity: 0.7,
                        }}>▼</span>
                    </button>

                    {listOpen && (
                        <div style={{
                            marginTop: 4, borderRadius: 10, overflow: "hidden",
                            border: `1px solid ${borderColor}`,
                            background: isOwn ? "rgba(0,0,0,0.08)" : "var(--t-card)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}>
                            {listRows.map((row: any, ri: number) => (
                                <div
                                    key={row.id || ri}
                                    onMouseEnter={() => setHoveredRow(ri)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    style={{
                                        padding: "8px 12px",
                                        borderBottom: ri < listRows.length - 1
                                            ? `1px solid ${isOwn ? "rgba(255,255,255,0.07)" : "var(--t-border-light)"}`
                                            : "none",
                                        cursor: "default",
                                        display: "flex", alignItems: "center", gap: 10,
                                        transition: "background .15s",
                                        background: hoveredRow === ri
                                            ? (isOwn ? "rgba(255,255,255,0.07)" : "rgba(0,71,134,0.05)")
                                            : "transparent",
                                        borderRight: `3px solid ${hoveredRow === ri
                                            ? (isOwn ? "rgba(255,255,255,0.5)" : "#0072b5")
                                            : "transparent"}`,
                                    }}
                                >
                                    <span style={{
                                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                                        background: hoveredRow === ri
                                            ? (isOwn ? "#fff" : "#0072b5")
                                            : (isOwn ? "rgba(255,255,255,0.25)" : "rgba(0,71,134,0.2)"),
                                        transition: "background .15s",
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontSize: 12, fontWeight: 600, margin: 0,
                                            color: hoveredRow === ri ? (isOwn ? "#fff" : "#004786") : textColor,
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            transition: "color .15s",
                                        }}>{row.title}</p>
                                        {row.description && (
                                            <p style={{ fontSize: 10, margin: "1px 0 0", color: mutedColor }}>{row.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Sections-based list fallback ── */}
            {!isList && sections.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    <button
                        onClick={() => setListOpen(!listOpen)}
                        style={{
                            width: "100%", padding: "7px 12px", borderRadius: 8,
                            background: brandLight, border: `1.5px solid ${borderColor}`,
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                            color: brandMain, display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 6, fontFamily: "inherit",
                            transition: "all .15s",
                        }}
                    >
                        <span style={{ fontSize: 13 }}>📋</span>
                        {listBtnLabel}
                        <span style={{ fontSize: 10, transition: "transform .2s", transform: listOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                    </button>

                    {listOpen && (
                        <div style={{
                            marginTop: 5, borderRadius: 10, overflow: "hidden",
                            border: `1px solid ${borderColor}`,
                            background: isOwn ? "rgba(0,0,0,0.08)" : "var(--t-surface)",
                        }}>
                            {sections.map((section: any, si: number) => (
                                <div key={si}>
                                    {section.title && (
                                        <p style={{
                                            fontSize: 10, fontWeight: 800, color: isOwn ? "rgba(255,255,255,0.6)" : "#0072b5",
                                            padding: "8px 12px 3px", margin: 0,
                                            textTransform: "uppercase", letterSpacing: "0.07em",
                                        }}>{section.title}</p>
                                    )}
                                    {(section.rows || []).map((row: any, ri: number) => (
                                        <div key={row.id || ri} style={{
                                            padding: "8px 12px",
                                            borderBottom: `1px solid ${borderColor}`,
                                        }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: textColor, margin: 0 }}>{row.title}</p>
                                            {row.description && (
                                                <p style={{ fontSize: 10, color: mutedColor, margin: "2px 0 0" }}>{row.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Fallback: raw text */}
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

        case "template":
            return (
                <div style={{
                    minWidth: 200, maxWidth: 300,
                    borderRadius: 12, overflow: "hidden",
                    border: `1px solid ${isOwn ? "rgba(255,255,255,0.2)" : "rgba(0,71,134,0.15)"}`,
                    background: isOwn ? "rgba(255,255,255,0.08)" : "rgba(0,71,134,0.04)",
                }}>
                    {/* Header bar */}
                    <div style={{
                        padding: "8px 12px",
                        background: isOwn
                            ? "rgba(255,255,255,0.12)"
                            : "linear-gradient(135deg, rgba(0,71,134,0.08), rgba(0,114,181,0.08))",
                        borderBottom: `1px solid ${isOwn ? "rgba(255,255,255,0.12)" : "rgba(0,71,134,0.1)"}`,
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <span style={{
                            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                            background: isOwn
                                ? "rgba(255,255,255,0.2)"
                                : "linear-gradient(135deg, #004786, #0072b5)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: "#fff", fontWeight: 700,
                        }}>T</span>
                        <div>
                            <p style={{
                                fontSize: 11, fontWeight: 700, margin: 0,
                                color: isOwn ? "rgba(255,255,255,0.95)" : "#004786",
                                letterSpacing: "-0.01em",
                            }}>
                                {c.template_name || c.name || "template"}
                            </p>
                            <p style={{
                                fontSize: 9, margin: "1px 0 0",
                                color: isOwn ? "rgba(255,255,255,0.5)" : "var(--t-text-faint)",
                                textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>WhatsApp Template</p>
                        </div>
                    </div>
                    {/* Footer: language */}
                    {(c.language_code || c.language?.code) && (
                        <div style={{
                            padding: "5px 12px",
                            display: "flex", alignItems: "center", gap: 5,
                        }}>
                            <span style={{ fontSize: 11 }}>🌐</span>
                            <span style={{
                                fontSize: 10, fontWeight: 600,
                                color: isOwn ? "rgba(255,255,255,0.6)" : "var(--t-text-faint)",
                                fontFamily: "monospace",
                            }}>
                                {c.language_code || c.language?.code}
                            </span>
                        </div>
                    )}
                </div>
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
    const [expanded, setExpanded] = useState(false)
    const senderName = m.sender_info?.name || "تعليق داخلي"
    const initials = senderName.charAt(0).toUpperCase()
    const rawText = m.content?.text || ""
    const mentions = (m.content as any)?.mentions as string[] | undefined

    // Strip @mentions from display text when collapsed
    const displayText = expanded ? rawText : rawText.replace(/@[\w\u0600-\u06FF.]+/g, "").replace(/\s{2,}/g, " ").trim()

    // Extract @mention names from raw text
    const mentionNames = rawText.match(/@[\w\u0600-\u06FF.]+/g) || []
    const hasMentions = mentionNames.length > 0 || (mentions && mentions.length > 0)

    return (
        <div style={{
            display: "flex", justifyContent: "center", margin: "6px 20px",
            animation: "noteIn .2s ease-out",
        }}>
            <div
                onClick={() => hasMentions && setExpanded(!expanded)}
                style={{
                    maxWidth: "75%", minWidth: 200,
                    borderRadius: 10,
                    background: "#fff",
                    border: "1px solid #e8eaed",
                    boxShadow: expanded ? "0 2px 8px rgba(0,0,0,0.07)" : "0 1px 4px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                    display: "flex",
                    cursor: hasMentions ? "pointer" : "default",
                    transition: "box-shadow .15s",
                }}
            >
                {/* Accent bar */}
                <div style={{
                    width: 3, flexShrink: 0,
                    background: "linear-gradient(180deg, #f59e0b, #d97706)",
                    borderRadius: "3px 0 0 3px",
                }} />

                <div style={{ flex: 1, padding: "8px 12px" }}>
                    {/* Header: avatar + name + badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            background: "linear-gradient(135deg, #f59e0b, #d97706)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 800, color: "#fff",
                            boxShadow: "0 1px 3px rgba(245,158,11,0.3)",
                        }}>
                            {initials}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#1f2937" }}>{senderName}</span>
                        <span style={{
                            fontSize: 8, fontWeight: 700, color: "#d97706",
                            background: "rgba(245,158,11,0.08)",
                            padding: "2px 6px", borderRadius: 4,
                            letterSpacing: ".03em", textTransform: "uppercase",
                        }}>ملاحظة</span>
                        <span style={{ flex: 1 }} />
                        {hasMentions && (
                            <span style={{
                                fontSize: 9, color: "#004786", fontWeight: 600,
                                display: "flex", alignItems: "center", gap: 3,
                                opacity: 0.6,
                            }}>
                                <AtSign size={10} />
                                {mentionNames.length}
                            </span>
                        )}
                        <StickyNote size={11} style={{ color: "#d4a017", opacity: 0.5 }} />
                    </div>

                    {/* Body */}
                    <p style={{
                        fontSize: 12.5, color: "#374151", lineHeight: 1.65,
                        margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>
                        {displayText || rawText}
                    </p>

                    {/* Expanded mentions */}
                    {expanded && hasMentions && (
                        <div style={{
                            marginTop: 8, paddingTop: 7,
                            borderTop: "1px solid #f3f4f6",
                            display: "flex", flexWrap: "wrap", gap: 4,
                            animation: "noteIn .15s ease-out",
                        }}>
                            <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, width: "100%", marginBottom: 2 }}>المذكورون:</span>
                            {mentionNames.map((name, i) => (
                                <span key={i} style={{
                                    display: "inline-flex", alignItems: "center", gap: 3,
                                    padding: "3px 8px", borderRadius: 12,
                                    background: "rgba(0,71,134,0.06)",
                                    color: "#004786", fontSize: 10, fontWeight: 700,
                                }}>
                                    <AtSign size={9} />
                                    {name.replace("@", "")}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer: timestamp + expand hint */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        {hasMentions && !expanded && (
                            <span style={{ fontSize: 9, color: "#d97706", opacity: 0.7 }}>اضغط لعرض المذكورين</span>
                        )}
                        <span style={{ flex: 1 }} />
                        <span style={{ fontSize: 9, color: "#9ca3af" }}>{formatTime(m.timestamp)}</span>
                    </div>
                </div>
            </div>

            <style>{`@keyframes noteIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }`}</style>
        </div>
    )
}
