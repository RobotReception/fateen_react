import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    listChannels, createChannel, updateChannel,
    deleteChannel, togglePlatform, toggleChannel,
    getChannelFlags, updateChannelFlags,
    getDataFlags, getPlatformsStatus,
} from "../services/channels-service"
import type {
    Platform, CreateChannelPayload, UpdateChannelPayload,
    TogglePayload, UpdateFlagsPayload, Channel,
} from "../types"
import { PLATFORMS } from "../types"


// ── Query keys ──
export const channelKeys = {
    all: (tid: string) => ["channels", tid] as const,
    platform: (tid: string, p: Platform) => ["channels", tid, p] as const,
    flags: (tid: string, p: Platform, id: string) => ["channels", tid, p, id, "flags"] as const,
}

// ── List channels for one platform ──
export function useChannelsByPlatform(tenantId: string, platform: Platform) {
    return useQuery({
        queryKey: channelKeys.platform(tenantId, platform),
        queryFn: () => listChannels(platform, tenantId),
        enabled: !!tenantId,
    })
}

// ── List ALL channels across all platforms ──
export function useAllChannels(tenantId: string) {
    return useQuery({
        queryKey: channelKeys.all(tenantId),
        queryFn: async () => {
            const results = await Promise.allSettled(PLATFORMS.map(p => listChannels(p, tenantId)))
            const channels: Channel[] = []
            for (const r of results) {
                if (r.status === "fulfilled" && r.value.success && r.value.data?.items)
                    channels.push(...r.value.data.items)
            }
            return channels
        },
        enabled: !!tenantId,
    })
}

// ── Channel flags ──
export function useChannelFlags(tenantId: string, platform: Platform, identifier: string, enabled = true) {
    return useQuery({
        queryKey: channelKeys.flags(tenantId, platform, identifier),
        queryFn: () => getChannelFlags(platform, identifier, tenantId),
        enabled: !!tenantId && !!identifier && enabled,
    })
}

// ── Create ──
export function useCreateChannel(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ platform, payload }: { platform: Platform; payload: CreateChannelPayload }) =>
            createChannel(platform, payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم إنشاء القناة بنجاح")
                qc.invalidateQueries({ queryKey: channelKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل إنشاء القناة")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء القناة"),
    })
}

// ── Update ──
export function useUpdateChannel(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ platform, identifier, payload }: { platform: Platform; identifier: string; payload: UpdateChannelPayload }) =>
            updateChannel(platform, identifier, payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم تحديث القناة بنجاح")
                qc.invalidateQueries({ queryKey: channelKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل تحديث القناة")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث القناة"),
    })
}

// ── Delete ──
export function useDeleteChannel(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ platform, identifier }: { platform: Platform; identifier: string }) =>
            deleteChannel(platform, identifier, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم حذف القناة بنجاح")
                qc.invalidateQueries({ queryKey: channelKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل حذف القناة")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء حذف القناة"),
    })
}

// ── Toggle entire platform ──
export function useTogglePlatform(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ platform, payload }: { platform: Platform; payload: TogglePayload }) =>
            togglePlatform(platform, payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "تم تحديث المنصة")
                qc.invalidateQueries({ queryKey: channelKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل تحديث المنصة")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث المنصة"),
    })
}

// ── Toggle single channel ──
export function useToggleChannel(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ platform, identifier, payload }: { platform: Platform; identifier: string; payload: TogglePayload }) =>
            toggleChannel(platform, identifier, payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.data.enabled ? "تم تفعيل القناة" : "تم إيقاف القناة")
                qc.invalidateQueries({ queryKey: channelKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل تحديث القناة")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث القناة"),
    })
}

// ── Update flags ──
export function useUpdateChannelFlags(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ platform, identifier, payload }: { platform: Platform; identifier: string; payload: UpdateFlagsPayload }) =>
            updateChannelFlags(platform, identifier, payload, tenantId),
        onSuccess: (res, vars) => {
            if (res.success) {
                toast.success("تم تحديث الـ flags بنجاح")
                qc.invalidateQueries({ queryKey: channelKeys.flags(tenantId, vars.platform, vars.identifier) })
            } else {
                toast.error(res.message || "فشل تحديث الـ flags")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث الـ flags"),
    })
}

// ── 🔟  Flags by any identifier (GET /data/flags) ──
export function useDataFlags(tenantId: string, id: string, flagType?: string, enabled = true) {
    return useQuery({
        queryKey: ["data-flags", tenantId, id, flagType],
        queryFn: () => getDataFlags(id, tenantId, flagType),
        enabled: !!tenantId && !!id && enabled,
    })
}

// ── 1️⃣1️⃣  All platforms status (GET /data/flags/platforms) ──
export function usePlatformsStatus(tenantId: string) {
    return useQuery({
        queryKey: ["platforms-status", tenantId],
        queryFn: () => getPlatformsStatus(tenantId),
        enabled: !!tenantId,
        staleTime: 30_000,
    })
}
