import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "../hooks/use-teams-tags"
import type { Tag } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, Tag as TagIcon, X, Loader2, Search,
    AlertTriangle, Check, Hash,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
const CSS = `
.tg-card { border-radius:12px; border:1px solid var(--t-border); background:var(--t-card); padding:14px 16px; transition:box-shadow .15s,border-color .15s; }
.tg-card:hover { border-color:var(--t-accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--t-accent) 10%,transparent); }
.tg-field { width:100%; padding:9px 12px; border-radius:9px; border:1.5px solid var(--t-border); background:var(--t-surface); font-size:13px; color:var(--t-text); outline:none; transition:border-color .15s; box-sizing:border-box; }
.tg-field:focus { border-color:var(--t-accent); }
.tg-label { font-size:10px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--t-text-faint); display:block; margin-bottom:5px; }
.tg-btn-primary { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:9px; border:none; background:var(--t-accent); color:var(--t-text-on-accent); font-size:13px; font-weight:700; cursor:pointer; transition:opacity .15s; }
.tg-btn-primary:hover:not(:disabled) { opacity:.88; }
.tg-btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:9px; border:1.5px solid var(--t-border); background:transparent; color:var(--t-text); font-size:12px; font-weight:600; cursor:pointer; transition:border-color .15s; }
.tg-btn-ghost:hover { border-color:var(--t-accent); }
.tg-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.tg-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
.tg-chip { display:inline-flex; align-items:center; gap:4px; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:700; }
@keyframes tgIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

/* ─── tag color palette (cycles by index) ─── */
const CHIP_COLORS = [
    ["#6366f1", "#6366f120"],
    ["#10b981", "#10b98120"],
    ["#f59e0b", "#f59e0b20"],
    ["#3b82f6", "#3b82f620"],
    ["#ec4899", "#ec489920"],
    ["#8b5cf6", "#8b5cf620"],
    ["#14b8a6", "#14b8a620"],
    ["#f97316", "#f9731620"],
] as const

const COLOR_MAP = new Map<string, (typeof CHIP_COLORS)[number]>()
function getCatColor(cat: string): (typeof CHIP_COLORS)[number] {
    if (!COLOR_MAP.has(cat)) COLOR_MAP.set(cat, CHIP_COLORS[COLOR_MAP.size % CHIP_COLORS.length])
    return COLOR_MAP.get(cat)!
}

/* ─── Modal ─── */
function Modal({ title, width = 500, onClose, children }: {
    title: string; width?: number; onClose: () => void; children: React.ReactNode
}) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{ borderRadius: 16, background: "var(--t-card)", border: "1px solid var(--t-border)", width: "100%", maxWidth: width, margin: 16, animation: "tgIn .15s ease-out" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--t-border-light)" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)" }}>{title}</div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex" }}><X size={16} /></button>
                </div>
                <div style={{ padding: "18px 20px" }}>{children}</div>
            </div>
        </div>
    )
}

/* ─── Tag Form ─── */
function TagForm({ tag, tenantId, onClose }: { tag?: Tag; tenantId: string; onClose: () => void }) {
    const createMut = useCreateTag(tenantId)
    const updateMut = useUpdateTag(tenantId)
    const isEdit = !!tag

    const [name, setName] = useState(tag?.name ?? "")
    const [nameAr, setNameAr] = useState(tag?.name_ar ?? "")
    const [nameEn, setNameEn] = useState(tag?.name_en ?? "")
    const [emoji, setEmoji] = useState(tag?.emoji ?? "")
    const [cat, setCat] = useState(tag?.category ?? "")
    const [desc, setDesc] = useState(tag?.description ?? "")
    const [source, setSource] = useState(tag?.source ?? "")

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const base = {
            name,
            name_ar: nameAr || undefined,
            name_en: nameEn || undefined,
            emoji: emoji || undefined,
            category: cat || undefined,
            description: desc || undefined,
            source: source || undefined,
        }
        if (isEdit) {
            // use id if available, fallback to tag_id
            const tagId = tag.id ?? tag.tag_id ?? ""
            updateMut.mutate({ tagId, payload: base }, { onSuccess: r => { if (r.success) onClose() } })
        } else {
            createMut.mutate(base, { onSuccess: r => { if (r.success) onClose() } })
        }
    }

    const isPending = createMut.isPending || updateMut.isPending

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {/* Emoji + Name in same row */}
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 10 }}>
                <div>
                    <label className="tg-label">إيموجي</label>
                    <input className="tg-field" value={emoji} onChange={e => setEmoji(e.target.value)}
                        placeholder="🏷️" maxLength={8}
                        style={{ textAlign: "center", fontSize: 20, padding: "6px 0" }} />
                </div>
                <div>
                    <label className="tg-label">الاسم الرئيسي *</label>
                    <input className="tg-field" value={name} onChange={e => setName(e.target.value)}
                        placeholder="عميل VIP" required />
                </div>
            </div>

            {/* Bilingual names */}
            <div className="tg-grid-2">
                <div>
                    <label className="tg-label">الاسم بالعربية</label>
                    <input className="tg-field" dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="مميز" />
                </div>
                <div>
                    <label className="tg-label">الاسم بالإنجليزية</label>
                    <input className="tg-field" dir="ltr" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="VIP" />
                </div>
            </div>

            {/* Category + Source */}
            <div className="tg-grid-2">
                <div>
                    <label className="tg-label">التصنيف</label>
                    <input className="tg-field" value={cat} onChange={e => setCat(e.target.value)} placeholder="customer" />
                </div>
                <div>
                    <label className="tg-label">المصدر</label>
                    <input className="tg-field" value={source} onChange={e => setSource(e.target.value)} placeholder="User" />
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="tg-label">الوصف</label>
                <textarea className="tg-field" rows={2} value={desc} onChange={e => setDesc(e.target.value)}
                    placeholder="وصف اختياري (حتى 200 حرف)..." maxLength={200}
                    style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" className="tg-btn-ghost" onClick={onClose}>إلغاء</button>
                <button type="submit" className="tg-btn-primary" disabled={isPending}>
                    {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {isEdit ? "حفظ التغييرات" : "إنشاء التاج"}
                </button>
            </div>
        </form>
    )
}

/* ─── Tag Card ─── */
function TagCard({ tag, onEdit, onDelete }: {
    tag: Tag
    onEdit: () => void
    onDelete: () => void
}) {
    const [c, bg] = getCatColor(tag.category || "other")
    return (
        <div className="tg-card" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            {/* Emoji bubble */}
            <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: bg, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: tag.emoji ? 22 : 16,
            }}>
                {tag.emoji ? tag.emoji : <Hash size={16} style={{ color: c }} />}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>{tag.name}</span>
                    {tag.category && (
                        <span className="tg-chip" style={{ color: c, background: bg }}>
                            {tag.category}
                        </span>
                    )}
                </div>
                {/* Bilingual names */}
                {(tag.name_ar || tag.name_en) && (
                    <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 2 }}>
                        {[tag.name_ar, tag.name_en].filter(Boolean).join(" · ")}
                    </div>
                )}
                {tag.description && (
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 3, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
                        {tag.description}
                    </div>
                )}
                {/* Meta */}
                {(tag.created_by || tag.last_edited_by) && (
                    <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 4, opacity: .7 }}>
                        {tag.created_by && <span>أُنشئ بواسطة: {tag.created_by}</span>}
                        {tag.last_edited_by && <span style={{ marginRight: 8 }}>· آخر تعديل: {tag.last_edited_by}</span>}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.UPDATE_TAG}>
                    <button className="tg-btn-ghost" onClick={onEdit} style={{ padding: "5px 8px" }}>
                        <Pencil size={12} />
                    </button>
                </ActionGuard>
                <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.DELETE_TAG}>
                    <button onClick={onDelete} style={{ display: "inline-flex", alignItems: "center", padding: "5px 8px", borderRadius: 9, border: "none", background: "rgba(239,68,68,.1)", color: "var(--t-danger)", cursor: "pointer" }}>
                        <Trash2 size={12} />
                    </button>
                </ActionGuard>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════
   Main Component
═══════════════════════════════════════ */
export function TagsTab() {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""

    const { data: tags = [], isLoading } = useTags(tid)
    const deleteMut = useDeleteTag(tid)

    const [search, setSearch] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [editTag, setEditTag] = useState<Tag | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)

    const filtered = tags.filter((t: Tag) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.name_ar ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (t.name_en ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (t.category ?? "").toLowerCase().includes(search.toLowerCase())
    )

    // group by category
    const categories = [...new Set(filtered.map((t: Tag) => t.category || "بدون تصنيف"))]

    const openEdit = (tag: Tag) => { setEditTag(tag); setShowForm(true) }
    const openCreate = () => { setEditTag(undefined); setShowForm(true) }

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* ── Header pills: summary ── */}
            {!isLoading && tags.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: "var(--t-surface)", color: "var(--t-text-faint)", border: "1px solid var(--t-border-light)" }}>
                        {tags.length} تاج
                    </span>
                    {[...new Set(tags.map((t: Tag) => t.category).filter(Boolean))].map((cat) => {
                        const [c, bg] = getCatColor(cat as string)
                        return (
                            <span key={cat as string} className="tg-chip" style={{ color: c, background: bg, cursor: "pointer" }}
                                onClick={() => setSearch(cat as string)}>
                                {cat as string} ({tags.filter((t: Tag) => t.category === cat).length})
                            </span>
                        )
                    })}
                </div>
            )}

            {/* ── Toolbar ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                    <input className="tg-field" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="بحث بالاسم أو التصنيف..." style={{ paddingRight: 36 }} />
                </div>
                <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.CREATE_TAG}>
                    <button className="tg-btn-primary" onClick={openCreate}>
                        <Plus size={14} /> تاج جديد
                    </button>
                </ActionGuard>
            </div>

            {/* ── Content ── */}
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--t-text-faint)" }}>
                    <Loader2 size={18} className="animate-spin" /> جاري تحميل التاجات...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <TagIcon size={36} style={{ margin: "0 auto 12px", display: "block", opacity: .2 }} />
                    <div style={{ fontSize: 14, color: "var(--t-text-faint)", fontWeight: 600 }}>
                        {search ? "لا توجد نتائج للبحث" : "لا توجد تاجات بعد"}
                    </div>
                    {!search && (
                        <button className="tg-btn-primary" onClick={openCreate} style={{ marginTop: 16 }}>
                            <Plus size={14} /> أضف أول تاج
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {categories.map(cat => (
                        <div key={cat}>
                            {/* Category heading */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{ height: 1, flex: 1, background: "var(--t-border-light)" }} />
                                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".08em", whiteSpace: "nowrap" }}>
                                    {cat} ({filtered.filter((t: Tag) => (t.category || "بدون تصنيف") === cat).length})
                                </span>
                                <div style={{ height: 1, flex: 1, background: "var(--t-border-light)" }} />
                            </div>
                            {/* Tag cards in responsive grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                                {filtered
                                    .filter((t: Tag) => (t.category || "بدون تصنيف") === cat)
                                    .map((tag: Tag) => (
                                        <TagCard
                                            key={tag.id ?? tag.tag_id}
                                            tag={tag}
                                            onEdit={() => openEdit(tag)}
                                            onDelete={() => setDeleteTarget(tag)}
                                        />
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modals ── */}
            {showForm && (
                <Modal title={editTag ? `تعديل: ${editTag.name}` : "إنشاء تاج جديد"} width={520} onClose={() => setShowForm(false)}>
                    <TagForm tag={editTag} tenantId={tid} onClose={() => setShowForm(false)} />
                </Modal>
            )}

            {deleteTarget && (
                <Modal title="تأكيد الحذف" width={400} onClose={() => setDeleteTarget(null)}>
                    <div style={{ textAlign: "center", padding: "8px 0 8px" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,.1)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <AlertTriangle size={24} style={{ color: "var(--t-danger)" }} />
                        </div>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{deleteTarget.emoji}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 6 }}>
                            حذف تاج «{deleteTarget.name}»؟
                        </div>
                        <div style={{ fontSize: 12, color: "var(--t-text-faint)", marginBottom: 20 }}>
                            لا يمكن التراجع عن هذا الإجراء
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button className="tg-btn-ghost" onClick={() => setDeleteTarget(null)}>إلغاء</button>
                            <button
                                disabled={deleteMut.isPending}
                                onClick={() => {
                                    const tagId = deleteTarget.id ?? deleteTarget.tag_id ?? ""
                                    deleteMut.mutate(tagId, { onSuccess: r => { if (r.success) setDeleteTarget(null) } })
                                }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 9, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                {deleteMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} حذف
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
