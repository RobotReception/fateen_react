/**
 * AgentMultiSelect — reusable component for picking agents from the AI-settings API.
 * Uses the existing useAgents() hook from ai-settings feature.
 */
import { useState, useRef, useEffect } from "react"
import { Bot, Check, ChevronDown, Search, Loader2, X } from "lucide-react"
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

    // Close dropdown when clicking outside
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
                    borderRadius: 9, border: `1.5px solid ${open ? "var(--t-accent)" : "var(--t-border)"}`,
                    background: "var(--t-surface)", cursor: "pointer", textAlign: "right",
                    display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5,
                    transition: "border-color .15s", boxSizing: "border-box",
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                {isLoading ? (
                    <span style={{ fontSize: 12, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 5 }}>
                        <Loader2 size={12} className="animate-spin" /> جاري التحميل...
                    </span>
                ) : selectedAgents.length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--t-text-faint)" }}>{placeholder}</span>
                ) : (
                    selectedAgents.map(a => (
                        <span key={a.id} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: "var(--t-accent-muted)", color: "var(--t-accent)",
                            border: "1px solid var(--t-accent)",
                        }}>
                            <Bot size={10} /> {a.name}
                            <span
                                onClick={e => { e.stopPropagation(); toggle(a.id) }}
                                style={{ cursor: "pointer", display: "flex", color: "var(--t-accent)", opacity: 0.7 }}
                            >
                                <X size={9} />
                            </span>
                        </span>
                    ))
                )}
                {/* Chevron */}
                <ChevronDown size={14} style={{
                    position: "absolute", left: 10, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
                    color: "var(--t-text-faint)", transition: "transform .2s", pointerEvents: "none",
                }} />
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0, zIndex: 200,
                    borderRadius: 11, border: "1.5px solid var(--t-border)", background: "var(--t-card)",
                    boxShadow: "0 8px 32px rgba(0,0,0,.14)", overflow: "hidden",
                    animation: "agmsIn .12s ease-out",
                }}>
                    <style>{`@keyframes agmsIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

                    {/* Search */}
                    {agents.length > 4 && (
                        <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--t-border-light)", position: "relative" }}>
                            <Search size={12} style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)" }} />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="بحث في الوكلاء..."
                                style={{
                                    width: "100%", padding: "6px 28px 6px 8px", borderRadius: 7,
                                    border: "1px solid var(--t-border)", background: "var(--t-surface)",
                                    fontSize: 12, color: "var(--t-text)", outline: "none", boxSizing: "border-box",
                                }}
                            />
                        </div>
                    )}

                    {/* Agent list */}
                    <div style={{ maxHeight: 220, overflowY: "auto", padding: "4px 0" }}>
                        {isLoading ? (
                            <div style={{ padding: "16px 14px", fontSize: 12, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 7 }}>
                                <Loader2 size={14} className="animate-spin" /> جاري التحميل...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: "16px 14px", fontSize: 12, color: "var(--t-text-faint)", textAlign: "center" }}>
                                {search ? "لا توجد نتائج" : "لا يوجد وكلاء"}
                            </div>
                        ) : (
                            filtered.map(agent => {
                                const selected = value.includes(agent.id)
                                return (
                                    <button
                                        key={agent.id}
                                        type="button"
                                        onClick={() => toggle(agent.id)}
                                        style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                                            padding: "9px 14px", border: "none", cursor: "pointer",
                                            background: selected ? "var(--t-accent-muted)" : "transparent",
                                            textAlign: "right", transition: "background .1s",
                                        }}
                                        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "var(--t-surface)" }}
                                        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent" }}
                                    >
                                        {/* Bot icon */}
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                            background: selected ? "var(--t-accent)" : "var(--t-surface)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            border: "1px solid var(--t-border-light)",
                                        }}>
                                            <Bot size={13} style={{ color: selected ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                                        </div>
                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", lineHeight: 1.3 }}>{agent.name}</div>
                                            <div style={{ fontSize: 10, color: "var(--t-text-faint)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {agent.id}
                                            </div>
                                        </div>
                                        {/* Checkmark */}
                                        {selected && (
                                            <Check size={14} style={{ color: "var(--t-accent)", flexShrink: 0 }} />
                                        )}
                                        {/* Status dot */}
                                        <span style={{
                                            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                                            background: agent.status === "active" ? "var(--t-success)" : "var(--t-text-faint)",
                                        }} />
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* Footer summary */}
                    {value.length > 0 && (
                        <div style={{
                            padding: "7px 14px", borderTop: "1px solid var(--t-border-light)",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>
                                {value.length} {value.length === 1 ? "وكيل محدد" : "وكلاء محددون"}
                            </span>
                            <button type="button" onClick={() => onChange([])} style={{
                                fontSize: 11, fontWeight: 600, color: "var(--t-danger)", background: "none",
                                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
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
