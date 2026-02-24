import useChat, { useGetCustomersQuery } from '../../store'
import { ChatStore } from '../../store2'
import { LoadingCustomer } from '../LoadingCustomer'
import SearchInput from '../ui/SearchInput'
import ChatListItem from './ChatListItem'
import { Filter, Grid3X3, List, MoreHorizontal, Search } from 'lucide-react'
import React from 'react'
import { useStore } from 'zustand'

const ChatList: React.FC = () => {
  const { activeInboxFilter, getFilteredChats, searchQuery, setSearchQuery } =
    useChat()

  const filteredChats = getFilteredChats()
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = React.useState<'newest' | 'unread'>('newest')
  const filter = useStore(ChatStore, (state) => state.activeInboxFilter)
  const { data, isLoading } = useGetCustomersQuery(filter)
  const getFilterTitle = () => {
    switch (activeInboxFilter) {
      case 'all':
        return 'All'
      case 'mine':
        return 'Mine'
      case 'unassigned':
        return 'Unassigned'
      case 'incoming_calls':
        return 'Incoming Calls'
      case 'new_lead':
        return 'New Lead'
      case 'vip_lead':
        return 'VIP Lead'
      case 'hot_lead':
        return 'Hot Lead'
      case 'payment':
        return 'Payment'
      case 'customer':
        return 'Customer'
      case 'cold_lead':
        return 'Cold Lead'
      default:
        return 'Chats'
    }
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200  grid grid-rows-[auto_1fr]  overflow-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {getFilterTitle()}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredChats.length}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              title={viewMode === 'list' ? 'Grid view' : 'List view'}
              type="button"
            >
              {viewMode === 'list' ? (
                <Grid3X3 className="w-4 h-4 text-gray-500" />
              ) : (
                <List className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Search */}
        <SearchInput
          className="w-full"
          onChange={setSearchQuery}
          placeholder="Search conversations..."
          value={searchQuery}
        />

        {/* Sort Options */}
        <div className="flex items-center space-x-2 mt-3">
          <select
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'unread')}
            value={sortBy}
          >
            <option value="newest">Newest</option>
            <option value="unread">Unread</option>
          </select>
          <button
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            type="button"
          >
            Unreplied
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className=" overflow-y-scroll h-full">
        {data?.sessions?.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No conversations found' : 'No conversations'}
          </div>
        ) : (
          <>
            {/* <div className="divide-y divide-gray-100">
              {filteredChats?.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} />
              ))}
            </div> */}
            {isLoading && <LoadingCustomer />}
            <div className="divide-y  overflow-y-auto divide-gray-100">
              {data?.sessions?.map((chat) => (
                <ChatListItem
                  chat={chat}
                  key={chat.session_id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// export default React.memo(ChatList);
export default ChatList
