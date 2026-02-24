import { TZDateMini, TZNameFormat } from '@date-fns/tz'
import { ChatStore, setActiveChat, type ChatType } from '../../store2'
import Avatar from '../ui/Avatar'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { format, isToday, isYesterday, parseISO } from 'date-fns'

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  DollarSign,
  Flame,
  MessageSquare,
  MessageSquareQuote,
  MoreHorizontal,
  MoveDownLeft,
  MoveUpRight,
  Pin,
  Star,
  User,
  Users,
  X as XIcon,
} from 'lucide-react'
import React from 'react'
import { useStore } from 'zustand'

type ChatListItemProps = {
  readonly chat: ChatType
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat }) => {
  const formatTime = (date: Date) => {
    const timeZone = 'Asia/Riyadh'
    new TZDateMini(2022, 2, 13).toString()
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'h:mm a')
    }
  }

  const getLifecycleIcon = () => {
    switch (chat.lifecycle) {
      case 'new_lead':
        return <Star className="w-3 h-3 text-blue-600" />
      case 'vip_lead':
        return <Crown className="w-3 h-3 text-purple-600" />
      case 'hot_lead':
        return <Flame className="w-3 h-3 text-red-600" />
      case 'payment':
        return <DollarSign className="w-3 h-3 text-green-600" />
      case 'customer':
        return <Users className="w-3 h-3 text-indigo-600" />
      case 'cold_lead':
        return <XIcon className="w-3 h-3 text-gray-600" />
      default:
        return null
    }
  }

  const getLifecycleLabel = () => {
    switch (chat.lifecycle) {
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
        return ''
    }
  }

  const getLifecycleColor = () => {
    switch (chat.lifecycle) {
      case 'new_lead':
        return 'bg-blue-100 text-blue-700'
      case 'vip_lead':
        return 'bg-purple-100 text-purple-700'
      case 'hot_lead':
        return 'bg-red-100 text-red-700'
      case 'payment':
        return 'bg-green-100 text-green-700'
      case 'customer':
        return 'bg-indigo-100 text-indigo-700'
      case 'cold_lead':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = () => {
    switch (chat.session_status) {
      case 'open':
        return <MessageSquare className="w-3 h-3 text-green-500" />
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="w-3 h-3 text-purple-500" />
      case 'closed':
        return <CheckCircle className="w-3 h-3 text-gray-500" />
      default:
        return null
    }
  }

  const getDirectionIcon = () => {
    switch (chat.last_direction) {
      case 'inbound':
        return <MoveDownLeft className="w-3 h-3 text-red-500" />
      case 'outbound':
        return <MoveUpRight className="w-3 h-3 text-blue-500" />
      case 'internal':
        return <MessageSquareQuote className="w-3 h-3 text-amber-500" />

      default:
        return null
    }
  }

  const filter = useStore(ChatStore, (state) => state.activeInboxFilter)
  const activeChat = useStore(ChatStore, (state) => state.activeChat)

  const isSelected = activeChat?.customer_id === chat.customer_id

  return (
    <div
      className={`p-4 cursor-pointer  max-w-full overflow-hidden transition-all duration-200 hover:bg-gray-50 group ${
        isSelected ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
      }`}
      onClick={() => {
        setActiveChat(chat)
        queryClient.invalidateQueries({
          queryKey: [queryKeyEnum.GET_CUSTOMERS_SESSIONS, filter],
        })
        router.navigate(`/chat/${chat?.customer_id}`)

        // GET_CUSTOMERS_SESSIONS: 'get-customers-sessions',
      }}
    >
      <div className="flex items-start overflow-hidden space-x-3">
        <div className="relative">
          <Avatar
            assigned_to={chat.assigned.assigned_to}
            isOnline={chat.isOnline}
            platform_icon={chat.platform_icon}
            profile_photo={chat.profile_photo}
            sender_name={chat.sender_name}
            size="md"
          />
        </div>

        <div className="flex-1 max-w-full min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {chat.sender_name}
              </h3>

              {chat.isPinned && (
                <Pin className="w-3 h-3 text-blue-500 fill-current flex-shrink-0" />
              )}
              {getStatusIcon()}
              {chat.priority === 'urgent' && (
                <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {chat.last_message && (
                <span className="text-xs text-gray-500">
                  {formatTime(chat.last_timestamp)}
                </span>
              )}
              <button
                className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Lifecycle Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <span
              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getLifecycleColor()}`}
            >
              {getLifecycleIcon()}
              <span>{getLifecycleLabel()}</span>
            </span>
          </div>

          {/* Message Preview */}
          <div className="flex items-center ةmax-w-full justify-between    mb-2">
            <div className="flex gap-2 w-1/2 flex-1  items-center">
              <p className="text-sm w-1/2 text-gray-600 truncate wrap-break-word  line-clamp-1 break-all"
              
              >
                {chat.last_message || 'No messages'}
              </p>
              {getDirectionIcon()}
            </div>
            {chat.unread_count > 0 && (
              <span className=" bg-blue-500 max-w-1/2 text-white text-xs font-medium px-2 py-1 rounded-full min-w-2 min-h-2 text-center flex-shrink-0">
                {chat.unread_count}
              </span>
            )}
          </div>

          {/* Assignment Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              {chat.assigned && (
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3 " />
                  <span className="line-clamp-1">
                    {chat.assigned.assigned_to_username}
                  </span>
                </div>
              )}
            </div>

            {/* Read Status for own messages */}

            {chat.is_assigned ? (
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium text-xs">
                  {chat.assigned_to?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ChatListItem)
