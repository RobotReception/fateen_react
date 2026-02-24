import {
  type Campaign,
  type Chat,
  type InboxFilter,
  type InboxStats,
  type Industry,
  type Message,
  type TeamInbox,
  type TypingIndicator,
  type User,
} from './types'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// type ChatState = {
//   activeChat: string | null

//   activeInboxFilter: InboxFilter
//   addMessage: (message: Message) => void
//   addTagToChat: (chatId: string, tag: string) => void
//   assignChat: (chatId: string, userId: string, assignedBy: string) => void
//   campaigns: Campaign[]
//   // Data
//   chats: Chat[]
//   currentUser: User | null
//   getFilteredChats: () => Chat[]

//   getInboxStats: () => InboxStats
//   industries: Industry[]
//   initializeData: () => void
//   selectedTeamInbox: string | null
//   sidebarCollapsed: boolean

//   setSidebarCollapsed: (collapsed: boolean) => void
//   setActiveChat: (chatId: string) => void
//   users: Record<string, User>
//   markMessagesAsRead: (chatId: string) => void
//   setTyping: (chatId: string, userId: string, userName: string) => void
//   removeTyping: (chatId: string, userId: string) => void
//   setActiveInboxFilter: (filter: InboxFilter) => void
//   setSearchQuery: (query: string) => void
//   setSelectedTeamInbox: (teamId: string | null) => void
//   // Actions
//   setCurrentUser: (user: User) => void
//   updateChatStatus: (chatId: string, status: Chat['status']) => void
//   teamInboxes: TeamInbox[]
//   typingIndicators: TypingIndicator[]
//   removeTagFromChat: (chatId: string, tag: string) => void
//   setChatPriority: (chatId: string, priority: Chat['priority']) => void
//   setChatLifecycle: (chatId: string, lifecycle: Chat['lifecycle']) => void
//   // UI State
//   searchQuery: string
//   isLoading: boolean
//   messages: Record<string, Message[]>
// }

// const useChat = create<ChatState>(
//   persist(
//     (set, get) => ({
//       activeChat: null,
//       customerInfo: null,

//       campaigns: [],
//       // Initial state
//       chats: [],
//       activeInboxFilter: 'all',
//       currentUser: null,
//       industries: [],
//       isLoading: false,
//       addMessage: (message) =>
//         set((state) => {
//           const chatMessages = state.messages[message.chatId] || []
//           const updatedMessages = {
//             ...state.messages,
//             [message.chatId]: [...chatMessages, message].sort(
//               (a, b) =>
//                 new Date(a.timestamp).getTime() -
//                 new Date(b.timestamp).getTime()
//             ),
//           }

//           const updatedChats = state.chats
//             .map((chat) =>
//               chat.id === message.chatId
//                 ? {
//                     ...chat,
//                     lastMessage: message,
//                     unreadCount:
//                       chat.id === state.activeChat ? 0 : chat.unreadCount + 1,
//                     status: chat.status === 'resolved' ? 'open' : chat.status,
//                     updatedAt: message.timestamp,
//                   }
//                 : chat
//             )
//             .sort(
//               (a, b) =>
//                 new Date(b.updatedAt).getTime() -
//                 new Date(a.updatedAt).getTime()
//             )

//           return {
//             chats: updatedChats,
//             messages: updatedMessages,
//           }
//         }),
//       messages: {},
//       markMessagesAsRead: (chatId) =>
//         set((state) => {
//           const updatedMessages = {
//             ...state.messages,
//             [chatId]: (state.messages[chatId] || []).map((msg) => ({
//               ...msg,
//               isRead: true,
//             })),
//           }

//           const updatedChats = state.chats.map((chat) =>
//             chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
//           )

//           return {
//             chats: updatedChats,
//             messages: updatedMessages,
//           }
//         }),
//       teamInboxes: [],
//       removeTyping: (chatId, userId) =>
//         set((state) => ({
//           typingIndicators: state.typingIndicators.filter(
//             (t) => !(t.chatId === chatId && t.userId === userId)
//           ),
//         })),
//       users: {},

//       searchQuery: '',

//       selectedTeamInbox: null,

//       typingIndicators: [],

//       assignChat: (chatId, userId, assignedBy) =>
//         set((state) => ({
//           chats: state.chats.map((chat) =>
//             chat.id === chatId
//               ? { ...chat, assignedBy, assignedTo: userId }
//               : chat
//           ),
//         })),

//       setActiveChat: (chatId) => {
//         set({ activeChat: chatId.customer_id })

//         get().markMessagesAsRead(chatId.customer_id)
//       },
//       setActiveHH: (chatId) => {
//         set({ customerInfo: chatId })

//         router.navigate(`/chat/${chatId?.customer_id}`)
//       },

//       addTagToChat: (chatId, tag) =>
//         set((state) => ({
//           chats: state.chats.map((chat) =>
//             chat.id === chatId && !chat.tags.includes(tag)
//               ? { ...chat, tags: [...chat.tags, tag] }
//               : chat
//           ),
//         })),

//       setActiveInboxFilter: (filter) => set({ activeInboxFilter: filter }),

//       removeTagFromChat: (chatId, tag) =>
//         set((state) => ({
//           chats: state.chats.map((chat) =>
//             chat.id === chatId
//               ? { ...chat, tags: chat.tags.filter((t) => t !== tag) }
//               : chat
//           ),
//         })),
//       // Actions
//       setCurrentUser: (user) => set({ currentUser: user }),
//       getFilteredChats: () => {
//         const {
//           chats,
//           activeInboxFilter,
//           searchQuery,
//           currentUser,
//           selectedTeamInbox,
//         } = get()

//         let filtered = chats

//         // Apply team inbox filter
//         if (selectedTeamInbox) {
//           filtered = filtered.filter((chat) => chat.team === selectedTeamInbox)
//         }

//         // Apply inbox filter
//         switch (activeInboxFilter) {
//           case 'mine':
//             filtered = filtered.filter(
//               (chat) => chat.assignedTo === currentUser?.id
//             )
//             break
//           case 'unassigned':
//             filtered = filtered.filter((chat) => !chat.assignedTo)
//             break
//           case 'incoming_calls':
//             filtered = filtered.filter((chat) => chat.source === 'phone')
//             break
//           case 'new_lead':
//             filtered = filtered.filter((chat) => chat.lifecycle === 'new_lead')
//             break
//           case 'vip_lead':
//             filtered = filtered.filter((chat) => chat.lifecycle === 'vip_lead')
//             break
//           case 'hot_lead':
//             filtered = filtered.filter((chat) => chat.lifecycle === 'hot_lead')
//             break
//           case 'payment':
//             filtered = filtered.filter((chat) => chat.lifecycle === 'payment')
//             break
//           case 'customer':
//             filtered = filtered.filter((chat) => chat.lifecycle === 'customer')
//             break
//           case 'cold_lead':
//             filtered = filtered.filter((chat) => chat.lifecycle === 'cold_lead')
//             break
//           default:
//             break
//         }

//         // Apply search filter
//         if (searchQuery) {
//           filtered = filtered.filter((chat) => {
//             const otherParticipant = chat.participants.find(
//               (p) => p.id !== currentUser?.id
//             )
//             return (
//               otherParticipant?.name
//                 .toLowerCase()
//                 .includes(searchQuery.toLowerCase()) ||
//               chat.lastMessage?.content
//                 .toLowerCase()
//                 .includes(searchQuery.toLowerCase()) ||
//               chat.tags.some((tag) =>
//                 tag.toLowerCase().includes(searchQuery.toLowerCase())
//               )
//             )
//           })
//         }

//         return filtered.sort(
//           (a, b) =>
//             new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
//         )
//       },
//       sidebarCollapsed: false,

//       getInboxStats: () => {
//         const { chats, currentUser } = get()
//         return {
//           mine: chats.filter((chat) => chat.assignedTo === currentUser?.id)
//             .length,
//           incomingCalls: chats.filter((chat) => chat.source === 'phone').length,
//           total: chats.length,
//           newLead: chats.filter((chat) => chat.lifecycle === 'new_lead').length,
//           unassigned: chats.filter((chat) => !chat.assignedTo).length,
//           hotLead: chats.filter((chat) => chat.lifecycle === 'hot_lead').length,
//           customer: chats.filter((chat) => chat.lifecycle === 'customer')
//             .length,
//           vipLead: chats.filter((chat) => chat.lifecycle === 'vip_lead').length,
//           coldLead: chats.filter((chat) => chat.lifecycle === 'cold_lead')
//             .length,
//           payment: chats.filter((chat) => chat.lifecycle === 'payment').length,
//         }
//       },

//       initializeData: () => {
//         // Mock data initialization
//         const mockUsers: Record<string, User> = {
//           '1': {
//             email: 'kara@example.com',
//             avatar:
//               'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
//             id: '1',
//             department: 'Sales',
//             name: 'Kara Finley',
//             isOnline: true,
//             role: 'Customer',
//           },
//           '2': {
//             email: 'alvin@example.com',
//             avatar:
//               'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
//             id: '2',
//             isOnline: false,
//             name: 'Alvin',
//             lastSeen: new Date(Date.now() - 30 * 60 * 1_000),
//             role: 'Customer',
//           },
//           '3': {
//             email: 'natalie@example.com',
//             avatar:
//               'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
//             id: '3',
//             isOnline: true,
//             name: 'Natalie',
//             role: 'Customer',
//           },
//           '4': {
//             email: 'myra@example.com',
//             avatar:
//               'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150',
//             id: '4',
//             isOnline: false,
//             name: 'Myra',
//             role: 'Customer',
//           },
//           '5': {
//             email: 'oliviera@example.com',
//             avatar:
//               'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
//             id: '5',
//             isOnline: true,
//             name: 'Oliviera',
//             role: 'Customer',
//           },
//           '6': {
//             email: 'kailey@example.com',
//             avatar:
//               'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150',
//             id: '6',
//             isOnline: false,
//             name: 'Kailey',
//             role: 'Customer',
//           },
//           '7': {
//             email: 'mohamed@example.com',
//             avatar:
//               'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150',
//             id: '7',
//             isOnline: true,
//             name: 'Mohamed',
//             role: 'Customer',
//           },
//           current: {
//             email: 'fahmy@example.com',
//             avatar:
//               'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
//             id: 'current',
//             department: 'Sales',
//             name: 'Fahmy',
//             isOnline: true,
//             role: 'Agent',
//           },
//         }

//         const mockChats: Chat[] = [
//           {
//             id: 'chat1',
//             isPinned: false,
//             createdAt: new Date('2025-03-19T14:57:00'),
//             participants: [mockUsers['current'], mockUsers['1']],
//             status: 'open',
//             unreadCount: 0,
//             assignedBy: 'current',
//             assignedTo: 'current',
//             updatedAt: new Date('2025-03-19T14:57:00'),
//             lifecycle: 'hot_lead',
//             priority: 'high',
//             source: 'web',
//             tags: ['osa'],
//             team: 'sales_team_apac',
//             workflow: {
//               assignedAgent: 'Fahmy',
//               name: 'Assignment',
//               status: 'AI Agent started',
//             },
//           },
//           {
//             id: 'chat2',
//             isPinned: false,
//             createdAt: new Date('2025-01-30T10:00:00'),
//             participants: [mockUsers['current'], mockUsers['2']],
//             status: 'open',
//             unreadCount: 0,
//             priority: 'normal',
//             lifecycle: 'new_lead',
//             updatedAt: new Date('2025-01-30T10:00:00'),
//             source: 'web',
//             tags: [],
//             team: 'sales_team_apac',
//           },
//           {
//             id: 'chat3',
//             isPinned: false,
//             createdAt: new Date('2025-04-11T09:00:00'),
//             participants: [mockUsers['current'], mockUsers['3']],
//             status: 'open',
//             unreadCount: 0,
//             priority: 'normal',
//             lifecycle: 'new_lead',
//             updatedAt: new Date('2025-04-11T09:00:00'),
//             source: 'web',
//             tags: [],
//             team: 'sales_team_apac',
//           },
//           {
//             id: 'chat4',
//             isPinned: false,
//             createdAt: new Date('2025-04-11T08:30:00'),
//             participants: [mockUsers['current'], mockUsers['4']],
//             status: 'open',
//             unreadCount: 0,
//             priority: 'normal',
//             lifecycle: 'vip_lead',
//             updatedAt: new Date('2025-04-11T08:30:00'),
//             source: 'web',
//             tags: [],
//             team: 'sales_team_apac',
//           },
//           {
//             id: 'chat5',
//             isPinned: false,
//             createdAt: new Date('2025-03-27T15:00:00'),
//             participants: [mockUsers['current'], mockUsers['5']],
//             status: 'open',
//             unreadCount: 0,
//             priority: 'normal',
//             lifecycle: 'payment',
//             updatedAt: new Date('2025-03-27T15:00:00'),
//             source: 'web',
//             tags: [],
//             team: 'sales_team_apac',
//           },
//           {
//             id: 'chat6',
//             isPinned: false,
//             createdAt: new Date('2025-03-22T11:00:00'),
//             participants: [mockUsers['current'], mockUsers['6']],
//             status: 'open',
//             unreadCount: 0,
//             priority: 'normal',
//             lifecycle: 'new_lead',
//             updatedAt: new Date('2025-03-22T11:00:00'),
//             source: 'web',
//             tags: [],
//             team: 'sales_team_apac',
//           },
//           {
//             id: 'chat7',
//             isPinned: false,
//             createdAt: new Date('2025-03-21T16:00:00'),
//             participants: [mockUsers['current'], mockUsers['7']],
//             status: 'open',
//             unreadCount: 0,
//             priority: 'normal',
//             lifecycle: 'new_lead',
//             updatedAt: new Date('2025-03-21T16:00:00'),
//             source: 'web',
//             tags: [],
//             team: 'sales_team_apac',
//           },
//         ]

//         const mockMessages: Record<string, Message[]> = {
//           chat1: [
//             {
//               chatId: 'chat1',
//               content: "Hello, I'm in Clear selection schedule a demo?",
//               id: 'msg1',
//               isRead: true,
//               messageType: 'text',
//               senderId: '1',
//               priority: 'high',
//               timestamp: new Date('2025-03-19T14:57:00'),
//             },
//           ],
//           chat2: [
//             {
//               chatId: 'chat2',
//               content: 'Hello',
//               id: 'msg2',
//               isRead: true,
//               messageType: 'text',
//               senderId: '2',
//               timestamp: new Date('2025-01-30T10:00:00'),
//             },
//           ],
//           chat3: [
//             {
//               chatId: 'chat3',
//               content: 'If you have no further questions,',
//               id: 'msg3',
//               isRead: true,
//               messageType: 'text',
//               senderId: '3',
//               timestamp: new Date('2025-04-11T09:00:00'),
//             },
//           ],
//           chat4: [
//             {
//               chatId: 'chat4',
//               content: "I'm so pleased you enjoyed the",
//               id: 'msg4',
//               isRead: true,
//               messageType: 'text',
//               senderId: '4',
//               timestamp: new Date('2025-04-11T08:30:00'),
//             },
//           ],
//           chat5: [
//             {
//               chatId: 'chat5',
//               content: "Perfect! I'd like to confirm whethe",
//               id: 'msg5',
//               isRead: true,
//               messageType: 'text',
//               senderId: '5',
//               timestamp: new Date('2025-03-27T15:00:00'),
//             },
//           ],
//           chat6: [
//             {
//               chatId: 'chat6',
//               content: 'If you have no further questions',
//               id: 'msg6',
//               isRead: true,
//               messageType: 'text',
//               senderId: '6',
//               timestamp: new Date('2025-03-22T11:00:00'),
//             },
//           ],
//           chat7: [
//             {
//               chatId: 'chat7',
//               content: 'Looking forward!',
//               id: 'msg7',
//               isRead: true,
//               messageType: 'text',
//               senderId: '7',
//               timestamp: new Date('2025-03-21T16:00:00'),
//             },
//           ],
//         }

//         const mockTeamInboxes: TeamInbox[] = [
//           {
//             count: 1,
//             id: 'sales_team_apac',
//             name: 'Sales team APAC',
//             type: 'sales',
//           },
//           {
//             count: 7,
//             id: 'marketing_team_apac',
//             name: 'Marketing team APAC',
//             type: 'marketing',
//           },
//           {
//             count: 10,
//             id: 'sales_team_emea',
//             name: 'Sales team EMEA',
//             type: 'sales',
//           },
//           {
//             count: 7,
//             id: 'marketing_team_emea',
//             name: 'Marketing team EMEA',
//             type: 'marketing',
//           },
//           {
//             count: 0,
//             id: 'custom_inbox',
//             name: 'Custom inbox',
//             type: 'custom',
//           },
//         ]

//         const mockCampaigns: Campaign[] = [
//           {
//             id: 'campaign1',
//             name: 'Spring Sale 2025',
//             status: 'active',
//             type: 'Email',
//           },
//           {
//             id: 'campaign2',
//             name: 'Product Launch',
//             status: 'active',
//             type: 'Social Media',
//           },
//         ]

//         const mockIndustries: Industry[] = [
//           { category: 'education', id: 'education', name: 'Education' },
//           { category: 'retail', id: 'retail', name: 'Retail' },
//         ]

//         // Update last messages for chats
//         const chatsWithLastMessage = mockChats.map((chat) => ({
//           ...chat,
//           lastMessage:
//             mockMessages[chat.id]?.[mockMessages[chat.id].length - 1],
//         }))

//         set({
//           chats: chatsWithLastMessage,
//           currentUser: mockUsers['current'],
//           campaigns: mockCampaigns,
//           users: mockUsers,
//           industries: mockIndustries,
//           messages: mockMessages,
//           teamInboxes: mockTeamInboxes,
//         })
//       },

//       setSearchQuery: (query) => set({ searchQuery: query }),

//       setChatLifecycle: (chatId, lifecycle) =>
//         set((state) => ({
//           chats: state.chats.map((chat) =>
//             chat.id === chatId ? { ...chat, lifecycle } : chat
//           ),
//         })),

//       setTyping: (chatId, userId, userName) =>
//         set((state) => ({
//           typingIndicators: [
//             ...state.typingIndicators.filter(
//               (t) => !(t.chatId === chatId && t.userId === userId)
//             ),
//             { chatId, userId, userName },
//           ],
//         })),

//       setChatPriority: (chatId, priority) =>
//         set((state) => ({
//           chats: state.chats.map((chat) =>
//             chat.id === chatId ? { ...chat, priority } : chat
//           ),
//         })),

//       setSelectedTeamInbox: (teamId) => set({ selectedTeamInbox: teamId }),

//       setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

//       updateChatStatus: (chatId, status) =>
//         set((state) => ({
//           chats: state.chats.map((chat) =>
//             chat.id === chatId ? { ...chat, status } : chat
//           ),
//         })),
//     }),
//     {
//       name: 'chatInfo',

//       // Use sessionStorage for persistence
//       partialize: (state) => ({
//         customerInfo: state.customerInfo,
//       }),
//       // Unique name for the storage key
//       storage: createJSONStorage(() => sessionStorage),
//     }
//   )
// )

type InboxType = {
  all: number
  lifecycles: Array<{
    code: string
    count: number
    icon: string
    name: string
  }>
  mine: number
  teams: Array<{
    color: string
    icon: number
    members: string[]
    name: string
    team_id: string
  }>

  unassigned: number
}

export type ChatStoreType = {
  actions: {
    IsAuthorized: () => boolean
    getUserInfo: () => AuthState | null
    setInbox: (inbox: InboxType) => void
    setActiveInbox: (inboxTitle: string) => void
  }
  inbox: InboxType | null
  activeInbox: string
}

export const ChatStore = create<AuthStoreType>()(
  persist(
    (set, get) => ({
      actions: {
        getMFAAttributes: () => {
          return get().MFAAttributes
        },
        getUserInfo: () => {
          return get().authState
        },

        IsAuthorized: () => {
          const MFAAttributes = get().authState?.token

          return typeof MFAAttributes === 'string'
        },

        login: async (payload) => {
          try {
            const { data, error } = await Client.POST('/api/backend/v1/login', {
              body: {
                ...payload,
              },
            })

            if (data) {
              // @ts-expect-error backend dont have type on schema

              set({ authState: data?.data })
              router.navigate(authRoutesPath.DASHBORD)
            }

            if (error) {
              refs.toast({
                // @ts-expect-error backend dont have type on schema

                detail: error?.message,
                life: 3_000,

                severity: 'error',
                // @ts-expect-error backend dont have type on schema

                summary: error?.statusCode,
              })
            }
          } catch (error) {
            console.log('error', error)
          }
        },

        logout: () => {
          sessionStorage.clear()
          router.navigate(authRoutesPath.LOGIN)
        },
      },
      authState: null,
      MFAAttributes: null,

      token: null,
    }),
    {
      name: 'chatInfo',

      // Use sessionStorage for persistence
      partialize: (state) => ({
        authState: state.authState,
        token: state.token,
      }),
      // Unique name for the storage key
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

export const useGetInbox = (username: string) => {
  return useQuery({
    queryFn: () => {
      return Client.GET('/api/backend/v1/inbox', {})
    },

    queryKey: [queryKeyEnum.GET_INBOX_MAIN, username],
    select: ({ data }) => {
      return {
        all: data?.data.all,
        lifecycles: data?.data.lifecycles,
        mine: data?.data.mine,
        teams: data?.data.teams,
        unassigned: data?.data.unassigned,
      }
    },
  })
}

export const useGetSessions = () => {
  return useQuery({
    queryFn: () => {
      return Client.GET('/api/backend/v1/customers', {
        params: {
          query: {
            enable_ai: true,
            is_assigned: false,
            limit: 20,
            page: 1,
          },
        },
      })
    },

    queryKey: ['setion'],
    select: ({ data }) => {
      return {
        pagination: data?.data.pagination,
        sessions: data?.data.items,
      }
    },
  })
}

export const fetchTicketComments = async (
  pageParameter: number,
  id: string | undefined
) => {
  const { data } = await Client.GET('/api/backend/v1/messages', {
    params: {
      query: {
        limit: 10,
        page: pageParameter,
        session_id: id,
      },
    },
  })

  return data
}

export const useGetCommentsQuery = (id: string | undefined) => {
  return useInfiniteQuery({
    getNextPageParam: (lastPage) => {
      // @ts-expect-error fix

      return lastPage?.pagination?.hasNext
        ? // @ts-expect-error fix

          lastPage.pagination.currentPage + 1
        : undefined
    },
    queryFn: ({ pageParam }) => fetchTicketComments(pageParam, id),

    // Start from page 1
    getPreviousPageParam: (firstPage) => {
      // @ts-expect-error fix
      return firstPage?.pagination?.hasPrevious
        ? // @ts-expect-error fix

          firstPage.pagination.currentPage - 1
        : undefined
    },

    initialPageParam: 1,
    queryKey: ['getAll', id],
    select: (data) => ({
      pageParams: [...data.pageParams].reverse(),
      pages: [...data.pages].reverse(),
    }),
  })
}

export const useGetMessagesQuery = (sessionId: string) => {
  return useQuery({
    queryFn: () => {
      return Client.GET('/api/backend/v1/messages', {
        params: {
          query: {
            session_id: sessionId,
          },
        },
      })
    },
    queryKey: ['setionId', sessionId],

    select: ({ data }) => {
      return {
        messages: data?.data.messages,
        pagination: data?.data.pagination,
      }
    },
  })
}
