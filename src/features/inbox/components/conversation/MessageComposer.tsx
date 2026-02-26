import { useState, useRef, useCallback, useEffect, useMemo, type KeyboardEvent, type ChangeEvent } from "react"
import {
    Send, Paperclip, Smile, Image, FileText,
    MessageSquare, Sparkles, ChevronDown, X, Loader2, AtSign, Hash, Mic, Square
} from "lucide-react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useSendMessage } from "../../hooks/use-send-message"
import { useConversationStore } from "../../store/conversation.store"
import { useAuthStore } from "@/stores/auth-store"
import { uploadMedia, addComment, getBriefUsers } from "../../services/inbox-service"
import { getAllSnippets } from "@/features/settings/services/teams-tags-service"
import { toast } from "sonner"
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

type VariableItem = { label: string; variable: string; resolve: (c: Customer | null) => string | undefined | null }

const CONTACT_VARIABLES: VariableItem[] = [
    { label: "الاسم", variable: "contact.name", resolve: (c: Customer | null) => c?.sender_name },
    { label: "رقم الهاتف", variable: "contact.phone", resolve: (c: Customer | null) => c?.phone_number || c?.customer_id },
    { label: "البريد الإلكتروني", variable: "contact.email", resolve: (c: Customer | null) => c?.email },
    { label: "المنصة", variable: "contact.platform", resolve: (c: Customer | null) => c?.platform },
    { label: "المرحلة", variable: "contact.lifecycle", resolve: (c: Customer | null) => c?.lifecycle?.name },
    { label: "المعرّف", variable: "contact.id", resolve: (c: Customer | null) => c?.customer_id },
    { label: "اسم المستخدم", variable: "contact.username", resolve: (c: Customer | null) => c?.username },
]

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
    { label: "وجوه", icon: "😊", emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖"] },
    { label: "إيماءات", icon: "👋", emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "👀", "👁️", "👅", "👄", "🫦"] },
    { label: "قلوب", icon: "❤️", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "🩷", "🩵", "🩶"] },
    { label: "أشخاص", icon: "👤", emojis: ["👶", "👧", "🧒", "👦", "👩", "🧑", "👨", "👩‍🦱", "🧑‍🦱", "👨‍🦱", "👩‍🦰", "🧑‍🦰", "👨‍🦰", "👱‍♀️", "👱", "👱‍♂️", "👩‍🦳", "🧑‍🦳", "👨‍🦳", "👩‍🦲", "🧑‍🦲", "👨‍🦲", "🧔‍♀️", "🧔", "🧔‍♂️", "👵", "🧓", "👴", "👲", "👳‍♀️", "👳", "👳‍♂️", "🧕", "👮‍♀️", "👮", "👮‍♂️", "👷‍♀️", "👷", "👷‍♂️", "💂‍♀️", "💂", "💂‍♂️", "🕵️‍♀️", "🕵️", "🕵️‍♂️", "👩‍⚕️", "🧑‍⚕️", "👨‍⚕️"] },
    { label: "طبيعة", icon: "🌿", emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🍀", "☀️", "🌙", "⭐", "🌟", "✨", "⚡", "🔥", "🌈", "☁️", "❄️", "💧", "🌊"] },
    { label: "طعام", icon: "🍕", emojis: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🌮", "🌯", "🫔", "🥙", "🧆", "🥗", "☕", "🍵", "🧃", "🥤", "🧋", "🍺", "🍷", "🥂", "🍰", "🎂", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮"] },
    { label: "أشياء", icon: "💡", emojis: ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💽", "💾", "💿", "📀", "📷", "📹", "🎥", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏰", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🧯", "🛢️", "💰", "💵", "💴", "💶", "💷", "🪙", "💳", "💎", "⚖️", "🧲", "🔧", "🔨", "🪛", "🔩", "⚙️", "🧰", "🗜️", "🔑", "🗝️", "🔒", "🔓", "📦", "📫", "📬", "✏️", "✒️", "🖊️", "🖋️", "📝", "📁", "📂", "📅", "📆", "📌", "📍", "✂️", "🖇️", "📎", "📏", "📐", "🗑️", "✅", "❌", "❓", "❗", "💯", "🔥", "⭐", "🎯", "🏆", "🎪", "🎭", "🎨", "🎬", "🎤", "🎧", "🎸", "🎹", "🎺", "🥁"] },
]

type ComposerMode = "reply" | "comment"

export function MessageComposer({ customerId, customer }: Props) {
    const [text, setText] = useState("")
    const [commentText, setCommentText] = useState("")
    const [mode, setMode] = useState<ComposerMode>("reply")
    const [isUploading, setIsUploading] = useState(false)
    const [attachment, setAttachment] = useState<{ file: File; preview?: string; type: string; snippetUrl?: string; mediaId?: string; mediaUrl?: string } | null>(null)
    const [showEmoji, setShowEmoji] = useState(false)
    const [showSnippets, setShowSnippets] = useState(false)
    const [showVariables, setShowVariables] = useState(false)
    const [snippetSearch, setSnippetSearch] = useState("")
    const [variableSearch, setVariableSearch] = useState("")
    const [mentionIds, setMentionIds] = useState<string[]>([])
    const [showMentions, setShowMentions] = useState(false)
    const [mentionSearch, setMentionSearch] = useState("")
    const [isSendingComment, setIsSendingComment] = useState(false)
    const [emojiCategory, setEmojiCategory] = useState(0)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const commentRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const snippetRef = useRef<HTMLDivElement>(null)
    const variableRef = useRef<HTMLDivElement>(null)
    const mentionRef = useRef<HTMLDivElement>(null)

    const queryClient = useQueryClient()
    const { mutate: send, isPending } = useSendMessage(customerId)
    const { setIsSending, replyTo, setReplyTo } = useConversationStore()
    const { user } = useAuthStore()

    // ── Brief users for @mentions ──
    const { data: briefUsersData } = useQuery({
        queryKey: ["brief-users"],
        queryFn: () => getBriefUsers(1, 100),
        staleTime: 120_000,
    })
    const allUsers = briefUsersData?.users ?? []
    const filteredMentionUsers = allUsers.filter((u) =>
        !mentionSearch || u.name.toLowerCase().includes(mentionSearch.toLowerCase())
    )

    // ── Comment mutation ──
    const commentMutation = useMutation({
        mutationFn: addComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer-messages", customerId] })
            setCommentText("")
            setMentionIds([])
            setMode("reply")
            setIsSendingComment(false)
            toast.success("تم إضافة التعليق")
        },
        onError: () => {
            setIsSendingComment(false)
            toast.error("فشل إضافة التعليق")
        },
    })

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

    // Build all variables: built-in + custom_fields + contact_fields (no duplicates)
    const allVariables = useMemo(() => {
        const vars: VariableItem[] = [...CONTACT_VARIABLES]
        // Track by full key AND by base field name (e.g. "email", "phone")
        const seen = new Set<string>()
        vars.forEach((v) => {
            seen.add(v.variable)
            seen.add(v.variable.split(".").pop()!)   // base name like "email", "phone"
            seen.add(v.label.toLowerCase())
        })

        // Add custom_fields dynamically (skip duplicates)
        if (customer?.custom_fields) {
            Object.entries(customer.custom_fields).forEach(([key, val]) => {
                const varKey = `custom.${key}`
                if (seen.has(varKey) || seen.has(key.toLowerCase())) return
                seen.add(varKey)
                seen.add(key.toLowerCase())
                vars.push({
                    label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                    variable: varKey,
                    resolve: () => val || undefined,
                })
            })
        }
        // Add contact_fields dynamically (skip duplicates)
        if (customer?.contact_fields) {
            Object.entries(customer.contact_fields).forEach(([key, val]) => {
                const varKey = `field.${key}`
                if (seen.has(varKey) || seen.has(key.toLowerCase())) return
                seen.add(varKey)
                seen.add(key.toLowerCase())
                vars.push({
                    label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                    variable: varKey,
                    resolve: () => val || undefined,
                })
            })
        }
        return vars
    }, [customer])

    const filteredVars = allVariables.filter((v) =>
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

    // Insert variable — resolves real customer data
    const insertVariable = (variable: typeof CONTACT_VARIABLES[number]) => {
        const currentText = text.endsWith("$") ? text.slice(0, -1) : text
        const value = variable.resolve(customer)
        setText(currentText + (value || `{{${variable.variable}}}`))   // fallback to template if no data
        setShowVariables(false)
        textareaRef.current?.focus()
    }

    // Send message (v2 API)
    const handleSend = useCallback(() => {
        const trimmed = text.trim()
        if ((!trimmed && !attachment) || isPending || !customer) return

        setIsSending(true)
        setText("")
        if (textareaRef.current) textareaRef.current.style.height = "auto"

        // ── Build common payload fields ──
        const senderId = user?.id ?? ""
        const responder = user?.username ?? user?.email ?? "admin"
        const agentName = user
            ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Support"
            : "Support"
        const accountId = customer.account_id || customer.id || customer.tenant_id || ""
        console.log("[SendMsg] account_id:", accountId, "| customer.account_id:", customer.account_id, "| customer.id:", customer.id)

        const basePayload = {
            platform: customer.platform,
            recipient_id: customer.customer_id,
            sender_id: senderId,
            responder,
            sender_info: { name: agentName, profile_picture: user?.profile_picture ?? null },
            account_id: accountId,
            response_to: replyTo?.messageId || null,
        }

        // Clear reply-to after capturing it
        setReplyTo(null)

        if (attachment) {
            const msgType = attachment.type
            const snippetUrl = attachment.snippetUrl
            const mediaId = attachment.mediaId
            const mediaUrl = attachment.mediaUrl
            const fileName = attachment.file.name
            setAttachment(null)

            if (snippetUrl) {
                // Snippet media — already has a URL, no re-upload needed
                send(
                    {
                        ...basePayload,
                        original_msg_id: null,
                        message_type: msgType as any,
                        content: { url: snippetUrl, caption: trimmed || undefined },
                    },
                    { onSettled: () => setIsSending(false) }
                )
            } else if (mediaId) {
                // File already uploaded — use stored media_id + url
                send(
                    {
                        ...basePayload,
                        original_msg_id: null,
                        message_type: msgType as any,
                        content: {
                            media_id: mediaId,
                            url: mediaUrl,
                            caption: trimmed || undefined,
                            filename: msgType === "document" ? fileName : undefined,
                        },
                    },
                    { onSettled: () => setIsSending(false) }
                )
            } else {
                // Edge case: file not yet uploaded (shouldn't normally happen)
                setIsSending(false)
            }
        } else {
            // Plain text message
            send(
                {
                    ...basePayload,
                    original_msg_id: null,
                    message_type: "text",
                    content: { text: trimmed },
                },
                { onSettled: () => setIsSending(false) }
            )
        }
        textareaRef.current?.focus()
    }, [text, attachment, isPending, customer, user, send, setIsSending, replyTo, setReplyTo])

    // Send comment (POST /inbox/comments)
    const handleSendComment = useCallback(() => {
        if (!commentText.trim() || isSendingComment || !customer) return
        setIsSendingComment(true)

        const agentName = user
            ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Support"
            : "Support"

        commentMutation.mutate({
            customer_id: customer.customer_id,
            session_id: customer.session_id ?? "",
            platform: customer.platform,
            sender_id: user?.id ?? "",
            sender_type: "agent",
            sender_info: { name: agentName, profile_picture: user?.profile_picture ?? null },
            content: {
                text: commentText.trim(),
                mentions: mentionIds.length > 0 ? mentionIds : undefined,
            },
        })
    }, [commentText, isSendingComment, customer, user, mentionIds, commentMutation])

    const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
        if (e.key === "Escape") { setShowSnippets(false); setShowVariables(false); setShowEmoji(false) }
    }

    // File handling — upload immediately on selection
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const type = file.type.startsWith("image/") ? "image"
            : file.type.startsWith("video/") ? "video"
                : file.type.startsWith("audio/") ? "audio" : "document"
        const preview = type === "image" ? URL.createObjectURL(file) : undefined

        // Show attachment preview immediately & start upload
        setAttachment({ file, preview, type })
        setIsUploading(true)
        e.target.value = ""

        uploadMedia(file, { platform: customer?.platform ?? "whatsapp" })
            .then((res) => {
                console.log("[MediaUpload] response:", res)
                // Defensive: try multiple field names for media_id
                const mId = res.media_id || (res as any).id || (res as any).mediaId || ""
                const mUrl = res.public_url || res.proxy_url || ""
                setAttachment((prev) => prev ? { ...prev, mediaId: mId, mediaUrl: mUrl } : null)
                setIsUploading(false)
            })
            .catch(() => {
                toast.error("فشل رفع الملف، حاول مرة أخرى")
                setAttachment(null)
                setIsUploading(false)
            })
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

                    {/* Reply preview bar */}
                    {replyTo && (
                        <div style={{
                            padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
                            background: "var(--t-surface)", borderBottom: "1px solid var(--t-border-light)",
                            borderRight: "3px solid var(--t-accent)",
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t-accent)", margin: 0 }}>
                                    ↩ الرد على {replyTo.senderName}
                                </p>
                                <p style={{ fontSize: 12, color: "var(--t-text-muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {replyTo.text}
                                </p>
                            </div>
                            <button onClick={() => setReplyTo(null)} style={{
                                width: 22, height: 22, borderRadius: 6, border: "none",
                                background: "var(--t-border-light)", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--t-text-muted)", flexShrink: 0,
                            }}><X size={12} /></button>
                        </div>
                    )}

                    {/* Attachment preview */}
                    {attachment && <AttachmentPreview attachment={attachment} onRemove={removeAttachment} isUploading={isUploading} />}

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
                                    {filteredVars.map((v) => {
                                        const resolved = v.resolve(customer)
                                        return (
                                            <div key={v.variable} onClick={() => insertVariable(v)}
                                                style={popupItemStyle}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)", margin: 0 }}>{v.label}</p>
                                                    <p style={{ fontSize: 11, color: "var(--t-text-muted)", margin: "1px 0 0" }}>{v.variable}</p>
                                                </div>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 600, direction: "ltr",
                                                    color: resolved ? "var(--t-success, #16a34a)" : "var(--t-text-faint)",
                                                    maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {resolved || "غير متوفر"}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px 6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <ToolBtn icon={<Image size={15} />} title="صورة" onClick={() => {
                                if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click() }
                            }} />
                            <ToolBtn icon={<Paperclip size={15} />} title="مرفق" onClick={() => {
                                if (fileInputRef.current) { fileInputRef.current.accept = "*/*"; fileInputRef.current.click() }
                            }} />
                            <ToolBtn icon={<Smile size={15} />} title="إيموجي" isActive={showEmoji}
                                onClick={() => { setShowEmoji(!showEmoji); setShowSnippets(false); setShowVariables(false) }} />
                            <ToolBtn icon={isRecording ? <Square size={15} /> : <Mic size={15} />}
                                title={isRecording ? "إيقاف التسجيل" : "تسجيل صوتي"}
                                isActive={isRecording}
                                onClick={() => {
                                    if (isRecording) {
                                        // Stop recording
                                        mediaRecorderRef.current?.stop()
                                        setIsRecording(false)
                                        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
                                        setRecordingTime(0)
                                    } else {
                                        // Start recording
                                        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                                            const mr = new MediaRecorder(stream)
                                            mediaRecorderRef.current = mr
                                            const chunks: BlobPart[] = []
                                            mr.ondataavailable = (e) => chunks.push(e.data)
                                            mr.onstop = () => {
                                                stream.getTracks().forEach((t) => t.stop())
                                                const blob = new Blob(chunks, { type: "audio/webm" })
                                                const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" })
                                                // Directly set attachment and upload (can't fake a ChangeEvent)
                                                setAttachment({ file, type: "audio" })
                                                setIsUploading(true)
                                                uploadMedia(file, { platform: customer?.platform ?? "whatsapp" })
                                                    .then((res) => {
                                                        const mId = res.media_id || (res as any).id || ""
                                                        const mUrl = res.public_url || res.proxy_url || ""
                                                        setAttachment((prev) => prev ? { ...prev, mediaId: mId, mediaUrl: mUrl } : null)
                                                        setIsUploading(false)
                                                    })
                                                    .catch(() => {
                                                        toast.error("فشل رفع التسجيل الصوتي")
                                                        setAttachment(null)
                                                        setIsUploading(false)
                                                    })
                                            }
                                            mr.start()
                                            setIsRecording(true)
                                            setRecordingTime(0)
                                            recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
                                        }).catch(() => {
                                            toast.error("لا يمكن الوصول إلى الميكروفون")
                                        })
                                    }
                                }}
                            />
                            <ToolBtn icon={<MessageSquare size={15} />} title="قوالب" isActive={showSnippets}
                                onClick={() => { setShowSnippets(!showSnippets); setShowVariables(false); setShowEmoji(false); setSnippetSearch("") }} />
                            <ToolBtn icon={<Hash size={15} />} title="متغيرات" isActive={showVariables}
                                onClick={() => { setShowVariables(!showVariables); setShowSnippets(false); setShowEmoji(false); setVariableSearch("") }} />
                            <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: "none" }} />
                        </div>

                        {/* Recording indicator */}
                        {isRecording && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
                                <span style={{
                                    width: 8, height: 8, borderRadius: "50%",
                                    background: "#ef4444",
                                    animation: "pulse 1s ease-in-out infinite",
                                }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", fontFamily: "monospace" }}>
                                    {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:{(recordingTime % 60).toString().padStart(2, "0")}
                                </span>
                            </div>
                        )}

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

                    {/* Full emoji picker */}
                    {showEmoji && (
                        <div style={{
                            borderTop: "1px solid var(--t-border-light)",
                            background: "var(--t-card)",
                        }}>
                            {/* Category tabs */}
                            <div style={{
                                display: "flex", gap: 0, borderBottom: "1px solid var(--t-border-light)",
                                padding: "0 8px",
                            }}>
                                {EMOJI_CATEGORIES.map((cat, i) => (
                                    <button key={cat.label}
                                        onClick={() => setEmojiCategory(i)}
                                        style={{
                                            flex: 1, padding: "8px 0", border: "none",
                                            background: "transparent", cursor: "pointer",
                                            fontSize: 18, borderBottom: i === emojiCategory ? "2px solid var(--t-accent)" : "2px solid transparent",
                                            opacity: i === emojiCategory ? 1 : 0.5,
                                            transition: "all .15s",
                                        }}
                                        title={cat.label}
                                    >{cat.icon}</button>
                                ))}
                            </div>
                            {/* Emoji grid */}
                            <div style={{
                                display: "flex", flexWrap: "wrap", gap: 2,
                                padding: "8px 10px", maxHeight: 200, overflowY: "auto",
                            }}>
                                {EMOJI_CATEGORIES[emojiCategory].emojis.map((em) => (
                                    <button key={em}
                                        onClick={() => { setText((p) => p + em); textareaRef.current?.focus() }}
                                        style={{
                                            width: 34, height: 34, border: "none",
                                            background: "transparent", borderRadius: 6,
                                            fontSize: 20, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "background 0.1s",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                                    >{em}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
                </>
            )}

            {/* ═══ COMMENT MODE ═══ */}
            {mode === "comment" && (
                <div style={{
                    background: "#fef3c7",
                    border: "2px solid #fbbf24",
                    borderRadius: 0,
                    position: "relative",
                }}>
                    {/* @Mentions dropdown */}
                    {showMentions && (
                        <div ref={mentionRef} style={{
                            position: "absolute", bottom: "100%", left: 12, right: 12,
                            background: "var(--t-card, #fff)", borderRadius: 10,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                            border: "1px solid var(--t-border-light)",
                            maxHeight: 200, overflowY: "auto", zIndex: 50,
                        }}>
                            {filteredMentionUsers.length === 0 ? (
                                <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--t-text-faint)" }}>لا يوجد نتائج</div>
                            ) : filteredMentionUsers.map((u) => (
                                <button key={u.user_id}
                                    onClick={() => {
                                        // Insert @name and store the user_id
                                        const before = commentText.slice(0, commentText.lastIndexOf("@"))
                                        setCommentText(before + `@${u.name} `)
                                        if (!mentionIds.includes(u.user_id)) setMentionIds((p) => [...p, u.user_id])
                                        setShowMentions(false)
                                        setMentionSearch("")
                                        commentRef.current?.focus()
                                    }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                                        padding: "8px 14px", border: "none", background: "none",
                                        cursor: "pointer", fontSize: 13, color: "var(--t-text)",
                                        textAlign: "right", fontFamily: "inherit",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "none" }}
                                >
                                    {u.profile_picture ? (
                                        <img src={u.profile_picture} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--t-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                                            {u.name?.charAt(0) || "?"}
                                        </div>
                                    )}
                                    <span style={{ fontWeight: 500 }}>{u.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Textarea */}
                    <div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>💬</span>
                        <textarea
                            ref={commentRef as any}
                            autoFocus
                            value={commentText}
                            onChange={(e) => {
                                const val = e.target.value
                                setCommentText(val)
                                // Auto-resize
                                e.target.style.height = "auto"
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
                                // Detect @ for mentions
                                const atIdx = val.lastIndexOf("@")
                                if (atIdx >= 0) {
                                    const afterAt = val.slice(atIdx + 1)
                                    if (!afterAt.includes(" ")) {
                                        setShowMentions(true)
                                        setMentionSearch(afterAt)
                                    } else {
                                        setShowMentions(false)
                                    }
                                } else {
                                    setShowMentions(false)
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") { setShowMentions(false); if (!showMentions) { setMode("reply"); setCommentText(""); setMentionIds([]) } }
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment() }
                            }}
                            placeholder="Use @ to mention a teammate. Comments are only visible to your team."
                            rows={1}
                            style={{
                                flex: 1, border: "none", outline: "none", resize: "none",
                                background: "transparent", fontSize: 13,
                                color: "#92400e", fontFamily: "inherit",
                                lineHeight: 1.6, minHeight: 24, maxHeight: 120,
                            }}
                        />
                        <button onClick={() => { setMode("reply"); setCommentText(""); setMentionIds([]) }}
                            style={{
                                width: 24, height: 24, borderRadius: "50%", border: "none",
                                background: "rgba(0,0,0,0.08)", cursor: "pointer", flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#92400e", marginTop: 2,
                            }}>
                            <X size={14} />
                        </button>
                    </div>

                    {/* Mention tags */}
                    {mentionIds.length > 0 && (
                        <div style={{ padding: "0 14px 4px 44px", display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {mentionIds.map((uid) => {
                                const u = allUsers.find((x) => x.user_id === uid)
                                return (
                                    <span key={uid} style={{
                                        fontSize: 10, padding: "2px 8px", borderRadius: 10,
                                        background: "#fde68a", color: "#92400e", fontWeight: 600,
                                        display: "inline-flex", alignItems: "center", gap: 3,
                                    }}>
                                        @{u?.name || uid}
                                        <button onClick={() => setMentionIds((p) => p.filter((x) => x !== uid))}
                                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#92400e", fontSize: 10, lineHeight: 1 }}>✕</button>
                                    </span>
                                )
                            })}
                        </div>
                    )}

                    {/* Toolbar */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "4px 14px 6px",
                    }}>
                        <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => { setShowMentions(true); setMentionSearch(""); setCommentText((p) => p + "@"); commentRef.current?.focus() }}
                                title="Mention @"
                                style={{
                                    width: 30, height: 30, border: "none",
                                    background: "transparent", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#92400e", borderRadius: 6,
                                }}>
                                <AtSign size={15} />
                            </button>
                        </div>
                        <button
                            onClick={handleSendComment}
                            disabled={!commentText.trim() || isSendingComment}
                            style={{
                                width: 30, height: 30, borderRadius: "50%", border: "none",
                                background: commentText.trim() && !isSendingComment ? "#d97706" : "#e5e7eb",
                                cursor: commentText.trim() && !isSendingComment ? "pointer" : "not-allowed",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", transition: "all .15s",
                            }}>
                            {isSendingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                    </div>
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

function AttachmentPreview({ attachment, onRemove, isUploading }: {
    attachment: { file: File; preview?: string; type: string; mediaId?: string }; onRemove: () => void; isUploading?: boolean
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
                <p style={{ fontSize: 10, color: "var(--t-text-faint)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    {(attachment.file.size / 1024).toFixed(0)} KB • {attachment.type}
                    {isUploading && <span style={{ color: "var(--t-accent)", fontWeight: 600 }}> • ⛏ جاري الرفع...</span>}
                    {!isUploading && attachment.mediaId && <span style={{ color: "#22c55e", fontWeight: 600 }}> • ✅ تم الرفع</span>}
                </p>
            </div>
            <button onClick={onRemove} disabled={isUploading} style={{
                width: 24, height: 24, borderRadius: 6, border: "none",
                background: "var(--t-surface)", cursor: isUploading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-muted)",
                opacity: isUploading ? 0.4 : 1,
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
