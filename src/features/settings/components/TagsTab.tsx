import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, useDeletedTags, useRestoreTag } from "../hooks/use-tags"
import type { Tag } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, Tag as TagIcon, X, Loader2, Search,
    AlertTriangle, Check, Hash, MoreVertical, Sparkles, FolderOpen,
    ArrowUpDown, RotateCcw, ChevronLeft, ChevronRight,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

const CSS = `
@keyframes tgIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes tgMenuIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
@keyframes tgFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}

.tg-table{width:100%;border-collapse:separate;border-spacing:0}
.tg-table thead th{padding:9px 14px;font-size:10.5px;font-weight:700;color:var(--t-text-faint);text-align:right;border-bottom:1.5px solid var(--t-border);white-space:nowrap;background:#fafbfc;text-transform:uppercase;letter-spacing:.03em}
.tg-table tbody td{padding:10px 14px;font-size:12px;color:var(--t-text);border-bottom:1px solid #f0f1f3;vertical-align:middle}
.tg-table tbody tr{transition:background .1s}
.tg-table tbody tr:hover{background:rgba(27,80,145,.015)}
.tg-table tbody tr:last-child td{border-bottom:none}
.tg-th-sort{display:inline-flex;align-items:center;gap:3px;cursor:pointer;user-select:none;transition:color .12s}
.tg-th-sort:hover{color:var(--t-accent)}

.tg-field{width:100%;padding:8px 11px;border-radius:8px;border:1.5px solid var(--t-border);background:#fafbfc;font-size:12px;color:var(--t-text);outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit}
.tg-field:focus{border-color:var(--t-accent);box-shadow:0 0 0 3px rgba(27,80,145,.06);background:#fff}
.tg-field::placeholder{color:#b0b7c3}
.tg-label{font-size:10px;font-weight:700;color:var(--t-text-muted);display:flex;align-items:center;gap:3px;margin-bottom:4px}
.tg-label-hint{font-size:9px;font-weight:500;color:#b0b7c3;margin-right:auto}

.tg-btn-primary{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:none;background:var(--t-brand-orange);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .12s;font-family:inherit;box-shadow:0 2px 8px rgba(27,80,145,.15)}
.tg-btn-primary:hover:not(:disabled){opacity:.9;box-shadow:0 4px 12px rgba(27,80,145,.2)}
.tg-btn-primary:disabled{opacity:.5;cursor:not-allowed}

.tg-btn-ghost{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1.5px solid var(--t-border);background:#fff;color:var(--t-text);font-size:11px;font-weight:600;cursor:pointer;transition:all .12s;font-family:inherit}
.tg-btn-ghost:hover{border-color:var(--t-accent);color:var(--t-accent)}

.tg-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}

.tg-actions-btn{width:28px;height:28px;border-radius:7px;border:1px solid var(--t-border);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t-text-faint);transition:all .1s}
.tg-actions-btn:hover{background:var(--t-surface);color:var(--t-text-muted);border-color:var(--t-border-medium)}
.tg-actions-menu{position:absolute;left:0;top:100%;margin-top:2px;z-index:20;background:#fff;border:1px solid var(--t-border);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.1);min-width:130px;padding:4px;animation:tgMenuIn .1s ease-out}
.tg-actions-menu button{width:100%;padding:7px 10px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;gap:6px;border-radius:7px;font-size:11px;font-weight:600;color:var(--t-text);transition:background .08s;font-family:inherit;text-align:right}
.tg-actions-menu button:hover{background:var(--t-surface)}
.tg-actions-menu button.danger{color:var(--t-danger)}
.tg-actions-menu button.danger:hover{background:rgba(239,68,68,.05)}

.tg-name-badge{display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 5px;border-radius:8px;background:#fafbfc;border:1px solid var(--t-border)}
.tg-color-swatch{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2.5px solid transparent;transition:all .12s;position:relative}
.tg-color-swatch:hover{transform:scale(1.08)}
.tg-color-swatch.active{border-color:var(--t-text);box-shadow:0 0 0 2px #fff}
.tg-color-swatch.active::after{content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:800;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.tg-preview-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px 4px 6px;border-radius:18px;font-size:12px;font-weight:700;transition:all .15s}
.tg-section{display:flex;align-items:center;gap:6px;margin:4px 0 2px}
.tg-section-label{font-size:9px;font-weight:800;color:#b0b7c3;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
.tg-section-line{flex:1;height:1px;background:#f0f1f3}

.tg-tab-bar{display:flex;gap:2px;background:#f0f1f3;border-radius:10px;padding:3px}
.tg-tab{padding:6px 16px;border-radius:8px;border:none;background:transparent;font-size:11px;font-weight:700;color:var(--t-text-muted);cursor:pointer;transition:all .12s;font-family:inherit;display:inline-flex;align-items:center;gap:5px}
.tg-tab:hover{color:var(--t-accent)}
.tg-tab.active{background:#fff;color:var(--t-accent);box-shadow:0 1px 3px rgba(0,0,0,.06)}
.tg-tab .tg-tab-count{font-size:9px;font-weight:800;padding:1px 6px;border-radius:10px;background:rgba(27,80,145,.08);color:var(--t-accent)}

.tg-restore-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:8px;border:1.5px solid rgba(27,80,145,.15);background:rgba(27,80,145,.03);color:var(--t-accent);font-size:11px;font-weight:700;cursor:pointer;transition:all .12s;font-family:inherit}
.tg-restore-btn:hover{background:rgba(27,80,145,.08);border-color:var(--t-accent)}
.tg-restore-btn:disabled{opacity:.5;cursor:not-allowed}

.tg-pagination{display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 14px;border-top:1px solid var(--t-border)}
.tg-pagination button{padding:5px 12px;border-radius:7px;border:1.5px solid var(--t-border);background:#fff;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;color:var(--t-accent);transition:all .12s;font-family:inherit}
.tg-pagination button:hover:not(:disabled){border-color:var(--t-accent);background:rgba(27,80,145,.03)}
.tg-pagination button:disabled{opacity:.4;cursor:not-allowed}
.tg-pagination span{font-size:11px;font-weight:700;color:var(--t-text-muted)}
`

const TAG_COLORS = [
    { name: "نيلي", hex: "#6366f1" }, { name: "وردي", hex: "#ec4899" },
    { name: "أحمر", hex: "var(--t-danger)" }, { name: "برتقالي", hex: "#f97316" },
    { name: "أصفر", hex: "#eab308" }, { name: "أخضر", hex: "var(--t-success)" },
    { name: "سماوي", hex: "#06b6d4" }, { name: "أزرق", hex: "var(--t-info)" },
    { name: "بنفسجي", hex: "#8b5cf6" }, { name: "زهري", hex: "#f472b6" },
] as const

function getTagColor(tag: Tag): string {
    if (tag.category) { let hash = 0; for (let i = 0; i < tag.category.length; i++) hash = tag.category.charCodeAt(i) + ((hash << 5) - hash); return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length].hex }
    return TAG_COLORS[0].hex
}

function fmtDate(d?: string) {
    if (!d) return "—"
    try { return new Intl.DateTimeFormat("ar", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Aden" }).format(new Date(d)) } catch { return d }
}

function Modal({ title, width = 440, onClose, children }: { title: string; width?: number; onClose: () => void; children: React.ReactNode }) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{ borderRadius: 16, background: "#fff", border: "1px solid var(--t-border)", width: "100%", maxWidth: width, margin: 16, animation: "tgIn .15s ease-out", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.12)" }}>
                <div style={{ height: 3, background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary))", borderRadius: "16px 16px 0 0" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f0f1f3", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--t-brand-orange)", display: "flex", alignItems: "center", justifyContent: "center" }}><TagIcon size={12} style={{ color: "#fff" }} /></div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>{title}</span>
                    </div>
                    <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, background: "var(--t-surface)", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-border)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "var(--t-surface)" }}>
                        <X size={12} />
                    </button>
                </div>
                <div style={{ padding: "14px 16px", overflowY: "auto", flex: 1 }}>{children}</div>
            </div>
        </div>
    )
}

function FormSection({ label, icon }: { label: string; icon?: React.ReactNode }) {
    return <div className="tg-section">{icon}<span className="tg-section-label">{label}</span><div className="tg-section-line" /></div>
}

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
    const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS[0].hex)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const base = { name, name_ar: nameAr || undefined, name_en: nameEn || undefined, emoji: emoji || undefined, category: cat || undefined, description: desc || undefined, source: source || undefined }
        if (isEdit) { const tagId = tag.id ?? tag.tag_id ?? ""; updateMut.mutate({ tagId, payload: base }, { onSuccess: r => { if (r.success) onClose() } }) }
        else createMut.mutate(base, { onSuccess: r => { if (r.success) onClose() } })
    }
    const isPending = createMut.isPending || updateMut.isPending

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Preview */}
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fafbfc", border: "1px solid var(--t-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={10} style={{ color: "#b0b7c3" }} /><span style={{ fontSize: 10, fontWeight: 600, color: "#b0b7c3" }}>معاينة</span></div>
                <div className="tg-preview-badge" style={{ color: selectedColor, background: `${selectedColor}10`, border: `1.5px solid ${selectedColor}20` }}>
                    {emoji && <span style={{ fontSize: 13 }}>{emoji}</span>}<span>{name || "اسم التاج"}</span>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 10 }}>
                <div><label className="tg-label">إيموجي</label><input className="tg-field" value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🏷️" maxLength={8} style={{ textAlign: "center", fontSize: 18, padding: "6px 0" }} /></div>
                <div><label className="tg-label">الاسم <span style={{ color: "var(--t-danger)" }}>*</span></label><input className="tg-field" value={name} onChange={e => setName(e.target.value)} placeholder="عميل VIP" required /></div>
            </div>

            <div>
                <label className="tg-label">الألوان</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {TAG_COLORS.map(c => <div key={c.hex} className={`tg-color-swatch${selectedColor === c.hex ? " active" : ""}`} style={{ background: c.hex }} onClick={() => setSelectedColor(c.hex)} title={c.name} />)}
                </div>
            </div>

            <div>
                <label className="tg-label">الوصف <span className="tg-label-hint">{desc.length}/200</span></label>
                <textarea className="tg-field" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف اختياري..." maxLength={200} style={{ resize: "vertical", lineHeight: 1.4 }} />
            </div>

            <FormSection label="تفاصيل إضافية" icon={<FolderOpen size={10} style={{ color: "#b0b7c3" }} />} />
            <div className="tg-grid-2">
                <div><label className="tg-label">الاسم بالعربية</label><input className="tg-field" dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="مميز" /></div>
                <div><label className="tg-label">الاسم بالإنجليزية</label><input className="tg-field" dir="ltr" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="VIP" /></div>
            </div>
            <div className="tg-grid-2">
                <div><label className="tg-label">التصنيف</label><input className="tg-field" value={cat} onChange={e => setCat(e.target.value)} placeholder="مبيعات" /></div>
                <div><label className="tg-label">المصدر</label><input className="tg-field" value={source} onChange={e => setSource(e.target.value)} placeholder="User" /></div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f1f3", marginTop: 2 }}>
                <button type="button" className="tg-btn-ghost" onClick={onClose}>إلغاء</button>
                <button type="submit" className="tg-btn-primary" disabled={isPending || !name.trim()}>
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {isEdit ? "حفظ التغييرات" : "إنشاء التاج"}
                </button>
            </div>
        </form>
    )
}

function ActionsDropdown({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: "relative", zIndex: open ? 20 : 1 }}>
            <button className="tg-actions-btn" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}><MoreVertical size={13} /></button>
            {open && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setOpen(false)} />
                    <div className="tg-actions-menu" dir="rtl">
                        <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.UPDATE_TAG}><button onClick={() => { onEdit(); setOpen(false) }}><Pencil size={11} /> تعديل</button></ActionGuard>
                        <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.DELETE_TAG}><button className="danger" onClick={() => { onDelete(); setOpen(false) }}><Trash2 size={11} /> حذف</button></ActionGuard>
                    </div>
                </>
            )}
        </div>
    )
}

export function TagsTab() {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""
    const { data: tags = [], isLoading } = useTags(tid)
    const deleteMut = useDeleteTag(tid)

    const [search, setSearch] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [editTag, setEditTag] = useState<Tag | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)
    const [sortField, setSortField] = useState<"name" | "created_at">("name")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
    const [activeTab, setActiveTab] = useState<"active" | "deleted">("active")
    const [deletedPage, setDeletedPage] = useState(1)

    const { data: deletedData, isLoading: isLoadingDeleted } = useDeletedTags(tid, deletedPage, 20)
    const restoreMut = useRestoreTag(tid)

    const filtered = tags.filter((t: Tag) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.name_ar ?? "").toLowerCase().includes(search.toLowerCase()) || (t.name_en ?? "").toLowerCase().includes(search.toLowerCase()) || (t.category ?? "").toLowerCase().includes(search.toLowerCase()))
        .sort((a: Tag, b: Tag) => { const dir = sortDir === "asc" ? 1 : -1; if (sortField === "name") return a.name.localeCompare(b.name) * dir; return ((a.created_at ?? "") > (b.created_at ?? "") ? 1 : -1) * dir })

    const toggleSort = (field: "name" | "created_at") => { if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortField(field); setSortDir("asc") } }
    const openEdit = (tag: Tag) => { setEditTag(tag); setShowForm(true) }
    const openCreate = () => { setEditTag(undefined); setShowForm(true) }

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* Status strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#fafbfc", border: "1px solid var(--t-border)" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--t-brand-orange)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TagIcon size={12} style={{ color: "#fff" }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--t-text-muted)", flex: 1 }}>إنشاء وإدارة الوسوم (Tags) لتصنيف جهات الاتصال والمحادثات.</span>
                <div style={{ textAlign: "center", flexShrink: 0 }}><div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-accent)" }}>{tags.length}</div><div style={{ fontSize: 9, color: "var(--t-text-faint)", fontWeight: 600 }}>الإجمالي</div></div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="tg-tab-bar">
                        <button className={`tg-tab ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
                            نشطة <span className="tg-tab-count">{tags.length}</span>
                        </button>
                        <button className={`tg-tab ${activeTab === "deleted" ? "active" : ""}`} onClick={() => { setActiveTab("deleted"); setDeletedPage(1) }}>
                            معطلة {deletedData?.total ? <span className="tg-tab-count">{deletedData.total}</span> : null}
                        </button>
                    </div>
                    {activeTab === "active" && (
                        <div style={{ position: "relative", width: 200 }}>
                            <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#b0b7c3", pointerEvents: "none" }} />
                            <input className="tg-field" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الوسوم..." style={{ paddingInlineEnd: 32, fontSize: 11 }} />
                        </div>
                    )}
                </div>
                <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.CREATE_TAG}>
                    <button className="tg-btn-primary" onClick={openCreate}><Plus size={13} /> وسم جديد</button>
                </ActionGuard>
            </div>

            {activeTab === "active" ? (
                <div style={{ borderRadius: 12, border: "1px solid var(--t-border)", background: "#fff", overflow: "visible" }}>
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--t-text-faint)", fontSize: 12 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid var(--t-border)", borderTopColor: "var(--t-accent)", animation: "spin .7s linear infinite" }} /> جاري التحميل...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--t-surface)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}><TagIcon size={22} style={{ color: "var(--t-border-medium)" }} /></div>
                            <div style={{ fontSize: 14, color: "var(--t-text)", fontWeight: 700, marginBottom: 3 }}>{search ? "لا توجد نتائج" : "لا توجد وسوم بعد"}</div>
                            <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 14 }}>{search ? "حاول تغيير كلمات البحث" : "أنشئ وسوماً لتصنيف جهات الاتصال"}</div>
                            {!search && <button className="tg-btn-primary" onClick={openCreate}><Plus size={13} /> أضف أول وسم</button>}
                        </div>
                    ) : (
                        <table className="tg-table">
                            <thead>
                                <tr>
                                    <th><span className="tg-th-sort" onClick={() => toggleSort("name")}>الاسم <ArrowUpDown size={10} style={{ opacity: sortField === "name" ? 1 : .3 }} /></span></th>
                                    <th>الوصف</th>
                                    <th>أنشأ بواسطة</th>
                                    <th>المصدر</th>
                                    <th><span className="tg-th-sort" onClick={() => toggleSort("created_at")}>تاريخ الإنشاء <ArrowUpDown size={10} style={{ opacity: sortField === "created_at" ? 1 : .3 }} /></span></th>
                                    <th>آخر تعديل بواسطة</th>
                                    <th><span className="tg-th-sort" onClick={() => toggleSort("created_at")}>آخر تعديل <ArrowUpDown size={10} style={{ opacity: sortField === "created_at" ? 1 : .3 }} /></span></th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((tag: Tag) => {
                                    const color = getTagColor(tag)
                                    return (
                                        <tr key={tag.id ?? tag.tag_id} style={{ animation: "tgFade .2s ease-out" }}>
                                            <td>
                                                <div className="tg-name-badge">
                                                    <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: tag.emoji ? 12 : 10, border: `1px solid ${color}18` }}>
                                                        {tag.emoji || <Hash size={10} style={{ color }} />}
                                                    </div>
                                                    <span style={{ fontWeight: 700, fontSize: 12.5, color: "var(--t-text)" }}>{tag.name}</span>
                                                </div>
                                            </td>
                                            <td><span style={{ color: "var(--t-text-faint)", fontSize: 11 }}>{tag.description || "—"}</span></td>
                                            <td><span style={{ fontSize: 11, color: "var(--t-text-muted)" }}>{tag.created_by || "—"}</span></td>
                                            <td><span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>{tag.source || "—"}</span></td>
                                            <td><span style={{ fontSize: 11, color: "var(--t-text-faint)", whiteSpace: "nowrap" }}>{fmtDate(tag.created_at)}</span></td>
                                            <td><span style={{ fontSize: 11, color: "var(--t-text-muted)" }}>{tag.last_edited_by || "—"}</span></td>
                                            <td><span style={{ fontSize: 11, color: "var(--t-text-faint)", whiteSpace: "nowrap" }}>{fmtDate(tag.last_edited_at || tag.updated_at)}</span></td>
                                            <td><ActionsDropdown onEdit={() => openEdit(tag)} onDelete={() => setDeleteTarget(tag)} /></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                /* ─── Deleted Tags ─── */
                <div style={{ borderRadius: 12, border: "1px solid var(--t-border)", background: "#fff", overflow: "visible" }}>
                    {isLoadingDeleted ? (
                        <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--t-accent)", fontSize: 12 }}>
                            <Loader2 size={16} className="animate-spin" /> جاري التحميل...
                        </div>
                    ) : !deletedData?.items?.length ? (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--t-surface)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={22} style={{ color: "var(--t-border-medium)" }} /></div>
                            <div style={{ fontSize: 13, color: "var(--t-text-faint)", fontWeight: 600 }}>لا توجد وسوم معطلة</div>
                        </div>
                    ) : (
                        <>
                            <table className="tg-table">
                                <thead><tr><th>الاسم</th><th>الوصف</th><th>المصدر</th><th>إجراءات</th></tr></thead>
                                <tbody>
                                    {deletedData.items.map((tag: Tag) => {
                                        return (
                                            <tr key={tag.id ?? tag.tag_id} style={{ opacity: .7 }}>
                                                <td>
                                                    <div className="tg-name-badge">
                                                        <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: tag.emoji ? 12 : 10, border: "1px solid var(--t-border)" }}>
                                                            {tag.emoji || <Hash size={10} style={{ color: "var(--t-text-faint)" }} />}
                                                        </div>
                                                        <span style={{ fontWeight: 700, fontSize: 12.5, color: "var(--t-text)" }}>{tag.name}</span>
                                                    </div>
                                                </td>
                                                <td><span style={{ color: "var(--t-text-faint)", fontSize: 11 }}>{tag.description || "—"}</span></td>
                                                <td><span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>{tag.source || "—"}</span></td>
                                                <td>
                                                    <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.UPDATE_TAG}>
                                                        <button className="tg-restore-btn" disabled={restoreMut.isPending} onClick={() => restoreMut.mutate(tag.id ?? tag.tag_id ?? "")}>
                                                            {restoreMut.isPending ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} استعادة
                                                        </button>
                                                    </ActionGuard>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {deletedData.total_pages > 1 && (
                                <div className="tg-pagination">
                                    <button disabled={!deletedData.has_previous} onClick={() => setDeletedPage(p => Math.max(1, p - 1))}>
                                        <ChevronRight size={12} /> السابق
                                    </button>
                                    <span>{deletedData.page} / {deletedData.total_pages}</span>
                                    <button disabled={!deletedData.has_next} onClick={() => setDeletedPage(p => p + 1)}>
                                        التالي <ChevronLeft size={12} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {showForm && <Modal title={editTag ? `تعديل: ${editTag.name}` : "وسم جديد"} width={440} onClose={() => setShowForm(false)}><TagForm tag={editTag} tenantId={tid} onClose={() => setShowForm(false)} /></Modal>}

            {deleteTarget && (
                <Modal title="تأكيد التعطيل" width={360} onClose={() => setDeleteTarget(null)}>
                    <div style={{ textAlign: "center", padding: "4px 0" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239,68,68,.06)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}><AlertTriangle size={22} style={{ color: "var(--t-danger)" }} /></div>
                        {deleteTarget.emoji && <div style={{ fontSize: 18, marginBottom: 4 }}>{deleteTarget.emoji}</div>}
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>تعطيل وسم «{deleteTarget.name}»؟</div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 16 }}>سيتم تعطيل الوسم ويمكنك استعادته لاحقاً</div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button className="tg-btn-ghost" onClick={() => setDeleteTarget(null)}>إلغاء</button>
                            <button disabled={deleteMut.isPending} onClick={() => { const tagId = deleteTarget.id ?? deleteTarget.tag_id ?? ""; deleteMut.mutate(tagId, { onSuccess: r => { if (r.success) setDeleteTarget(null) } }) }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 18px", borderRadius: 8, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(239,68,68,.2)" }}>
                                {deleteMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} تعطيل
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
