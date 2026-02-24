import { useState, useEffect } from "react"
import {
    Loader2, Save, MessageSquareText, RefreshCw, AlertTriangle,
    WifiOff, RotateCcw, BookOpen,
} from "lucide-react"
import { usePromptsSettings, useUpdatePromptsSettings } from "../hooks/use-ai-settings"
import type { PromptsSettings } from "../types"

const CSS = `
@keyframes prFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes prShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.pr-card { border-radius:13px; border:1.5px solid var(--t-border); background:var(--t-card); overflow:hidden; transition:border-color .15s, box-shadow .15s; margin-bottom:0; }
.pr-card.dirty { border-color:var(--t-accent); box-shadow:0 0 0 3px rgba(99,102,241,.1); }
.pr-textarea { width:100%; padding:12px 14px; border-radius:10px; border:1.5px solid var(--t-border-light); background:var(--t-surface); font-size:13px; color:var(--t-text); outline:none; resize:vertical; line-height:1.8; font-family:inherit; min-height:130px; transition:border-color .15s; box-sizing:border-box; }
.pr-textarea:focus { border-color:var(--t-accent); }
`

const FIELDS: { key: keyof PromptsSettings; label: string; desc: string; icon: typeof MessageSquareText; placeholder: string }[] = [
    { key: "general_prompt", label: "التوجيه العام", desc: "السلوك العام للوكيل", icon: MessageSquareText, placeholder: "أنت مساعد ذكي..." },
]

const sk = (w: string, h = 12, r = 6) => ({ width: w, height: h, borderRadius: r, background: "linear-gradient(110deg,var(--t-border) 30%,var(--t-border-light) 50%,var(--t-border) 70%)", backgroundSize: "200% 100%", animation: "prShimmer 1.6s ease-in-out infinite" } as React.CSSProperties)

function Skeleton() {
    return (
        <div style={{ animation: "prFade .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{ borderRadius: 13, border: "1px solid var(--t-border)", background: "var(--t-card)", padding: "16px 18px" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                            <div style={sk("32px", 32, 9)} /><div><div style={sk("110px", 13)} /><div style={{ ...sk("160px", 9), marginTop: 5 }} /></div>
                        </div>
                        <div style={sk("100%", 110, 9)} />
                    </div>
                ))}
            </div>
        </div>
    )
}

function PromptCard({ field, value, onSave, isSaving }: {
    field: typeof FIELDS[number]; value: string; onSave: (v: string) => void; isSaving: boolean
}) {
    const [draft, setDraft] = useState(value)
    const [dirty, setDirty] = useState(false)
    useEffect(() => { setDraft(value); setDirty(false) }, [value])
    const Icon = field.icon
    const isEmpty = !draft.trim()

    return (
        <div className={`pr-card ${dirty ? "dirty" : ""}`}>
            <div style={{ padding: "13px 16px 11px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--t-border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: dirty ? "var(--t-accent)" : isEmpty ? "var(--t-border-light)" : "var(--t-accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                        <Icon size={14} style={{ color: dirty ? "var(--t-text-on-accent)" : isEmpty ? "var(--t-text-faint)" : "var(--t-accent)" }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>{field.label}</div>
                        <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 2 }}>{field.desc}</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {dirty && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--t-accent)", background: "var(--t-accent-muted)", padding: "2px 8px", borderRadius: 20 }}>مُعدَّل</span>}
                    <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>{draft.length}</span>
                </div>
            </div>
            <div style={{ padding: "12px 16px 14px" }}>
                <textarea className="pr-textarea" value={draft} placeholder={field.placeholder}
                    onChange={e => { setDraft(e.target.value); setDirty(e.target.value !== value) }} />
                {dirty && (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 9 }}>
                        <button onClick={() => { setDraft(value); setDirty(false) }} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 13px", borderRadius: 8, cursor: "pointer", border: "1.5px solid var(--t-border)", background: "transparent", color: "var(--t-text-faint)", fontSize: 12, fontWeight: 600 }}>
                            <RotateCcw size={11} /> تراجع
                        </button>
                        <button disabled={isSaving} onClick={() => onSave(draft)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 15px", borderRadius: 8, cursor: "pointer", border: "none", background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 12, fontWeight: 700, opacity: isSaving ? 0.7 : 1 }}>
                            {isSaving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                            حفظ
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export function PromptsTab({ agentId }: { agentId: string }) {
    const { data: prompts, isLoading, isError, error, refetch, isRefetching } = usePromptsSettings(agentId)
    const update = useUpdatePromptsSettings(agentId)

    if (isLoading) return <Skeleton />
    if (isError && !prompts) {
        const ax = error as any
        const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
        return (
            <div style={{ borderRadius: 14, padding: "40px 24px", textAlign: "center", border: "1px solid var(--t-border)", background: "var(--t-card)" }}>
                <style>{CSS}</style>
                <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px", background: "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isNet ? <WifiOff size={22} style={{ color: "var(--t-danger)" }} /> : <AlertTriangle size={22} style={{ color: "var(--t-danger)" }} />}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)", marginBottom: 12 }}>خطأ في تحميل التوجيهات</div>
                <button onClick={() => refetch()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, border: "none", background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: isRefetching ? 0.7 : 1 }}>
                    {isRefetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    إعادة المحاولة
                </button>
            </div>
        )
    }
    if (!prompts) return (
        <div style={{ borderRadius: 14, padding: "48px 24px", textAlign: "center", border: "1px dashed var(--t-border)" }}>
            <style>{CSS}</style>
            <BookOpen size={32} style={{ display: "block", margin: "0 auto 12px", opacity: 0.25 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>لا توجد توجيهات</div>
        </div>
    )

    return (
        <div style={{ animation: "prFade .25s ease-out" }}>
            <style>{CSS}</style>
            <PromptCard
                field={FIELDS[0]}
                value={(prompts as any)["general_prompt"] || ""}
                onSave={v => update.mutate({ general_prompt: v })}
                isSaving={update.isPending}
            />
        </div>
    )
}
