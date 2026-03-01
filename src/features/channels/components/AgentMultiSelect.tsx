/**
 * AgentMultiSelect — reusable component for picking agents from the AI-settings API.
 * Uses the existing useAgents() hook from ai-settings feature.
 */
import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search, Loader2, X } from "lucide-react"
import { useAgents } from "../../ai-settings/hooks/use-ai-settings"

interface Props {
    /** Currently selected agent IDs */
    value: string[]
    /** Called when selection changes */
    onChange: (ids: string[]) => void
    placeholder?: string
    disabled?: boolean
}

export function AgentMultiSelect({ value, onChange, placeholder = "اختر وكلاء...", disabled }: Props) {
    const { data: agents = [], isLoading } = useAgents()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const toggle = (id: string) => {
        onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
    }

    const filtered = agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase())
    )

    const selectedAgents = agents.filter(a => value.includes(a.id))

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                style={{
                    width: "100%", minHeight: 38, padding: "6px 38px 6px 10px",
                    borderRadius: 9, border: `1.5px solid ${open ? "#004786" : "#e0e3e7"}`,
                    background: "#fafafa", cursor: "pointer", textAlign: "right",
                    display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5,
                    transition: "border-color .15s, box-shadow .15s", boxSizing: "border-box",
                    opacity: disabled ? 0.6 : 1,
                    boxShadow: open ? "0 0 0 3px rgba(0,71,134,.06)" : "none",
                }}
            >
                {isLoading ? (
                    <span style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}>
                        <Loader2 size={12} className="animate-spin" style={{ color: "#004786" }} /> جاري التحميل...
                    </span>
                ) : selectedAgents.length === 0 ? (
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{placeholder}</span>
                ) : (
                    selectedAgents.map(a => (
                        <span key={a.id} style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 10px 3px 6px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: "linear-gradient(135deg, rgba(0,71,134,.06), rgba(0,71,134,.03))",
                            color: "#004786", border: "1px solid rgba(0,71,134,.1)",
                        }}>
                            <span style={{
                                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                                background: "linear-gradient(135deg, #004786, #0072b5)", color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 8, fontWeight: 800,
                            }}>{a.name.charAt(0).toUpperCase()}</span>
                            {a.name}
                            <span
                                onClick={e => { e.stopPropagation(); toggle(a.id) }}
                                style={{ cursor: "pointer", display: "flex", color: "rgba(0,71,134,.3)", transition: "color .12s", marginRight: 2 }}
                                onMouseEnter={e => { e.currentTarget.style.color = "#dc2626" }}
                                onMouseLeave={e => { e.currentTarget.style.color = "rgba(0,71,134,.3)" }}
                            >
                                <X size={10} />
                            </span>
                        </span>
                    ))
                )}
                {/* Chevron */}
                <ChevronDown size={14} style={{
                    position: "absolute", left: 10, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
                    color: open ? "#004786" : "#9ca3af", transition: "transform .2s, color .15s", pointerEvents: "none",
                }} />
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0, zIndex: 200,
                    borderRadius: 11, border: "1px solid #eaedf0", background: "#fff",
                    boxShadow: "0 8px 32px rgba(0,0,0,.1)", overflow: "hidden",
                    animation: "agmsIn .12s ease-out",
                }}>
                    <style>{`@keyframes agmsIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

                    {/* Search */}
                    {agents.length > 4 && (
                        <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f1f3", position: "relative" }}>
                            <Search size={12} style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="بحث في الوكلاء..."
                                style={{
                                    width: "100%", padding: "6px 28px 6px 8px", borderRadius: 7,
                                    border: "1px solid #e0e3e7", background: "#fafafa",
                                    fontSize: 12, color: "var(--t-text, #111827)", outline: "none", boxSizing: "border-box",
                                }}
                            />
                        </div>
                    )}

                    {/* Agent list */}
                    <div style={{ maxHeight: 220, overflowY: "auto", padding: "4px 0" }}>
                        {isLoading ? (
                            <div style={{ padding: "16px 14px", fontSize: 12, color: "#004786", display: "flex", alignItems: "center", gap: 7 }}>
                                <Loader2 size={14} className="animate-spin" /> جاري التحميل...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: "16px 14px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
                                {search ? "لا توجد نتائج" : "لا يوجد وكلاء"}
                            </div>
                        ) : (
                            filtered.map(agent => {
                                const selected = value.includes(agent.id)
                                const initials = agent.name.charAt(0).toUpperCase()
                                const isActive = agent.status === "active"
                                return (
                                    <button
                                        key={agent.id}
                                        type="button"
                                        onClick={() => toggle(agent.id)}
                                        style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                                            padding: "8px 14px", border: "none", cursor: "pointer",
                                            background: selected ? "rgba(0,71,134,.04)" : "transparent",
                                            textAlign: "right", transition: "background .1s",
                                            fontFamily: "inherit",
                                        }}
                                        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#fafbfc" }}
                                        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = selected ? "rgba(0,71,134,.04)" : "transparent" }}
                                    >
                                        {/* Avatar initials */}
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                            background: selected ? "linear-gradient(135deg, #004786, #0072b5)" : "#f0f1f3",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 12, fontWeight: 800, color: selected ? "#fff" : "#9ca3af",
                                            transition: "all .12s",
                                        }}>
                                            {initials}
                                        </div>
                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--t-text, #111827)", lineHeight: 1.2 }}>{agent.name}</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: isActive ? "#16a34a" : "#9ca3af" }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? "#16a34a" : "#d1d5db" }} />
                                                    {isActive ? "نشط" : "غير نشط"}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Checkbox */}
                                        <div style={{
                                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                                            border: `1.5px solid ${selected ? "#004786" : "#d1d5db"}`,
                                            background: selected ? "#004786" : "#fff",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all .1s",
                                        }}>
                                            {selected && <Check size={11} style={{ color: "#fff" }} />}
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* Footer summary */}
                    {value.length > 0 && (
                        <div style={{
                            padding: "7px 14px", borderTop: "1px solid #f0f1f3",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                {value.length} {value.length === 1 ? "وكيل محدد" : "وكلاء محددون"}
                            </span>
                            <button type="button" onClick={() => onChange([])} style={{
                                fontSize: 11, fontWeight: 600, color: "#dc2626", background: "none",
                                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                                fontFamily: "inherit",
                            }}>
                                <X size={10} /> إلغاء الكل
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
