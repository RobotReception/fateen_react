import { Shield, RefreshCw, Loader2 } from "lucide-react"
import type { Role } from "../types"
import { CreateRoleForm } from "./CreateRoleForm"

interface Props {
    roles: Role[] | undefined
    isLoading: boolean
    isError: boolean
    refetch: () => void
    activeRole: string | null
    onSelect: (role: string) => void
}

export function RolesList({ roles, isLoading, isError, refetch, activeRole, onSelect }: Props) {
    return (
        <div className="w-[250px] shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            {/* header */}
            <div className="px-4 py-3.5 border-b border-gray-100">
                <h3 className="text-[14px] font-bold text-gray-900">الأدوار</h3>
                <p className="text-[12px] text-gray-500 mt-0.5 font-medium">{roles?.length || 0} دور</p>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 size={18} className="animate-spin text-gray-400" />
                    </div>
                )}

                {isError && (
                    <div className="flex flex-col items-center py-10 gap-2">
                        <p className="text-[13px] text-gray-500 font-medium">فشل التحميل</p>
                        <button onClick={refetch}
                            className="flex items-center gap-1.5 text-[12px] text-gray-700 font-medium hover:text-gray-900 transition-colors">
                            <RefreshCw size={11} /> إعادة
                        </button>
                    </div>
                )}

                {roles?.map(r => {
                    const on = activeRole === r.role
                    return (
                        <button key={r.role} onClick={() => onSelect(r.role)}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-3 text-right transition-all
                                       ${on
                                    ? "bg-gray-900 text-white shadow-sm"
                                    : "text-gray-700 hover:bg-gray-100"}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${on ? "bg-white/15" : "bg-gray-100"}`}>
                                <Shield size={14} strokeWidth={2} className={on ? "text-white" : "text-gray-500"} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-[13px] truncate ${on ? "font-bold" : "font-semibold"}`}>
                                    {r.name_ar}
                                </p>
                                <p className={`text-[11px] truncate font-mono ${on ? "text-gray-300" : "text-gray-400"}`} dir="ltr">
                                    {r.role}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* create form */}
            <CreateRoleForm onCreated={onSelect} />
        </div>
    )
}
