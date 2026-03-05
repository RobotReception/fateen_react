import { useState, useEffect, useRef } from "react"
import {
    Loader2,
    AlertCircle,
    ChevronRight,
    Phone,
    Video,
    MoreVertical,
    ArrowRight,
    LayoutList,
    X,
    ImageIcon,
} from "lucide-react"
import * as menuService from "../services/menu-manager-service"
import type { Template, MenuTreeNode } from "../types"
import { MENU_ITEM_TYPES } from "../types"

interface PreviewTabProps {
    onNavigateToTab?: (tab: string) => void
    selectedTemplateId?: string | null
    embedded?: boolean
}

// ── Clock for status bar ──
function useClock() {
    const [time, setTime] = useState(() => {
        const d = new Date()
        return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: false })
    })
    useEffect(() => {
        const id = setInterval(() => {
            const d = new Date()
            setTime(d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: false }))
        }, 30_000)
        return () => clearInterval(id)
    }, [])
    return time
}

// ── Chat message shape ──
interface ChatMessage {
    id: string
    type: "user" | "bot" | "choice"
    text?: string
    imageUrl?: string
    videoUrl?: string
    fileUrl?: string
    fileName?: string
    extraButtons?: { type: string; title: string; value: string }[]
    header?: string
    footer?: string
    showListBtn?: boolean
    listBtnLabel?: string
    isLeaf?: boolean          // true when node has no active children
    time: string
}

function getTime() {
    return new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: true })
}

// ── Fateen-themed WhatsApp palette ──
const WA = {
    header: "#004786",
    headerDark: "#003a6e",
    bg: "#efeae2",
    botBubble: "#ffffff",
    userBubble: "#dcf8c6",
    tick: "#53bdeb",
    border: "#e9e9e9",
    footer: "#8696a0",
    listBtn: "#004786",
    divider: "#e9e9e9",
}

export function PreviewTab({ selectedTemplateId, embedded }: PreviewTabProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(selectedTemplateId || null)
    const [, setTree] = useState<MenuTreeNode | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [breadcrumb, setBreadcrumb] = useState<MenuTreeNode[]>([])
    const [currentNode, setCurrentNode] = useState<MenuTreeNode | null>(null)
    const [listSheetOpen, setListSheetOpen] = useState(false)
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
    // Asset URL cache: assetId -> resolved public URL
    const [assetUrlCache, setAssetUrlCache] = useState<Record<string, string>>({})
    const clock = useClock()
    const chatRef = useRef<HTMLDivElement>(null)
    const rootNodeRef = useRef<MenuTreeNode | null>(null)

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })
        }
    }, [chatHistory, listSheetOpen])

    useEffect(() => {
        menuService.listTemplates({ page: 1, limit: 100 })
            .then(res => setTemplates(res.data.templates || []))
            .catch(() => {/* silent */ })
    }, [])

    // Walk tree recursively and collect all asset_ids, then resolve their URLs
    const resolveTreeAssets = (node: MenuTreeNode, ids: Set<string>) => {
        const assetIds = (node.item?.content?.asset_ids as string[] | undefined) || []
        assetIds.forEach(id => ids.add(id))
        node.children?.forEach(child => resolveTreeAssets(child, ids))
    }

    useEffect(() => {
        if (selectedTemplateId) setCurrentTemplateId(selectedTemplateId)
    }, [selectedTemplateId])

    // Reset when template changes
    useEffect(() => {
        setListSheetOpen(false)
        setChatHistory([])
        setAssetUrlCache({})
        if (!currentTemplateId) { setTree(null); setCurrentNode(null); setBreadcrumb([]); return }
        setLoading(true)
        setError(null)
        menuService.getTemplateTree(currentTemplateId)
            .then(async res => {
                rootNodeRef.current = res.data
                setTree(res.data)
                setCurrentNode(res.data)
                setBreadcrumb([res.data])

                // ── Resolve all asset_ids in the tree to public URLs ──
                const ids = new Set<string>()
                resolveTreeAssets(res.data, ids)
                if (ids.size > 0) {
                    const cache: Record<string, string> = {}
                    await Promise.allSettled(
                        [...ids].map(async id => {
                            try {
                                const r = await menuService.getMediaPublicUrl(id)
                                cache[id] = r.data.url
                            } catch { /* skip */ }
                        })
                    )
                    setAssetUrlCache(cache)
                    // Build initial messages AFTER URLs are known
                    setChatHistory([
                        { id: "init-user", type: "user", text: "مرحباً 👋", time: "9:41 ص" },
                        buildBotMessageWithCache(res.data, cache),
                    ])
                } else {
                    setChatHistory([
                        { id: "init-user", type: "user", text: "مرحباً 👋", time: "9:41 ص" },
                        buildBotMessageWithCache(res.data, {}),
                    ])
                }
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "خطأ في تحميل الشجرة"))
            .finally(() => setLoading(false))
    }, [currentTemplateId])

    // Build a ChatMessage from a MenuTreeNode (bot perspective)
    // cache: asset_id -> resolved public URL
    function buildBotMessageWithCache(node: MenuTreeNode, cache: Record<string, string>): ChatMessage {
        const c = node.item?.content
        const pres = c?.presentation
        const header = pres?.header || node.item?.title || ""
        const footer = pres?.footer || ""
        const button = pres?.button || "عرض الخيارات"

        // Body text: for images type use caption or reply_after_media
        const reply = c?.reply || c?.caption || (c?.reply_after_media as string | undefined) || ""

        // Image: resolve first asset_id from cache
        const assetIds = (c?.asset_ids as string[] | undefined) || []
        const imgUrl: string | undefined = assetIds.length > 0 ? cache[assetIds[0]] : undefined

        // For videos: same asset_ids -> video URL
        const isVideo = node.item.type === "videos"
        const isFile = node.item.type === "files"
        const isImage = node.item.type === "images"
        const resolvedUrl = imgUrl // same field, just used differently below

        // Buttons
        const btns: { type: string; title: string; value: string }[] =
            (c?.buttons as { type: string; title: string; value: string }[]) || []

        const hasChildren = (node.children || []).filter(child => child.item.is_active !== false).length > 0

        return {
            id: `bot-${node.item.id}-${Date.now()}`,
            type: "bot",
            header,
            footer,
            imageUrl: (isImage || (!isVideo && !isFile)) ? resolvedUrl : undefined,
            videoUrl: isVideo ? resolvedUrl : undefined,
            fileUrl: isFile ? resolvedUrl : undefined,
            fileName: isFile ? node.item.title : undefined,
            extraButtons: btns,
            text: reply || (hasChildren ? "كيف يمكنني مساعدتك؟ اختر من القائمة أدناه 👇" : ""),
            showListBtn: hasChildren,
            listBtnLabel: button,
            isLeaf: !hasChildren,
            time: getTime(),
        }
    }

    const navigateTo = (node: MenuTreeNode, choiceLabel: string) => {
        setListSheetOpen(false)
        setCurrentNode(node)

        const idx = breadcrumb.findIndex(b => b.item.id === node.item.id)
        if (idx >= 0) {
            setBreadcrumb(breadcrumb.slice(0, idx + 1))
        } else {
            setBreadcrumb([...breadcrumb, node])
        }

        // Append: user choice bubble + new bot message
        const userMsg: ChatMessage = {
            id: `user-choice-${node.item.id}-${Date.now()}`,
            type: "choice",
            text: choiceLabel,
            time: getTime(),
        }
        const botMsg = buildBotMessageWithCache(node, assetUrlCache)
        setChatHistory(prev => [...prev, userMsg, botMsg])
    }

    const goBack = () => {
        if (breadcrumb.length > 1) {
            setListSheetOpen(false)
            const newBread = breadcrumb.slice(0, -1)
            setBreadcrumb(newBread)
            const prevNode = newBread[newBread.length - 1]
            setCurrentNode(prevNode)
            const userMsg: ChatMessage = {
                id: `user-back-${Date.now()}`,
                type: "choice",
                text: "↩ رجوع للقائمة السابقة",
                time: getTime(),
            }
            const botMsg = buildBotMessageWithCache(prevNode, assetUrlCache)
            setChatHistory(prev => [...prev, userMsg, botMsg])
        }
    }

    const goToRoot = () => {
        const root = rootNodeRef.current
        if (!root) return
        setListSheetOpen(false)
        setCurrentNode(root)
        setBreadcrumb([root])
        const userMsg: ChatMessage = {
            id: `user-root-${Date.now()}`,
            type: "choice",
            text: "🏠 القائمة الرئيسية",
            time: getTime(),
        }
        const botMsg = buildBotMessageWithCache(root, assetUrlCache)
        setChatHistory(prev => [...prev, userMsg, botMsg])
    }

    const activeChildren = (currentNode?.children || [])
        .filter(c => c.item.is_active !== false)
        .sort((a, b) => (a.item.order || 0) - (b.item.order || 0))

    // Current node's button label (for list sheet header)
    const currentButton = currentNode?.item?.content?.presentation?.button || "عرض الخيارات"

    return (
        <div style={{ direction: "rtl", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
            {/* ── Top Controls (hidden when embedded) ── */}
            {!embedded && (
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12, flexWrap: "wrap", gap: 10, flexShrink: 0, padding: "0 4px",
                }}>
                    <div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)", margin: 0 }}>المحاكي</h2>
                        <p style={{ fontSize: 11, color: "var(--t-text-muted)", margin: "2px 0 0" }}>
                            معاينة القائمة كما تظهر للمستخدم
                        </p>
                    </div>
                    <select
                        value={currentTemplateId || ""}
                        onChange={(e) => setCurrentTemplateId(e.target.value || null)}
                        style={{
                            padding: "6px 10px", borderRadius: 8,
                            border: "1.5px solid var(--t-border-light)",
                            background: "var(--t-surface)", fontSize: 12,
                            color: "var(--t-text)", outline: "none",
                            minWidth: 160, cursor: "pointer", fontFamily: "inherit",
                        }}
                    >
                        <option value="">— اختر قالباً —</option>
                        {templates.map(t => (
                            <option key={t.template_id} value={t.template_id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {!currentTemplateId && <EmptyState />}
            {loading && (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: "#004786", margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 13, color: "var(--t-text-muted)" }}>جاري تحميل المعاينة...</p>
                </div>
            )}
            {error && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8, padding: 16,
                    borderRadius: 12, background: "rgba(239,68,68,0.06)",
                    color: "#ef4444", fontSize: 13,
                }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* ── Phone Simulator ── */}
            {currentNode && !loading && (
                <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: embedded ? "4px 0" : "10px 0", overflow: "hidden", minHeight: 0 }}>
                    <div style={{
                        position: "relative",
                        width: "100%", maxWidth: 320,
                        aspectRatio: "9 / 19.2",
                        maxHeight: "100%",
                        display: "flex", justifyContent: "center",
                    }}>
                        {/* Ambient glow */}
                        <div style={{
                            position: "absolute", inset: -30,
                            background: "radial-gradient(ellipse at center, rgba(0,71,134,0.10) 0%, transparent 70%)",
                            borderRadius: "50%", pointerEvents: "none", zIndex: 0,
                        }} />

                        {/* Outer frame */}
                        <div style={{
                            position: "relative", zIndex: 1,
                            width: "100%", height: "100%",
                            borderRadius: "clamp(30px, 7vw, 44px)",
                            background: "linear-gradient(160deg, #2c2c2e 0%, #1c1c1e 40%, #0a0a0a 100%)",
                            boxShadow: [
                                "0 0 0 1.5px #3a3a3c",
                                "0 0 0 3px #1c1c1e",
                                "0 20px 50px rgba(0,0,0,0.4)",
                                "0 10px 25px rgba(0,0,0,0.25)",
                                "inset 0 1px 0 rgba(255,255,255,0.08)",
                            ].join(", "),
                            display: "flex", flexDirection: "column", flexShrink: 0,
                        }}>
                            {/* Volume up */}
                            <div style={{ position: "absolute", left: -4, top: 120, width: 4, height: 32, borderRadius: "4px 0 0 4px", background: "linear-gradient(90deg,#3a3a3c,#2c2c2e)" }} />
                            {/* Volume down */}
                            <div style={{ position: "absolute", left: -4, top: 162, width: 4, height: 32, borderRadius: "4px 0 0 4px", background: "linear-gradient(90deg,#3a3a3c,#2c2c2e)" }} />
                            {/* Mute */}
                            <div style={{ position: "absolute", left: -4, top: 90, width: 4, height: 22, borderRadius: "4px 0 0 4px", background: "linear-gradient(90deg,#3a3a3c,#2c2c2e)" }} />
                            {/* Power */}
                            <div style={{ position: "absolute", right: -4, top: 130, width: 4, height: 60, borderRadius: "0 4px 4px 0", background: "linear-gradient(90deg,#2c2c2e,#3a3a3c)" }} />

                            {/* ── Screen ── */}
                            <div style={{
                                margin: 8,
                                flex: 1, borderRadius: 38, overflow: "hidden",
                                background: WA.bg, display: "flex", flexDirection: "column",
                                position: "relative",
                            }}>
                                {/* iOS Status Bar */}
                                <div style={{
                                    height: 50, background: WA.header,
                                    display: "flex", alignItems: "flex-end",
                                    paddingBottom: 4, paddingLeft: 16, paddingRight: 16,
                                    position: "relative", zIndex: 5,
                                }}>
                                    {/* Dynamic Island */}
                                    <div style={{
                                        position: "absolute", top: 8, left: "50%",
                                        transform: "translateX(-50%)",
                                        width: 110, height: 28, borderRadius: 20,
                                        background: "#000", zIndex: 10,
                                    }} />
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingTop: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>{clock}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            {/* Signal */}
                                            <svg width="16" height="12" viewBox="0 0 16 12">
                                                {[0, 1, 2, 3].map(i => (
                                                    <rect key={i} x={i * 4} y={12 - (i + 1) * 3} width={3} height={(i + 1) * 3} rx={1}
                                                        fill={i < 3 ? "#fff" : "rgba(255,255,255,0.4)"} />
                                                ))}
                                            </svg>
                                            {/* WiFi */}
                                            <svg width="14" height="11" viewBox="0 0 14 11">
                                                <path d="M7 8.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#fff" />
                                                <path d="M3.8 6.3a4.5 4.5 0 0 1 6.4 0" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                                                <path d="M1.2 3.7a8 8 0 0 1 11.6 0" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                                            </svg>
                                            {/* Battery */}
                                            <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <div style={{ width: 22, height: 11, borderRadius: 3, border: "1.5px solid rgba(255,255,255,0.8)", padding: 1.5, display: "flex" }}>
                                                    <div style={{ width: "78%", height: "100%", borderRadius: 1.5, background: "#fff" }} />
                                                </div>
                                                <div style={{ width: 2, height: 5, borderRadius: "0 1px 1px 0", background: "rgba(255,255,255,0.6)" }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* WA Chat Header */}
                                <div style={{
                                    background: `linear-gradient(180deg, ${WA.headerDark} 0%, ${WA.header} 100%)`,
                                    padding: "8px 12px",
                                    display: "flex", alignItems: "center", gap: 8,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)", zIndex: 4,
                                }}>
                                    <button onClick={goBack} style={{
                                        background: "none", border: "none", cursor: breadcrumb.length > 1 ? "pointer" : "default",
                                        display: "flex", alignItems: "center", color: breadcrumb.length > 1 ? "#fff" : "rgba(255,255,255,0.5)", padding: "4px 0",
                                    }}>
                                        <ArrowRight size={18} style={{ transform: "rotate(180deg)" }} />
                                    </button>
                                    {/* Avatar */}
                                    <div style={{
                                        width: 36, height: 36, borderRadius: "50%",
                                        background: "linear-gradient(135deg, #004786, #0072b5)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, fontSize: 14, fontWeight: 700, color: "#fff",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                    }}>ف</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", margin: 0 }}>فطين</p>
                                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.82)", margin: 0 }}>متصل الآن</p>
                                    </div>
                                    <div style={{ display: "flex", gap: 14, color: "rgba(255,255,255,0.9)" }}>
                                        <Video size={17} /><Phone size={17} /><MoreVertical size={17} />
                                    </div>
                                </div>

                                {/* Breadcrumb trail */}
                                {breadcrumb.length > 1 && (
                                    <div style={{
                                        padding: "5px 12px",
                                        background: "rgba(0,0,0,0.04)",
                                        borderBottom: `1px solid ${WA.divider}`,
                                        display: "flex", alignItems: "center", gap: 4,
                                        overflow: "auto", scrollbarWidth: "none",
                                    }}>
                                        {breadcrumb.map((b, i) => (
                                            <span key={b.item.id} style={{ display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                                                <button
                                                    onClick={() => { /* breadcrumb navigation already handled via goBack */ }}
                                                    style={{
                                                        background: i === breadcrumb.length - 1 ? "rgba(0,71,134,0.10)" : "transparent",
                                                        border: "none", fontSize: 10,
                                                        color: i === breadcrumb.length - 1 ? WA.header : "#8696a0",
                                                        fontWeight: i === breadcrumb.length - 1 ? 700 : 400,
                                                        cursor: "default", padding: "2px 6px",
                                                        borderRadius: 6, fontFamily: "inherit",
                                                    }}
                                                >
                                                    {b.item.title.substring(0, 14)}{b.item.title.length > 14 ? "…" : ""}
                                                </button>
                                                {i < breadcrumb.length - 1 && (
                                                    <ChevronRight size={9} style={{ color: "#c4c4c4", flexShrink: 0 }} />
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* ── Chat Messages ── */}
                                <div
                                    ref={chatRef}
                                    style={{
                                        flex: 1, overflowY: "auto", padding: "12px 10px 10px",
                                        background: WA.bg, position: "relative", scrollbarWidth: "none",
                                    }}
                                >
                                    {/* Date stamp */}
                                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                                        <span style={{
                                            fontSize: 10, color: "#667781",
                                            background: "rgba(255,255,255,0.85)",
                                            padding: "3px 10px", borderRadius: 10,
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                                        }}>اليوم</span>
                                    </div>

                                    {/* Render conversation history */}
                                    {chatHistory.map((msg) => {
                                        if (msg.type === "user" || msg.type === "choice") {
                                            return (
                                                <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                                                    <div style={{
                                                        maxWidth: "72%",
                                                        background: msg.type === "choice" ? "#d1f4e0" : WA.userBubble,
                                                        borderRadius: "12px 2px 12px 12px",
                                                        padding: "7px 10px",
                                                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                                    }}>
                                                        {msg.type === "choice" && (
                                                            <p style={{ fontSize: 9, color: WA.header, fontWeight: 700, margin: "0 0 2px" }}>✓ اخترت</p>
                                                        )}
                                                        <p style={{ fontSize: 12, color: "#1a1a1a", margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3, marginTop: 2 }}>
                                                            <span style={{ fontSize: 9, color: WA.footer }}>{msg.time}</span>
                                                            <svg width="14" height="8" viewBox="0 0 14 8">
                                                                <path d="M1 4l3 3 5-5M5 4l3 3 5-5" stroke={WA.tick} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        // Bot message
                                        return (
                                            <div key={msg.id} style={{ display: "flex", justifyContent: "flex-start", marginBottom: 8 }}>
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #004786, #0072b5)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 9, color: "#fff", fontWeight: 700,
                                                    flexShrink: 0, marginTop: "auto", marginLeft: 4,
                                                }}>ف</div>
                                                <div style={{ maxWidth: "80%" }}>
                                                    <div style={{
                                                        background: WA.botBubble,
                                                        borderRadius: "2px 12px 12px 12px",
                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                                        overflow: "hidden",
                                                    }}>
                                                        {/* Image header if present */}
                                                        {msg.imageUrl && (
                                                            <div style={{ position: "relative" }}>
                                                                <img
                                                                    src={msg.imageUrl}
                                                                    alt=""
                                                                    style={{
                                                                        width: "100%", maxHeight: 130,
                                                                        objectFit: "cover", display: "block",
                                                                    }}
                                                                    onError={(e) => {
                                                                        (e.currentTarget.parentElement as HTMLElement).style.display = "none"
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Text header */}
                                                        {msg.header && (
                                                            <div style={{
                                                                padding: msg.imageUrl ? "8px 12px 4px" : "10px 12px 4px",
                                                                borderBottom: msg.text ? `1px solid ${WA.divider}` : "none",
                                                            }}>
                                                                <p style={{
                                                                    fontSize: 13, fontWeight: 700,
                                                                    color: "#111b21", margin: 0, lineHeight: 1.4,
                                                                }}>{msg.header}</p>
                                                            </div>
                                                        )}

                                                        {/* Body text */}
                                                        {msg.text && (
                                                            <div style={{ padding: "8px 12px" }}>
                                                                <p style={{
                                                                    fontSize: 12.5, color: "#1a1a1a",
                                                                    margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap",
                                                                }}>{msg.text}</p>
                                                            </div>
                                                        )}

                                                        {/* Video */}
                                                        {msg.videoUrl && (
                                                            <div style={{ padding: "0 12px 8px", position: "relative" }}>
                                                                <div style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
                                                                    <video
                                                                        src={msg.videoUrl}
                                                                        style={{ width: "100%", maxHeight: 120, display: "block", objectFit: "cover" }}
                                                                        muted preload="metadata"
                                                                    />
                                                                    <div style={{
                                                                        position: "absolute", inset: 0,
                                                                        background: "rgba(0,0,0,0.3)",
                                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                                    }}>
                                                                        <div style={{
                                                                            width: 36, height: 36, borderRadius: "50%",
                                                                            background: "rgba(255,255,255,0.9)",
                                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                                            fontSize: 14, paddingLeft: 2,
                                                                        }}>▶</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* File */}
                                                        {msg.fileUrl && (
                                                            <div style={{ padding: "0 12px 8px" }}>
                                                                <a
                                                                    href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                                                                    style={{
                                                                        display: "flex", alignItems: "center", gap: 10,
                                                                        padding: "8px 12px", borderRadius: 10,
                                                                        background: "#f0f2f5",
                                                                        border: `1px solid ${WA.divider}`,
                                                                        textDecoration: "none",
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        width: 34, height: 34, borderRadius: 8,
                                                                        background: "linear-gradient(135deg,#004786,#0072b5)",
                                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                                        flexShrink: 0, fontSize: 14, color: "#fff",
                                                                    }}>📄</div>
                                                                    <div style={{ minWidth: 0 }}>
                                                                        <p style={{
                                                                            fontSize: 11.5, fontWeight: 600, color: "#111b21",
                                                                            margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                                        }}>{msg.fileName || "ملف"}</p>
                                                                        <p style={{ fontSize: 9.5, color: WA.footer, margin: 0 }}>اضغط للتحميل</p>
                                                                    </div>
                                                                </a>
                                                            </div>
                                                        )}

                                                        {/* Extra Buttons (type=buttons) */}
                                                        {msg.extraButtons && msg.extraButtons.length > 0 && (
                                                            <div style={{
                                                                padding: "0 12px 8px",
                                                                display: "flex", flexDirection: "column", gap: 5,
                                                            }}>
                                                                {msg.extraButtons.map((btn, bi) => (
                                                                    <a
                                                                        key={bi}
                                                                        href={btn.type === "url" ? btn.value : undefined}
                                                                        target={btn.type === "url" ? "_blank" : undefined}
                                                                        rel="noopener noreferrer"
                                                                        style={{
                                                                            display: "flex", alignItems: "center",
                                                                            justifyContent: "center", gap: 5,
                                                                            padding: "8px 12px", borderRadius: 8,
                                                                            background: "#fff",
                                                                            border: `1.5px solid ${WA.header}`,
                                                                            fontSize: 12, fontWeight: 700,
                                                                            color: WA.header, textDecoration: "none",
                                                                            cursor: btn.type === "url" ? "pointer" : "default",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        {btn.type === "url" ? "🔗 " : ""}{btn.title}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Footer */}
                                                        {msg.footer && (
                                                            <div style={{ padding: "0 12px 6px" }}>
                                                                <p style={{
                                                                    fontSize: 10.5, color: WA.footer,
                                                                    margin: 0, fontStyle: "italic",
                                                                }}>{msg.footer}</p>
                                                            </div>
                                                        )}

                                                        {/* Timestamp */}
                                                        <div style={{ padding: "2px 10px 6px", textAlign: "left" }}>
                                                            <span style={{ fontSize: 9.5, color: WA.footer }}>{msg.time}</span>
                                                        </div>
                                                    </div>

                                                    {/* List Button - shows on latest bot msg with children */}
                                                    {msg.showListBtn && msg.id === chatHistory.filter(m => m.type === "bot").at(-1)?.id && (
                                                        <button
                                                            onClick={() => setListSheetOpen(true)}
                                                            style={{
                                                                marginTop: 2, width: "100%",
                                                                padding: "9px 12px",
                                                                background: WA.botBubble,
                                                                borderRadius: "0 0 12px 12px",
                                                                border: "none",
                                                                borderTop: `1px solid ${WA.divider}`,
                                                                display: "flex", alignItems: "center",
                                                                justifyContent: "center", gap: 6,
                                                                cursor: "pointer", fontSize: 12.5, fontWeight: 700,
                                                                color: WA.listBtn, fontFamily: "inherit",
                                                                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                                                transition: "background 0.15s",
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,71,134,0.04)" }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = WA.botBubble }}
                                                        >
                                                            <LayoutList size={13} />
                                                            {msg.listBtnLabel}
                                                        </button>
                                                    )}

                                                    {/* ── Leaf Nav Buttons ── only on latest leaf bot msg */}
                                                    {msg.isLeaf && msg.id === chatHistory.filter(m => m.type === "bot").at(-1)?.id && (
                                                        <div style={{
                                                            marginTop: 6,
                                                            display: "flex",
                                                            gap: 6,
                                                            flexWrap: "wrap",
                                                        }}>
                                                            {/* Back button */}
                                                            {breadcrumb.length > 1 && (
                                                                <button
                                                                    onClick={goBack}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: "8px 10px",
                                                                        borderRadius: 20,
                                                                        background: "#fff",
                                                                        border: `1.5px solid ${WA.divider}`,
                                                                        display: "flex", alignItems: "center",
                                                                        justifyContent: "center", gap: 5,
                                                                        cursor: "pointer",
                                                                        fontSize: 11.5, fontWeight: 700,
                                                                        color: "#374151",
                                                                        fontFamily: "inherit",
                                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                                                        transition: "all 0.15s",
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                    onMouseEnter={e => {
                                                                        e.currentTarget.style.background = "#f3f4f6"
                                                                        e.currentTarget.style.borderColor = "#9ca3af"
                                                                    }}
                                                                    onMouseLeave={e => {
                                                                        e.currentTarget.style.background = "#fff"
                                                                        e.currentTarget.style.borderColor = WA.divider
                                                                    }}
                                                                >
                                                                    ↩ رجوع
                                                                </button>
                                                            )}
                                                            {/* Home button */}
                                                            <button
                                                                onClick={goToRoot}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: "8px 10px",
                                                                    borderRadius: 20,
                                                                    background: "linear-gradient(135deg, #004786, #0072b5)",
                                                                    border: "none",
                                                                    display: "flex", alignItems: "center",
                                                                    justifyContent: "center", gap: 5,
                                                                    cursor: "pointer",
                                                                    fontSize: 11.5, fontWeight: 700,
                                                                    color: "#fff",
                                                                    fontFamily: "inherit",
                                                                    boxShadow: "0 2px 8px rgba(0,71,134,0.35)",
                                                                    transition: "all 0.15s",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                                onMouseEnter={e => {
                                                                    e.currentTarget.style.transform = "scale(1.02)"
                                                                    e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,71,134,0.45)"
                                                                }}
                                                                onMouseLeave={e => {
                                                                    e.currentTarget.style.transform = "scale(1)"
                                                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,71,134,0.35)"
                                                                }}
                                                            >
                                                                🏠 القائمة الرئيسية
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}



                                    <style>{`
                                        @keyframes slideUp {
                                            from { transform: translateY(100%); }
                                            to { transform: translateY(0); }
                                        }
                                    `}</style>
                                </div>

                                {/* ── Message Input Bar ── */}
                                <div style={{
                                    background: "#f0f2f5", borderTop: "1px solid rgba(0,0,0,0.06)",
                                    padding: "6px 10px", display: "flex", alignItems: "center", gap: 8,
                                }}>
                                    <div style={{
                                        flex: 1, background: "#fff", borderRadius: 22,
                                        padding: "7px 12px", fontSize: 12, color: "#8696a0",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                        display: "flex", alignItems: "center", gap: 6,
                                    }}>
                                        <span>اكتب رسالة...</span>
                                    </div>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: "50%",
                                        background: "linear-gradient(135deg, #004786, #0072b5)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, boxShadow: "0 2px 6px rgba(0,71,134,0.4)",
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 19V5M5 12l7-7 7 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Home Indicator */}
                                <div style={{
                                    height: 22, background: "#f0f2f5",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <div style={{ width: 100, height: 4, borderRadius: 4, background: "#1c1c1e" }} />
                                </div>

                                {/* ── List Bottom Sheet ── */}
                                {listSheetOpen && (
                                    <div style={{
                                        position: "absolute", inset: 0, zIndex: 20,
                                        display: "flex", flexDirection: "column", justifyContent: "flex-end",
                                    }}>
                                        {/* Overlay */}
                                        <div
                                            onClick={() => setListSheetOpen(false)}
                                            style={{
                                                position: "absolute", inset: 0,
                                                background: "rgba(0,0,0,0.45)",
                                                backdropFilter: "blur(2px)",
                                            }}
                                        />
                                        {/* Sheet */}
                                        <div style={{
                                            position: "relative", background: "#fff",
                                            borderRadius: "20px 20px 0 0",
                                            maxHeight: "75%", display: "flex", flexDirection: "column",
                                            zIndex: 21, animation: "slideUp 0.28s cubic-bezier(0.32,0.72,0,1)",
                                            boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
                                        }}>
                                            {/* Handle */}
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 16px 4px" }}>
                                                <div style={{ width: 36, height: 4, borderRadius: 4, background: "#e0e0e0" }} />
                                            </div>
                                            {/* Header */}
                                            <div style={{
                                                display: "flex", alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "6px 16px 12px",
                                                borderBottom: `1px solid ${WA.divider}`,
                                            }}>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: "#111b21", margin: 0 }}>
                                                    {currentButton}
                                                </p>
                                                <button
                                                    onClick={() => setListSheetOpen(false)}
                                                    style={{
                                                        background: "#f5f5f5", border: "none", borderRadius: "50%",
                                                        width: 26, height: 26, display: "flex",
                                                        alignItems: "center", justifyContent: "center",
                                                        cursor: "pointer", color: "#666",
                                                    }}
                                                ><X size={13} /></button>
                                            </div>

                                            {/* Items */}
                                            <div style={{ overflowY: "auto", scrollbarWidth: "none" }}>
                                                {activeChildren.map((child, idx) => {
                                                    const typeConfig = MENU_ITEM_TYPES.find(t => t.value === child.item.type)
                                                    const isSubmenu = child.item.type === "submenu"
                                                    const childPres = child.item?.content?.presentation
                                                    const childAssetIds = (child.item?.content?.asset_ids as string[] | undefined) || []
                                                    const childImgUrl: string | undefined = childAssetIds.length > 0
                                                        ? assetUrlCache[childAssetIds[0]]
                                                        : undefined
                                                    return (
                                                        <button
                                                            key={child.item.id}
                                                            onClick={() => navigateTo(child, child.item.title)}
                                                            style={{
                                                                display: "flex", alignItems: "center", gap: 12,
                                                                width: "100%", padding: "10px 16px",
                                                                borderBottom: idx < activeChildren.length - 1 ? `1px solid ${WA.divider}` : "none",
                                                                borderBottomWidth: idx < activeChildren.length - 1 ? 1 : 0,
                                                                borderBottomStyle: "solid",
                                                                borderBottomColor: WA.divider,
                                                                background: "none", border: "none",
                                                                cursor: "pointer", textAlign: "right",
                                                                color: "inherit", fontFamily: "inherit",
                                                                transition: "background 0.12s",
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = "#f5f5f5" }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = "none" }}
                                                        >
                                                            {/* Thumbnail / number */}
                                                            {childImgUrl ? (
                                                                <div style={{
                                                                    width: 38, height: 38, borderRadius: 8,
                                                                    flexShrink: 0, overflow: "hidden",
                                                                    background: "#f0f0f0",
                                                                    border: `1px solid ${WA.divider}`,
                                                                }}>
                                                                    <img
                                                                        src={childImgUrl} alt=""
                                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = "none";
                                                                            (e.currentTarget.parentElement as HTMLElement).style.background = "#e8eaed";
                                                                            (e.currentTarget.parentElement as HTMLElement).innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div style={{
                                                                    width: 36, height: 36, borderRadius: "50%",
                                                                    background: isSubmenu
                                                                        ? "linear-gradient(135deg,#004786,#0072b5)"
                                                                        : `${typeConfig?.color || "#6b7280"}18`,
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    flexShrink: 0, fontSize: 12, fontWeight: 700,
                                                                    color: isSubmenu ? "#fff" : (typeConfig?.color || "#6b7280"),
                                                                }}>
                                                                    {idx + 1}
                                                                </div>
                                                            )}

                                                            {/* Title + desc */}
                                                            <div style={{ flex: 1, textAlign: "right" }}>
                                                                <p style={{ fontSize: 13, fontWeight: 600, color: "#111b21", margin: 0 }}>
                                                                    {child.item.title}
                                                                </p>
                                                                {(childPres?.footer || child.item?.content?.reply) && (
                                                                    <p style={{
                                                                        fontSize: 10.5, color: "#8696a0",
                                                                        margin: "1px 0 0",
                                                                        overflow: "hidden", textOverflow: "ellipsis",
                                                                        whiteSpace: "nowrap", maxWidth: 140,
                                                                    }}>
                                                                        {childPres?.footer || child.item?.content?.reply}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Arrow or type badge */}
                                                            {isSubmenu ? (
                                                                <ChevronRight size={14} style={{ color: "#8696a0", flexShrink: 0 }} />
                                                            ) : childImgUrl ? (
                                                                <ImageIcon size={12} style={{ color: "#8696a0", flexShrink: 0 }} />
                                                            ) : (
                                                                <span style={{
                                                                    fontSize: 9, padding: "2px 6px", borderRadius: 8,
                                                                    background: `${typeConfig?.color || "#6b7280"}14`,
                                                                    color: typeConfig?.color || "#6b7280",
                                                                    fontWeight: 600, flexShrink: 0,
                                                                }}>
                                                                    {typeConfig?.label || child.item.type}
                                                                </span>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <div style={{ height: 8 }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Empty state ──
function EmptyState() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 16 }}>
            <div style={{ position: "relative" }}>
                <div style={{
                    width: 70, height: 120, borderRadius: 18,
                    background: "linear-gradient(145deg,#e8eaed,#d1d5db)",
                    border: "3px solid #9ca3af", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden",
                }}>
                    <div style={{ width: 22, height: 3, borderRadius: 4, background: "#9ca3af", marginTop: -20 }} />
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 40 - i * 6, height: 3, borderRadius: 4, background: "#c4c9d4", opacity: 1 - i * 0.25 }} />
                    ))}
                    <div style={{ width: 28, height: 3, borderRadius: 4, background: "#004786", opacity: 0.7 }} />
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#6b7280", marginTop: 8 }} />
                </div>
                <div style={{
                    position: "absolute", inset: -15, borderRadius: "50%",
                    border: "2px solid rgba(0,71,134,0.15)",
                    animation: "ping 2s ease-in-out infinite",
                }} />
                <style>{`@keyframes ping { 0%,100%{transform:scale(0.8);opacity:0} 50%{transform:scale(1.1);opacity:1} }`}</style>
            </div>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text)", margin: "0 0 6px" }}>اختر قالباً للمعاينة</p>
                <p style={{ fontSize: 13, color: "var(--t-text-muted)", margin: 0, lineHeight: 1.6 }}>
                    سيتم عرض القائمة كما تظهر للمستخدم<br />على هاتفه في WhatsApp
                </p>
            </div>
        </div>
    )
}
