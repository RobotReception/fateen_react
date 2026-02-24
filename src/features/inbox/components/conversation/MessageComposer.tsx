import { useState, useRef, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from "react"
import {
    Send, Paperclip, Smile, Type, Image, FileText,
    MessageSquare, Sparkles, ChevronDown, X, Loader2, AtSign, Hash
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useSendMessage } from "../../hooks/use-send-message"
import { useConversationStore } from "../../store/conversation.store"
import { useAuthStore } from "@/stores/auth-store"
import { uploadMedia } from "../../services/inbox-service"
import { getAllSnippets } from "@/features/settings/services/teams-tags-service"
import type { Customer } from "../../types/inbox.types"
import type { Snippet } from "@/features/settings/types/teams-tags"

interface Props {
    customerId: string
    customer: Customer | null
}

const PLATFORM_LABELS: Record<string, string> = {
    whatsapp: "WhatsApp",
    facebook: "Facebook Messenger",
    instagram: "Instagram",
    telegram: "Telegram",
    email: "Email",
    sms: "SMS",
    web: "Web Chat",
}

const CONTACT_VARIABLES = [
    { label: "ID", variable: "contact.id" },
    { label: "Name", variable: "contact.name" },
    { label: "First Name", variable: "contact.firstname" },
    { label: "Last Name", variable: "contact.lastname" },
    { label: "Email", variable: "contact.email" },
    { label: "Phone Number", variable: "contact.phone" },
    { label: "Platform", variable: "contact.platform" },
    { label: "Lifecycle", variable: "contact.lifecycle" },
]

const QUICK_EMOJIS = ["😊", "👍", "❤️", "😂", "🙏", "👋", "✅", "🎉", "🔥", "💯", "😢", "🤔", "🎁", "💪", "⭐", "🌟"]

type ComposerMode = "reply" | "comment"

export function MessageComposer({ customerId, customer }: Props) {
    const [text, setText] = useState("")
    const [commentText, setCommentText] = useState("")
    const [mode, setMode] = useState<ComposerMode>("reply")
    const [isUploading, setIsUploading] = useState(false)
    const [attachment, setAttachment] = useState<{ file: File; preview?: string; type: string; snippetUrl?: string } | null>(null)
    const [showEmoji, setShowEmoji] = useState(false)
    const [showSnippets, setShowSnippets] = useState(false)
    const [showVariables, setShowVariables] = useState(false)
    const [snippetSearch, setSnippetSearch] = useState("")
    const [variableSearch, setVariableSearch] = useState("")

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const commentRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const snippetRef = useRef<HTMLDivElement>(null)
    const variableRef = useRef<HTMLDivElement>(null)

    const { mutate: send, isPending } = useSendMessage(customerId)
    const { setIsSending } = useConversationStore()
    const { user } = useAuthStore()

    const tenantId = user?.tenant_id ?? ""
    const platformLabel = PLATFORM_LABELS[customer?.platform ?? ""] ?? customer?.platform ?? "—"

    // ── Fetch snippets ──
    const { data: snippetsData } = useQuery({
        queryKey: ["inbox-snippets", tenantId],
        queryFn: () => getAllSnippets(tenantId),
        enabled: !!tenantId,
        staleTime: 60_000,
    })
    const allSnippets: Snippet[] = snippetsData?.data?.items ?? []
    const filteredSnippets = allSnippets.filter((s) =>
        !snippetSearch || s.name.toLowerCase().includes(snippetSearch.toLowerCase())
        || (s.content?.text ?? "").toLowerCase().includes(snippetSearch.toLowerCase())
    )

    // Filtered variables
    const filteredVars = CONTACT_VARIABLES.filter((v) =>
        !variableSearch || v.label.toLowerCase().includes(variableSearch.toLowerCase())
        || v.variable.toLowerCase().includes(variableSearch.toLowerCase())
    )

    // Close popups on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (snippetRef.current && !snippetRef.current.contains(e.target as Node)) setShowSnippets(false)
            if (variableRef.current && !variableRef.current.contains(e.target as Node)) setShowVariables(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    // Auto-resize textarea
    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setText(val)
        const el = e.target
        el.style.height = "auto"
        el.style.height = Math.min(el.scrollHeight, 140) + "px"

        // Detect '/' at start or after space for snippets
        const lastChar = val[val.length - 1]
        if (lastChar === "/" && (val.length === 1 || val[val.length - 2] === " ")) {
            setShowSnippets(true)
            setSnippetSearch("")
        }
        // Detect '$' for variables
        if (lastChar === "$" && (val.length === 1 || val[val.length - 2] === " ")) {
            setShowVariables(true)
            setVariableSearch("")
        }
    }

    // Insert snippet content into composer (user sends manually)
    const insertSnippet = (snippet: Snippet) => {
        if (!customer) return
        setShowSnippets(false)

        // Remove the trailing '/' trigger
        const currentText = text.endsWith("/") ? text.slice(0, -1) : text

        const msgType = snippet.message_type || "text"
        const content = snippet.content ?? {}

        if (msgType === "text") {
            // Insert text into textarea
            const snippetText = content.text ?? snippet.message ?? snippet.name
            setText(currentText + snippetText)
        } else {
            // For media snippets: insert caption/text + show URL info
            if (content.text || content.caption) {
                setText(currentText + (content.caption ?? content.text ?? ""))
            }
            // If there's a URL, show it as a "virtual" attachment preview
            if (content.url) {
                setAttachment({
                    file: new File([], content.filename ?? `snippet.${msgType}`),
                    preview: msgType === "image" ? content.url : undefined,
                    type: msgType === "file" ? "document" : msgType,
                    snippetUrl: content.url,
                })
            }
        }
        textareaRef.current?.focus()
    }

    // Insert variable
    const insertVariable = (variable: string) => {
        // Remove the trailing '$' trigger
        const currentText = text.endsWith("$") ? text.slice(0, -1) : text
        setText(currentText + `{{${variable}}}`)
        setShowVariables(false)
        textareaRef.current?.focus()
    }

    // Send message
    const handleSend = useCallback(() => {
        const trimmed = text.trim()
        if ((!trimmed && !attachment) || isPending || !customer) return

        setIsSending(true)
        setText("")
        if (textareaRef.current) textareaRef.current.style.height = "auto"

        const senderId = user?.tenant_id ?? customer.tenant_id ?? "prideidea"
        const responder = user?.username ?? user?.email ?? "admin"
        const agentName = user
            ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Support"
            : "Support"

        if (attachment) {
            const msgType = attachment.type
            const snippetUrl = attachment.snippetUrl
            setAttachment(null)

            if (snippetUrl) {
                // Snippet media — already has a URL, no upload needed
                send(
                    {
                        platform: customer.platform,
                        recipient_id: customer.customer_id,
                        sender_id: senderId,
                        responder,
                        original_msg_id: null,
                        message_type: msgType as any,
                        content: { url: snippetUrl, text: trimmed || undefined },
                        sender_info: { name: agentName, profile_picture: user?.profile_picture ?? null },
                    },
                    { onSettled: () => setIsSending(false) }
                )
            } else {
                // Regular file upload
                const file = attachment.file
                setIsUploading(true)
                uploadMedia(file)
                    .then((res) => {
                        send(
                            {
                                platform: customer.platform,
                                recipient_id: customer.customer_id,
                                sender_id: senderId,
                                responder,
                                original_msg_id: null,
                                message_type: msgType as any,
                                content: { url: res.proxy_url, text: trimmed || undefined },
                                sender_info: { name: agentName, profile_picture: user?.profile_picture ?? null },
                            },
                            { onSettled: () => { setIsSending(false); setIsUploading(false) } }
                        )
                    })
                    .catch(() => { setIsSending(false); setIsUploading(false) })
            }
        } else {
            send(
                {
                    platform: customer.platform,
                    recipient_id: customer.customer_id,
                    sender_id: senderId,
                    responder,
                    original_msg_id: null,
                    message_type: "text",
                    content: { text: trimmed },
                    sender_info: { name: agentName, profile_picture: user?.profile_picture ?? null },
                },
                { onSettled: () => setIsSending(false) }
            )
        }
        textareaRef.current?.focus()
    }, [text, attachment, isPending, customer, user, send, setIsSending])

    const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
        if (e.key === "Escape") { setShowSnippets(false); setShowVariables(false); setShowEmoji(false) }
    }

    // File handling
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const type = file.type.startsWith("image/") ? "image"
            : file.type.startsWith("video/") ? "video"
                : file.type.startsWith("audio/") ? "audio" : "document"
        setAttachment({ file, preview: type === "image" ? URL.createObjectURL(file) : undefined, type })
        e.target.value = ""
    }

    const removeAttachment = () => {
        if (attachment?.preview) URL.revokeObjectURL(attachment.preview)
        setAttachment(null)
    }

    const canSend = (!!text.trim() || !!attachment) && !isPending && !isUploading && !!customer

    return (
        <div style={{ borderTop: "1px solid var(--t-border-light)", background: "var(--t-card)", flexShrink: 0 }}>

            {/* ═══ REPLY MODE ═══ */}
            {mode === "reply" && (
                <>
                    {/* Top: Channel + AI Assist */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "6px 14px", borderBottom: "1px solid var(--t-border-light)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--t-text)" }}>
                            {customer?.platform_icon && <img src={customer.platform_icon} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
                            <span>{platformLabel}</span>
                            <ChevronDown size={12} style={{ color: "var(--t-text-faint)" }} />
                        </div>
                        <button style={linkBtn}><Sparkles size={13} />AI Assist</button>
                    </div>

                    {/* Attachment preview */}
                    {attachment && <AttachmentPreview attachment={attachment} onRemove={removeAttachment} />}

                    {/* Textarea */}
                    <div style={{ padding: "8px 14px 4px", position: "relative" }}>
                        <textarea
                            ref={textareaRef} value={text}
                            onChange={handleTextChange} onKeyDown={handleKey}
                            placeholder={customer ? "Use '/' for snippets, '$' for variables, ':' for emoji" : "Select a conversation first"}
                            disabled={!customer || isUploading}
                            rows={1}
                            style={{
                                width: "100%", border: "none", outline: "none",
                                background: "transparent", resize: "none",
                                fontSize: 13, color: "var(--t-text)",
                                lineHeight: 1.6, maxHeight: 140,
                                overflowY: "auto", fontFamily: "inherit", padding: 0,
                            }}
                        />

                        {/* ── Snippets popup ── */}
                        {showSnippets && (
                            <div ref={snippetRef} style={popupStyle}>
                                <div style={popupHeader}>
                                    <MessageSquare size={14} style={{ color: "var(--t-text-muted)" }} />
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>Snippets</span>
                                </div>
                                <div style={popupSearchWrap}>
                                    <input
                                        autoFocus
                                        value={snippetSearch}
                                        onChange={(e) => setSnippetSearch(e.target.value)}
                                        placeholder="Search snippets…"
                                        style={popupSearchInput}
                                    />
                                </div>
                                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                                    {filteredSnippets.length === 0 ? (
                                        <p style={{ padding: "12px 14px", fontSize: 12, color: "var(--t-text-faint)", margin: 0 }}>No snippets found</p>
                                    ) : filteredSnippets.map((s) => (
                                        <div key={s.id ?? s.field_id} onClick={() => insertSnippet(s)}
                                            style={popupItemStyle}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <MessageSquare size={13} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)", margin: 0 }}>{s.name}</p>
                                                    <p style={{
                                                        fontSize: 11, color: "var(--t-text-muted)", margin: "2px 0 0",
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260,
                                                    }}>
                                                        {s.content?.text || s.message || `[${s.message_type}]`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: 9, padding: "2px 6px", borderRadius: 8,
                                                background: "var(--t-surface)", color: "var(--t-text-faint)",
                                                fontWeight: 600, textTransform: "uppercase", flexShrink: 0,
                                            }}>{s.message_type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Variables popup ── */}
                        {showVariables && (
                            <div ref={variableRef} style={popupStyle}>
                                <div style={popupHeader}>
                                    <Hash size={14} style={{ color: "var(--t-text-muted)" }} />
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>Select Variable</span>
                                </div>
                                <div style={popupSearchWrap}>
                                    <input
                                        autoFocus
                                        value={variableSearch}
                                        onChange={(e) => setVariableSearch(e.target.value)}
                                        placeholder="Type to search for variable"
                                        style={popupSearchInput}
                                    />
                                </div>
                                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                                    {filteredVars.map((v) => (
                                        <div key={v.variable} onClick={() => insertVariable(v.variable)}
                                            style={popupItemStyle}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                                        >
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)", margin: 0 }}>{v.label}</p>
                                                <p style={{ fontSize: 11, color: "var(--t-text-muted)", margin: "1px 0 0" }}>{v.variable}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px 6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <ToolBtn icon={<Type size={15} />} title="Formatting" />
                            <ToolBtn icon={<Image size={15} />} title="Image" onClick={() => {
                                if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click() }
                            }} />
                            <ToolBtn icon={<Smile size={15} />} title="Emoji" isActive={showEmoji}
                                onClick={() => { setShowEmoji(!showEmoji); setShowSnippets(false); setShowVariables(false) }} />
                            <ToolBtn icon={<Paperclip size={15} />} title="Attachment" onClick={() => {
                                if (fileInputRef.current) { fileInputRef.current.accept = "*/*"; fileInputRef.current.click() }
                            }} />
                            <ToolBtn icon={<AtSign size={15} />} title="Mention" />
                            <ToolBtn icon={<MessageSquare size={15} />} title="Snippets" isActive={showSnippets}
                                onClick={() => { setShowSnippets(!showSnippets); setShowVariables(false); setShowEmoji(false); setSnippetSearch("") }} />
                            <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: "none" }} />
                        </div>
                        <button onClick={handleSend} disabled={!canSend} style={{
                            width: 32, height: 32, borderRadius: "50%", border: "none",
                            background: canSend ? "var(--t-accent)" : "var(--t-surface)",
                            color: canSend ? "var(--t-text-on-accent)" : "var(--t-text-faint)",
                            cursor: canSend ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s", flexShrink: 0,
                        }}>
                            {isPending || isUploading
                                ? <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />
                                : <Send size={14} />}
                        </button>
                    </div>

                    {/* Quick emoji */}
                    {showEmoji && (
                        <div style={{ padding: "6px 14px 8px", borderTop: "1px solid var(--t-border-light)", display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {QUICK_EMOJIS.map((em) => (
                                <button key={em} onClick={() => { setText((p) => p + em); setShowEmoji(false); textareaRef.current?.focus() }}
                                    style={emojiBtn}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-border-light)" }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                                >{em}</button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ═══ COMMENT MODE ═══ */}
            {mode === "comment" && (
                <div style={{
                    background: "#fef3c7",
                    padding: "10px 14px",
                    display: "flex", alignItems: "center", gap: 8,
                    border: "2px solid #fbbf24",
                    borderRadius: 0,
                }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
                    <input
                        ref={commentRef}
                        autoFocus
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") { setMode("reply"); setCommentText("") }
                        }}
                        placeholder="Use @ to mention a teammate. Comments are only visible to your team."
                        style={{
                            flex: 1, border: "none", outline: "none",
                            background: "transparent", fontSize: 13,
                            color: "#92400e", fontFamily: "inherit",
                        }}
                    />
                    <button onClick={() => { setMode("reply"); setCommentText("") }}
                        style={{
                            width: 24, height: 24, borderRadius: "50%", border: "none",
                            background: "rgba(0,0,0,0.08)", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#92400e",
                        }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ═══ FOOTER: Add Comment + Summarize ═══ */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "5px 14px",
                borderTop: "1px solid var(--t-border-light)",
                background: "var(--t-bg, var(--t-surface))",
            }}>
                <button
                    onClick={() => { setMode(mode === "comment" ? "reply" : "comment"); if (mode !== "comment") setTimeout(() => commentRef.current?.focus(), 50) }}
                    style={{
                        ...linkBtnDark,
                        fontWeight: mode === "comment" ? 700 : 500,
                        color: mode === "comment" ? "#d97706" : "var(--t-text-secondary)",
                    }}>
                    <MessageSquare size={13} />
                    {mode === "comment" ? "Back to reply" : "Add comment"}
                </button>
                <button style={linkBtn}><Sparkles size={13} />Summarize</button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}

// ═══════════════════════════════════════════
// Sub-components & styles
// ═══════════════════════════════════════════

function AttachmentPreview({ attachment, onRemove }: {
    attachment: { file: File; preview?: string; type: string }; onRemove: () => void
}) {
    return (
        <div style={{
            padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
            background: "var(--t-surface)", borderBottom: "1px solid var(--t-border-light)",
        }}>
            {attachment.type === "image" && attachment.preview ? (
                <img src={attachment.preview} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
            ) : (
                <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: "rgba(var(--t-accent-rgb, 59,130,246), 0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <FileText size={18} style={{ color: "var(--t-accent)" }} />
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "var(--t-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.file.name}</p>
                <p style={{ fontSize: 10, color: "var(--t-text-faint)", margin: 0 }}>{(attachment.file.size / 1024).toFixed(0)} KB • {attachment.type}</p>
            </div>
            <button onClick={onRemove} style={{
                width: 24, height: 24, borderRadius: 6, border: "none",
                background: "var(--t-surface)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-muted)",
            }}><X size={14} /></button>
        </div>
    )
}

function ToolBtn({ icon, title, onClick, isActive }: {
    icon: React.ReactNode; title: string; onClick?: () => void; isActive?: boolean
}) {
    return (
        <button onClick={onClick} title={title} style={{
            width: 30, height: 30, border: "none",
            background: isActive ? "var(--t-surface)" : "transparent",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: isActive ? "var(--t-accent)" : "var(--t-text-muted)",
            borderRadius: 6, transition: "all 0.12s",
        }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent" }}
        >{icon}</button>
    )
}

// ── Styles ──
const linkBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 4,
    border: "none", background: "transparent",
    fontSize: 12, fontWeight: 600,
    color: "var(--t-accent)", cursor: "pointer",
}

const linkBtnDark: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 4,
    border: "none", background: "transparent",
    fontSize: 12, fontWeight: 500,
    color: "var(--t-text-secondary)", cursor: "pointer",
}

const emojiBtn: React.CSSProperties = {
    width: 32, height: 32, border: "none",
    background: "var(--t-surface)", borderRadius: 6,
    fontSize: 16, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.12s",
}

const popupStyle: React.CSSProperties = {
    position: "absolute", bottom: "100%", left: 0, right: 0,
    background: "var(--t-card)", border: "1px solid var(--t-border-light)",
    borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    marginBottom: 4, zIndex: 50, overflow: "hidden",
}

const popupHeader: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "10px 14px 6px", borderBottom: "1px solid var(--t-border-light)",
    color: "var(--t-text)",
}

const popupSearchWrap: React.CSSProperties = {
    padding: "6px 10px",
}

const popupSearchInput: React.CSSProperties = {
    width: "100%", padding: "6px 10px", borderRadius: 6,
    border: "1px solid var(--t-border-light)",
    outline: "none", fontSize: 12, color: "var(--t-text)",
    background: "var(--t-surface)", fontFamily: "inherit",
}

const popupItemStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 14px", cursor: "pointer",
    transition: "background 0.1s",
}
