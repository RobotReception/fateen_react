import React, { useEffect, useRef, useMemo } from 'react'
import {
  Phone,
  Video,
  MoreHorizontal,
  Search,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Star,
  Crown,
  Flame,
  DollarSign,
  Users,
  X as XIcon,
  Settings,
  UserPlus,
  Archive,
} from 'lucide-react'
import useChat from '../../store'
import Avatar from '../ui/Avatar'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import MessageInput from './MessageInput'

const ChatWindow: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const {
    activeChat,
    chats,
    messages,
    users,
    currentUser,
    typingIndicators,
    updateChatStatus,
    setChatPriority,
    setChatLifecycle,
    assignChat,
  } = useChat()

  const currentChatData = useMemo(() => {
    return chats.find((chat) => chat.id === activeChat)
  }, [chats, activeChat])

  const currentMessages = useMemo(() => {
    return activeChat ? messages[activeChat] || [] : []
  }, [messages, activeChat])

  const otherParticipant = useMemo(() => {
    if (!currentChatData || !currentUser) return null
    return currentChatData.participants.find((p) => p.id !== currentUser.id)
  }, [currentChatData, currentUser])

  const chatTypingIndicators = useMemo(() => {
    return typingIndicators.filter(
      (t) => t.chatId === activeChat && t.userId !== currentUser?.id
    )
  }, [typingIndicators, activeChat, currentUser])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages, chatTypingIndicators])

  const getLifecycleIcon = () => {
    if (!currentChatData) return null

    switch (currentChatData.lifecycle) {
      case 'new_lead':
        return <Star className="w-4 h-4 text-blue-600" />
      case 'vip_lead':
        return <Crown className="w-4 h-4 text-purple-600" />
      case 'hot_lead':
        return <Flame className="w-4 h-4 text-red-600" />
      case 'payment':
        return <DollarSign className="w-4 h-4 text-green-600" />
      case 'customer':
        return <Users className="w-4 h-4 text-indigo-600" />
      case 'cold_lead':
        return <XIcon className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const getLifecycleLabel = () => {
    if (!currentChatData) return ''

    switch (currentChatData.lifecycle) {
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

  const getStatusIcon = () => {
    if (!currentChatData) return null

    switch (currentChatData.status) {
      case 'open':
        return <MessageSquare className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-purple-500" />
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  const handleStatusChange = (status: typeof currentChatData.status) => {
    if (activeChat && status) {
      updateChatStatus(activeChat, status)
    }
  }

  const handleLifecycleChange = (
    lifecycle: typeof currentChatData.lifecycle
  ) => {
    if (activeChat && lifecycle) {
      setChatLifecycle(activeChat, lifecycle)
    }
  }

  if (!activeChat || !otherParticipant || !currentChatData) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MessageSquare className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-lg font-medium mb-2">Welcome to your Inbox</p>
          <p className="text-sm">
            Select a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar
            user={otherParticipant}
            size="md"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-gray-900">
                {otherParticipant.name}
              </h2>
              {getStatusIcon()}
              {currentChatData.priority === 'urgent' && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              {getLifecycleIcon()}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>
                {otherParticipant.isOnline ? 'Online now' : 'Offline'}
              </span>
              <span>•</span>
              <span>{getLifecycleLabel()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Lifecycle Dropdown */}
          <select
            value={currentChatData.lifecycle}
            onChange={(e) => handleLifecycleChange(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="new_lead">New Lead</option>
            <option value="vip_lead">VIP Lead</option>
            <option value="hot_lead">Hot Lead</option>
            <option value="payment">Payment</option>
            <option value="customer">Customer</option>
            <option value="cold_lead">Cold Lead</option>
          </select>

          <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Manage
          </button>

          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <UserPlus className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <Archive className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Info Bar */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Lifecycle</span>
              <span className="font-medium text-gray-900">
                {getLifecycleLabel()}
              </span>
            </div>

            {currentChatData.assignedTo && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Assigned to</span>
                <span className="font-medium text-gray-900">
                  {currentChatData.assignedTo === currentUser?.id
                    ? 'You'
                    : 'Agent'}
                </span>
              </div>
            )}

            {currentChatData.workflow && (
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Workflow</span>
                <span className="font-medium text-gray-900">
                  {currentChatData.workflow.name}:{' '}
                  {currentChatData.workflow.status}
                </span>
              </div>
            )}
          </div>

          <div className="text-gray-500">
            {new Date(currentChatData.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="space-y-1">
          {currentMessages.map((message, index) => {
            const sender = users[message.senderId]
            const isOwn = message.senderId === currentUser?.id
            const showAvatar =
              index === 0 ||
              currentMessages[index - 1]?.senderId !== message.senderId
            const showTime =
              index === currentMessages.length - 1 ||
              currentMessages[index + 1]?.senderId !== message.senderId

            if (!sender) return null

            return (
              <MessageBubble
                key={message.id}
                message={message}
                sender={sender}
                isOwn={isOwn}
                showAvatar={showAvatar}
                showTime={showTime}
              />
            )
          })}

          {/* Typing Indicators */}
          {chatTypingIndicators.map((indicator) => (
            <TypingIndicator
              key={`${indicator.chatId}-${indicator.userId}`}
              userName={indicator.userName}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <MessageInput />
    </div>
  )
}

export default React.memo(ChatWindow)
