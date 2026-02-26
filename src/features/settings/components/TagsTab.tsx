import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "../hooks/use-teams-tags"
import type { Tag } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, Tag as TagIcon, X, Loader2, Search,
    AlertTriangle, Check, Hash, MoreVertical, Sparkles, FolderOpen,
    ArrowUpDown,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
const CSS = `
.tg-table { width:100%; border-collapse:separate; border-spacing:0; }
.tg-table thead th {
    padding:8px 12px; font-size:11px; font-weight:600; color:var(--t-text-secondary);
    text-align:right; border-bottom:1px solid var(--t-border); white-space:nowrap;
    background:var(--t-surface);
}
.tg-table tbody td {
    padding:9px 12px; font-size:12px; color:var(--t-text); border-bottom:1px solid var(--t-border-light);
    vertical-align:middle;
}
.tg-table tbody tr { transition:background .1s; }
.tg-table tbody tr:hover { background:color-mix(in srgb,var(--t-accent) 3%,transparent); }
.tg-table tbody tr:last-child td { border-bottom:none; }
.tg-th-sort { display:inline-flex; align-items:center; gap:3px; cursor:pointer; user-select:none; }
.tg-th-sort:hover { color:var(--t-accent); }

.tg-field {
    width:100%; padding:8px 11px; border-radius:8px; border:1.5px solid var(--t-border);
    background:var(--t-surface); font-size:12px; color:var(--t-text); outline:none;
    transition:border-color .15s,box-shadow .15s; box-sizing:border-box; font-family:inherit;
}
.tg-field:focus { border-color:var(--t-accent); box-shadow:0 0 0 2px color-mix(in srgb,var(--t-accent) 10%,transparent); }
.tg-field::placeholder { color:var(--t-text-faint); opacity:.6; }

.tg-label { font-size:10px; font-weight:700; color:var(--t-text-secondary); display:flex; align-items:center; gap:3px; margin-bottom:4px; }
.tg-label-hint { font-size:9px; font-weight:500; color:var(--t-text-faint); margin-right:auto; }

.tg-btn-primary {
    display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px;
    border:none; background:var(--t-accent); color:var(--t-text-on-accent); font-size:12px;
    font-weight:700; cursor:pointer; transition:opacity .12s; font-family:inherit;
}
.tg-btn-primary:hover:not(:disabled) { opacity:.88; }
.tg-btn-primary:disabled { opacity:.5; cursor:not-allowed; }

.tg-btn-ghost {
    display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:8px;
    border:1.5px solid var(--t-border); background:transparent; color:var(--t-text);
    font-size:11px; font-weight:600; cursor:pointer; transition:all .12s; font-family:inherit;
}
.tg-btn-ghost:hover { border-color:var(--t-accent); color:var(--t-accent); }

.tg-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

.tg-actions-btn {
    width:26px; height:26px; border-radius:6px; border:none; background:transparent;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:var(--t-text-faint); transition:all .1s;
}
.tg-actions-btn:hover { background:var(--t-surface); color:var(--t-text); }

.tg-actions-menu {
    position:absolute; left:0; top:100%; margin-top:2px; z-index:20;
    background:var(--t-card); border:1px solid var(--t-border); border-radius:8px;
    box-shadow:0 6px 20px rgba(0,0,0,.1); min-width:120px; padding:3px;
    animation:tgMenuIn .1s ease-out;
}
.tg-actions-menu button {
    width:100%; padding:6px 10px; border:none; background:transparent; cursor:pointer;
    display:flex; align-items:center; gap:6px; border-radius:6px;
    font-size:11px; font-weight:600; color:var(--t-text); transition:background .08s;
    font-family:inherit; text-align:right;
}
.tg-actions-menu button:hover { background:var(--t-surface); }
.tg-actions-menu button.danger { color:var(--t-danger); }
.tg-actions-menu button.danger:hover { background:rgba(239,68,68,.06); }

.tg-name-badge {
    display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 5px;
    border-radius:7px; background:var(--t-surface); border:1px solid var(--t-border-light);
}

.tg-color-swatch {
    width:26px; height:26px; border-radius:50%; cursor:pointer;
    border:2.5px solid transparent; transition:all .12s; position:relative;
}
.tg-color-swatch:hover { transform:scale(1.08); }
.tg-color-swatch.active { border-color:var(--t-text); box-shadow:0 0 0 2px var(--t-card); }
.tg-color-swatch.active::after {
    content:'✓'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:11px; font-weight:800; text-shadow:0 1px 2px rgba(0,0,0,.3);
}

.tg-section { display:flex; align-items:center; gap:6px; margin:4px 0 2px; }
.tg-section-label { font-size:9px; font-weight:800; color:var(--t-text-faint); text-transform:uppercase; letter-spacing:.08em; white-space:nowrap; }
.tg-section-line { flex:1; height:1px; background:var(--t-border-light); }

.tg-preview-badge {
    display:inline-flex; align-items:center; gap:5px; padding:4px 12px 4px 6px;
    border-radius:18px; font-size:12px; font-weight:700; transition:all .15s;
}

@keyframes tgIn { from{opacity:0;transform:scale(.97) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes tgMenuIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
`

/* ─── Colors ─── */
const TAG_COLORS = [
    { name: "نيلي", hex: "#6366f1" }, { name: "وردي", hex: "#ec4899" },
    { name: "أحمر", hex: "#ef4444" }, { name: "برتقالي", hex: "#f97316" },
    { name: "أصفر", hex: "#eab308" }, { name: "أخضر", hex: "#10b981" },
    { name: "سماوي", hex: "#06b6d4" }, { name: "أزرق", hex: "#3b82f6" },
    { name: "بنفسجي", hex: "#8b5cf6" }, { name: "زهري", hex: "#f472b6" },
] as const

function getTagColor(tag: Tag): string {
    if (tag.category) {
        let hash = 0
        for (let i = 0; i < tag.category.length; i++) hash = tag.category.charCodeAt(i) + ((hash << 5) - hash)
        return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length].hex
    }
    return TAG_COLORS[0].hex
}

function fmtDate(d?: string) {
    if (!d) return "—"
    try {
        return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Aden" }).format(new Date(d))
    } catch { return d }
}

/* ─── Modal ─── */
function Modal({ title, width = 440, onClose, children }: {
    title: string; width?: number; onClose: () => void; children: React.ReactNode
}) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{
                borderRadius: 14, background: "var(--t-card)", border: "1px solid var(--t-border)",
                width: "100%", maxWidth: width, margin: 16, animation: "tgIn .15s ease-out",
                maxHeight: "88vh", display: "flex", flexDirection: "column",
                boxShadow: "0 12px 40px rgba(0,0,0,.1)",
            }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderBottom: "1px solid var(--t-border-light)", flexShrink: 0,
                }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)" }}>{title}</div>
                    <button onClick={onClose} style={{
                        width: 24, height: 24, borderRadius: 6, background: "transparent",
                        border: "none", cursor: "pointer", color: "var(--t-text-faint)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                    >
                        <X size={14} />
                    </button>
                </div>
                <div style={{ padding: "14px 16px", overflowY: "auto", flex: 1 }}>{children}</div>
            </div>
        </div>
    )
}

/* ─── Section divider ─── */
function FormSection({ label, icon }: { label: string; icon?: React.ReactNode }) {
    return (
        <div className="tg-section">
            {icon}
            <span className="tg-section-label">{label}</span>
            <div className="tg-section-line" />
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
    const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS[0].hex)

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
            const tagId = tag.id ?? tag.tag_id ?? ""
            updateMut.mutate({ tagId, payload: base }, { onSuccess: r => { if (r.success) onClose() } })
        } else {
            createMut.mutate(base, { onSuccess: r => { if (r.success) onClose() } })
        }
    }

    const isPending = createMut.isPending || updateMut.isPending

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Preview */}
            <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "var(--t-surface)", border: "1px solid var(--t-border-light)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={10} style={{ color: "var(--t-text-faint)" }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)" }}>معاينة</span>
                </div>
                <div className="tg-preview-badge" style={{
                    color: selectedColor, background: `${selectedColor}14`,
                    border: `1.5px solid ${selectedColor}25`,
                }}>
                    {emoji && <span style={{ fontSize: 13 }}>{emoji}</span>}
                    <span>{name || "اسم التاج"}</span>
                </div>
            </div>

            {/* Emoji + Name */}
            <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 10 }}>
                <div>
                    <label className="tg-label">إيموجي</label>
                    <input className="tg-field" value={emoji} onChange={e => setEmoji(e.target.value)}
                        placeholder="🏷️" maxLength={8}
                        style={{ textAlign: "center", fontSize: 18, padding: "6px 0" }} />
                </div>
                <div>
                    <label className="tg-label">الاسم <span style={{ color: "var(--t-danger)" }}>*</span></label>
                    <input className="tg-field" value={name} onChange={e => setName(e.target.value)}
                        placeholder="عميل VIP" required />
                </div>
            </div>

            {/* Colors */}
            <div>
                <label className="tg-label">الألوان</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {TAG_COLORS.map(c => (
                        <div key={c.hex}
                            className={`tg-color-swatch${selectedColor === c.hex ? " active" : ""}`}
                            style={{ background: c.hex }}
                            onClick={() => setSelectedColor(c.hex)}
                            title={c.name} />
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="tg-label">
                    الوصف
                    <span className="tg-label-hint">{desc.length}/200</span>
                </label>
                <textarea className="tg-field" rows={2} value={desc} onChange={e => setDesc(e.target.value)}
                    placeholder="وصف اختياري..." maxLength={200}
                    style={{ resize: "vertical", lineHeight: 1.4 }} />
            </div>

            {/* Extra */}
            <FormSection label="تفاصيل إضافية" icon={<FolderOpen size={10} style={{ color: "var(--t-text-faint)" }} />} />

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
            <div className="tg-grid-2">
                <div>
                    <label className="tg-label">التصنيف</label>
                    <input className="tg-field" value={cat} onChange={e => setCat(e.target.value)} placeholder="مبيعات" />
                </div>
                <div>
                    <label className="tg-label">المصدر</label>
                    <input className="tg-field" value={source} onChange={e => setSource(e.target.value)} placeholder="User" />
                </div>
            </div>

            {/* Actions */}
            <div style={{
                display: "flex", gap: 8, justifyContent: "flex-end",
                paddingTop: 6, borderTop: "1px solid var(--t-border-light)", marginTop: 2,
            }}>
                <button type="button" className="tg-btn-ghost" onClick={onClose}>إلغاء</button>
                <button type="submit" className="tg-btn-primary" disabled={isPending || !name.trim()}>
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {isEdit ? "حفظ التغييرات" : "إنشاء التاج"}
                </button>
            </div>
        </form>
    )
}

/* ─── Actions Dropdown ─── */
function ActionsDropdown({ onEdit, onDelete }: {
    onEdit: () => void; onDelete: () => void
}) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: "relative", zIndex: open ? 20 : 1 }}>
            <button className="tg-actions-btn" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}>
                <MoreVertical size={14} />
            </button>
            {open && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setOpen(false)} />
                    <div className="tg-actions-menu" dir="rtl">
                        <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.UPDATE_TAG}>
                            <button onClick={() => { onEdit(); setOpen(false) }}>
                                <Pencil size={12} /> تعديل
                            </button>
                        </ActionGuard>
                        <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.DELETE_TAG}>
                            <button className="danger" onClick={() => { onDelete(); setOpen(false) }}>
                                <Trash2 size={12} /> حذف
                            </button>
                        </ActionGuard>
                    </div>
                </>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════
   Main
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
    const [sortField, setSortField] = useState<"name" | "created_at">("name")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

    const filtered = tags
        .filter((t: Tag) =>
            !search ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            (t.name_ar ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (t.name_en ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (t.category ?? "").toLowerCase().includes(search.toLowerCase())
        )
        .sort((a: Tag, b: Tag) => {
            const dir = sortDir === "asc" ? 1 : -1
            if (sortField === "name") return a.name.localeCompare(b.name) * dir
            return ((a.created_at ?? "") > (b.created_at ?? "") ? 1 : -1) * dir
        })

    const toggleSort = (field: "name" | "created_at") => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortField(field); setSortDir("asc") }
    }

    const openEdit = (tag: Tag) => { setEditTag(tag); setShowForm(true) }
    const openCreate = () => { setEditTag(undefined); setShowForm(true) }

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ position: "relative", width: 200 }}>
                    <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                    <input className="tg-field" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="بحث في التاجات" style={{ paddingInlineEnd: 32, fontSize: 11 }} />
                </div>
                <ActionGuard pageBit={PAGE_BITS.TAGS} actionBit={ACTION_BITS.CREATE_TAG}>
                    <button className="tg-btn-primary" onClick={openCreate}>
                        <Plus size={13} /> + تاج جديد
                    </button>
                </ActionGuard>
            </div>

            {/* Table */}
            <div style={{ borderRadius: 10, border: "1px solid var(--t-border)", background: "var(--t-card)", overflow: "visible" }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--t-text-faint)", fontSize: 12 }}>
                        <Loader2 size={15} className="animate-spin" /> جاري التحميل...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <TagIcon size={28} style={{ margin: "0 auto 8px", display: "block", color: "var(--t-text-faint)", opacity: .25 }} />
                        <div style={{ fontSize: 13, color: "var(--t-text-secondary)", fontWeight: 600 }}>
                            {search ? "لا توجد نتائج" : "لا توجد تاجات بعد"}
                        </div>
                        {!search && (
                            <button className="tg-btn-primary" onClick={openCreate} style={{ marginTop: 10 }}>
                                <Plus size={13} /> أضف أول تاج
                            </button>
                        )}
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
                                    <tr key={tag.id ?? tag.tag_id}>
                                        <td>
                                            <div className="tg-name-badge">
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                                    background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: tag.emoji ? 12 : 10,
                                                }}>
                                                    {tag.emoji || <Hash size={10} style={{ color }} />}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 12 }}>{tag.name}</span>
                                            </div>
                                        </td>
                                        <td><span style={{ color: "var(--t-text-secondary)", fontSize: 11 }}>{tag.description || "—"}</span></td>
                                        <td><span style={{ fontSize: 11 }}>{tag.created_by || "—"}</span></td>
                                        <td><span style={{ fontSize: 11, color: "var(--t-text-secondary)" }}>{tag.source || "—"}</span></td>
                                        <td><span style={{ fontSize: 11, color: "var(--t-text-secondary)", whiteSpace: "nowrap" }}>{fmtDate(tag.created_at)}</span></td>
                                        <td><span style={{ fontSize: 11 }}>{tag.last_edited_by || "—"}</span></td>
                                        <td><span style={{ fontSize: 11, color: "var(--t-text-secondary)", whiteSpace: "nowrap" }}>{fmtDate(tag.last_edited_at || tag.updated_at)}</span></td>
                                        <td>
                                            <ActionsDropdown onEdit={() => openEdit(tag)} onDelete={() => setDeleteTarget(tag)} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {showForm && (
                <Modal title={editTag ? `تعديل: ${editTag.name}` : "تاج جديد"} width={440} onClose={() => setShowForm(false)}>
                    <TagForm tag={editTag} tenantId={tid} onClose={() => setShowForm(false)} />
                </Modal>
            )}

            {deleteTarget && (
                <Modal title="تأكيد الحذف" width={360} onClose={() => setDeleteTarget(null)}>
                    <div style={{ textAlign: "center", padding: "4px 0" }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "rgba(239,68,68,.08)", margin: "0 auto 12px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <AlertTriangle size={20} style={{ color: "var(--t-danger)" }} />
                        </div>
                        {deleteTarget.emoji && <div style={{ fontSize: 18, marginBottom: 4 }}>{deleteTarget.emoji}</div>}
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>
                            حذف تاج «{deleteTarget.name}»؟
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 16 }}>
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
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "7px 18px", borderRadius: 8, border: "none",
                                    background: "var(--t-danger)", color: "#fff",
                                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                }}>
                                {deleteMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} حذف
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
