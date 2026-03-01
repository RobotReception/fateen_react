import { useState, useCallback, useEffect, useRef } from "react"
import {
    ChevronDown,
    ChevronLeft,
    Plus,
    Trash2,
    Edit3,
    Folder,
    FileText,
    Zap,
    Image,
    File,
    Video,
    MousePointerClick,
    List,
    Reply,
    Loader2,
    AlertCircle,
    FolderTree,
    X,
    Save,
    ChevronsDown,
    ChevronsUp,
    Upload,
    ImageIcon,
} from "lucide-react"
import * as menuService from "../services/menu-manager-service"
import type { Template, MenuTreeNode, MenuItem, MenuItemType, CreateMenuItemPayload, UpdateMenuItemPayload } from "../types"
import { MENU_ITEM_TYPES } from "../types"

const ICON_MAP: Record<MenuItemType, typeof Folder> = {
    submenu: Folder,
    text: FileText,
    action: Zap,
    images: Image,
    files: File,
    videos: Video,
    buttons: MousePointerClick,
    list: List,
    quick_reply: Reply,
}

interface TreeEditorTabProps {
    onNavigateToTab?: (tab: string) => void
    selectedTemplateId?: string | null
}

export function TreeEditorTab({ selectedTemplateId }: TreeEditorTabProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(selectedTemplateId || null)
    const [tree, setTree] = useState<MenuTreeNode | null>(null)
    const [treeLoading, setTreeLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
    const [showAddDialog, setShowAddDialog] = useState<string | null>(null) // parent_id
    const [editItem, setEditItem] = useState<MenuItem | null>(null)
    const [fetchingItemId, setFetchingItemId] = useState<string | null>(null)

    // Add item form
    const [addKey, setAddKey] = useState("")
    const [addTitle, setAddTitle] = useState("")
    const [addType, setAddType] = useState<MenuItemType>("text")
    const [addDesc, setAddDesc] = useState("")
    const [submitting, setSubmitting] = useState(false)
    // Type-specific add fields
    const [addReply, setAddReply] = useState("")
    const [addHeader, setAddHeader] = useState("")
    const [addFooter, setAddFooter] = useState("")
    const [addButton, setAddButton] = useState("")
    const [addMediaAssetIds, setAddMediaAssetIds] = useState<string[]>([])
    const [addReplyAfterMedia, setAddReplyAfterMedia] = useState("")
    const [addUploadingMedia, setAddUploadingMedia] = useState(false)
    const addFileInputRef = useRef<HTMLInputElement>(null)

    // Edit item form
    const [editTitle, setEditTitle] = useState("")
    const [editDesc, setEditDesc] = useState("")
    const [editReply, setEditReply] = useState("")
    const [editActive, setEditActive] = useState(true)
    const [editReplyAfterMedia, setEditReplyAfterMedia] = useState("")
    const [editAssetIds, setEditAssetIds] = useState("")

    // Media URLs cache: mediaId -> signedUrl
    const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
    const [loadingMediaIds, setLoadingMediaIds] = useState<Set<string>>(new Set())
    const [uploadingMedia, setUploadingMedia] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const MEDIA_TYPES: MenuItemType[] = ["images", "videos", "files"]

    // Load templates
    useEffect(() => {
        menuService.listTemplates({ page: 1, limit: 100 })
            .then(res => setTemplates(res.data.templates || []))
            .catch(() => {/* silent */ })
    }, [])

    /** Fetch public URL for a media asset and cache it */
    const fetchMediaUrl = useCallback(async (mediaId: string) => {
        if (mediaUrls[mediaId] || loadingMediaIds.has(mediaId)) return
        setLoadingMediaIds(prev => new Set([...prev, mediaId]))
        try {
            const res = await menuService.getMediaPublicUrl(mediaId)
            setMediaUrls(prev => ({ ...prev, [mediaId]: res.data.url }))
        } catch {
            // silent — image just won't show
        } finally {
            setLoadingMediaIds(prev => {
                const next = new Set(prev)
                next.delete(mediaId)
                return next
            })
        }
    }, [mediaUrls, loadingMediaIds])

    /** Fetch all media URLs when selectedItem/editItem has asset_ids */
    useEffect(() => {
        const item = editItem || selectedItem
        if (!item?.content?.asset_ids) return
        const ids = item.content.asset_ids as string[]
        ids.forEach(id => {
            if (!mediaUrls[id] && !loadingMediaIds.has(id)) {
                fetchMediaUrl(id)
            }
        })
    }, [selectedItem, editItem, fetchMediaUrl, mediaUrls, loadingMediaIds])

    /** Handle file upload, get media_id back, update editAssetIds */
    const handleMediaUpload = async (file: globalThis.File) => {
        setUploadingMedia(true)
        try {
            const res = await menuService.uploadMedia(file, { source: "user_upload" })
            const newMediaId = res.data.media_id
            // Add to editAssetIds
            const currentIds = editAssetIds.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
            currentIds.push(newMediaId)
            setEditAssetIds(currentIds.join(", "))
            // Fetch signed URL for the new asset
            fetchMediaUrl(newMediaId)
        } catch {
            // silent
        } finally {
            setUploadingMedia(false)
        }
    }

    useEffect(() => {
        if (selectedTemplateId) setCurrentTemplateId(selectedTemplateId)
    }, [selectedTemplateId])

    const fetchTree = useCallback(async () => {
        if (!currentTemplateId) return
        setTreeLoading(true)
        setError(null)
        try {
            const res = await menuService.getTemplateTree(currentTemplateId)
            setTree(res.data)
            // Auto-expand root
            if (res.data?.item?.id) {
                setExpanded(prev => new Set([...prev, res.data.item.id]))
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "خطأ في تحميل الشجرة"
            setError(msg)
        } finally {
            setTreeLoading(false)
        }
    }, [currentTemplateId])

    useEffect(() => { fetchTree() }, [fetchTree])

    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const expandAll = () => {
        if (!tree) return
        const ids = new Set<string>()
        function collect(node: MenuTreeNode) {
            ids.add(node.item.id)
            node.children.forEach(collect)
        }
        collect(tree)
        setExpanded(ids)
    }

    const collapseAll = () => setExpanded(new Set())

    const resetAddForm = () => {
        setShowAddDialog(null)
        setAddKey(""); setAddTitle(""); setAddType("text"); setAddDesc("")
        setAddReply(""); setAddHeader(""); setAddFooter(""); setAddButton("")
        setAddMediaAssetIds([]); setAddReplyAfterMedia("")
    }

    const handleAddMediaUpload = async (file: globalThis.File) => {
        setAddUploadingMedia(true)
        try {
            const res = await menuService.uploadMedia(file, { source: "user_upload" })
            const newId = res.data.media_id
            setAddMediaAssetIds(prev => [...prev, newId])
            fetchMediaUrl(newId)
        } catch {/* silent */ } finally {
            setAddUploadingMedia(false)
        }
    }

    const handleAddItem = async () => {
        if (!showAddDialog || !currentTemplateId || !addKey.trim() || !addTitle.trim()) return
        setSubmitting(true)
        try {
            const payload: CreateMenuItemPayload = {
                parent_id: showAddDialog,
                key: addKey.trim(),
                type: addType,
                title: addTitle.trim(),
            }
            if (addDesc) payload.description = addDesc

            // Build content based on type
            if (addType === "text" || addType === "quick_reply" || addType === "buttons" || addType === "list") {
                if (addReply) payload.content = { reply: addReply, format: "plain" }
            } else if (MEDIA_TYPES.includes(addType)) {
                payload.content = {
                    asset_ids: addMediaAssetIds,
                    reply_after_media: addReplyAfterMedia || null,
                }
            } else if (addType === "submenu") {
                if (addHeader || addFooter || addButton) {
                    payload.content = {
                        presentation: {
                            header: addHeader || undefined,
                            footer: addFooter || undefined,
                            button: addButton || undefined,
                        }
                    }
                }
            }

            await menuService.createItem(currentTemplateId, payload)
            resetAddForm()
            fetchTree()
        } catch {/* silent */ } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!currentTemplateId) return
        try {
            await menuService.deleteItem(currentTemplateId, itemId)
            if (selectedItem?.id === itemId) setSelectedItem(null)
            if (editItem?.id === itemId) setEditItem(null)
            fetchTree()
        } catch {/* silent */ }
    }

    const openEditPanel = (item: MenuItem) => {
        setEditItem(item)
        setEditTitle(item.title)
        setEditDesc(item.description || "")
        setEditReply(item.content?.reply || "")
        setEditActive(item.is_active)
        setEditReplyAfterMedia(item.content?.reply_after_media || "")
        setEditAssetIds((item.content?.asset_ids || []).join(", "))
    }

    /** Fetch full item from API before selecting */
    const handleSelectItem = async (itemId: string) => {
        if (!currentTemplateId) return
        setFetchingItemId(itemId)
        setEditItem(null)
        try {
            const res = await menuService.getItem(currentTemplateId, itemId)
            setSelectedItem(res.data)
        } catch {
            // Fallback: just mark as selected without full data
            setSelectedItem(null)
        } finally {
            setFetchingItemId(null)
        }
    }

    /** Fetch full item from API before opening edit panel */
    const handleOpenEdit = async (itemId: string) => {
        if (!currentTemplateId) return
        setFetchingItemId(itemId)
        try {
            const res = await menuService.getItem(currentTemplateId, itemId)
            openEditPanel(res.data)
        } catch {
            // silent
        } finally {
            setFetchingItemId(null)
        }
    }

    const handleSaveEdit = async () => {
        if (!editItem || !currentTemplateId) return
        setSubmitting(true)
        try {
            const payload: UpdateMenuItemPayload = {}
            if (editTitle !== editItem.title) payload.title = editTitle
            if (editDesc !== (editItem.description || "")) payload.description = editDesc
            if (editActive !== editItem.is_active) payload.is_active = editActive

            // Text type — reply field
            if (editItem.type === "text" && editReply !== (editItem.content?.reply || "")) {
                payload.content = { ...editItem.content, reply: editReply, format: "plain" }
            }

            // Media types — asset_ids + reply_after_media
            if (MEDIA_TYPES.includes(editItem.type)) {
                const newAssetIds = editAssetIds.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
                const oldAssetIds = editItem.content?.asset_ids || []
                const newReplyAfter = editReplyAfterMedia || null
                const oldReplyAfter = editItem.content?.reply_after_media || null

                const assetChanged = JSON.stringify(newAssetIds) !== JSON.stringify(oldAssetIds)
                const replyChanged = newReplyAfter !== oldReplyAfter

                if (assetChanged || replyChanged) {
                    payload.content = {
                        ...editItem.content,
                        asset_ids: newAssetIds,
                        reply_after_media: newReplyAfter,
                    }
                }
            }

            await menuService.updateItem(currentTemplateId, editItem.id, payload)
            setEditItem(null)
            fetchTree()
        } catch {/* silent */ } finally {
            setSubmitting(false)
        }
    }

    // Render tree node recursively
    const renderNode = (node: MenuTreeNode, depth = 0): React.ReactNode => {
        const item = node.item
        const isExpanded = expanded.has(item.id)
        const hasChildren = node.children.length > 0
        const isSubmenu = item.type === "submenu"
        const Icon = ICON_MAP[item.type] || FileText
        const typeConfig = MENU_ITEM_TYPES.find(t => t.value === item.type)
        const isSelected = selectedItem?.id === item.id

        return (
            <div key={item.id}>
                <div
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 10px", paddingRight: 10 + depth * 20,
                        borderRadius: 8, cursor: "pointer",
                        background: isSelected ? "rgba(0,71,134,0.06)" : "transparent",
                        borderRight: isSelected ? "3px solid #004786" : "3px solid transparent",
                        transition: "all 0.15s",
                        marginBottom: 1,
                    }}
                    onClick={() => handleSelectItem(item.id)}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--t-card-hover, #f9fafb)" }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                >
                    {/* Expand/Collapse */}
                    <div
                        style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        onClick={(e) => { e.stopPropagation(); if (isSubmenu || hasChildren) toggleExpand(item.id) }}
                    >
                        {(isSubmenu || hasChildren) && (
                            isExpanded
                                ? <ChevronDown size={13} style={{ color: "#6b7280" }} />
                                : <ChevronLeft size={13} style={{ color: "#9ca3af" }} />
                        )}
                    </div>

                    {/* Icon */}
                    <div style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: `${typeConfig?.color || "#6b7280"}12`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                        <Icon size={13} style={{ color: typeConfig?.color || "#6b7280" }} />
                    </div>

                    {/* Title */}
                    <span style={{
                        fontSize: 13, fontWeight: isSelected ? 600 : 500,
                        color: item.is_active ? "var(--t-text, #1f2937)" : "var(--t-text-muted, #9ca3af)",
                        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        textDecoration: !item.is_active ? "line-through" : "none",
                    }}>
                        {item.title}
                    </span>

                    {/* Type badge */}
                    <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 12,
                        background: `${typeConfig?.color || "#6b7280"}10`,
                        color: typeConfig?.color || "#6b7280",
                        fontWeight: 600, flexShrink: 0,
                    }}>
                        {typeConfig?.label || item.type}
                    </span>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        {isSubmenu && (
                            <button onClick={(e) => { e.stopPropagation(); setShowAddDialog(item.id) }}
                                style={iconBtnStyle} title="إضافة عنصر فرعي">
                                <Plus size={12} />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(item.id) }}
                            style={iconBtnStyle} title="تعديل">
                            {fetchingItemId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Edit3 size={12} />}
                        </button>
                        {depth > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id) }}
                                style={{ ...iconBtnStyle, color: "#ef4444" }} title="حذف">
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Children */}
                {isExpanded && hasChildren && (
                    <div>
                        {node.children
                            .sort((a, b) => a.item.order - b.item.order)
                            .map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div style={{ display: "flex", gap: 16, height: "calc(100vh - 180px)" }}>
            {/* ── Left Panel: Tree ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                {/* Template Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>محرر الشجرة</h2>
                        <p style={{ fontSize: 12, color: "var(--t-text-secondary, #6b7280)", margin: "2px 0 0" }}>
                            بناء وتعديل هيكل القائمة التفاعلية
                        </p>
                    </div>
                    <select
                        value={currentTemplateId || ""}
                        onChange={(e) => setCurrentTemplateId(e.target.value || null)}
                        style={{
                            padding: "7px 12px", borderRadius: 9,
                            border: "1px solid var(--t-border-light, #e5e7eb)",
                            background: "var(--t-surface, #f9fafb)", fontSize: 13,
                            color: "var(--t-text, #1f2937)", outline: "none",
                            minWidth: 200,
                        }}
                    >
                        <option value="">— اختر قالب —</option>
                        {templates.map(t => (
                            <option key={t.template_id} value={t.template_id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {!currentTemplateId && (
                    <div style={{ textAlign: "center", padding: 60, color: "var(--t-text-muted, #9ca3af)" }}>
                        <FolderTree size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                        <p style={{ fontSize: 14, fontWeight: 600 }}>اختر قالباً لتعديل الشجرة</p>
                    </div>
                )}

                {currentTemplateId && treeLoading && (
                    <div style={{ textAlign: "center", padding: 60 }}>
                        <Loader2 size={28} className="animate-spin" style={{ color: "#004786", margin: "0 auto 12px" }} />
                        <p style={{ fontSize: 13, color: "#6b7280" }}>جاري تحميل الشجرة...</p>
                    </div>
                )}

                {error && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 13 }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {tree && !treeLoading && (
                    <>
                        {/* Toolbar */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                            <button onClick={expandAll} style={toolbarBtnStyle} title="توسيع الكل">
                                <ChevronsDown size={13} /> توسيع
                            </button>
                            <button onClick={collapseAll} style={toolbarBtnStyle} title="طي الكل">
                                <ChevronsUp size={13} /> طي
                            </button>
                        </div>
                        {/* Tree */}
                        <div style={{
                            flex: 1, overflowY: "auto",
                            border: "1px solid var(--t-border-light, #e5e7eb)",
                            borderRadius: 12, padding: 8,
                            background: "var(--t-card, #fff)",
                        }}>
                            {renderNode(tree)}
                        </div>
                    </>
                )}
            </div>

            {/* ── Right Panel: Properties ── */}
            {(selectedItem || editItem) && (
                <div style={{
                    width: 320, flexShrink: 0, borderRadius: 14,
                    border: "1px solid var(--t-border-light, #e5e7eb)",
                    background: "var(--t-card, #fff)", overflow: "hidden",
                    display: "flex", flexDirection: "column",
                }}>
                    <div style={{
                        background: "linear-gradient(135deg, #004786, #0098d6)",
                        padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                            {editItem ? "تعديل العنصر" : "الخصائص"}
                        </span>
                        <button onClick={() => { setEditItem(null); setSelectedItem(null) }}
                            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: 3, cursor: "pointer" }}>
                            <X size={13} style={{ color: "#fff" }} />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
                        {fetchingItemId ? (
                            <div style={{ textAlign: "center", padding: 30 }}>
                                <Loader2 size={22} className="animate-spin" style={{ color: "#004786", margin: "0 auto 10px" }} />
                                <p style={{ fontSize: 12, color: "#6b7280" }}>جاري جلب بيانات العنصر...</p>
                            </div>
                        ) : editItem ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div>
                                    <label style={labelStyle}>العنوان</label>
                                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>الوصف</label>
                                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                                </div>
                                {editItem.type === "text" && (
                                    <div>
                                        <label style={labelStyle}>الرد</label>
                                        <textarea value={editReply} onChange={e => setEditReply(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                                    </div>
                                )}
                                {MEDIA_TYPES.includes(editItem.type) && (
                                    <>
                                        {/* Image Previews */}
                                        <div>
                                            <label style={labelStyle}>الوسائط ({editAssetIds.split(/[,\n]/).map(s => s.trim()).filter(Boolean).length})</label>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                                                {editAssetIds.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map((assetId, idx) => (
                                                    <div key={idx} style={{
                                                        position: "relative", width: 80, height: 80, borderRadius: 10,
                                                        border: "1px solid var(--t-border-light, #e5e7eb)",
                                                        overflow: "hidden", background: "var(--t-surface, #f3f4f6)",
                                                    }}>
                                                        {mediaUrls[assetId] ? (
                                                            <img
                                                                src={mediaUrls[assetId]}
                                                                alt={`asset-${idx}`}
                                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                                            />
                                                        ) : loadingMediaIds.has(assetId) ? (
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                                <Loader2 size={16} className="animate-spin" style={{ color: "#004786" }} />
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 2 }}>
                                                                <ImageIcon size={18} style={{ color: "#9ca3af" }} />
                                                                <span style={{ fontSize: 8, color: "#9ca3af" }}>{assetId.substring(0, 8)}</span>
                                                            </div>
                                                        )}
                                                        {/* Remove button */}
                                                        <button
                                                            onClick={() => {
                                                                const ids = editAssetIds.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
                                                                ids.splice(idx, 1)
                                                                setEditAssetIds(ids.join(", "))
                                                            }}
                                                            style={{
                                                                position: "absolute", top: 3, left: 3,
                                                                width: 18, height: 18, borderRadius: "50%",
                                                                background: "rgba(239,68,68,0.85)", border: "none",
                                                                cursor: "pointer", display: "flex",
                                                                alignItems: "center", justifyContent: "center",
                                                            }}
                                                        >
                                                            <X size={10} style={{ color: "#fff" }} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {/* Upload button */}
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploadingMedia}
                                                    style={{
                                                        width: 80, height: 80, borderRadius: 10,
                                                        border: "2px dashed var(--t-border-light, #d1d5db)",
                                                        background: "transparent", cursor: "pointer",
                                                        display: "flex", flexDirection: "column",
                                                        alignItems: "center", justifyContent: "center", gap: 4,
                                                        color: "var(--t-text-muted, #9ca3af)",
                                                        transition: "all 0.15s",
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border-light, #d1d5db)"; e.currentTarget.style.color = "var(--t-text-muted, #9ca3af)" }}
                                                >
                                                    {uploadingMedia
                                                        ? <Loader2 size={18} className="animate-spin" />
                                                        : <Upload size={18} />
                                                    }
                                                    <span style={{ fontSize: 9, fontWeight: 600 }}>رفع ملف</span>
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/gif,.pdf,.doc,.docx,.mp4,.mp3"
                                                    style={{ display: "none" }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleMediaUpload(file)
                                                        e.target.value = ""
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>رد بعد الوسائط (اختياري)</label>
                                            <textarea
                                                value={editReplyAfterMedia}
                                                onChange={e => setEditReplyAfterMedia(e.target.value)}
                                                rows={2}
                                                placeholder="نص يظهر بعد إرسال الوسائط"
                                                style={{ ...inputStyle, resize: "vertical" }}
                                            />
                                        </div>
                                    </>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <label style={{ ...labelStyle, margin: 0 }}>مفعّل</label>
                                    <button
                                        onClick={() => setEditActive(!editActive)}
                                        style={{
                                            width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                                            background: editActive ? "#004786" : "#d1d5db", position: "relative", transition: "all 0.2s",
                                        }}
                                    >
                                        <div style={{
                                            width: 16, height: 16, borderRadius: "50%", background: "#fff",
                                            position: "absolute", top: 2,
                                            right: editActive ? 2 : 18,
                                            transition: "right 0.2s",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                        }} />
                                    </button>
                                </div>
                                <button onClick={handleSaveEdit} disabled={submitting} style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                                    background: "linear-gradient(135deg, #004786, #0098d6)", color: "#fff",
                                    fontSize: 13, fontWeight: 600, marginTop: 4,
                                }}>
                                    {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                    حفظ التعديلات
                                </button>
                            </div>
                        ) : selectedItem && (
                            <div style={{ fontSize: 13 }}>
                                {([
                                    ["المعرف", selectedItem.id],
                                    ["المفتاح", selectedItem.key],
                                    ["النوع", MENU_ITEM_TYPES.find(t => t.value === selectedItem.type)?.label || selectedItem.type],
                                    ["الترتيب", String(selectedItem.order)],
                                    ["مفعّل", selectedItem.is_active ? "نعم ✅" : "لا ❌"],
                                ] as const).map(([label, value]) => (
                                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}>
                                        <span style={{ color: "var(--t-text-secondary, #6b7280)", fontWeight: 500 }}>{label}</span>
                                        <span style={{ color: "var(--t-text, #1f2937)", fontWeight: 600, textAlign: "left", maxWidth: "60%", wordBreak: "break-all" }}>{value}</span>
                                    </div>
                                ))}
                                {selectedItem.content?.reply && (
                                    <div style={{ marginTop: 12 }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>الرد:</p>
                                        <div style={{
                                            padding: 10, borderRadius: 8,
                                            background: "var(--t-surface, #f9fafb)",
                                            fontSize: 12, color: "var(--t-text, #1f2937)",
                                            whiteSpace: "pre-wrap", lineHeight: 1.6,
                                        }}>
                                            {selectedItem.content.reply}
                                        </div>
                                    </div>
                                )}
                                {selectedItem.content?.asset_ids && selectedItem.content.asset_ids.length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                                            الوسائط ({selectedItem.content.asset_ids.length}):
                                        </p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {(selectedItem.content.asset_ids as string[]).map((assetId: string, idx: number) => (
                                                <div key={idx} style={{
                                                    width: 72, height: 72, borderRadius: 8,
                                                    border: "1px solid var(--t-border-light, #e5e7eb)",
                                                    overflow: "hidden", background: "var(--t-surface, #f3f4f6)",
                                                    position: "relative",
                                                }}>
                                                    {mediaUrls[assetId] ? (
                                                        <img
                                                            src={mediaUrls[assetId]}
                                                            alt={`asset-${idx}`}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                                                            onClick={() => window.open(mediaUrls[assetId], "_blank")}
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                                        />
                                                    ) : loadingMediaIds.has(assetId) ? (
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                            <Loader2 size={14} className="animate-spin" style={{ color: "#004786" }} />
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 2 }}>
                                                            <ImageIcon size={16} style={{ color: "#9ca3af" }} />
                                                            <span style={{ fontSize: 7, color: "#9ca3af" }}>{assetId.substring(0, 8)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedItem.content?.reply_after_media !== undefined && selectedItem.content?.reply_after_media !== null && (
                                    <div style={{ marginTop: 12 }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>رد بعد الوسائط:</p>
                                        <div style={{
                                            padding: 10, borderRadius: 8,
                                            background: "var(--t-surface, #f9fafb)",
                                            fontSize: 12, color: "var(--t-text, #1f2937)",
                                            whiteSpace: "pre-wrap", lineHeight: 1.6,
                                        }}>
                                            {selectedItem.content.reply_after_media || "— فارغ —"}
                                        </div>
                                    </div>
                                )}
                                <button onClick={() => handleOpenEdit(selectedItem.id)} style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    width: "100%", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                                    background: "linear-gradient(135deg, #004786, #0098d6)", color: "#fff",
                                    fontSize: 13, fontWeight: 600, marginTop: 16,
                                }}>
                                    <Edit3 size={13} /> تعديل العنصر
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Add Item Dialog ── */}
            {showAddDialog && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 100,
                    background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
                }} onClick={resetAddForm}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: "100%", maxWidth: 460, maxHeight: "90vh", borderRadius: 18,
                        background: "var(--t-card, #fff)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        overflow: "hidden", animation: "modalSlideIn .25s cubic-bezier(0.16,1,0.3,1)",
                        display: "flex", flexDirection: "column",
                    }}>
                        <div style={{ background: "linear-gradient(135deg, #004786, #0072b5, #0098d6)", padding: "16px 20px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                            <div style={{ position: "absolute", top: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>إضافة عنصر جديد</span>
                                <button onClick={resetAddForm} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer" }}>
                                    <X size={14} style={{ color: "#fff" }} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
                            <div>
                                <label style={labelStyle}>المفتاح (key) *</label>
                                <input value={addKey} onChange={e => setAddKey(e.target.value)} placeholder="مثال: new_service" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>العنوان *</label>
                                <input value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="عنوان العنصر" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>النوع</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                                    {MENU_ITEM_TYPES.map(t => (
                                        <button
                                            key={t.value}
                                            onClick={() => setAddType(t.value)}
                                            style={{
                                                padding: "6px 8px", borderRadius: 8, fontSize: 11, fontWeight: 500,
                                                border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                                                borderColor: addType === t.value ? t.color : "var(--t-border-light, #e5e7eb)",
                                                background: addType === t.value ? `${t.color}10` : "transparent",
                                                color: addType === t.value ? t.color : "var(--t-text-secondary, #6b7280)",
                                            }}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Dynamic Content Fields ── */}
                            <div style={{
                                padding: "10px 12px", borderRadius: 10,
                                background: "var(--t-surface, #f9fafb)",
                                border: "1px solid var(--t-border-light, #e5e7eb)",
                            }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#004786", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                                    {ICON_MAP[addType] && (() => { const IC = ICON_MAP[addType]; return <IC size={12} /> })()}
                                    إعدادات {MENU_ITEM_TYPES.find(t => t.value === addType)?.label || addType}
                                </p>

                                {/* text / quick_reply / buttons / list → reply */}
                                {(addType === "text" || addType === "quick_reply" || addType === "buttons" || addType === "list") && (
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: 11 }}>نص الرد</label>
                                        <textarea
                                            value={addReply}
                                            onChange={e => setAddReply(e.target.value)}
                                            rows={3}
                                            placeholder="النص الذي سيظهر كرد"
                                            style={{ ...inputStyle, resize: "vertical" }}
                                        />
                                    </div>
                                )}

                                {/* images / videos / files → media upload + reply_after_media */}
                                {MEDIA_TYPES.includes(addType) && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: 11 }}>الوسائط</label>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                {addMediaAssetIds.map((assetId, idx) => (
                                                    <div key={idx} style={{
                                                        position: "relative", width: 64, height: 64, borderRadius: 8,
                                                        border: "1px solid var(--t-border-light, #e5e7eb)",
                                                        overflow: "hidden", background: "#fff",
                                                    }}>
                                                        {mediaUrls[assetId] ? (
                                                            <img src={mediaUrls[assetId]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                                                        ) : (
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                                <Loader2 size={14} className="animate-spin" style={{ color: "#004786" }} />
                                                            </div>
                                                        )}
                                                        <button onClick={() => setAddMediaAssetIds(prev => prev.filter((_, i) => i !== idx))}
                                                            style={{
                                                                position: "absolute", top: 2, left: 2, width: 16, height: 16, borderRadius: "50%",
                                                                background: "rgba(239,68,68,0.85)", border: "none", cursor: "pointer",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                            }}>
                                                            <X size={8} style={{ color: "#fff" }} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addFileInputRef.current?.click()} disabled={addUploadingMedia}
                                                    style={{
                                                        width: 64, height: 64, borderRadius: 8,
                                                        border: "2px dashed var(--t-border-light, #d1d5db)",
                                                        background: "transparent", cursor: "pointer",
                                                        display: "flex", flexDirection: "column",
                                                        alignItems: "center", justifyContent: "center", gap: 3,
                                                        color: "var(--t-text-muted, #9ca3af)", transition: "all 0.15s",
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border-light, #d1d5db)"; e.currentTarget.style.color = "var(--t-text-muted, #9ca3af)" }}>
                                                    {addUploadingMedia ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                    <span style={{ fontSize: 8, fontWeight: 600 }}>رفع</span>
                                                </button>
                                                <input ref={addFileInputRef} type="file" accept="image/png,image/jpeg,image/gif,.pdf,.doc,.docx,.mp4,.mp3"
                                                    style={{ display: "none" }} onChange={e => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleAddMediaUpload(file)
                                                        e.target.value = ""
                                                    }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: 11 }}>رد بعد الوسائط (اختياري)</label>
                                            <textarea value={addReplyAfterMedia} onChange={e => setAddReplyAfterMedia(e.target.value)}
                                                rows={2} placeholder="نص يظهر بعد إرسال الوسائط"
                                                style={{ ...inputStyle, resize: "vertical" }} />
                                        </div>
                                    </div>
                                )}

                                {/* submenu → presentation */}
                                {addType === "submenu" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: 11 }}>العنوان الرئيسي (Header)</label>
                                            <input value={addHeader} onChange={e => setAddHeader(e.target.value)}
                                                placeholder="عنوان القائمة الفرعية" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: 11 }}>التذييل (Footer)</label>
                                            <input value={addFooter} onChange={e => setAddFooter(e.target.value)}
                                                placeholder="نص التذييل (اختياري)" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: 11 }}>الزر (Button)</label>
                                            <input value={addButton} onChange={e => setAddButton(e.target.value)}
                                                placeholder="نص الزر (اختياري)" style={inputStyle} />
                                        </div>
                                    </div>
                                )}

                                {/* action → info */}
                                {addType === "action" && (
                                    <p style={{ fontSize: 11, color: "var(--t-text-muted, #9ca3af)", margin: 0 }}>
                                        سيتم تنفيذ إجراء مخصص عند اختيار هذا العنصر. يمكنك تكوين الإجراء بعد الإنشاء.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label style={labelStyle}>الوصف</label>
                                <input value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="اختياري" style={inputStyle} />
                            </div>
                        </div>
                        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--t-border-light, #e5e7eb)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                            <button onClick={resetAddForm} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--t-border-light, #e5e7eb)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>
                                إلغاء
                            </button>
                            <button onClick={handleAddItem} disabled={submitting || !addKey.trim() || !addTitle.trim()} style={{
                                padding: "8px 20px", borderRadius: 8, border: "none",
                                background: addKey.trim() && addTitle.trim() ? "linear-gradient(135deg, #004786, #0098d6)" : "#e5e7eb",
                                color: addKey.trim() && addTitle.trim() ? "#fff" : "#9ca3af",
                                fontSize: 13, fontWeight: 600, cursor: addKey.trim() && addTitle.trim() ? "pointer" : "default",
                                display: "flex", alignItems: "center", gap: 6,
                            }}>
                                {submitting && <Loader2 size={13} className="animate-spin" />}
                                إضافة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    )
}

const iconBtnStyle: React.CSSProperties = {
    background: "transparent", border: "none", borderRadius: 5,
    padding: 4, cursor: "pointer", color: "var(--t-text-muted, #9ca3af)",
    transition: "all 0.15s", display: "flex", alignItems: "center",
}

const toolbarBtnStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
    border: "1px solid var(--t-border-light, #e5e7eb)",
    background: "transparent", color: "var(--t-text-secondary, #6b7280)",
    cursor: "pointer", transition: "all 0.15s",
}

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "var(--t-text-secondary, #6b7280)", marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 9,
    border: "1px solid var(--t-border-light, #e5e7eb)",
    background: "var(--t-surface, #f9fafb)", fontSize: 13,
    outline: "none", color: "var(--t-text, #1f2937)",
}
