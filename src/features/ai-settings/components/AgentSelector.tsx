import { useState, useEffect } from "react"
import { Plus, Bot, Trash2, Loader2, Search, Edit3, Check, X, Building2, Tag, Save, Settings } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from "../hooks/use-ai-settings"
import { useAuthStore } from "@/stores/auth-store"
import { getDepartmentsLookup } from "../../knowledge/services/knowledge-service"
import apiClient from "@/lib/api-client"
import type { Agent } from "../types"

/* ── CSS ── */
const CSS = `
@keyframes agFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes agShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`

/* ── Chip (for multi-select) ── */
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 12px", borderRadius: 20, cursor: "pointer",
            fontSize: 11, fontWeight: 600, transition: "all .12s ease",
            border: selected ? "1.5px solid var(--t-accent)" : "1px solid var(--t-border)",
            background: selected ? "var(--t-accent-muted)" : "var(--t-surface)",
            color: selected ? "var(--t-accent)" : "var(--t-text-muted)",
        }}>
            {selected && <Check size={10} />}
            {label}
        </button>
    )
}

/* ── Department & Category chip selectors (shared between create/edit) ── */
function DeptCatSelectors({
    departments,
    categories,
    selectedDepts,
    selectedCats,
    onToggleDept,
    onToggleCat,
}: {
    departments: { department_id: string; name: string; name_ar: string }[]
    categories: { category_id: string; name: string; name_ar?: string }[]
    selectedDepts: string[]
    selectedCats: string[]
    onToggleDept: (id: string) => void
    onToggleCat: (id: string) => void
}) {
    return (
        <>
            {/* Departments */}
            <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                    <Building2 size={11} /> الأقسام
                    {selectedDepts.length > 0 && <span style={{ fontSize: 9, background: "var(--t-accent-muted)", color: "var(--t-accent)", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>{selectedDepts.length}</span>}
                </label>
                {departments.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", fontStyle: "italic" }}>لا توجد أقسام متاحة</div>
                ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {departments.map(d => (
                            <Chip key={d.department_id} label={d.name_ar || d.name} selected={selectedDepts.includes(d.department_id)} onClick={() => onToggleDept(d.department_id)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Categories */}
            <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                    <Tag size={11} /> الفئات
                    {selectedCats.length > 0 && <span style={{ fontSize: 9, background: "var(--t-accent-muted)", color: "var(--t-accent)", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>{selectedCats.length}</span>}
                </label>
                {categories.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", fontStyle: "italic" }}>لا توجد فئات متاحة</div>
                ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {categories.map(c => (
                            <Chip key={c.category_id} label={c.name_ar || c.name} selected={selectedCats.includes(c.category_id)} onClick={() => onToggleCat(c.category_id)} />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

/* ── Agent Edit Panel (opened per card) ── */
function AgentEditPanel({
    agent,
    departments,
    categories,
    onClose,
}: {
    agent: Agent
    departments: { department_id: string; name: string; name_ar: string }[]
    categories: { category_id: string; name: string; name_ar?: string }[]
    onClose: () => void
}) {
    const updateMut = useUpdateAgent()

    const [eName, setEName] = useState(agent.name)
    const [eDesc, setEDesc] = useState(agent.description || "")
    const [eStatus, setEStatus] = useState<"active" | "inactive">(agent.status)
    const [eDepts, setEDepts] = useState<string[]>(agent.departments || [])
    const [eCats, setECats] = useState<string[]>(agent.categories || [])

    // Sync if agent data changes externally
    useEffect(() => {
        setEName(agent.name)
        setEDesc(agent.description || "")
        setEStatus(agent.status)
        setEDepts(agent.departments || [])
        setECats(agent.categories || [])
    }, [agent])

    const toggleDept = (id: string) => setEDepts(p => p.includes(id) ? p.filter(d => d !== id) : [...p, id])
    const toggleCat = (id: string) => setECats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id])

    const hasChanges =
        eName !== agent.name ||
        eDesc !== (agent.description || "") ||
        eStatus !== agent.status ||
        JSON.stringify(eDepts.sort()) !== JSON.stringify((agent.departments || []).sort()) ||
        JSON.stringify(eCats.sort()) !== JSON.stringify((agent.categories || []).sort())

    const handleSave = () => {
        if (!eName.trim()) return
        updateMut.mutate({
            id: agent.id, payload: {
                name: eName.trim(),
                description: eDesc.trim() || undefined,
                status: eStatus,
                departments: eDepts,
                categories: eCats,
            }
        }, { onSuccess: () => onClose() })
    }

    return (
        <div style={{
            borderRadius: 12, padding: 16,
            border: "1px solid var(--t-accent)",
            background: "var(--t-card)",
            animation: "agFade .2s ease-out",
        }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Settings size={14} style={{ color: "var(--t-accent)" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>تعديل الوكيل</span>
                </div>
                <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
                    <X size={14} style={{ color: "var(--t-text-faint)" }} />
                </button>
            </div>

            {/* Name + Description */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 4 }}>اسم الوكيل</label>
                    <input value={eName} onChange={e => setEName(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--t-border)", background: "var(--t-surface)", fontSize: 12, color: "var(--t-text)", outline: "none" }} />
                </div>
                <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 4 }}>الوصف</label>
                    <input value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="وصف مختصر"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--t-border)", background: "var(--t-surface)", fontSize: 12, color: "var(--t-text)", outline: "none" }} />
                </div>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>الحالة</label>
                <div style={{ display: "flex", gap: 6 }}>
                    <Chip label="نشط" selected={eStatus === "active"} onClick={() => setEStatus("active")} />
                    <Chip label="غير نشط" selected={eStatus === "inactive"} onClick={() => setEStatus("inactive")} />
                </div>
            </div>

            {/* Departments + Categories */}
            <DeptCatSelectors
                departments={departments} categories={categories}
                selectedDepts={eDepts} selectedCats={eCats}
                onToggleDept={toggleDept} onToggleCat={toggleCat}
            />

            {/* Actions */}
            <div style={{ marginTop: 14, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={{
                    padding: "7px 14px", borderRadius: 8,
                    border: "1px solid var(--t-border)", background: "transparent",
                    color: "var(--t-text)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}>إلغاء</button>
                <button
                    disabled={!eName.trim() || !hasChanges || updateMut.isPending}
                    onClick={handleSave}
                    style={{
                        padding: "7px 16px", borderRadius: 8, border: "none",
                        background: hasChanges ? "var(--t-accent)" : "var(--t-border)",
                        color: hasChanges ? "var(--t-text-on-accent)" : "var(--t-text-faint)",
                        fontSize: 11, fontWeight: 600, cursor: hasChanges ? "pointer" : "default",
                        display: "inline-flex", alignItems: "center", gap: 4,
                        opacity: updateMut.isPending ? 0.7 : 1,
                    }}
                >
                    {updateMut.isPending ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    حفظ التعديلات
                </button>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   AGENT SELECTOR
   ══════════════════════════════════════════════════════════════ */
export function AgentSelector({
    selectedId,
    onSelect,
}: {
    selectedId: string | null
    onSelect: (id: string) => void
}) {
    const tid = useAuthStore(s => s.user?.tenant_id || "")
    const { data: agents = [], isLoading } = useAgents()
    const createMut = useCreateAgent()
    const deleteMut = useDeleteAgent()

    /* ── Department/category lookup queries ── */
    const { data: departmentsData } = useQuery({
        queryKey: ["departments-lookup", tid],
        queryFn: () => getDepartmentsLookup(tid),
        enabled: !!tid,
        staleTime: 60_000,
        select: r => r.data ?? [],
    })
    const departments = departmentsData ?? []

    const { data: categoriesData } = useQuery({
        queryKey: ["categories-list", tid],
        queryFn: async () => {
            const { data } = await apiClient.get<{ success: boolean; data: { categories: { category_id: string; name: string; name_ar?: string }[] } }>("/categories", {
                headers: { "X-Tenant-ID": tid },
            })
            return data
        },
        enabled: !!tid,
        staleTime: 60_000,
        select: r => r.data?.categories ?? [],
    })
    const categories = categoriesData ?? []

    /* ── Local state ── */
    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDesc, setNewDesc] = useState("")
    const [newStatus, setNewStatus] = useState<"active" | "inactive">("active")
    const [selectedDepts, setSelectedDepts] = useState<string[]>([])
    const [selectedCats, setSelectedCats] = useState<string[]>([])
    const [search, setSearch] = useState("")
    const [editingAgentId, setEditingAgentId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const filtered = agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.description || "").toLowerCase().includes(search.toLowerCase())
    )

    const toggleDept = (id: string) => setSelectedDepts(p => p.includes(id) ? p.filter(d => d !== id) : [...p, id])
    const toggleCat = (id: string) => setSelectedCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id])

    const resetCreateForm = () => {
        setNewName(""); setNewDesc(""); setNewStatus("active")
        setSelectedDepts([]); setSelectedCats([]); setShowCreate(false)
    }

    const handleCreate = () => {
        if (!newName.trim()) return
        createMut.mutate({
            name: newName.trim(),
            description: newDesc.trim() || undefined,
            status: newStatus,
            departments: selectedDepts.length > 0 ? selectedDepts : undefined,
            categories: selectedCats.length > 0 ? selectedCats : undefined,
        }, {
            onSuccess: (res) => {
                if (res.data?.id) onSelect(res.data.id)
                resetCreateForm()
            },
        })
    }

    const handleDelete = (id: string) => {
        deleteMut.mutate(id)
        setConfirmDeleteId(null)
        if (selectedId === id) {
            const remaining = agents.filter(a => a.id !== id)
            if (remaining.length) onSelect(remaining[0].id)
        }
    }

    return (
        <div style={{ animation: "agFade .25s ease-out" }}>
            <style>{CSS}</style>

            {/* ── Header bar ── */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 14,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Bot size={18} style={{ color: "var(--t-accent)" }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.01em" }}>الوكلاء</span>
                    {agents.length > 0 && (
                        <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                            background: "var(--t-accent-muted)", color: "var(--t-accent)",
                        }}>{agents.length}</span>
                    )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {agents.length > 3 && (
                        <div style={{ position: "relative" }}>
                            <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث..."
                                style={{ width: 160, padding: "7px 32px 7px 10px", borderRadius: 9, border: "1px solid var(--t-border)", background: "var(--t-surface)", fontSize: 12, color: "var(--t-text)", outline: "none" }} />
                        </div>
                    )}
                    <button onClick={() => setShowCreate(!showCreate)} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "7px 14px", borderRadius: 9, border: "none",
                        background: "var(--t-accent)", color: "var(--t-text-on-accent)",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                    }}>
                        <Plus size={13} /> وكيل جديد
                    </button>
                </div>
            </div>

            {/* ── Create form ── */}
            {showCreate && (
                <div style={{
                    borderRadius: 12, padding: 18,
                    border: "1px dashed var(--t-accent)", background: "var(--t-card)",
                    marginBottom: 12, animation: "agFade .2s ease-out",
                }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 14 }}>إنشاء وكيل جديد</div>

                    {/* Name + Description */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 4 }}>اسم الوكيل *</label>
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: وكيل الدعم الفني"
                                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--t-border)", background: "var(--t-surface)", fontSize: 13, color: "var(--t-text)", outline: "none" }} autoFocus />
                        </div>
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 4 }}>الوصف</label>
                            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="وصف مختصر (اختياري)"
                                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--t-border)", background: "var(--t-surface)", fontSize: 13, color: "var(--t-text)", outline: "none" }} />
                        </div>
                    </div>

                    {/* Status */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>الحالة</label>
                        <div style={{ display: "flex", gap: 6 }}>
                            <Chip label="نشط" selected={newStatus === "active"} onClick={() => setNewStatus("active")} />
                            <Chip label="غير نشط" selected={newStatus === "inactive"} onClick={() => setNewStatus("inactive")} />
                        </div>
                    </div>

                    {/* Departments + Categories */}
                    <div style={{ marginBottom: 16 }}>
                        <DeptCatSelectors
                            departments={departments} categories={categories}
                            selectedDepts={selectedDepts} selectedCats={selectedCats}
                            onToggleDept={toggleDept} onToggleCat={toggleCat}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6 }}>
                        <button disabled={!newName.trim() || createMut.isPending} onClick={handleCreate} style={{
                            padding: "8px 18px", borderRadius: 9, border: "none",
                            background: "var(--t-accent)", color: "var(--t-text-on-accent)",
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 5,
                            opacity: createMut.isPending ? 0.7 : 1,
                        }}>
                            {createMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            إنشاء
                        </button>
                        <button onClick={resetCreateForm} style={{
                            padding: "8px 14px", borderRadius: 9,
                            border: "1px solid var(--t-border)", background: "transparent",
                            color: "var(--t-text)", fontSize: 12, cursor: "pointer",
                        }}>إلغاء</button>
                    </div>
                </div>
            )}

            {/* ── Loading ── */}
            {isLoading && (
                <div style={{ display: "flex", gap: 8 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            flex: 1, height: 72, borderRadius: 12,
                            background: "linear-gradient(110deg, var(--t-border) 30%, var(--t-border-light) 50%, var(--t-border) 70%)",
                            backgroundSize: "200% 100%", animation: "agShimmer 1.6s ease-in-out infinite",
                        }} />
                    ))}
                </div>
            )}

            {/* ── Empty state ── */}
            {!isLoading && filtered.length === 0 && agents.length === 0 && !showCreate && (
                <div style={{
                    borderRadius: 14, padding: "36px 24px", textAlign: "center",
                    border: "1px dashed var(--t-border)", color: "var(--t-text-faint)",
                }}>
                    <Bot size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.4 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>لا يوجد وكلاء</div>
                    <div style={{ fontSize: 12 }}>أنشئ أول وكيل لبدء تخصيص إعدادات الذكاء الاصطناعي</div>
                </div>
            )}

            {/* ── Agent cards ── */}
            {!isLoading && filtered.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 8,
                }}>
                    {filtered.map(agent => {
                        const isSelected = agent.id === selectedId
                        const isEditOpen = editingAgentId === agent.id
                        const isDeleting = confirmDeleteId === agent.id

                        if (isEditOpen) {
                            return (
                                <AgentEditPanel
                                    key={agent.id}
                                    agent={agent}
                                    departments={departments}
                                    categories={categories}
                                    onClose={() => setEditingAgentId(null)}
                                />
                            )
                        }

                        return (
                            <div
                                key={agent.id}
                                onClick={() => { if (!isDeleting) onSelect(agent.id) }}
                                style={{
                                    borderRadius: 12, padding: "14px 16px",
                                    border: `1.5px solid ${isSelected ? "var(--t-accent)" : "var(--t-border)"}`,
                                    background: isSelected ? "var(--t-accent-muted)" : "var(--t-card)",
                                    cursor: isDeleting ? "default" : "pointer",
                                    transition: "all .15s ease",
                                    position: "relative",
                                    boxShadow: isSelected ? "0 0 0 3px rgba(var(--t-accent-rgb, 99,102,241), 0.12)" : "none",
                                }}
                            >
                                {/* Top row: icon + name + action buttons */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 8,
                                            background: isSelected ? "var(--t-accent)" : "var(--t-surface)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all .15s",
                                        }}>
                                            <Bot size={14} style={{ color: isSelected ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>{agent.name}</span>
                                    </div>
                                    {!isDeleting && (
                                        <div style={{ display: "flex", gap: 2 }} onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setEditingAgentId(agent.id)}
                                                title="تعديل التفاصيل"
                                                style={{ border: "none", background: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--t-text-faint)", transition: "color .1s" }}
                                                onMouseEnter={e => { e.currentTarget.style.color = "var(--t-text)" }}
                                                onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-faint)" }}>
                                                <Edit3 size={12} />
                                            </button>
                                            <button onClick={() => setConfirmDeleteId(agent.id)}
                                                title="حذف الوكيل"
                                                style={{ border: "none", background: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--t-text-faint)", transition: "color .1s" }}
                                                onMouseEnter={e => { e.currentTarget.style.color = "var(--t-danger)" }}
                                                onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-faint)" }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Status + department/category badges */}
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 3,
                                        fontSize: 10, fontWeight: 600,
                                        color: agent.status === "active" ? "var(--t-success)" : "var(--t-text-faint)",
                                    }}>
                                        <span style={{
                                            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                                            background: agent.status === "active" ? "var(--t-success)" : "var(--t-text-faint)",
                                        }} />
                                        {agent.status === "active" ? "نشط" : "غير نشط"}
                                    </span>
                                    {agent.departments?.length > 0 && (
                                        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--t-text-faint)", background: "var(--t-surface)", padding: "1px 6px", borderRadius: 8 }}>
                                            <Building2 size={8} style={{ display: "inline", verticalAlign: "middle", marginLeft: 2 }} /> {agent.departments.length}
                                        </span>
                                    )}
                                    {agent.categories?.length > 0 && (
                                        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--t-text-faint)", background: "var(--t-surface)", padding: "1px 6px", borderRadius: 8 }}>
                                            <Tag size={8} style={{ display: "inline", verticalAlign: "middle", marginLeft: 2 }} /> {agent.categories.length}
                                        </span>
                                    )}
                                </div>

                                {agent.description && (
                                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {agent.description}
                                    </div>
                                )}

                                {/* Delete confirm overlay */}
                                {isDeleting && (
                                    <div style={{
                                        position: "absolute", inset: 0, borderRadius: 12,
                                        background: "rgba(var(--t-bg-rgb, 255,255,255), 0.95)",
                                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                        gap: 8, backdropFilter: "blur(4px)",
                                    }} onClick={e => e.stopPropagation()}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-danger)" }}>حذف "{agent.name}"؟</div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button onClick={() => handleDelete(agent.id)} style={{
                                                padding: "5px 14px", borderRadius: 7, border: "none",
                                                background: "var(--t-danger)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
                                            }}>حذف</button>
                                            <button onClick={() => setConfirmDeleteId(null)} style={{
                                                padding: "5px 12px", borderRadius: 7,
                                                border: "1px solid var(--t-border)", background: "transparent",
                                                color: "var(--t-text)", fontSize: 11, cursor: "pointer",
                                            }}>إلغاء</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
