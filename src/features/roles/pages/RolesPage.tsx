import { useState, useCallback, useMemo, useEffect } from "react"
import { Shield, AlertCircle, RefreshCw } from "lucide-react"
import { useRoles } from "../hooks/use-roles"
import { RolesList } from "../components/RolesList"
import { RoleDetail } from "../components/RoleDetail"
import { FetchingBar } from "@/components/ui/FetchingBar"

export function RolesPage({ embedded = false }: { embedded?: boolean }) {
    const { data: roles, isLoading, isFetching, isError, refetch } = useRoles()
    const [activeRole, setActiveRole] = useState<string | null>(null)

    const bg = isFetching && !isLoading

    /* resolve the active role object */
    const selectedRole = useMemo(
        () => roles?.find(r => r.role === activeRole) || null,
        [roles, activeRole]
    )

    /* auto-select first role when list loads */
    const handleSelect = useCallback((role: string) => setActiveRole(role), [])

    /* when roles load and no selection, select first */
    useEffect(() => {
        if (roles && roles.length > 0 && !activeRole) {
            setActiveRole(roles[0].role)
        }
    }, [roles, activeRole])

    return (
        <div className={embedded ? "max-w-[1200px] mx-auto" : "p-6 sm:p-8 lg:p-10 max-w-[1200px] mx-auto"}>
            <FetchingBar visible={bg} />

            {/* Header */}
            {!embedded && (
                <header className="mb-7">
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-1.5">
                        <span>لوحة التحكم</span>
                        <span className="text-gray-300">←</span>
                        <span className="text-gray-600">الأدوار والصلاحيات</span>
                    </div>
                    <h1 className="text-[22px] font-bold text-gray-800 tracking-[-0.02em]">
                        الأدوار والصلاحيات
                    </h1>
                    <p className="text-[13px] text-gray-400 mt-1">
                        إنشاء الأدوار وإدارة الصلاحيات وتعيين المستخدمين
                    </p>
                </header>
            )}

            {/* Error state */}
            {isError && !roles && (
                <div className="rounded-lg border border-gray-100 bg-white flex flex-col items-center justify-center py-20">
                    <AlertCircle size={18} className="text-gray-300" />
                    <p className="mt-2 text-[13px] text-gray-400">فشل تحميل الأدوار</p>
                    <button onClick={() => refetch()}
                        className="mt-3 rounded-lg border border-gray-200 px-4 py-1.5 text-[13px] text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                        <RefreshCw size={12} /> إعادة المحاولة
                    </button>
                </div>
            )}

            {/* Main layout */}
            {(!isError || roles) && (
                <div className="flex gap-3 items-start">
                    {/* Left sidebar — roles list */}
                    <RolesList
                        roles={roles}
                        isLoading={isLoading}
                        isError={isError}
                        refetch={refetch}
                        activeRole={activeRole}
                        onSelect={handleSelect}
                    />

                    {/* Right panel — role detail */}
                    {selectedRole ? (
                        <RoleDetail
                            key={selectedRole.role}
                            role={selectedRole}
                        />
                    ) : !isLoading && (
                        <div className="flex-1 rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center py-20">
                            <Shield size={28} className="text-gray-300" />
                            <p className="mt-3 text-[14px] font-medium text-gray-600">اختر دوراً من القائمة</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
