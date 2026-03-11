import { useState, useCallback } from "react"
import { Plus, X, Loader2, AlertCircle } from "lucide-react"
import { useCreateRole } from "../hooks/use-roles"
import type { CreateRolePayload } from "../types"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

interface Props { onCreated?: (role: string) => void }

const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 7,
    border: "1.5px solid var(--t-border-light, var(--t-border))",
    background: "var(--t-surface, var(--t-card-hover))",
    padding: "7px 10px", fontSize: 11.5,
    color: "var(--t-text, var(--t-text))", outline: "none",
    fontFamily: "inherit",
    transition: "border-color .15s",
}

export function CreateRoleForm({ onCreated }: Props) {
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState({ role: "", name_ar: "", name_en: "", description_ar: "", description_en: "" })
    const mut = useCreateRole()

    const reset = useCallback(() => {
        setForm({ role: "", name_ar: "", name_en: "", description_ar: "", description_en: "" })
        setOpen(false)
    }, [])

    const handleSubmit = useCallback(() => {
        if (!form.role.trim() || !form.name_ar.trim() || !form.name_en.trim()) return
        const payload: CreateRolePayload = {
            role: form.role.trim().toLowerCase().replace(/\s+/g, "_"),
            name_ar: form.name_ar.trim(),
            name_en: form.name_en.trim(),
            description_ar: form.description_ar.trim() || undefined,
            description_en: form.description_en.trim() || undefined,
        }
        mut.mutate(payload, {
            onSuccess: () => { onCreated?.(payload.role); reset() },
        })
    }, [form, mut, onCreated, reset])

    if (!open) {
        return (
            <ActionGuard pageBit={PAGE_BITS.ROLES} actionBit={ACTION_BITS.CREATE_ROLE}>
                <div style={{ padding: "8px 10px", borderTop: "1px solid var(--t-border-light, #eaedf0)" }}>
                    <button onClick={() => setOpen(true)} style={{
                        display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 5,
                        padding: "8px 0", borderRadius: 8, border: "1px dashed var(--t-border, var(--t-border-medium))",
                        background: "transparent", color: "var(--t-accent)",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        transition: "all .12s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(27,80,145,0.03)"; e.currentTarget.style.borderColor = "var(--t-accent)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--t-border, var(--t-border-medium))" }}
                    >
                        <Plus size={13} /> إنشاء دور جديد
                    </button>
                </div>
            </ActionGuard>
        )
    }

    return (
        <div style={{
            borderTop: "1px solid var(--t-border-light, #eaedf0)",
            padding: 12, animation: "rSlide .15s ease-out",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t-accent)" }}>دور جديد</span>
                <button onClick={reset} style={{
                    background: "none", border: "none", cursor: "pointer", padding: 2,
                    color: "var(--t-text-faint, var(--t-text-faint))",
                }}>
                    <X size={13} />
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    placeholder="معرّف الدور (مثال: supervisor)" dir="ltr"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "var(--t-accent)" }}
                    onBlur={e => { e.target.style.borderColor = "var(--t-border-light, var(--t-border))" }}
                />
                <input value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))}
                    placeholder="الاسم بالعربية"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "var(--t-accent)" }}
                    onBlur={e => { e.target.style.borderColor = "var(--t-border-light, var(--t-border))" }}
                />
                <input value={form.name_en} onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
                    placeholder="Name in English" dir="ltr"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "var(--t-accent)" }}
                    onBlur={e => { e.target.style.borderColor = "var(--t-border-light, var(--t-border))" }}
                />
                <input value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))}
                    placeholder="وصف (اختياري)"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "var(--t-accent)" }}
                    onBlur={e => { e.target.style.borderColor = "var(--t-border-light, var(--t-border))" }}
                />
                <input value={form.description_en} onChange={e => setForm(p => ({ ...p, description_en: e.target.value }))}
                    placeholder="Description (optional)" dir="ltr"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "var(--t-accent)" }}
                    onBlur={e => { e.target.style.borderColor = "var(--t-border-light, var(--t-border))" }}
                />
            </div>

            {mut.isError && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 10.5, color: "var(--t-danger)" }}>
                    <AlertCircle size={11} />
                    {(mut.error as any)?.message || "فشل الإنشاء"}
                </div>
            )}

            <button onClick={handleSubmit}
                disabled={mut.isPending || !form.role.trim() || !form.name_ar.trim() || !form.name_en.trim()}
                style={{
                    width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 8,
                    border: "none", background: "var(--t-brand-orange)", color: "#fff",
                    fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    opacity: (mut.isPending || !form.role.trim() || !form.name_ar.trim() || !form.name_en.trim()) ? 0.4 : 1,
                    boxShadow: "0 1px 3px rgba(27,80,145,0.15)",
                }}>
                {mut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                إنشاء
            </button>

            <style>{`@keyframes rSlide{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`}</style>
        </div>
    )
}
