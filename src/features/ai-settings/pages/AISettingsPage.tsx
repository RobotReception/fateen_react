import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { createPortal } from "react-dom"
import {
    Bot, Plus, Search, Sparkles, Loader2, X,
    Building2, Tag, Check, Brain, MessageSquareText,
    Volume2, Settings2, MoreVertical, Edit3, Trash2, Save,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from "../hooks/use-ai-settings"
import { useAuthStore } from "@/stores/auth-store"
import { getDepartmentsLookup } from "../../knowledge/services/knowledge-service"
import apiClient from "@/lib/api-client"
import type { Agent } from "../types"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ── Brand color ── */
const BRAND = ["var(--t-accent)", "var(--t-accent-secondary)"] as const

const CSS = `
@keyframes agFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes agFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.ag-card {
    position:relative; border-radius:16px; border:1px solid var(--t-border);
    background:#fff; overflow:hidden; cursor:pointer;
    transition:all .2s ease; display:flex; flex-direction:column;
}
.ag-card:hover { border-color:var(--t-border-medium); box-shadow:0 8px 30px rgba(0,0,0,.06); transform:translateY(-2px); }
.ag-card:hover .ag-avatar { transform:scale(1.05); }
.ag-input{width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--t-border);background:#fff;font-size:13px;color:var(--t-text);outline:none;transition:border-color .15s,box-shadow .15s;font-family:inherit;box-sizing:border-box}
.ag-input:focus{border-color:var(--t-accent);box-shadow:0 0 0 3px rgba(27,80,145,.06)}
.ag-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;cursor:pointer;font-size:11px;font-weight:600;transition:all .12s;border:1.5px solid transparent;font-family:inherit}
.ag-chip.sel{border-color:var(--t-accent);background:rgba(27,80,145,.06);color:var(--t-accent)}
.ag-chip.unsel{border-color:var(--t-border);background:var(--t-page);color:var(--t-text-faint)}
.ag-chip.unsel:hover{border-color:var(--t-border-medium);color:var(--t-text-muted)}
`

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return <button className={`ag-chip ${selected ? "sel" : "unsel"}`} onClick={onClick}>{selected && <Check size={9} />} {label}</button>
}

/* ════ AGENT CARD ════ */
function AgentCard({ agent, onClick, onEdit, onDelete }: { agent: Agent; onClick: () => void; onEdit?: () => void; onDelete?: () => void }) {
    const [a, b] = BRAND
    const isActive = agent.status === "active"
    const [menuOpen, setMenuOpen] = useState(false)
    const btnRef = useRef<HTMLButtonElement>(null)
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

    const openMenu = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setMenuPos({ top: rect.bottom + 4, left: rect.left })
        }
        setMenuOpen(v => !v)
    }

    return (
        <div className="ag-card" onClick={onClick} style={{ animation: "agFade .3s ease-out both" }}>
            {/* Top gradient bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${a}, ${b})` }} />

            <div style={{ padding: "12px 14px 10px", flex: 1 }}>
                {/* Row: Avatar + Info + Status + Menu */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div className="ag-avatar" style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `linear-gradient(135deg, ${a}, ${b})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 800, color: "#fff",
                        boxShadow: `0 2px 8px ${a}25`, transition: "transform .2s",
                    }}>
                        {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--t-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</h3>
                            <span style={{
                                fontSize: 8.5, fontWeight: 700, padding: "1.5px 7px", borderRadius: 20, flexShrink: 0,
                                background: isActive ? "rgba(22,163,74,.06)" : "var(--t-surface)",
                                color: isActive ? "#16a34a" : "var(--t-text-faint)",
                                display: "inline-flex", alignItems: "center", gap: 3,
                            }}>
                                <span style={{ width: 4, height: 4, borderRadius: "50%", background: isActive ? "#16a34a" : "var(--t-border-medium)" }} />
                                {isActive ? "نشط" : "معطّل"}
                            </span>
                        </div>
                        {agent.description && (
                            <p style={{ margin: 0, fontSize: 10.5, color: "var(--t-text-faint)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                                {agent.description}
                            </p>
                        )}
                    </div>

                    {/* ⋮ Three-dot menu */}
                    {(onEdit || onDelete) && (
                        <div style={{ flexShrink: 0 }}>
                            <button
                                ref={btnRef}
                                onClick={openMenu}
                                style={{
                                    width: 28, height: 28, borderRadius: 7, border: "none",
                                    background: menuOpen ? "var(--t-surface)" : "transparent",
                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "var(--t-text-faint)", transition: "all .12s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)"; e.currentTarget.style.color = "var(--t-text-muted)" }}
                                onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-text-faint)" } }}
                            >
                                <MoreVertical size={14} />
                            </button>
                            {menuOpen && createPortal(
                                <div style={{ position: "fixed", inset: 0, zIndex: 9990 }} onClick={e => { e.stopPropagation(); setMenuOpen(false) }}>
                                    <div
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                            position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9991,
                                            background: "#fff", borderRadius: 10, border: "1px solid var(--t-border)",
                                            boxShadow: "0 8px 24px rgba(0,0,0,.12)", minWidth: 150, overflow: "hidden",
                                            animation: "agFade .15s ease-out",
                                        }}
                                    >
                                        {onEdit && (
                                            <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.UPDATE_AGENT}>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit() }}
                                                    style={{
                                                        width: "100%", padding: "10px 16px", border: "none", background: "transparent",
                                                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                                                        fontSize: 13, fontWeight: 600, color: "var(--t-text)", fontFamily: "inherit",
                                                        transition: "background .1s",
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)" }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                                >
                                                    <Edit3 size={14} style={{ color: "var(--t-accent)" }} /> تعديل
                                                </button>
                                            </ActionGuard>
                                        )}
                                        {onDelete && (
                                            <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.DELETE_AGENT}>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
                                                    style={{
                                                        width: "100%", padding: "10px 16px", border: "none", background: "transparent",
                                                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                                                        fontSize: 13, fontWeight: 600, color: "#dc2626", fontFamily: "inherit",
                                                        transition: "background .1s",
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2" }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                                >
                                                    <Trash2 size={14} /> حذف
                                                </button>
                                            </ActionGuard>
                                        )}
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    )}
                </div>

                {/* Departments */}
                {agent.departments && agent.departments.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                        {agent.departments.slice(0, 2).map((d, i) => (
                            <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 20, background: "#f0f1f3", color: "var(--t-text-muted)", display: "inline-flex", alignItems: "center", gap: 2 }}>
                                <Building2 size={7} /> {d}
                            </span>
                        ))}
                        {agent.departments.length > 2 && <span style={{ fontSize: 9, color: "var(--t-text-faint)" }}>+{agent.departments.length - 2}</span>}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: "7px 14px 9px", borderTop: "1px solid #f0f1f3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 8 }}>
                    {[{ icon: Brain, label: "AI" }, { icon: MessageSquareText, label: "التوجيهات" }, { icon: Volume2, label: "TTS" }].map(t => (
                        <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 2, color: "#b0b7c3", fontSize: 9 }}>
                            <t.icon size={9} /><span>{t.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--t-accent)", fontSize: 10, fontWeight: 600 }}>
                    <Settings2 size={10} /> إعدادات
                </div>
            </div>
        </div>
    )
}

/* ════ EDIT MODAL ════ */
function EditAgentModal({ agent, open, onClose, departments, categories, onSave, isSaving }: {
    agent: Agent | null; open: boolean; onClose: () => void
    departments: { department_id: string; name: string; name_ar: string }[]
    categories: { category_id: string; name: string; name_ar?: string }[]
    onSave: (v: any) => void; isSaving: boolean
}) {
    const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [status, setStatus] = useState<"active" | "inactive">("active"); const [depts, setDepts] = useState<string[]>([]); const [cats, setCats] = useState<string[]>([])

    useEffect(() => { if (open && agent) { setName(agent.name); setDesc(agent.description || ""); setStatus(agent.status); setDepts(agent.departments || []); setCats(agent.categories || []) } }, [open, agent])

    const toggle = (arr: string[], id: string, set: (v: string[]) => void) => set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])

    if (!open || !agent) return null
    return createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)" }} onClick={onClose}>
            <div dir="rtl" onClick={e => e.stopPropagation()} style={{ width: 440, maxHeight: "85vh", background: "#fff", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.18)", overflow: "hidden", animation: "agFade .2s ease-out" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary), var(--t-accent-light))" }} />
                <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--t-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--t-brand-orange)", display: "flex", alignItems: "center", justifyContent: "center" }}><Edit3 size={14} style={{ color: "#fff" }} /></div>
                        <div><div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)" }}>تعديل الوكيل</div><div style={{ fontSize: 11, color: "var(--t-text-faint)" }}>{agent.name}</div></div>
                    </div>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "var(--t-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-muted)" }}><X size={14} /></button>
                </div>
                <div style={{ padding: "18px 24px 20px", overflowY: "auto", maxHeight: "55vh" }}>
                    <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "block", marginBottom: 5 }}>اسم الوكيل *</label><input autoFocus className="ag-input" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "block", marginBottom: 5 }}>الوصف</label><input className="ag-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف مختصر" /></div>
                    <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "block", marginBottom: 5 }}>الحالة</label><div style={{ display: "flex", gap: 5 }}><Chip label="نشط" selected={status === "active"} onClick={() => setStatus("active")} /><Chip label="غير نشط" selected={status === "inactive"} onClick={() => setStatus("inactive")} /></div></div>
                    {departments.length > 0 && <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}><Building2 size={11} /> الأقسام</label><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{departments.map(d => <Chip key={d.department_id} label={d.name_ar || d.name} selected={depts.includes(d.department_id)} onClick={() => toggle(depts, d.department_id, setDepts)} />)}</div></div>}
                    {categories.length > 0 && <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}><Tag size={11} /> الفئات</label><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{categories.map(c => <Chip key={c.category_id} label={c.name_ar || c.name} selected={cats.includes(c.category_id)} onClick={() => toggle(cats, c.category_id, setCats)} />)}</div></div>}
                </div>
                <div style={{ padding: "14px 24px 18px", borderTop: "1px solid var(--t-border)", display: "flex", gap: 8 }}>
                    <button disabled={!name.trim() || isSaving} onClick={() => onSave({ name, description: desc, status, departments: depts, categories: cats })} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--t-brand-orange)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: isSaving ? .7 : 1, fontFamily: "inherit" }}>
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} حفظ التعديلات
                    </button>
                    <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid var(--t-border)", background: "#fff", color: "var(--t-text-muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
                </div>
            </div>
        </div>,
        document.body
    )
}

/* ════ DELETE CONFIRM ════ */
function DeleteConfirm({ agent, open, onClose, onConfirm, isDeleting }: {
    agent: Agent | null; open: boolean; onClose: () => void; onConfirm: () => void; isDeleting: boolean
}) {
    if (!open || !agent) return null
    return createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)" }} onClick={onClose}>
            <div dir="rtl" onClick={e => e.stopPropagation()} style={{ width: 380, background: "#fff", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.18)", overflow: "hidden", animation: "agFade .2s ease-out" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg, #dc2626, #ef4444)" }} />
                <div style={{ padding: "24px 24px 16px", textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                        <Trash2 size={22} style={{ color: "#dc2626" }} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", marginBottom: 6 }}>حذف الوكيل</div>
                    <div style={{ fontSize: 13, color: "var(--t-text-muted)", lineHeight: 1.6 }}>
                        هل أنت متأكد من حذف الوكيل <strong>"{agent.name}"</strong>؟<br />هذا الإجراء لا يمكن التراجع عنه.
                    </div>
                </div>
                <div style={{ padding: "14px 24px 18px", display: "flex", gap: 8 }}>
                    <button disabled={isDeleting} onClick={onConfirm} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: isDeleting ? .7 : 1, fontFamily: "inherit" }}>
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} نعم، احذف
                    </button>
                    <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid var(--t-border)", background: "#fff", color: "var(--t-text-muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
                </div>
            </div>
        </div>,
        document.body
    )
}

/* ════ CREATE MODAL ════ */
function CreateModal({
    open, onClose, departments, categories, onSave, isSaving,
}: {
    open: boolean; onClose: () => void
    departments: { department_id: string; name: string; name_ar: string }[]
    categories: { category_id: string; name: string; name_ar?: string }[]
    onSave: (v: any) => void; isSaving: boolean
}) {
    const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [status, setStatus] = useState<"active" | "inactive">("active"); const [depts, setDepts] = useState<string[]>([]); const [cats, setCats] = useState<string[]>([])

    const toggle = (arr: string[], id: string, set: (v: string[]) => void) => set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])

    if (!open) return null
    return createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)" }} onClick={onClose}>
            <div dir="rtl" onClick={e => e.stopPropagation()} style={{ width: 440, maxHeight: "85vh", background: "#fff", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.18)", overflow: "hidden", animation: "agFade .2s ease-out" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary), var(--t-accent-light))" }} />
                <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--t-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--t-brand-orange)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={15} style={{ color: "#fff" }} /></div>
                        <div><div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)" }}>وكيل جديد</div><div style={{ fontSize: 11, color: "var(--t-text-faint)" }}>أنشئ وكيل ذكاء اصطناعي</div></div>
                    </div>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "var(--t-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-muted)" }}><X size={14} /></button>
                </div>
                <div style={{ padding: "18px 24px 20px", overflowY: "auto", maxHeight: "55vh" }}>
                    <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "block", marginBottom: 5 }}>اسم الوكيل *</label><input autoFocus className="ag-input" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مساعد خدمة العملاء" /></div>
                    <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "block", marginBottom: 5 }}>الوصف</label><input className="ag-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف مختصر" /></div>
                    <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "block", marginBottom: 5 }}>الحالة</label><div style={{ display: "flex", gap: 5 }}><Chip label="نشط" selected={status === "active"} onClick={() => setStatus("active")} /><Chip label="غير نشط" selected={status === "inactive"} onClick={() => setStatus("inactive")} /></div></div>
                    {departments.length > 0 && <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}><Building2 size={11} /> الأقسام</label><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{departments.map(d => <Chip key={d.department_id} label={d.name_ar || d.name} selected={depts.includes(d.department_id)} onClick={() => toggle(depts, d.department_id, setDepts)} />)}</div></div>}
                    {categories.length > 0 && <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}><Tag size={11} /> الفئات</label><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{categories.map(c => <Chip key={c.category_id} label={c.name_ar || c.name} selected={cats.includes(c.category_id)} onClick={() => toggle(cats, c.category_id, setCats)} />)}</div></div>}
                </div>
                <div style={{ padding: "14px 24px 18px", borderTop: "1px solid var(--t-border)", display: "flex", gap: 8 }}>
                    <button disabled={!name.trim() || isSaving} onClick={() => onSave({ name, description: desc, status, departments: depts, categories: cats })} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: name.trim() ? "var(--t-gradient-accent)" : "var(--t-border)", color: name.trim() ? "#fff" : "var(--t-text-faint)", fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: isSaving ? .7 : 1, fontFamily: "inherit", boxShadow: name.trim() ? "0 2px 8px rgba(27,80,145,.2)" : "none" }}>
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} إنشاء وكيل
                    </button>
                    <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid var(--t-border)", background: "#fff", color: "var(--t-text-muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
                </div>
            </div>
        </div>,
        document.body
    )
}

/* ════════════════════════════════════════════════
   MAIN EXPORT — Agent Listing Page
════════════════════════════════════════════════ */
export function AISettingsPage() {
    const navigate = useNavigate()
    const tid = useAuthStore(s => s.user?.tenant_id || "")
    const { data: agents = [], isLoading } = useAgents()
    const createMut = useCreateAgent()
    const updateMut = useUpdateAgent()
    const deleteMut = useDeleteAgent()
    const [showCreate, setShowCreate] = useState(false)
    const [search, setSearch] = useState("")
    const [editAgent, setEditAgent] = useState<Agent | null>(null)
    const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null)

    const { data: departments = [] } = useQuery({
        queryKey: ["departments-lookup", tid],
        queryFn: () => getDepartmentsLookup(tid),
        enabled: !!tid, staleTime: 60_000,
        select: r => r.data ?? [],
    })
    const { data: categories = [] } = useQuery({
        queryKey: ["categories-list", tid],
        queryFn: async () => {
            const { data } = await apiClient.get<{ success: boolean; data: { categories: { category_id: string; name: string; name_ar?: string }[] } }>("/categories", { headers: { "X-Tenant-ID": tid } })
            return data
        },
        enabled: !!tid, staleTime: 60_000,
        select: r => r.data?.categories ?? [],
    })

    const filtered = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || (a.description || "").toLowerCase().includes(search.toLowerCase()))

    const activeCount = agents.filter(a => a.status === "active").length

    const handleCreateSave = (v: any) => {
        createMut.mutate({ name: v.name, description: v.description || undefined, status: v.status, departments: v.departments, categories: v.categories }, {
            onSuccess: res => {
                setShowCreate(false)
                if (res.data?.id) navigate(`/dashboard/settings/ai/${res.data.id}`)
            },
        })
    }

    const handleEditSave = (v: any) => {
        if (!editAgent) return
        updateMut.mutate({ id: editAgent.id, payload: { name: v.name, description: v.description || undefined, status: v.status, departments: v.departments, categories: v.categories } }, {
            onSuccess: () => setEditAgent(null),
        })
    }

    const handleDeleteConfirm = () => {
        if (!deleteAgent) return
        deleteMut.mutate(deleteAgent.id, { onSuccess: () => setDeleteAgent(null) })
    }

    return (
        <div dir="rtl" style={{ padding: "0 8px", height: "100%", display: "flex", flexDirection: "column", animation: "agFade .3s ease-out" }}>
            <style>{CSS}</style>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 14px", flexShrink: 0 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--t-brand-orange)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Bot size={16} style={{ color: "#fff" }} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-.02em" }}>الوكلاء</h1>
                        {agents.length > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(27,80,145,.06)", color: "var(--t-accent)" }}>{agents.length}</span>
                        )}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--t-text-muted)", paddingRight: 38 }}>إدارة وتخصيص وكلاء الذكاء الاصطناعي</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Stats */}
                    {agents.length > 0 && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <div style={{ padding: "6px 14px", borderRadius: 10, background: "var(--t-surface)", border: "1px solid var(--t-border)", textAlign: "center" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".05em" }}>نشط</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{activeCount}</div>
                            </div>
                            <div style={{ padding: "6px 14px", borderRadius: 10, background: "var(--t-surface)", border: "1px solid var(--t-border)", textAlign: "center" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".05em" }}>الإجمالي</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)" }}>{agents.length}</div>
                            </div>
                        </div>
                    )}
                    {/* Create button */}
                    <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.CREATE_AGENT}>
                        <button onClick={() => setShowCreate(true)} style={{
                            padding: "10px 20px", borderRadius: 12, border: "none",
                            background: "var(--t-brand-orange)", color: "#fff",
                            fontSize: 13, fontWeight: 700, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 7,
                            boxShadow: "0 3px 12px rgba(27,80,145,.2)", fontFamily: "inherit", transition: "all .15s",
                        }}>
                            <Plus size={15} /> وكيل جديد
                        </button>
                    </ActionGuard>
                </div>
            </div>

            {/* ── Search bar ── */}
            {agents.length > 3 && (
                <div style={{ padding: "0 16px 12px" }}>
                    <div style={{ position: "relative", maxWidth: 360 }}>
                        <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--t-border-medium)", pointerEvents: "none" }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="البحث عن وكيل..."
                            className="ag-input" style={{ paddingRight: 34 }} />
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
                {isLoading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{ borderRadius: 16, border: "1px solid var(--t-border)", background: "#fff", overflow: "hidden" }}>
                                <div style={{ height: 4, background: "#f0f1f3" }} />
                                <div style={{ padding: 20 }}>
                                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(110deg,#f0f1f3 30%,var(--t-page) 50%,#f0f1f3 70%)", backgroundSize: "200% 100%", animation: "agFade 1.6s ease-in-out infinite" }} />
                                        <div style={{ flex: 1 }}><div style={{ width: "60%", height: 14, borderRadius: 6, background: "#f0f1f3", marginBottom: 6 }} /><div style={{ width: "40%", height: 10, borderRadius: 6, background: "var(--t-surface)" }} /></div>
                                    </div>
                                    <div style={{ width: "100%", height: 12, borderRadius: 6, background: "var(--t-surface)", marginBottom: 6 }} />
                                    <div style={{ width: "80%", height: 12, borderRadius: 6, background: "var(--t-surface)" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
                        <div style={{ width: 88, height: 88, borderRadius: 28, marginBottom: 22, background: "linear-gradient(135deg, rgba(27,80,145,.06), rgba(27,80,145,.01))", border: "1.5px solid rgba(27,80,145,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Sparkles size={38} style={{ color: "var(--t-accent)", opacity: .4 }} />
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t-text)", marginBottom: 8, letterSpacing: "-.02em" }}>
                            {agents.length === 0 ? "ابدأ بإنشاء أول وكيل" : "لا توجد نتائج"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--t-text-muted)", maxWidth: 380, lineHeight: 1.7, marginBottom: 24 }}>
                            {agents.length === 0 ? "الوكلاء هم وحدات الذكاء الاصطناعي المستقلة. خصص كل وكيل بنماذج وتوجيهات فريدة." : "جرب كلمات بحث مختلفة"}
                        </div>
                        {agents.length === 0 && (
                            <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.CREATE_AGENT}>
                                <button onClick={() => setShowCreate(true)} style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "var(--t-brand-orange)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, boxShadow: "0 4px 16px rgba(27,80,145,.2)", fontFamily: "inherit" }}>
                                    <Plus size={16} /> إنشاء وكيل جديد
                                </button>
                            </ActionGuard>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                        {filtered.map((agent, idx) => (
                            <div key={agent.id} style={{ animationDelay: `${idx * 0.04}s` }}>
                                <AgentCard agent={agent} onClick={() => navigate(`/dashboard/settings/ai/${agent.id}`)} onEdit={() => setEditAgent(agent)} onDelete={() => setDeleteAgent(agent)} />
                            </div>
                        ))}

                        {/* Add new card */}
                        <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.CREATE_AGENT}>
                            <div onClick={() => setShowCreate(true)} style={{
                                borderRadius: 12, border: "1.5px dashed var(--t-border-medium)", background: "#fafbfc",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                padding: "20px 14px", transition: "all .15s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.background = "rgba(27,80,145,.02)" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border-medium)"; e.currentTarget.style.background = "#fafbfc" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, rgba(27,80,145,.08), rgba(27,80,145,.03))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Plus size={15} style={{ color: "var(--t-accent)" }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-accent)" }}>إنشاء وكيل جديد</span>
                            </div>
                        </ActionGuard>
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            <CreateModal open={showCreate} onClose={() => setShowCreate(false)}
                departments={departments} categories={categories}
                onSave={handleCreateSave} isSaving={createMut.isPending} />

            {/* ── Edit Modal ── */}
            <EditAgentModal agent={editAgent} open={!!editAgent} onClose={() => setEditAgent(null)}
                departments={departments} categories={categories}
                onSave={handleEditSave} isSaving={updateMut.isPending} />

            {/* ── Delete Confirm ── */}
            <DeleteConfirm agent={deleteAgent} open={!!deleteAgent} onClose={() => setDeleteAgent(null)}
                onConfirm={handleDeleteConfirm} isDeleting={deleteMut.isPending} />
        </div>
    )
}
