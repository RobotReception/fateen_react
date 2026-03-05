import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    updateContact,
    updateContactCustomFields,
    deleteContact,
    convertContact,
    createContact,
} from "../services/contacts-service"
import { invalidateCustomerCaches } from "@/lib/query-keys"
import type { Contact, UpdateContactPayload } from "../types/contacts.types"

/* ═══════════════════════════════════════════════════════════ */
/*   Contact Mutation Hooks (with optimistic UI & cross-sync) */
/* ═══════════════════════════════════════════════════════════ */

// ─── Update Contact ─────────────────────────────────────────
export function useUpdateContact(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: UpdateContactPayload) =>
            updateContact(customerId, payload, accountId),

        onMutate: async (payload) => {
            await qc.cancelQueries({ queryKey: ["contact-detail", customerId] })
            const prev = qc.getQueryData<Contact>(["contact-detail", customerId, accountId])
            if (prev) {
                qc.setQueryData(["contact-detail", customerId, accountId], {
                    ...prev,
                    ...payload,
                })
            }
            return { prev }
        },
        onSuccess: () => toast.success("تم تحديث جهة الاتصال"),
        onError: (_e, _v, ctx) => {
            if (ctx?.prev) {
                qc.setQueryData(["contact-detail", customerId, accountId], ctx.prev)
            }
            toast.error("فشل تحديث جهة الاتصال")
        },
        onSettled: () => invalidateCustomerCaches(qc, customerId),
    })
}

// ─── Update Custom Fields ───────────────────────────────────
export function useUpdateContactCustomFields(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (customFields: Record<string, string>) =>
            updateContactCustomFields(customerId, customFields, accountId),

        onMutate: async (customFields) => {
            await qc.cancelQueries({ queryKey: ["contact-detail", customerId] })
            const prev = qc.getQueryData<Contact>(["contact-detail", customerId, accountId])
            if (prev) {
                qc.setQueryData(["contact-detail", customerId, accountId], {
                    ...prev,
                    custom_fields: { ...prev.custom_fields, ...customFields },
                })
            }
            return { prev }
        },
        onSuccess: () => toast.success("تم تحديث الحقول بنجاح"),
        onError: (_e, _v, ctx) => {
            if (ctx?.prev) {
                qc.setQueryData(["contact-detail", customerId, accountId], ctx.prev)
            }
            toast.error("فشل تحديث الحقول")
        },
        onSettled: () => invalidateCustomerCaches(qc, customerId),
    })
}

// ─── Delete Contact ─────────────────────────────────────────
export function useDeleteContact(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => deleteContact(customerId, accountId),
        onSuccess: () => toast.success("تم حذف جهة الاتصال"),
        onError: () => toast.error("فشل حذف جهة الاتصال"),
        onSettled: () => invalidateCustomerCaches(qc, customerId),
    })
}

// ─── Convert Contact ────────────────────────────────────────
export function useConvertContact(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (isContact: boolean) =>
            convertContact(customerId, isContact, accountId),
        onSuccess: (_d, isContact) =>
            toast.success(isContact ? "تم التحويل إلى جهة اتصال" : "تم إلغاء التحويل"),
        onError: () => toast.error("فشل عملية التحويل"),
        onSettled: () => invalidateCustomerCaches(qc, customerId),
    })
}

// ─── Create Contact ─────────────────────────────────────────
export function useCreateContact() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: {
            customer_id: string
            additional_fields?: Record<string, string>
            notes?: string
            accountId?: string
            username?: string
        }) => {
            const { accountId, username, ...rest } = payload
            return createContact(rest, { accountId, username })
        },
        onSuccess: () => toast.success("تم إنشاء جهة الاتصال"),
        onError: () => toast.error("فشل إنشاء جهة الاتصال"),
        onSettled: (_d, _e, vars) => invalidateCustomerCaches(qc, vars.customer_id),
    })
}
