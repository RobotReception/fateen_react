import { useQueryClient, useMutation } from "@tanstack/react-query"
import { sendMessage } from "../services/inbox-service"
import type { SendMessagePayload } from "../types/inbox.types"
import { toast } from "sonner"

export function useSendMessage(customerId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: SendMessagePayload) => sendMessage(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer-messages", customerId] })
            queryClient.invalidateQueries({ queryKey: ["inbox-customers"] })
        },
        onError: () => {
            toast.error("فشل إرسال الرسالة، حاول مرة أخرى")
        },
    })
}
