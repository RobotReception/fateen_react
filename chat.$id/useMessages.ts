// src/features/chat/useMessages.ts
import { Client } from '@/globals/Client'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { useInfiniteQuery } from '@tanstack/react-query'

export type MessageType = 'text' | 'image' | 'audio' | 'interactive' | 'file'
export type Direction = 'inbound' | 'outbound'

export type ChatMessage = {
  _id: string
  content: {
    caption?: string
    text?: string
    transcript?: string
    url?: string
    // interactive fields if needed...
  }
  customer_id: string
  direction: Direction
  isOptimistic?: boolean
  isRead?: 'sent' | 'read' | 'received' | string
  is_internal?: boolean
  message_id: string
  message_type: MessageType
  platform: string
  recipient_id?: string
  response_to?: string | null
  sender_id?: string
  sender_info?: { name?: string; profile_photo?: string | null }
  sender_type?: 'user' | 'customer' | 'ai' | 'system'
  timestamp: string
  status?: string
  session_id: string
}

type PageResp = {
  messages: ChatMessage[]
  pagination?: {
    currentPage: number
    hasNext?: boolean
    hasPrevious?: boolean
  }
}

export const fetchTicketComments = async (page: number, id?: string) => {
  const { data } = await Client.GET(
    '/api/backend/v1/customers/{customer_id}/messages',
    {
      params: {
        path: { customer_id: id },
        query: { limit: 10, page },
      },
    }
  )
  return data?.data as PageResp
}

export const useGetCommentsQuery = (id?: string) => {
  return useInfiniteQuery({
    getNextPageParam: (lastPage) =>
      lastPage?.pagination?.hasNext
        ? (lastPage.pagination!.currentPage ?? 1) + 1
        : undefined,
    initialPageParam: 1,
    getPreviousPageParam: (firstPage) =>
      firstPage?.pagination?.hasPrevious
        ? (firstPage.pagination!.currentPage ?? 1) - 1
        : undefined,

    queryFn: ({ pageParam }) => fetchTicketComments(pageParam as number, id),

    queryKey: [queryKeyEnum.GET_ALL_MESSAGES, id],

    // نعرض الأقدم فالأحدث (مثل كودك) مع الحفاظ على آخر صفحة للأحدث
    select: (data) => ({
      pageParams: [...data.pageParams].reverse(),
      pages: [...data.pages].reverse(),
    }),
  })
}
