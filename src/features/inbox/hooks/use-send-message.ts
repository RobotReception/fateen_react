import { useQueryClient, useMutation } from "@tanstack/react-query"
import { sendMessage } from "../services/inbox-service"
import { useConversationStore } from "../store/conversation.store"
import type { SendMessagePayload, Message, MessagesResponse } from "../types/inbox.types"
import { toast } from "sonner"

/**
 * Optimistic send-message hook:
 * 1) onMutate  → injects a "pending" message into the store (renders instantly)
 * 2) onSuccess → injects the optimistic message into the react-query cache
 *                so it stays visible, THEN removes the pending marker,
 *                THEN silently refetches for server sync
 * 3) onError   → removes pending + shows toast
 */
export function useSendMessage(customerId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: SendMessagePayload) => sendMessage(payload),

        // ── Before sending: inject an optimistic (pending) message ──
        onMutate: async (payload) => {
            const tempId = `_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

            const optimisticMsg: Message = {
                id: tempId,
                _key: tempId,
                customer_id: customerId,
                platform: payload.platform,
                sender_id: payload.sender_id,
                sender_type: "agent",
                sender_info: payload.sender_info,
                direction: "outbound",
                message_type: payload.message_type,
                content: payload.content as any,
                timestamp: new Date().toISOString(),
                status: "sent",
                is_internal: false,
            }

            const { addPendingMessage } = useConversationStore.getState()
            addPendingMessage(optimisticMsg)
            return { tempId, optimisticMsg }
        },

        // ── On success: inject into cache → remove pending → background refetch ──
        onSuccess: (_data, _payload, context) => {
            if (!context) return

            const { tempId, optimisticMsg } = context
            const queryKey = ["customer-messages", customerId]

            // 1. Inject the optimistic message into the query cache so it
            //    stays visible even after removing from pending store
            queryClient.setQueryData<{ pages: MessagesResponse[]; pageParams: unknown[] }>(
                queryKey,
                (old) => {
                    if (!old || !old.pages.length) return old
                    const newPages = [...old.pages]
                    const firstPage = { ...newPages[0] }
                    // Append to the end of the first page (newest messages page)
                    firstPage.messages = [...(firstPage.messages ?? []), optimisticMsg]
                    newPages[0] = firstPage
                    return { ...old, pages: newPages }
                }
            )

            // 2. Now safe to remove from pending (it's in the cache now)
            const { removePendingMessage } = useConversationStore.getState()
            removePendingMessage(tempId)

            // 3. Background refetch to sync with real server data
            //    (will replace our optimistic entry with the real one)
            queryClient.invalidateQueries({ queryKey })
            queryClient.invalidateQueries({ queryKey: ["inbox-customers"] })
        },

        // ── On error: remove pending, show toast ──
        onError: (_err, _payload, context) => {
            if (context?.tempId) {
                const { removePendingMessage } = useConversationStore.getState()
                removePendingMessage(context.tempId)
            }
            toast.error("فشل إرسال الرسالة، حاول مرة أخرى")
        },
    })
}
