import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { createPortal } from "react-dom"
import {
    Brain, MessageSquareText, Volume2,
    Trash2, Edit3, X, Loader2, ArrowRight,
    Building2, Tag, Save, ChevronLeft, Check,
    AlertCircle,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAgents, useUpdateAgent, useDeleteAgent } from "../hooks/use-ai-settings"
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

const TABS: { key: TabKey; icon: typeof Brain; label: string; desc: string }[] = [
    { key: "ai", icon: Brain, label: "الذكاء الاصطناعي", desc: "إعدادات النماذج والمزودون" },
    { key: "prompts", icon: MessageSquareText, label: "التوجيهات", desc: "إدارة التوجيهات والأوامر" },
    { key: "tts", icon: Volume2, label: "تحويل النص لكلام", desc: "إعدادات الصوت والنطق" },
]

const BRAND = ["var(--t-accent)", "var(--t-accent-secondary)"] as const

const CSS = `
@keyframes adFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.ad-scroll::-webkit-scrollbar{width:4px}
.ad-scroll::-webkit-scrollbar-thumb{background:var(--t-border);border-radius:4px}
.ad-input{width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--t-border);background:#fff;font-size:13px;color:var(--t-text);outline:none;transition:border-color .15s,box-shadow .15s;font-family:inherit;box-sizing:border-box}
.ad-input:focus{border-color:var(--t-accent);box-shadow:0 0 0 3px rgba(27,80,145,.06)}
.ad-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;cursor:pointer;font-size:11px;font-weight:600;transition:all .12s;border:1.5px solid transparent;font-family:inherit}
.ad-chip.sel{border-color:var(--t-accent);background:rgba(27,80,145,.06);color:var(--t-accent)}
.ad-chip.unsel{border-color:var(--t-border);background:var(--t-page);color:var(--t-text-faint)}
.ad-chip.unsel:hover{border-color:var(--t-border-medium);color:var(--t-text-muted)}
`

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return <button className={`ad-chip ${selected ? "sel" : "unsel"}`} onClick={onClick}>{selected && <Check size={9} />} {label}</button>
}

/* ════ EDIT MODAL ════ */
function EditModal({ agent, open, onClose, departments, categories, onSave, isSaving }: {
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
            <div dir="rtl" onClick={e => e.stopPropagation()} style={{ width: 440, maxHeight: "85vh", background: "#fff", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.18)", overflow: "hidden", animation: "adFade .2s ease-out" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary), var(--t-accent-light))" }} />
                <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--t-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--t-brand-orange)", display: "flex", alignItems: "center", justifyContent: "center" }}><Edit3 size={14} style={{ color: "#fff" }} /></div>
                        <div><div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)" }}>تعديل الوكيل</div><div style={{ fontSize: 11, color: "var(--t-text-faint)" }}>{agent.name}</div></div>
                    </div>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "var(--t-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-muted)" }}><X size={14} /></button>
                </div>
                <div className="ad-scroll" style={{ padding: "18px 24px 20px", overflowY: "auto", maxHeight: "55vh" }}>
                    <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "block", marginBottom: 5 }}>اسم الوكيل *</label><input autoFocus className="ad-input" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-muted)", display: "block", marginBottom: 5 }}>الوصف</label><input className="ad-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف مختصر" /></div>
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

/* ════════════════════════════════════════════════
   MAIN — Agent Detail Page
════════════════════════════════════════════════ */
export function AgentDetailPage() {
    const { agentId } = useParams<{ agentId: string }>()
    const navigate = useNavigate()
    const tid = useAuthStore(s => s.user?.tenant_id || "")
    const { data: agents = [], isLoading } = useAgents()
    const updateMut = useUpdateAgent()
    const deleteMut = useDeleteAgent()

    const [activeTab, setActiveTab] = useState<TabKey>("ai")
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [showDelete, setShowDelete] = useState(false)

    const agent = agents.find(a => a.id === agentId) ?? null

    const { data: departments = [] } = useQuery({
        queryKey: ["departments-lookup", tid], queryFn: () => getDepartmentsLookup(tid),
        enabled: !!tid, staleTime: 60_000, select: r => r.data ?? [],
    })
    const { data: categories = [] } = useQuery({
        queryKey: ["categories-list", tid],
        queryFn: async () => { const { data } = await apiClient.get<{ success: boolean; data: { categories: { category_id: string; name: string; name_ar?: string }[] } }>("/categories", { headers: { "X-Tenant-ID": tid } }); return data },
        enabled: !!tid, staleTime: 60_000, select: r => r.data?.categories ?? [],
    })

    const handleEditSave = (v: any) => {
        if (!agent) return
        updateMut.mutate({ id: agent.id, payload: { name: v.name, description: v.description || undefined, status: v.status, departments: v.departments, categories: v.categories } }, { onSuccess: () => setShowEdit(false) })
    }
    const handleDelete = () => {
        if (!agentId) return
        deleteMut.mutate(agentId)
        setShowDelete(false)
        navigate("/dashboard/settings/organization?tab=ai")
    }

    if (isLoading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 48 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--t-accent)" }} />
        </div>
    )

    if (!agent) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 48, textAlign: "center" }}>
            <AlertCircle size={36} style={{ color: "var(--t-border-medium)", marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text)", marginBottom: 8 }}>الوكيل غير موجود</div>
            <button onClick={() => navigate("/dashboard/settings/organization?tab=ai")} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "var(--t-brand-orange)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                العودة للوكلاء
            </button>
        </div>
    )

    const [c1, c2] = BRAND

    return (
        <div className="flex h-full" dir="rtl">
            <style>{CSS}</style>

            {/* ════ RIGHT SIDEBAR ════ */}
            <aside className={`shrink-0 bg-white transition-all duration-300 ${sidebarCollapsed ? "w-[60px]" : "w-[220px]"}`}
                style={{ borderLeft: "1px solid var(--t-border)", borderRadius: 6, margin: "8px 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>

                {/* Gradient Header */}
                <div onClick={() => { if (sidebarCollapsed) setSidebarCollapsed(false) }}
                    style={{
                        background: `linear-gradient(135deg, ${c1}, ${c2})`,
                        padding: sidebarCollapsed ? "12px 0" : "14px 14px",
                        position: "relative", overflow: "hidden",
                        display: "flex", alignItems: sidebarCollapsed ? "center" : "flex-start",
                        justifyContent: sidebarCollapsed ? "center" : "flex-start",
                        flexDirection: sidebarCollapsed ? "column" : "column",
                        gap: 8, cursor: sidebarCollapsed ? "pointer" : "default",
                    }}>
                    <div style={{ position: "absolute", top: -15, left: -15, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />

                    {!sidebarCollapsed ? (
                        <>
                            {/* Back button */}
                            <button onClick={() => navigate("/dashboard/settings/organization?tab=ai")} style={{
                                display: "flex", alignItems: "center", gap: 4,
                                background: "rgba(255,255,255,.12)", border: "none", borderRadius: 6,
                                padding: "4px 8px", cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,.8)",
                                transition: "background .15s", position: "relative", zIndex: 1, fontFamily: "inherit",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.22)" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)" }}>
                                <ArrowRight size={11} /> جميع الوكلاء
                            </button>

                            {/* Agent info */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                                    background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 14, fontWeight: 800, color: "#fff",
                                }}>
                                    {agent.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</div>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.65)", display: "flex", alignItems: "center", gap: 3 }}>
                                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: agent.status === "active" ? "#86efac" : "rgba(255,255,255,.3)" }} />
                                        {agent.status === "active" ? "نشط" : "غير نشط"}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", position: "relative", zIndex: 1 }}>
                            {agent.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {!sidebarCollapsed && (
                        <button onClick={() => setSidebarCollapsed(true)} style={{
                            position: "absolute", top: 12, left: 10, background: "rgba(255,255,255,.12)",
                            border: "none", borderRadius: 5, padding: 3, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", transition: "background .15s", zIndex: 2,
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.22)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)" }}>
                            <ChevronLeft size={13} style={{ color: "rgba(255,255,255,.8)" }} />
                        </button>
                    )}
                </div>

                {/* Tab Navigation */}
                <nav style={{ padding: "6px 6px", flex: 1 }}>
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} title={sidebarCollapsed ? tab.label : undefined}
                                style={{
                                    display: "flex", width: "100%", alignItems: "center", gap: 10,
                                    padding: sidebarCollapsed ? "9px 0" : "8px 10px", marginBottom: 2, borderRadius: 8,
                                    border: "none", background: isActive ? "var(--t-surface)" : "transparent",
                                    cursor: "pointer", justifyContent: sidebarCollapsed ? "center" : "flex-start",
                                    position: "relative", textAlign: "right", transition: "background .12s", color: "inherit",
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--t-page)" }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "var(--t-surface)" : "transparent" }}>
                                {isActive && !sidebarCollapsed && <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, borderRadius: 3, background: c1 }} />}
                                <div style={{
                                    width: sidebarCollapsed ? 28 : 26, height: sidebarCollapsed ? 28 : 26, borderRadius: 7,
                                    background: isActive ? `${c1}15` : "var(--t-surface)",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s",
                                }}>
                                    <Icon size={sidebarCollapsed ? 15 : 13} strokeWidth={isActive ? 2.2 : 1.6} style={{ color: isActive ? c1 : "var(--t-text-faint)", transition: "color .15s" }} />
                                </div>
                                {!sidebarCollapsed && (
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 500, color: isActive ? "#1f2937" : "var(--t-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tab.label}</div>
                                        <div style={{ fontSize: 10, color: "var(--t-text-faint)" }}>{tab.desc}</div>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Actions */}
                {!sidebarCollapsed && (
                    <div style={{ padding: "8px 10px 12px", borderTop: "1px solid var(--t-border)", display: "flex", gap: 4 }}>
                        <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.UPDATE_AGENT}>
                            <button onClick={() => setShowEdit(true)} style={{
                                flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid var(--t-border)",
                                background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                                justifyContent: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--t-text-muted)",
                                transition: "all .12s", fontFamily: "inherit",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-muted)" }}>
                                <Edit3 size={11} /> تعديل
                            </button>
                        </ActionGuard>
                        <ActionGuard pageBit={PAGE_BITS.AGENTS} actionBit={ACTION_BITS.DELETE_AGENT}>
                            <button onClick={() => setShowDelete(true)} style={{
                                padding: "7px 12px", borderRadius: 8, border: "1px solid var(--t-border)",
                                background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                                justifyContent: "center", color: "var(--t-text-muted)", transition: "all .12s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-danger)"; e.currentTarget.style.color = "var(--t-danger)" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-muted)" }}>
                                <Trash2 size={11} />
                            </button>
                        </ActionGuard>
                    </div>
                )}
            </aside>

            {/* ════ MAIN CONTENT ════ */}
            <div className="flex-1 overflow-y-auto ad-scroll">
                <div className="p-6">
                    <div key={`${agentId}-${activeTab}`} style={{ animation: "adFade .22s ease-out" }}>
                        {activeTab === "ai" && <AITab agentId={agentId!} />}
                        {activeTab === "prompts" && <PromptsTab agentId={agentId!} />}
                        {activeTab === "tts" && <TTSTab agentId={agentId!} />}
                    </div>
                </div>
            </div>

            {/* ════ MODALS ════ */}
            <EditModal agent={agent} open={showEdit} onClose={() => setShowEdit(false)}
                departments={departments} categories={categories}
                onSave={handleEditSave} isSaving={updateMut.isPending} />

            {showDelete && agent && createPortal(
                <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)" }} onClick={() => setShowDelete(false)}>
                    <div dir="rtl" onClick={e => e.stopPropagation()} style={{ width: 380, background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,.18)", animation: "adFade .2s ease-out" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(220,38,38,.06)", display: "flex", alignItems: "center", justifyContent: "center" }}><AlertCircle size={20} style={{ color: "var(--t-danger)" }} /></div>
                            <div><div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)" }}>حذف الوكيل</div><div style={{ fontSize: 12, color: "var(--t-text-muted)" }}>"{agent.name}"</div></div>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--t-text-muted)", lineHeight: 1.7, marginBottom: 20 }}>هل أنت متأكد من حذف هذا الوكيل؟ سيتم حذف جميع الإعدادات نهائياً.</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={handleDelete} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}><Trash2 size={13} style={{ display: "inline", verticalAlign: "-2px", marginLeft: 5 }} /> حذف نهائياً</button>
                            <button onClick={() => setShowDelete(false)} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid var(--t-border)", background: "#fff", color: "var(--t-text-muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
