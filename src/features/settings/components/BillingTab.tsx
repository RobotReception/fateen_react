import { useMemo } from "react"
import {
    AlertCircle, RefreshCw,
    Calendar, CreditCard, BarChart3,
} from "lucide-react"
import { useOrganization } from "../hooks/use-settings"
import { useAuthStore } from "@/stores/auth-store"
import { FetchingBar } from "@/components/ui/FetchingBar"
import type { LimitItem } from "../types"

/* ─── helpers ─── */
function fmtDate(d: string | null | undefined): string {
    if (!d) return "—"
    try { return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Aden" }).format(new Date(d)) }
    catch { return d }
}

/* ─── usage bar ─── */
function UsageItem({ label, limit }: { label: string; limit: LimitItem | undefined }) {
    if (!limit) return null
    const max = limit.max_count ?? limit.max_per_month ?? limit.max_size_gb ?? limit.max_requests_per_day ?? 0
    const cur = limit.current_count ?? limit.current_month_count ?? limit.current_size_gb ?? limit.current_requests_today ?? 0
    const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0
    const unit = limit.max_size_gb !== undefined ? " GB" : ""
    const isHigh = pct > 85
    const isMedium = pct > 60

    return (
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-semibold text-gray-800">{label}</span>
                <span className="text-[13px] font-bold text-gray-900 tabular-nums" dir="ltr">
                    {cur}{unit} <span className="text-gray-400 font-medium">/ {max}{unit}</span>
                </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: isHigh ? "var(--t-accent)" : isMedium ? "var(--t-text-secondary)" : "var(--t-text-muted)",
                    }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
                <span className={`text-[11px] font-bold ${isHigh ? "text-gray-900" : "text-gray-500"}`}>
                    {pct.toFixed(0)}% مستخدم
                </span>
                {isHigh && (
                    <span className="text-[11px] font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded-full">
                        يقترب من الحد
                    </span>
                )}
            </div>
        </div>
    )
}

/* ─── data row ─── */
function DataRow({ label, value }: { label: string; value?: string | null }) {
    const empty = !value
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <span className="text-[13px] font-medium text-gray-500">{label}</span>
            <span className={`text-[13px] font-semibold ${empty ? "text-gray-300" : "text-gray-900"}`}>
                {value || "—"}
            </span>
        </div>
    )
}

/* ─── card wrapper ─── */
function Card({ title, icon: Icon, children }: {
    title: string; icon: typeof CreditCard; children: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                    <Icon size={15} className="text-white" />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    )
}

/* ─── skeleton ─── */
function Skeleton() {
    return (
        <div className="animate-pulse space-y-5">
            {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-7">
                    <div className="h-5 w-32 rounded-lg bg-gray-100 mb-6" />
                    <div className="grid grid-cols-2 gap-6">
                        {[1, 2].map(j => (
                            <div key={j} className="p-4 rounded-xl bg-gray-50">
                                <div className="h-4 w-20 rounded bg-gray-100 mb-3" />
                                <div className="h-2 w-full rounded-full bg-gray-100" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

/* ═══════════════════════════════════════════════
   MAIN — Billing & Usage Tab
   ═══════════════════════════════════════════════ */
export function BillingTab() {
    const user = useAuthStore(s => s.user)
    const tenantId = user?.tenant_id || ""
    const { data: org, isLoading, isFetching, isError, refetch } = useOrganization(tenantId)

    const bg = isFetching && !isLoading

    const trialDays = useMemo(() => {
        if (!org?.trial_ends_at) return null
        const d = new Date(org.trial_ends_at).getTime() - Date.now()
        return d > 0 ? Math.ceil(d / 86_400_000) : 0
    }, [org?.trial_ends_at])

    if (isLoading) return <Skeleton />

    if (isError || !org) return (
        <div className="rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center py-20">
            <AlertCircle size={20} className="text-gray-400" />
            <p className="mt-3 text-[14px] font-medium text-gray-600">فشل تحميل بيانات الاشتراك</p>
            <button onClick={() => refetch()}
                className="mt-4 rounded-lg border border-gray-200 px-5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <RefreshCw size={13} /> إعادة المحاولة
            </button>
        </div>
    )

    const limits = org.plan_snapshot?.limits || org.effective_limits

    return (
        <div className="space-y-5">
            <FetchingBar visible={bg} />

            {/* ── Trial Notice ── */}
            {trialDays !== null && (
                <div className={`rounded-xl px-5 py-4 flex items-center gap-3 text-[14px] font-medium border ${trialDays > 0
                    ? "bg-white border-gray-200 text-gray-800"
                    : "bg-gray-900 border-gray-900 text-white"
                    }`}>
                    <Calendar size={16} className={trialDays > 0 ? "text-gray-500" : "text-gray-400"} />
                    <span>
                        الفترة التجريبية: <strong className="font-bold">{trialDays > 0 ? `${trialDays} يوم متبقي` : "انتهت"}</strong>
                        {org.trial_ends_at && <span className={trialDays > 0 ? "text-gray-500" : "text-gray-400"}> — حتى {fmtDate(org.trial_ends_at)}</span>}
                    </span>
                </div>
            )}

            {/* ── Subscription ── */}
            <Card title="تفاصيل الاشتراك" icon={CreditCard}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
                    <div>
                        {/* Plan row — special styling */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-[13px] font-medium text-gray-500">الخطة</span>
                            <div className="flex items-center gap-2.5">
                                <span className="text-[14px] font-bold text-gray-900">{org.plan_snapshot?.plan_name || org.plan || "—"}</span>
                                <span className="text-[11px] font-bold text-white bg-gray-900 rounded-full px-2.5 py-0.5 uppercase">{org.status}</span>
                            </div>
                        </div>
                        <DataRow label="بداية التجربة" value={fmtDate(org.trial_started_at)} />
                        <DataRow label="نهاية التجربة" value={fmtDate(org.trial_ends_at)} />
                    </div>
                    <div>
                        <DataRow label="تاريخ الإنشاء" value={fmtDate(org.created_at)} />
                        <DataRow label="آخر تحديث" value={fmtDate(org.updated_at)} />
                    </div>
                </div>
            </Card>

            {/* ── Usage & Limits ── */}
            {limits && (
                <Card title="الاستخدام والحدود" icon={BarChart3}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <UsageItem label="المستخدمون" limit={limits.users} />
                        <UsageItem label="جهات الاتصال" limit={limits.contacts} />
                        <UsageItem label="الرسائل" limit={limits.messages} />
                        <UsageItem label="التخزين" limit={limits.storage} />
                        <UsageItem label="طلبات API" limit={limits.api} />
                    </div>
                </Card>
            )}
        </div>
    )
}
