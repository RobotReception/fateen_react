import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type AssignedType = {
  assigned_to: string | null
  assigned_to_username: string | null
  is_assigned: boolean
  updated_at: string
}
export type ChatType = {
  _id: string
  assigned: AssignedType
  conversation_opened_at: string
  // ISO timestamp
  conversation_status: {
    close_category: string
    close_reason: string
    closed_at: string
    is_closed: boolean
  }
  conversation_summary: string
  created_at: string
  // ISO timestamp
  custom_fields: string
  customer_id: string
  enable_ai: boolean
  favorite: boolean
  isRead: boolean
  language: string
  last_direction: string
  last_message: string
  last_message_type: string
  last_profile_update: string
  // ISO timestamp
  last_sender_id: string
  last_timestamp: string
  // ISO timestamp
  lifecycle: string
  muted: boolean
  platform: string
  platform_icon: string
  profile_photo: string
  sender_name: string
  // ISO timestamp
  sender_type: string
  session_id: string
  session_status: 'pending' | 'closed'
  status_history: any[]
  // You can replace `any` with a defined structure if needed
  tags: string[]
  team_id: string[]
  unread_count: number
  updated_at: string
}
type ChatStoreType = {
  actions: {
    setActiveChat: (chat: ChatType) => void

    setActiveInboxFilter: (filter: object) => void
    setSidebarCollapsed: (collapsed: boolean) => void
  }
  activeChat: ChatType | null
  activeInboxFilter: object

  sidebarCollapsed: boolean
}

export const ChatStore = create<ChatStoreType>()(
  persist(
    (set) => ({
      actions: {
        setActiveChat: (chat) => {
          set({ activeChat: chat })

          // router.navigate(`/chat/${chat?.customer_id}`)
        },
        setActiveInboxFilter: (filter) =>
          set(() => ({ activeInboxFilter: filter })),
        setSidebarCollapsed: (collapsed) =>
          set(() => ({ sidebarCollapsed: collapsed })),
      },
      activeChat: null,
      activeInboxFilter: {},
      sidebarCollapsed: false,
    }),
    {
      name: 'chat-storage',

      // Use sessionStorage for persistence
      partialize: (state) => ({
        activeChat: state.activeChat,
      }),
      // Unique name for the storage key
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

export const { setActiveInboxFilter, setSidebarCollapsed, setActiveChat } =
  ChatStore.getState().actions
