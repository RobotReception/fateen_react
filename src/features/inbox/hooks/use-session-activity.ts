import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { getSessionActivity } from "../services/inbox-service"
import type { SessionActivityResponse } from "../services/inbox-service"

export function useSessionActivity(sessionId: string | undefined) {
    return useQuery<SessionActivityResponse>({
        queryKey: queryKeys.sessionActivity(sessionId ?? ""),
        queryFn: () => getSessionActivity(sessionId!),
        enabled: Boolean(sessionId),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    })
}
