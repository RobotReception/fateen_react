import { useState } from "react"
import { Loader2, Bell, BarChart3, Database, Gauge, Shield, Timer, RefreshCw, AlertTriangle, WifiOff, Settings2 } from "lucide-react"
import { useFeaturesSettings, useUpdateFeaturesSettings } from "../hooks/use-ai-settings"

/* ── CSS ── */
const CSS = `
@keyframes ftFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes ftShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes ftSlide{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
`

/* ══════════════════════════════════════════════════════════════
   SKELETON
   ══════════════════════════════════════════════════════════════ */
function Skeleton() {
    const sk = (w: string, h = 14, r = 8) =>
        ({ width: w, height: h, borderRadius: r, background: "linear-gradient(110deg, var(--t-border) 30%, var(--t-border-light) 50%, var(--t-border) 70%)", backgroundSize: "200% 100%", animation: "ftShimmer 1.6s ease-in-out infinite" }) as React.CSSProperties
    return (
        <div style={{ animation: "ftFadeUp .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ borderRadius: 14, padding: 22, background: "var(--t-card)", border: "1px solid var(--t-border)", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={sk("42px", 42, 11)} /><div><div style={sk("150px", 15)} /><div style={{ ...sk("200px", 10), marginTop: 6 }} /></div>
                </div>
                {[0, 1, 2, 3].map(i => <div key={i} style={{ ...sk("100%", 56), marginBottom: 8 }} />)}
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   ERROR
   ══════════════════════════════════════════════════════════════ */
function ErrorPanel({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying: boolean }) {
    const ax = error as any
    const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
    const status = ax?.response?.status
    const msg = ax?.response?.data?.message || ax?.response?.data?.detail || ax?.message || ""
    return (
        <div style={{
            borderRadius: 14, border: "1px solid", textAlign: "center", padding: "32px 24px",
            borderColor: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
            background: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
            animation: "ftFadeUp .3s ease-out",
        }}>
            <style>{CSS}</style>
            <div style={{
                width: 52, height: 52, borderRadius: 14, margin: "0 auto 14",
                background: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {isNet ? <WifiOff size={22} style={{ color: "var(--t-warning)" }} /> : <AlertTriangle size={22} style={{ color: "var(--t-danger)" }} />}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)", marginBottom: 5 }}>{isNet ? "لا يمكن الاتصال بالخادم" : "خطأ في تحميل البيانات"}</div>
            <div style={{ fontSize: 12, color: "var(--t-text-faint)", marginBottom: 6, lineHeight: 1.6, maxWidth: 340, margin: "0 auto 6px" }}>{isNet ? "تحقق من اتصال الشبكة وأعد المحاولة" : msg || "تعذر جلب البيانات من الخادم"}</div>
            {status && <div style={{ fontSize: 10, color: "var(--t-text-faint)", fontFamily: "monospace", marginBottom: 14, opacity: 0.5 }}>HTTP {status}</div>}
            {!status && <div style={{ height: 12 }} />}
            <button onClick={onRetry} style={{
                padding: "9px 22px", borderRadius: 9, border: "none", cursor: "pointer",
                background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 12, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
                opacity: retrying ? 0.7 : 1, pointerEvents: retrying ? "none" : "auto",
            }}>
                {retrying ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {retrying ? "جاري إعادة المحاولة..." : "إعادة المحاولة"}
            </button>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   TOGGLE SWITCH
   ══════════════════════════════════════════════════════════════ */
function Toggle({ on, onToggle, size = "md" }: { on: boolean; onToggle: () => void; size?: "sm" | "md" }) {
    const w = size === "sm" ? 36 : 44
    const h = size === "sm" ? 20 : 24
    const d = size === "sm" ? 14 : 18
    const pad = 3
    return (
        <button onClick={onToggle} style={{
            width: w, height: h, borderRadius: h, border: "none", position: "relative", cursor: "pointer",
            background: on ? "var(--t-accent)" : "var(--t-border)",
            transition: "background .2s ease", flexShrink: 0,
        }}>
            <span style={{
                position: "absolute", top: pad, left: on ? w - d - pad : pad,
                width: d, height: d, borderRadius: "50%", background: on ? "var(--t-text-on-accent)" : "#fff",
                transition: "left .2s ease", boxShadow: "0 1px 3px rgba(0,0,0,.12)",
            }} />
        </button>
    )
}

/* ══════════════════════════════════════════════════════════════
   FEATURE ROW
   ══════════════════════════════════════════════════════════════ */
function FeatureRow({ icon: Icon, title, desc, on, onChange }: { icon: any; title: string; desc: string; on: boolean; onChange: () => void }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: 12,
            border: "1px solid var(--t-border)", background: "var(--t-card)",
            transition: "all .15s ease",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: on ? "var(--t-accent-muted)" : "var(--t-surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .15s",
                }}>
                    <Icon size={16} style={{ color: on ? "var(--t-accent)" : "var(--t-text-faint)" }} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>{title}</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 1 }}>{desc}</div>
                </div>
            </div>
            <Toggle on={on} onToggle={onChange} size="sm" />
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   NUMBER INPUT ROW
   ══════════════════════════════════════════════════════════════ */
function NumberRow({ icon: Icon, title, desc, value, onSave, min, max, step = 1 }: {
    icon: any; title: string; desc: string; value: number; onSave: (v: number) => void; min?: number; max?: number; step?: number
}) {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: 12,
            border: "1px solid var(--t-border)", background: "var(--t-card)",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "var(--t-surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Icon size={16} style={{ color: "var(--t-text-faint)" }} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>{title}</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 1 }}>{desc}</div>
                </div>
            </div>
            <input
                type="number" step={step} min={min} max={max}
                defaultValue={value}
                onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onSave(v) }}
                style={{
                    width: 100, padding: "7px 10px", borderRadius: 9, textAlign: "center",
                    border: "1px solid var(--t-border)", background: "var(--t-surface)",
                    fontSize: 13, fontWeight: 700, color: "var(--t-text)", outline: "none",
                    fontFamily: "monospace",
                }}
                dir="ltr"
            />
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   MAIN FEATURES TAB
   ══════════════════════════════════════════════════════════════ */
export function FeaturesTab({ agentId }: { agentId: string }) {
    const { data: features, isLoading, isError, error, refetch, isRefetching } = useFeaturesSettings(agentId)
    const updateF = useUpdateFeaturesSettings(agentId)

    if (isLoading) return <Skeleton />
    if (isError && !features) return <ErrorPanel error={error} onRetry={() => refetch()} retrying={isRefetching} />

    const hasData = features && Object.keys(features).length > 0

    return (
        <div style={{ animation: "ftFadeUp .3s ease-out" }}>
            <style>{CSS}</style>

            {/* Refetch bar */}
            {isRefetching && (
                <div style={{ height: 2, borderRadius: 1, marginBottom: 12, overflow: "hidden", background: "var(--t-border-light)" }}>
                    <div style={{ height: "100%", width: "40%", borderRadius: 1, background: "var(--t-accent)", animation: "ftSlide 1s ease-in-out infinite" }} />
                </div>
            )}

            {!hasData ? (
                <div style={{
                    borderRadius: 14, padding: "40px 24px", textAlign: "center",
                    border: "1px dashed var(--t-border)", color: "var(--t-text-faint)",
                }}>
                    <Settings2 size={28} style={{ margin: "0 auto 10px", display: "block" }} />
                    <div style={{ fontSize: 14, fontWeight: 700 }}>لا توجد إعدادات ميزات</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>ستظهر الميزات العامة عند تهيئتها من الخادم</div>
                </div>
            ) : (
                <>
                    {/* Hero */}
                    <div style={{
                        borderRadius: 14, padding: 22, marginBottom: 16,
                        background: "var(--t-card)", border: "1px solid var(--t-border)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 11,
                                background: "var(--t-accent)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Settings2 size={20} style={{ color: "var(--t-text-on-accent)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.01em" }}>الميزات العامة</div>
                                <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>تحكم في الميزات المنصة الأساسية</div>
                            </div>
                        </div>
                    </div>

                    {/* Toggle features */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                            <Bell size={15} style={{ color: "var(--t-text-muted)" }} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>التبديلات</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <FeatureRow icon={Bell} title="الإشعارات" desc="تفعيل نظام الإشعارات"
                                on={features!.enable_notifications} onChange={() => updateF.mutate({ enable_notifications: !features!.enable_notifications })} />
                            <FeatureRow icon={BarChart3} title="التحليلات" desc="تتبع وتحليل البيانات"
                                on={features!.enable_analytics} onChange={() => updateF.mutate({ enable_analytics: !features!.enable_analytics })} />
                            <FeatureRow icon={Database} title="التخزين المؤقت" desc="تفعيل ذاكرة التخزين المؤقت"
                                on={features!.enable_caching} onChange={() => updateF.mutate({ enable_caching: !features!.enable_caching })} />
                            <FeatureRow icon={Shield} title="تحديد المعدل" desc="تقييد عدد الطلبات في فترة زمنية"
                                on={features!.enable_rate_limiting} onChange={() => updateF.mutate({ enable_rate_limiting: !features!.enable_rate_limiting })} />
                        </div>
                    </div>

                    {/* Numeric settings */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                            <Gauge size={15} style={{ color: "var(--t-text-muted)" }} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>الإعدادات الرقمية</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <NumberRow icon={Timer} title="مهلة التخزين المؤقت" desc="مدة الاحتفاظ بالبيانات المؤقتة (ثوانٍ)"
                                value={features!.cache_ttl_seconds} onSave={v => updateF.mutate({ cache_ttl_seconds: v })} min={0} max={86400} />
                            <NumberRow icon={Gauge} title="حد الطلبات" desc="الحد الأقصى للطلبات في كل نافذة"
                                value={features!.rate_limit_requests} onSave={v => updateF.mutate({ rate_limit_requests: v })} min={1} max={100000} />
                            <NumberRow icon={Timer} title="نافذة تحديد المعدل" desc="مدة النافذة الزمنية (ثوانٍ)"
                                value={features!.rate_limit_window} onSave={v => updateF.mutate({ rate_limit_window: v })} min={1} max={3600} />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
