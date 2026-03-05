import { Providers } from "./providers"
import { AppRouter } from "./router"
import { usePermissionsSync } from "@/lib/usePermissionsSync"

/** مكوّن داخلي يعمل ضمن Providers لاستخدام React Query */
function AppInner() {
    // مزامنة الصلاحيات عبر React Query (بدون polling متكرر)
    usePermissionsSync()
    return <AppRouter />
}

export default function App() {
    return (
        <Providers>
            <AppInner />
        </Providers>
    )
}
