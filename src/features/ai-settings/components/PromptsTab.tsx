import { useState, useEffect } from "react"
import { Loader2, Save, MessageSquareText, RefreshCw, AlertTriangle, WifiOff, RotateCcw } from "lucide-react"
import { usePromptsSettings, useUpdatePromptsSettings } from "../hooks/use-ai-settings"

/* ── CSS ── */
const CSS = `
@keyframes prFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes prShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`

/* ── Skeleton ── */
function Skeleton() {
    const sk = (w: string, h = 14, r = 8) => ({ width: w, height: h, borderRadius: r, background: "linear-gradient(110deg, var(--t-border) 30%, var(--t-border-light) 50%, var(--t-border) 70%)", backgroundSize: "200% 100%", animation: "prShimmer 1.6s ease-in-out infinite" } as React.CSSProperties)
    return (
        <div style={{ animation: "prFadeUp .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ borderRadius: 14, padding: 22, background: "var(--t-card)", border: "1px solid var(--t-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={sk("42px", 42, 11)} />
                    <div><div style={sk("120px", 16)} /><div style={{ ...sk("180px", 11), marginTop: 6 }} /></div>
                </div>
                <div style={sk("100%", 200, 10)} />
            </div>
        </div>
    )
}

/* ── Error ── */
function ErrorPanel({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying: boolean }) {
    const ax = error as any
    const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
    const status = ax?.response?.status
    const msg = ax?.response?.data?.message || ax?.response?.data?.detail || ax?.message || ""
    return (
        <div style={{
            borderRadius: 14, border: "1px solid", textAlign: "center", padding: "36px 24px",
            borderColor: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
            background: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
            animation: "prFadeUp .3s ease-out",
        }}>
            <style>{CSS}</style>
            <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 16",
                background: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {isNet ? <WifiOff size={24} style={{ color: "var(--t-warning)" }} /> : <AlertTriangle size={24} style={{ color: "var(--t-danger)" }} />}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text)", marginBottom: 6 }}>{isNet ? "لا يمكن الاتصال بالخادم" : "خطأ في تحميل البيانات"}</div>
            <div style={{ fontSize: 13, color: "var(--t-text-faint)", marginBottom: 16, lineHeight: 1.6 }}>{isNet ? "تحقق من اتصال الشبكة" : msg || "تعذر جلب البيانات"}</div>
            {status && <div style={{ fontSize: 11, color: "var(--t-text-faint)", fontFamily: "monospace", marginBottom: 16, opacity: 0.5 }}>HTTP {status}</div>}
            <button onClick={onRetry} style={{
                padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 13, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
                opacity: retrying ? 0.7 : 1, pointerEvents: retrying ? "none" : "auto",
            }}>
                {retrying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {retrying ? "جاري إعادة المحاولة..." : "إعادة المحاولة"}
            </button>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   PROMPTS TAB
   ══════════════════════════════════════════════════════════════ */
export function PromptsTab() {
    const { data: prompts, isLoading, isError, error, refetch, isRefetching } = usePromptsSettings()
    const update = useUpdatePromptsSettings()
    const [draft, setDraft] = useState("")
    const [dirty, setDirty] = useState(false)

    useEffect(() => {
        if (prompts) {
            setDraft((prompts as any).general_prompt || "")
            setDirty(false)
        }
    }, [prompts])

    if (isLoading) return <Skeleton />
    if (isError && !prompts) return <ErrorPanel error={error} onRetry={() => refetch()} retrying={isRefetching} />
    if (!prompts) return (
        <div style={{
            borderRadius: 14, padding: "40px 24px", textAlign: "center",
            border: "1px dashed var(--t-border)", color: "var(--t-text-faint)",
            animation: "prFadeUp .3s ease-out",
        }}>
            <style>{CSS}</style>
            <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 14",
                background: "var(--t-surface)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <MessageSquareText size={26} style={{ color: "var(--t-text-faint)" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>لا توجد بيانات</div>
            <div style={{ fontSize: 12 }}>سيتم عرض البيانات عند تهيئتها</div>
        </div>
    )

    const charCount = draft.length
    const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0

    return (
        <div style={{ animation: "prFadeUp .3s ease-out" }}>
            <style>{CSS}</style>

            <div style={{
                borderRadius: 14, padding: 22,
                background: "var(--t-card)", border: "1px solid var(--t-border)",
                transition: "all .15s",
            }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 11,
                            background: "var(--t-accent)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <MessageSquareText size={20} style={{ color: "var(--t-text-on-accent)" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.01em" }}>التوجيه العام</div>
                            <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>التوجيه الرئيسي الذي يحدد سلوك المساعد الذكي</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{
                            fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                            background: "var(--t-surface)", color: "var(--t-text-faint)",
                        }}>
                            {charCount} حرف • {wordCount} كلمة
                        </span>
                    </div>
                </div>

                {/* Textarea */}
                <textarea
                    value={draft}
                    onChange={e => { setDraft(e.target.value); setDirty(true) }}
                    placeholder="اكتب نص التوجيه العام هنا..."
                    style={{
                        width: "100%", minHeight: 240, padding: "14px 16px",
                        borderRadius: 12, border: "1px solid",
                        borderColor: dirty ? "var(--t-accent)" : "var(--t-border)",
                        background: "var(--t-surface)", fontSize: 13, color: "var(--t-text)",
                        outline: "none", resize: "vertical", lineHeight: 1.8, fontFamily: "inherit",
                        transition: "border-color .2s, box-shadow .2s",
                        boxShadow: dirty ? "0 0 0 3px var(--t-accent-muted)" : "none",
                    }}
                />

                {/* Actions */}
                {dirty && (
                    <div style={{
                        marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8,
                        animation: "prFadeUp .15s ease-out",
                    }}>
                        <button onClick={() => { setDraft((prompts as any).general_prompt || ""); setDirty(false) }} style={{
                            padding: "9px 16px", borderRadius: 9, cursor: "pointer",
                            border: "1px solid var(--t-border)", background: "transparent",
                            color: "var(--t-text)", fontSize: 12, fontWeight: 600,
                            display: "inline-flex", alignItems: "center", gap: 5,
                            transition: "all .12s",
                        }}>
                            <RotateCcw size={12} /> إلغاء
                        </button>
                        <button
                            disabled={update.isPending}
                            onClick={() => update.mutate({ general_prompt: draft }, { onSuccess: () => setDirty(false) })}
                            style={{
                                padding: "9px 20px", borderRadius: 9, cursor: "pointer",
                                border: "none", background: "var(--t-accent)",
                                color: "var(--t-text-on-accent)", fontSize: 12, fontWeight: 600,
                                display: "inline-flex", alignItems: "center", gap: 5,
                                opacity: update.isPending ? 0.7 : 1, transition: "all .12s",
                            }}>
                            {update.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            حفظ التوجيه
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
