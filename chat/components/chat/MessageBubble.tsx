import React from 'react'
import { Check, CheckCheck, Clock } from 'lucide-react'
import { Message, User } from '../../types'
import Avatar from '../ui/Avatar'

interface MessageBubbleProps {
  message: Message
  sender: User
  isOwn: boolean
  showAvatar?: boolean
  showTime?: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  isOwn,
  showAvatar = true,
  showTime = true,
}) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={`flex items-end space-x-2 space-x-reverse mb-4 ${isOwn ? 'justify-start' : 'justify-end'}`}
    >
      {/* Avatar for other users */}
      {!isOwn && showAvatar && (
        <Avatar
          user={sender}
          size="sm"
          showStatus={false}
        />
      )}

      {/* Message Content */}
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          } ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
        >
          <p
            className="text-sm leading-relaxed"
            dir="rtl"
          >
            {message.content}
          </p>
        </div>

        {/* Time and Status */}
        {showTime && (
          <div
            className={`flex items-center mt-1 text-xs text-gray-500 ${isOwn ? 'justify-start' : 'justify-end'}`}
          >
            <span>{formatTime(message.timestamp)}</span>
            {isOwn && (
              <div className="ml-1">
                {message.isRead ? (
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacer for own messages */}
      {isOwn && showAvatar && <div className="w-8" />}
    </div>
  )
}

export default React.memo(MessageBubble)
