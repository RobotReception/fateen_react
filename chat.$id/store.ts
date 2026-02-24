import { type OptionsTable } from '@/types/global'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { create } from 'zustand'

type filterType = {
  categorySearch: undefined
  dateFrom: Date | null
  dateTo: Date | null
  statusSearch: undefined
}

export type CommentsStoreType = {
  actions: {
    changePagination: (options: OptionsTable) => void
    searchInTable: (pageNumer: string | undefined) => void
    setFilters: (filter: Partial<filterType>) => void
  }

  filters: filterType
  options: OptionsTable
  query: string
}
export const CommentsStore = create<CommentsStoreType>((set) => ({
  actions: {
    async changePagination(data) {
      set({ options: data })
    },
    async searchInTable(data) {
      set({
        options: {
          first: 0,
          page: undefined,
          rows: 10,
          sortField: undefined,
          sortOrder: undefined,
        },
        query: data,
      })
    },
    async setFilters(newFilters) {
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
        options: {
          first: 0,
          page: undefined,
          rows: 10,
          sortField: undefined,
          sortOrder: undefined,
        },
      }))
    },
  },

  filters: {
    categorySearch: undefined,
    dateFrom: null,
    dateTo: null,
    statusSearch: undefined,
  },

  // state
  options: {
    first: 0,
    page: 1,
    rows: 20,
    sortField: undefined,
    sortOrder: undefined,
  },
  query: '',
}))
export const { changePagination, searchInTable, setFilters } =
  CommentsStore.getState().actions

export const fetchTicketComments = async (
  pageParameter: number,
  id: string
) => {
  const { data } = await Client.GET(
    '/api/backend/v1/customers/{customer_id}/messages',
    {
      params: {
        path: { customer_id: id },
        query: {
          limit: 10,
          page: pageParameter,
        },
      },
    }
  )
  return data?.data
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
    queryKey: [queryKeyEnum.GET_ALL_MESSAGES, id],
    select: (data) => ({
      pageParams: [...data.pageParams].reverse(),
      pages: [...data.pages].reverse(),
    }),
  })
}

export const useGetUsersMentionQuery = () => {
  return useQuery({
    queryFn: () => {
      return Client.GET('/api/backend/v1/get-users-brief/all', {})
    },
    //users

    queryKey: [queryKeyEnum.GET_USERS_MENTION],

    select: ({ data }) => {
      return {
        // @ts-expect-error backend dont have type on schema

        users: data?.data?.users,
      }
    },
  })
}

export const useGetUsersBriefQuery = (
  options: OptionsTable,
  KeywordSearch: string
) => {
  return useQuery({
    queryFn: () => {
      return Client.GET('/api/backend/v1/get-users-brief/all', {
        params: {
          query: {
            page: options.page,
            page_size: options.rows,
            search: KeywordSearch,
          },
        },
      })
    },

    queryKey: [
      queryKeyEnum.GET_USERS_BRIEF,
      options.rows,
      options.page,
      KeywordSearch,
    ],
    select: ({ data }) => {
      return {
        //     // @ts-expect-error backend dont have type on schema

        data: data?.data?.users,
        pagination: data?.data?.pagination,
      }
    },

    // select: ({ data }) => {
    //   return {
    //     // @ts-expect-error backend dont have type on schema

    //     users: data?.data?.users,
    //   }
    // },
  })
}

export const useGetTeamQuery = (
  options: OptionsTable,
  KeywordSearch: string
) => {
  return useQuery({
    queryFn: () => {
      return Client.GET('/api/backend/v1/get_teams', {
        params: {
          query: {
            page: options.page,
            page_size: options.rows,
            search: KeywordSearch,
          },
        },
      })
    },

    queryKey: [
      queryKeyEnum.GET_ASSIGN_TEAM,
      options.rows,
      options.page,
      KeywordSearch,
    ],
    select: ({ data }) => {
      return {
        //     // @ts-expect-error backend dont have type on schema

        data: data?.data.data,
        pagination: data?.data?.pagination,
      }
    },

    // select: ({ data }) => {
    //   return {
    //     // @ts-expect-error backend dont have type on schema

    //     users: data?.data?.users,
    //   }
    // },
  })
}
