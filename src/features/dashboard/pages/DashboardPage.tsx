import { Users, FileText, BarChart3, Settings } from "lucide-react"

export function DashboardPage() {
    return (
        <div className="h-full overflow-y-auto p-4 lg:p-6 space-y-6" dir="rtl">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
                <p className="mt-1 text-sm text-gray-400">مرحباً بك في لوحة تحكم فطين</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "المستخدمين", icon: Users, value: "—", color: "bg-gray-900" },
                    { title: "المستندات", icon: FileText, value: "—", color: "bg-gray-700" },
                    { title: "التحليلات", icon: BarChart3, value: "—", color: "bg-gray-800" },
                    { title: "الإعدادات", icon: Settings, value: "—", color: "bg-gray-600" },
                ].map((card) => (
                    <div
                        key={card.title}
                        className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">{card.title}</p>
                                <p className="mt-1 text-3xl font-bold text-gray-800">{card.value}</p>
                            </div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color} text-white transition-transform group-hover:scale-110`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <BarChart3 size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600">لوحة التحكم قيد التطوير</h3>
                    <p className="mt-1 text-sm text-gray-400">سيتم إضافة الإحصائيات والرسوم البيانية قريباً</p>
                </div>
            </div>
        </div>
    )
}
