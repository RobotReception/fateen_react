import { useState, useEffect } from "react"
import {
    Loader2, Save, MessageSquareText, RefreshCw, AlertTriangle,
    WifiOff, RotateCcw, BookOpen,
} from "lucide-react"
import { usePromptsSettings, useUpdatePromptsSettings } from "../hooks/use-ai-settings"

const CSS = `
@keyframes prFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes prShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.pr2-textarea{width:100%;padding:14px 16px;border-radius:10px;border:1.5px solid var(--t-border);background:#fafbfc;font-size:13px;color:var(--t-text);outline:none;resize:vertical;line-height:1.8;font-family:inherit;min-height:200px;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
.pr2-textarea:focus{border-color:var(--t-accent);box-shadow:0 0 0 3px rgba(27,80,145,.06);background:#fff}
`

const sk = (w: string, h = 12, r = 6) => ({ width: w, height: h, borderRadius: r, background: "linear-gradient(110deg,#f0f1f3 30%,var(--t-page) 50%,#f0f1f3 70%)", backgroundSize: "200% 100%", animation: "prShimmer 1.6s ease-in-out infinite" } as React.CSSProperties)

export function PromptsTab({ agentId }: { agentId: string }) {
    const { data: prompts, isLoading, isError, error, refetch, isRefetching } = usePromptsSettings(agentId)
    const update = useUpdatePromptsSettings(agentId)

    const [draft, setDraft] = useState("")
    const [dirty, setDirty] = useState(false)

    const val = (prompts as any)?.general_prompt || ""
    useEffect(() => { setDraft(val); setDirty(false) }, [val])

    if (isLoading) return (
        <div style={{ animation: "prFade .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ borderRadius: 12, border: "1px solid var(--t-border)", background: "#fff", padding: 18 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}><div style={sk("32px", 32, 8)} /><div><div style={sk("100px", 12)} /><div style={{ ...sk("160px", 9), marginTop: 4 }} /></div></div>
                <div style={sk("100%", 160, 10)} />
            </div>
        </div>
    )

    if (isError && !prompts) {
        const ax = error as any
        const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
        return (
            <div style={{ borderRadius: 12, padding: "40px 24px", textAlign: "center", border: "1px solid var(--t-border)", background: "#fff" }}>
                <style>{CSS}</style>
                <div style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isNet ? <WifiOff size={22} style={{ color: "var(--t-danger)" }} /> : <AlertTriangle size={22} style={{ color: "var(--t-danger)" }} />}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)", marginBottom: 12 }}>خطأ في التحميل</div>
                <button onClick={() => refetch()} style={{
                    display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 8,
                    border: "none", background: "var(--t-brand-orange)", color: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: isRefetching ? .7 : 1, fontFamily: "inherit",
                }}>{isRefetching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} إعادة المحاولة</button>
            </div>
        )
    }

    if (!prompts) return (
        <div style={{ borderRadius: 12, padding: "48px 24px", textAlign: "center", border: "1.5px dashed var(--t-border-medium)" }}>
            <style>{CSS}</style>
            <BookOpen size={28} style={{ margin: "0 auto 10px", display: "block", color: "var(--t-border-medium)" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", marginBottom: 3 }}>لا توجد توجيهات</div>
            <div style={{ fontSize: 11, color: "var(--t-text-faint)" }}>ستظهر بعد تهيئة الوكيل</div>
        </div>
    )

    return (
        <div style={{ animation: "prFade .25s ease-out" }}>
            <style>{CSS}</style>

            {/* Card */}
            <div style={{
                borderRadius: 12, border: `1px solid ${dirty ? "rgba(27,80,145,.2)" : "var(--t-border)"}`,
                background: "#fff", overflow: "hidden", transition: "border-color .2s, box-shadow .2s",
                boxShadow: dirty ? "0 0 0 3px rgba(27,80,145,.04)" : "none",
            }}>
                {/* Header strip */}
                <div style={{ height: 2, background: dirty ? "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary))" : "var(--t-border)", transition: "background .2s" }} />

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--t-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: dirty ? "var(--t-gradient-accent)" : "#f0f1f3",
                            display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                        }}>
                            <MessageSquareText size={14} style={{ color: dirty ? "#fff" : "var(--t-text-faint)" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>التوجيه العام</div>
                            <div style={{ fontSize: 10, color: "var(--t-text-faint)" }}>حدد سلوك وشخصية الوكيل</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {dirty && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--t-accent)", background: "rgba(27,80,145,.06)", padding: "2px 8px", borderRadius: 20 }}>مُعدَّل</span>}
                        <span style={{ fontSize: 9, color: "var(--t-text-faint)", background: "var(--t-surface)", padding: "2px 7px", borderRadius: 8, fontVariantNumeric: "tabular-nums" }}>{draft.length} حرف</span>
                    </div>
                </div>

                {/* Textarea */}
                <div style={{ padding: "14px 16px" }}>
                    <textarea className="pr2-textarea" value={draft} placeholder="أنت مساعد ذكي..."
                        onChange={e => { setDraft(e.target.value); setDirty(e.target.value !== val) }} />

                    {dirty && (
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 10 }}>
                            <button onClick={() => { setDraft(val); setDirty(false) }} style={{
                                display: "inline-flex", alignItems: "center", gap: 4, padding: "7px 13px", borderRadius: 8, cursor: "pointer",
                                border: "1.5px solid var(--t-border)", background: "#fff", color: "var(--t-text-muted)", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                            }}><RotateCcw size={10} /> تراجع</button>
                            <button disabled={update.isPending} onClick={() => update.mutate({ general_prompt: draft })} style={{
                                display: "inline-flex", alignItems: "center", gap: 4, padding: "7px 15px", borderRadius: 8, cursor: "pointer",
                                border: "none", background: "var(--t-brand-orange)", color: "#fff", fontSize: 11, fontWeight: 700,
                                opacity: update.isPending ? .7 : 1, fontFamily: "inherit", boxShadow: "0 1px 5px rgba(27,80,145,.13)",
                            }}>
                                {update.isPending ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} حفظ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
