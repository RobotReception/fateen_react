import { useState, useCallback } from "react"
import { Plus, X, Loader2, AlertCircle } from "lucide-react"
import { useCreateRole } from "../hooks/use-roles"
import type { CreateRolePayload } from "../types"

interface Props { onCreated?: (role: string) => void }

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
            <button onClick={() => setOpen(true)}
                className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium
                           text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <Plus size={14} /> إنشاء دور جديد
            </button>
        )
    }

    return (
        <div className="border-t border-gray-100 p-3 space-y-2.5" style={{ animation: "rSlide .15s ease-out" }}>
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-gray-600">دور جديد</span>
                <button onClick={reset} className="rounded p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={13} />
                </button>
            </div>

            <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                placeholder="معرّف الدور (مثال: supervisor)" dir="ltr"
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] text-gray-700 placeholder:text-gray-300 outline-none focus:border-gray-400" />
            <input value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))}
                placeholder="الاسم بالعربية"
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] text-gray-700 placeholder:text-gray-300 outline-none focus:border-gray-400" />
            <input value={form.name_en} onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
                placeholder="Name in English" dir="ltr"
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] text-gray-700 placeholder:text-gray-300 outline-none focus:border-gray-400" />
            <input value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))}
                placeholder="وصف (اختياري)"
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] text-gray-700 placeholder:text-gray-300 outline-none focus:border-gray-400" />
            <input value={form.description_en} onChange={e => setForm(p => ({ ...p, description_en: e.target.value }))}
                placeholder="Description (optional)" dir="ltr"
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] text-gray-700 placeholder:text-gray-300 outline-none focus:border-gray-400" />

            {mut.isError && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <AlertCircle size={11} className="text-gray-400" />
                    {(mut.error as any)?.message || "فشل الإنشاء"}
                </div>
            )}

            <button onClick={handleSubmit}
                disabled={mut.isPending || !form.role.trim() || !form.name_ar.trim() || !form.name_en.trim()}
                className="w-full rounded-md bg-gray-800 py-1.5 text-[12px] font-medium text-white
                           hover:bg-gray-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
                {mut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                إنشاء
            </button>

            <style>{`@keyframes rSlide{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    )
}
