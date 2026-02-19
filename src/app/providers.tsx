import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "sonner"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,      // 5 min — data considered fresh
            gcTime: 30 * 60 * 1000,         // 30 min — keep inactive cache in memory
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            structuralSharing: true,         // skip re-renders when data is identical
        },
        mutations: {
            retry: 0,
        },
    },
})

interface ProvidersProps {
    children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {children}
                <Toaster
                    position="top-left"
                    dir="rtl"
                    richColors
                    closeButton
                    toastOptions={{
                        duration: 4000,
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    )
}
