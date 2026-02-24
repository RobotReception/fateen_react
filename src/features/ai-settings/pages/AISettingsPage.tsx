import { useState } from "react"
import {
    Bot, Brain, MessageSquareText, Volume2,
    Plus, Trash2, Edit3, X, Loader2, Search,
    Building2, Tag, Save, ChevronDown, ChevronUp,
    Check, Sparkles, AlertCircle
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from "../hooks/use-ai-settings"
import { useAuthStore } from "@/stores/auth-store"
import { getDepartmentsLookup } from "../../knowledge/services/knowledge-service"
import apiClient from "@/lib/api-client"
import { AITab } from "../components/AITab"
import { PromptsTab } from "../components/PromptsTab"
import { TTSTab } from "../components/TTSTab"
import type { Agent } from "../types"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

type TabKey = "ai" | "prompts" | "tts"

const TABS: { key: TabKey; icon: typeof Brain; label: string }[] = [
    { key: "ai", icon: Brain, label: "الذكاء الاصطناعي" },
    { key: "prompts", icon: MessageSquareText, label: "التوجيهات" },
    { key: "tts", icon: Volume2, label: "تحويل النص لكلام" },
]

/* ────────────────────────────────────────────────────────────────
   GLOBAL CSS
──────────────────────────────────────────────────────────────── */
const CSS = `
@keyframes aiPageFade { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
@keyframes aiShimmer  { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes aiSlide    { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

/* Agent rail items */
.ag-rail-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 11px;
    cursor: pointer; transition: all .13s ease;
    border: 1.5px solid transparent;
    margin-bottom: 3px;
}
.ag-rail-item:hover  { background: var(--t-border-light); }
.ag-rail-item.active { background: var(--t-accent-muted); border-color: var(--t-accent); }

/* Tab pills */
.ag-tab {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 18px; border-radius: 100px;
    border: 1.5px solid transparent; cursor: pointer;
    font-size: 13px; font-weight: 600; transition: all .15s;
    background: transparent; color: var(--t-text-faint);
    white-space: nowrap;
}
.ag-tab:hover  { background: var(--t-surface); color: var(--t-text); }
.ag-tab.active {
    background: var(--t-accent); color: var(--t-text-on-accent);
    border-color: var(--t-accent);
    box-shadow: 0 2px 12px rgba(99,102,241,.25);
}

/* Chip */
.ag-chip {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 3px 9px; border-radius: 20px; cursor: pointer;
    font-size: 11px; font-weight: 600; transition: all .12s;
    border: 1.5px solid transparent;
}
.ag-chip.sel { border-color: var(--t-accent); background: var(--t-accent-muted); color: var(--t-accent); }
.ag-chip.unsel { border-color: var(--t-border); background: var(--t-surface); color: var(--t-text-faint); }

/* Form inputs */
.ag-input {
    width: 100%; padding: 9px 12px; border-radius: 9px;
    border: 1.5px solid var(--t-border); background: var(--t-surface);
    font-size: 13px; color: var(--t-text); outline: none;
    transition: border-color .15s;
}
.ag-input:focus { border-color: var(--t-accent); }

/* Scrollbar */
.ag-scroll::-webkit-scrollbar { width: 4px; }
.ag-scroll::-webkit-scrollbar-thumb { background: var(--t-border); border-radius: 4px; }

/* Action icon btn */
.ag-icon-btn {
    width: 26px; height: 26px; border-radius: 7px; border: none;
    background: transparent; cursor: pointer; display: inline-flex;
    align-items: center; justify-content: center;
    color: var(--t-text-faint); transition: all .12s;
}
.ag-icon-btn:hover { background: var(--t-border); color: var(--t-text); }
.ag-icon-btn.danger:hover { background: var(--t-danger-soft); color: var(--t-danger); }
`

/* ── Shimmer block ── */
const skBlock = (w: string, h = 12, r = 6) => ({
    width: w, height: h, borderRadius: r, flexShrink: 0,
    background: "linear-gradient(110deg,var(--t-border) 30%,var(--t-border-light) 50%,var(--t-border) 70%)",
    backgroundSize: "200% 100%",
    animation: "aiShimmer 1.6s ease-in-out infinite",
} as React.CSSProperties)

/* ── Chip ── */
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return (
        <button className={`ag-chip ${selected ? "sel" : "unsel"}`} onClick={onClick}>
            {selected && <Check size={9} />} {label}
        </button>
    )
}

/* ────────────────────────────────────────────────────────────────
   AGENT FORM — shared for create & edit
──────────────────────────────────────────────────────────────── */
function AgentForm({
    mode, initial, departments, categories, onSave, onCancel, isSaving,
}: {
    mode: "create" | "edit"
    initial: { name: string; description: string; status: "active" | "inactive"; departments: string[]; categories: string[] }
    departments: { department_id: string; name: string; name_ar: string }[]
    categories: { category_id: string; name: string; name_ar?: string }[]
    onSave: (v: typeof initial) => void
    onCancel: () => void
    isSaving: boolean
}) {
    const [name, setName] = useState(initial.name)
    const [desc, setDesc] = useState(initial.description)
    const [status, setStatus] = useState<"active" | "inactive">(initial.status)
    const [depts, setDepts] = useState<string[]>(initial.departments)
    const [cats, setCats] = useState<string[]>(initial.categories)
    const [showDepts, setShowDepts] = useState(false)
    const [showCats, setShowCats] = useState(false)

    const toggle = (arr: string[], id: string, set: (v: string[]) => void) =>
        set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])

    return (
        <div style={{
            background: "var(--t-card)", border: "1.5px solid var(--t-accent)",
            borderRadius: 14, padding: 18, margin: "0 8px 10px",
            animation: "aiPageFade .18s ease-out",
        }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Bot size={14} style={{ color: "var(--t-accent)" }} />
                {mode === "create" ? "وكيل جديد" : "تعديل الوكيل"}
            </div>

            {/* Name */}
            <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "block", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>الاسم *</label>
                <input autoFocus className="ag-input" value={name} onChange={e => setName(e.target.value)} placeholder="اسم الوكيل" />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "block", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>الوصف</label>
                <input className="ag-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف مختصر" />
            </div>

            {/* Status */}
            <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "block", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>الحالة</label>
                <div style={{ display: "flex", gap: 5 }}>
                    <Chip label="نشط" selected={status === "active"} onClick={() => setStatus("active")} />
                    <Chip label="غير نشط" selected={status === "inactive"} onClick={() => setStatus("inactive")} />
                </div>
            </div>

            {/* Departments — collapsible */}
            {departments.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                    <button onClick={() => setShowDepts(!showDepts)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "5px 0", border: "none", background: "none", cursor: "pointer" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 4 }}>
                            <Building2 size={10} /> الأقسام {depts.length > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: "var(--t-accent-muted)", color: "var(--t-accent)", padding: "1px 5px", borderRadius: 8 }}>{depts.length}</span>}
                        </span>
                        {showDepts ? <ChevronUp size={11} style={{ color: "var(--t-text-faint)" }} /> : <ChevronDown size={11} style={{ color: "var(--t-text-faint)" }} />}
                    </button>
                    {showDepts && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7, paddingBottom: 4 }}>{departments.map(d => <Chip key={d.department_id} label={d.name_ar || d.name} selected={depts.includes(d.department_id)} onClick={() => toggle(depts, d.department_id, setDepts)} />)}</div>}
                </div>
            )}

            {/* Categories — collapsible */}
            {categories.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                    <button onClick={() => setShowCats(!showCats)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "5px 0", border: "none", background: "none", cursor: "pointer" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 4 }}>
                            <Tag size={10} /> الفئات {cats.length > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: "var(--t-accent-muted)", color: "var(--t-accent)", padding: "1px 5px", borderRadius: 8 }}>{cats.length}</span>}
                        </span>
                        {showCats ? <ChevronUp size={11} style={{ color: "var(--t-text-faint)" }} /> : <ChevronDown size={11} style={{ color: "var(--t-text-faint)" }} />}
                    </button>
                    {showCats && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7, paddingBottom: 4 }}>{categories.map(c => <Chip key={c.category_id} label={c.name_ar || c.name} selected={cats.includes(c.category_id)} onClick={() => toggle(cats, c.category_id, setCats)} />)}</div>}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 6 }}>
                <button
                    disabled={!name.trim() || isSaving}
                    onClick={() => onSave({ name, description: desc, status, departments: depts, categories: cats })}
                    style={{
                        flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                        background: name.trim() ? "var(--t-accent)" : "var(--t-border)",
                        color: name.trim() ? "var(--t-text-on-accent)" : "var(--t-text-faint)",
                        fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "default",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                        opacity: isSaving ? 0.7 : 1, transition: "all .15s",
                    }}
                >
                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {mode === "create" ? "إنشاء" : "حفظ التعديلات"}
                </button>
                <button onClick={onCancel} style={{
                    padding: "9px 14px", borderRadius: 9, border: "1.5px solid var(--t-border)",
                    background: "transparent", color: "var(--t-text-faint)", fontSize: 13, cursor: "pointer",
                }}>
                    <X size={14} />
                </button>
            </div>
        </div>
    )
}

/* ────────────────────────────────────────────────────────────────
   AGENTS RAIL (Left sidebar)
──────────────────────────────────────────────────────────────── */
function AgentsRail({
    agents, selected, onSelect, isLoading,
    showCreate, setShowCreate,
    editingId, setEditingId,
    confirmDeleteId, setConfirmDeleteId,
    departments, categories,
    onCreateSave, onEditSave, onDelete,
    createPending, editPending,
    search, setSearch,
}: {
    agents: Agent[]; selected: string | null; onSelect: (id: string) => void; isLoading: boolean
    showCreate: boolean; setShowCreate: (v: boolean) => void
    editingId: string | null; setEditingId: (id: string | null) => void
    confirmDeleteId: string | null; setConfirmDeleteId: (id: string | null) => void
    departments: { department_id: string; name: string; name_ar: string }[]
    categories: { category_id: string; name: string; name_ar?: string }[]
    onCreateSave: (v: any) => void; onEditSave: (agent: Agent, v: any) => void; onDelete: (id: string) => void
    createPending: boolean; editPending: boolean
    search: string; setSearch: (v: string) => void
}) {
    const filtered = agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.description || "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div style={{
            width: 230, flexShrink: 0,
            borderLeft: "1px solid var(--t-border-light)",
            display: "flex", flexDirection: "column",
            background: "var(--t-surface)",
            overflow: "hidden",
        }}>
            {/* Rail header */}
            <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid var(--t-border-light)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".08em" }}>الوكلاء</span>
                    <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.CREATE_AGENT}>
                        <button
                            onClick={() => { setShowCreate(!showCreate); setEditingId(null) }}
                            title="إنشاء وكيل"
                            style={{
                                width: 26, height: 26, borderRadius: 7, border: "none",
                                background: showCreate ? "var(--t-accent)" : "var(--t-border-light)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all .15s",
                            }}
                        >
                            <Plus size={13} style={{ color: showCreate ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                        </button>
                    </ActionGuard>
                </div>
                {agents.length > 3 && (
                    <div style={{ position: "relative" }}>
                        <Search size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الوكلاء..."
                            style={{ width: "100%", padding: "7px 30px 7px 9px", borderRadius: 8, border: "1px solid var(--t-border)", background: "var(--t-card)", fontSize: 12, color: "var(--t-text)", outline: "none" }} />
                    </div>
                )}
            </div>

            {/* Scrollable list */}
            <div className="ag-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 4px 8px" }}>

                {/* Create form */}
                {showCreate && (
                    <AgentForm mode="create"
                        initial={{ name: "", description: "", status: "active", departments: [], categories: [] }}
                        departments={departments} categories={categories}
                        onSave={onCreateSave} onCancel={() => setShowCreate(false)} isSaving={createPending} />
                )}

                {/* Loading skeletons */}
                {isLoading && !showCreate && (
                    <div style={{ padding: "4px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{ padding: "10px 10px", borderRadius: 11, background: "var(--t-card)", display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={skBlock("32px", 32, 10)} />
                                <div style={{ flex: 1 }}>
                                    <div style={skBlock("70%", 12, 6)} />
                                    <div style={{ ...skBlock("50%", 9, 5), marginTop: 5 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!isLoading && filtered.length === 0 && !showCreate && (
                    <div style={{ padding: "32px 14px", textAlign: "center", color: "var(--t-text-faint)" }}>
                        <Bot size={28} style={{ display: "block", margin: "0 auto 8px", opacity: 0.25 }} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-faint)" }}>لا يوجد وكلاء</div>
                        <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>اضغط + لإنشاء أول وكيل</div>
                    </div>
                )}

                {/* Agent list */}
                {filtered.map(agent => {
                    const isSel = agent.id === selected
                    const isEditOpen = editingId === agent.id
                    const isDelConf = confirmDeleteId === agent.id

                    return (
                        <div key={agent.id}>
                            {!isEditOpen && (
                                <div
                                    className={`ag-rail-item ${isSel ? "active" : ""}`}
                                    onClick={() => { if (!isDelConf) { onSelect(agent.id); setEditingId(null) } }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                                        background: isSel ? "var(--t-accent)" : "var(--t-border-light)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all .15s",
                                    }}>
                                        <Bot size={15} style={{ color: isSel ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                                    </div>

                                    {/* Text */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--t-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: agent.status === "active" ? "var(--t-success)" : "var(--t-border)", display: "inline-block", flexShrink: 0 }} />
                                            <span style={{ fontSize: 10, color: "var(--t-text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {agent.status === "active" ? "نشط" : "غير نشط"}
                                                {agent.departments?.length > 0 ? ` · ${agent.departments.length}` : ""}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions (shown inline always visible on selected) */}
                                    <div style={{ display: "flex", gap: 1 }} onClick={e => e.stopPropagation()}>
                                        <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.UPDATE_AGENT}>
                                            <button className="ag-icon-btn" onClick={() => { setEditingId(agent.id); setShowCreate(false) }} title="تعديل">
                                                <Edit3 size={11} />
                                            </button>
                                        </ActionGuard>
                                        <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.DELETE_AGENT}>
                                            <button className="ag-icon-btn danger" onClick={() => setConfirmDeleteId(agent.id)} title="حذف">
                                                <Trash2 size={11} />
                                            </button>
                                        </ActionGuard>
                                    </div>
                                </div>
                            )}

                            {/* Edit form */}
                            {isEditOpen && (
                                <AgentForm mode="edit"
                                    initial={{ name: agent.name, description: agent.description || "", status: agent.status, departments: agent.departments || [], categories: agent.categories || [] }}
                                    departments={departments} categories={categories}
                                    onSave={v => onEditSave(agent, v)} onCancel={() => setEditingId(null)} isSaving={editPending} />
                            )}

                            {/* Delete confirm */}
                            {isDelConf && (
                                <div style={{ margin: "2px 8px 6px", padding: "10px 12px", borderRadius: 11, background: "var(--t-danger-soft)", border: "1px solid rgba(239,68,68,.25)" }} onClick={e => e.stopPropagation()}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t-danger)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                                        <AlertCircle size={12} /> حذف "{agent.name}"؟
                                    </div>
                                    <div style={{ display: "flex", gap: 5 }}>
                                        <button onClick={() => onDelete(agent.id)} style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>حذف</button>
                                        <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: "1px solid var(--t-border)", background: "transparent", color: "var(--t-text)", fontSize: 11, cursor: "pointer" }}>إلغاء</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ────────────────────────────────────────────────────────────────
   AGENT BANNER (top of content area)
──────────────────────────────────────────────────────────────── */
function AgentBanner({ agent, activeTab, onTabChange }: { agent: Agent; activeTab: TabKey; onTabChange: (t: TabKey) => void }) {
    return (
        <div style={{
            borderBottom: "1px solid var(--t-border-light)",
            background: "var(--t-card)",
            flexShrink: 0,
        }}>
            {/* Agent info row */}
            <div style={{
                padding: "20px 28px 0",
                display: "flex", alignItems: "flex-start", gap: 14,
            }}>
                {/* Avatar */}
                <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: "linear-gradient(135deg, var(--t-accent), var(--t-accent-dark, var(--t-accent)))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(99,102,241,.3)",
                }}>
                    <Sparkles size={22} style={{ color: "white" }} />
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.02em", lineHeight: 1 }}>{agent.name}</h2>
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                            background: agent.status === "active" ? "var(--t-success-soft, rgba(16,185,129,.12))" : "var(--t-border)",
                            color: agent.status === "active" ? "var(--t-success)" : "var(--t-text-faint)",
                            border: `1px solid ${agent.status === "active" ? "var(--t-success)" : "transparent"}`,
                        }}>
                            {agent.status === "active" ? "نشط" : "غير نشط"}
                        </span>
                    </div>

                    {/* Tags row */}
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
                        {agent.description && (
                            <span style={{ fontSize: 12, color: "var(--t-text-faint)", marginLeft: 4 }}>{agent.description}</span>
                        )}
                        {agent.departments?.map((d, i) => (
                            <span key={i} style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                                background: "var(--t-surface)", color: "var(--t-text-faint)",
                                border: "1px solid var(--t-border-light)",
                                display: "inline-flex", alignItems: "center", gap: 4,
                            }}>
                                <Building2 size={9} /> {d}
                            </span>
                        ))}
                        {agent.categories?.map((c, i) => (
                            <span key={i} style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                                background: "var(--t-surface)", color: "var(--t-text-faint)",
                                border: "1px solid var(--t-border-light)",
                                display: "inline-flex", alignItems: "center", gap: 4,
                            }}>
                                <Tag size={9} /> {c}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab pills row */}
            <div style={{ padding: "12px 24px 0", display: "flex", gap: 4, alignItems: "center" }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`ag-tab ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => onTabChange(tab.key)}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

/* ────────────────────────────────────────────────────────────────
   EMPTY / NO AGENT SELECTED
──────────────────────────────────────────────────────────────── */
function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 48, textAlign: "center",
        }}>
            <div style={{
                width: 80, height: 80, borderRadius: 24, marginBottom: 20,
                background: "linear-gradient(135deg, var(--t-accent-muted), var(--t-surface))",
                border: "1px solid var(--t-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Bot size={36} style={{ color: "var(--t-accent)", opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t-text)", marginBottom: 8, letterSpacing: "-0.02em" }}>
                ابدأ بإنشاء وكيل
            </div>
            <div style={{ fontSize: 14, color: "var(--t-text-faint)", maxWidth: 320, lineHeight: 1.7, marginBottom: 24 }}>
                الوكلاء هم وحدات الذكاء الاصطناعي المستقلة. يمكنك تخصيص كل وكيل بنماذج مختلفة وتوجيهات وميزات فريدة.
            </div>
            <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.CREATE_AGENT}>
                <button onClick={onCreate} style={{
                    padding: "11px 26px", borderRadius: 12, border: "none",
                    background: "var(--t-accent)", color: "var(--t-text-on-accent)",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 7,
                    boxShadow: "0 4px 16px rgba(99,102,241,.3)",
                    transition: "all .15s",
                }}>
                    <Plus size={16} /> إنشاء وكيل جديد
                </button>
            </ActionGuard>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════
   AI SETTINGS PAGE — MAIN EXPORT
════════════════════════════════════════════════════════════════ */
export function AISettingsPage() {
    const tid = useAuthStore(s => s.user?.tenant_id || "")
    const { data: agents = [], isLoading: agentsLoading } = useAgents()
    const createMut = useCreateAgent()
    const updateMut = useUpdateAgent()
    const deleteMut = useDeleteAgent()

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<TabKey>("ai")
    const [showCreate, setShowCreate] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    /* Lookup data */
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

    /* Auto-select first */
    const selectedAgent = agents.find(a => a.id === selectedId) ?? null
    if (!selectedId && agents.length > 0 && !agentsLoading) {
        setSelectedId(agents[0].id)
    }

    /* Handlers */
    const handleCreateSave = (v: any) => {
        createMut.mutate({ name: v.name, description: v.description || undefined, status: v.status, departments: v.departments, categories: v.categories }, {
            onSuccess: res => { if (res.data?.id) setSelectedId(res.data.id); setShowCreate(false) },
        })
    }
    const handleEditSave = (agent: Agent, v: any) => {
        updateMut.mutate({ id: agent.id, payload: { name: v.name, description: v.description || undefined, status: v.status, departments: v.departments, categories: v.categories } }, {
            onSuccess: () => setEditingId(null),
        })
    }
    const handleDelete = (id: string) => {
        deleteMut.mutate(id)
        setConfirmDeleteId(null)
        if (selectedId === id) setSelectedId(agents.find(a => a.id !== id)?.id ?? null)
    }

    return (
        <div style={{
            display: "flex", height: "calc(100vh - 88px)", minHeight: 500,
            borderRadius: 16, border: "1px solid var(--t-border)",
            overflow: "hidden", background: "var(--t-bg)",
            animation: "aiPageFade .3s ease-out",
        }}>
            <style>{CSS}</style>

            {/* ── Left: Agents rail ── */}
            <AgentsRail
                agents={agents} selected={selectedId}
                onSelect={id => { setSelectedId(id); setEditingId(null) }}
                isLoading={agentsLoading}
                showCreate={showCreate} setShowCreate={setShowCreate}
                editingId={editingId} setEditingId={setEditingId}
                confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId}
                departments={departments} categories={categories}
                onCreateSave={handleCreateSave} onEditSave={handleEditSave} onDelete={handleDelete}
                createPending={createMut.isPending} editPending={updateMut.isPending}
                search={search} setSearch={setSearch}
            />

            {/* ── Right: Content area ── */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {!selectedAgent ? (
                    <EmptyState onCreate={() => setShowCreate(true)} />
                ) : (
                    <>
                        {/* Banner */}
                        <AgentBanner agent={selectedAgent} activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* Scrollable content */}
                        <div className="ag-scroll" style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                            <div key={`${selectedId}-${activeTab}`} style={{ animation: "aiPageFade .22s ease-out" }}>
                                {activeTab === "ai" && <AITab agentId={selectedId!} />}
                                {activeTab === "prompts" && <PromptsTab agentId={selectedId!} />}
                                {activeTab === "tts" && <TTSTab agentId={selectedId!} />}

                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
