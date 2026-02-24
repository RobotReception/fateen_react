import { apiClient } from "@/lib/api-client"
import type {
    Platform,
    CreateChannelPayload,
    UpdateChannelPayload,
    TogglePayload,
    UpdateFlagsPayload,
    ChannelListResponse,
    ChannelDetailResponse,
    ChannelDeleteResponse,
    ChannelFlagsResponse,
    PlatformToggleResponse,
    ChannelToggleResponse,
    DataFlagsResponse,
    PlatformsStatusResponse,
} from "../types"

const BASE = "/channels"
const DATA_BASE = "/data"
const h = (tid: string) => ({ "X-Tenant-ID": tid })

// ── 2️⃣  GET /channels/{platform} ── list channels
export const listChannels = async (platform: Platform, tid: string): Promise<ChannelListResponse> => {
    const { data } = await apiClient.get<ChannelListResponse>(`${BASE}/${platform}`, { headers: h(tid) })
    return data
}

// ── 3️⃣  GET /channels/{platform}/{identifier} ── single channel
export const getChannel = async (platform: Platform, identifier: string, tid: string): Promise<ChannelDetailResponse> => {
    const { data } = await apiClient.get<ChannelDetailResponse>(`${BASE}/${platform}/${encodeURIComponent(identifier)}`, { headers: h(tid) })
    return data
}

// ── 1️⃣  POST /channels/{platform}/add ── create
export const createChannel = async (platform: Platform, payload: CreateChannelPayload, tid: string): Promise<ChannelDetailResponse> => {
    const { data } = await apiClient.post<ChannelDetailResponse>(`${BASE}/${platform}/add`, payload, { headers: h(tid) })
    return data
}

// ── 4️⃣  PATCH /channels/{platform}/{identifier} ── partial update
export const updateChannel = async (platform: Platform, identifier: string, payload: UpdateChannelPayload, tid: string): Promise<ChannelDetailResponse> => {
    const { data } = await apiClient.patch<ChannelDetailResponse>(`${BASE}/${platform}/${encodeURIComponent(identifier)}`, payload, { headers: h(tid) })
    return data
}

// ── 5️⃣  DELETE /channels/{platform}/{identifier} ── delete
export const deleteChannel = async (platform: Platform, identifier: string, tid: string): Promise<ChannelDeleteResponse> => {
    const { data } = await apiClient.delete<ChannelDeleteResponse>(`${BASE}/${platform}/${encodeURIComponent(identifier)}`, { headers: h(tid) })
    return data
}

// ── 6️⃣  PATCH /channels/{platform}/toggle ── toggle entire platform
export const togglePlatform = async (platform: Platform, payload: TogglePayload, tid: string): Promise<PlatformToggleResponse> => {
    const { data } = await apiClient.patch<PlatformToggleResponse>(`${BASE}/${platform}/toggle`, payload, { headers: h(tid) })
    return data
}

// ── 7️⃣  PATCH /channels/{platform}/{identifier}/toggle ── toggle single channel
export const toggleChannel = async (platform: Platform, identifier: string, payload: TogglePayload, tid: string): Promise<ChannelToggleResponse> => {
    const { data } = await apiClient.patch<ChannelToggleResponse>(`${BASE}/${platform}/${encodeURIComponent(identifier)}/toggle`, payload, { headers: h(tid) })
    return data
}

// ── 8️⃣  GET /channels/{platform}/{identifier}/flags ── fetch flags
export const getChannelFlags = async (platform: Platform, identifier: string, tid: string): Promise<ChannelFlagsResponse> => {
    const { data } = await apiClient.get<ChannelFlagsResponse>(`${BASE}/${platform}/${encodeURIComponent(identifier)}/flags`, { headers: h(tid) })
    return data
}

// ── 9️⃣  PATCH /channels/{platform}/{identifier}/flags ── update flags
export const updateChannelFlags = async (platform: Platform, identifier: string, payload: UpdateFlagsPayload, tid: string): Promise<ChannelFlagsResponse> => {
    const { data } = await apiClient.patch<ChannelFlagsResponse>(`${BASE}/${platform}/${encodeURIComponent(identifier)}/flags`, payload, { headers: h(tid) })
    return data
}

// ── 🔟  GET /data/flags?id={id} ── flags by any identifier
export const getDataFlags = async (id: string, tid: string, flagType?: string): Promise<DataFlagsResponse> => {
    const params: Record<string, string> = { id }
    if (flagType) params.flag_type = flagType
    const { data } = await apiClient.get<DataFlagsResponse>(`${DATA_BASE}/flags`, { headers: h(tid), params })
    return data
}

// ── 1️⃣1️⃣  GET /data/flags/platforms ── status of all platforms
export const getPlatformsStatus = async (tid: string): Promise<PlatformsStatusResponse> => {
    const { data } = await apiClient.get<PlatformsStatusResponse>(`${DATA_BASE}/flags/platforms`, { headers: h(tid) })
    return data
}
