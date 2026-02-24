import React, { useState, useRef } from 'react'
import { Send, Paperclip, Smile, Mic } from 'lucide-react'
import useChat from '../../store'
import { Message } from '../../types'

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { activeChat, currentUser, addMessage, setTyping, removeTyping } =
    useChat()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activeChat || !currentUser) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: activeChat,
      senderId: currentUser.id,
      content: message.trim(),
      timestamp: new Date(),
      isRead: false,
      messageType: 'text',
    }

    addMessage(newMessage)
    setMessage('')
    removeTyping(activeChat, currentUser.id)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }

    // Typing indicator
    if (activeChat && currentUser) {
      if (value.trim()) {
        setTyping(activeChat, currentUser.id, currentUser.name)
      } else {
        removeTyping(activeChat, currentUser.id)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!activeChat) {
    return null
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form
        onSubmit={handleSubmit}
        className="flex items-end space-x-2 space-x-reverse"
      >
        {/* Attachment Button */}
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full 
            transition-colors duration-200"
          title="إرفاق ملف"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالة..."
            className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-full 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              resize-none max-h-32 text-sm leading-relaxed"
            style={{ minHeight: '42px' }}
            dir="rtl"
            rows={1}
          />

          {/* Emoji Button */}
          <button
            type="button"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 
              hover:text-gray-700 transition-colors duration-200"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Send/Voice Button */}
        {message.trim() ? (
          <button
            type="submit"
            className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 
              transition-colors duration-200 focus:outline-none focus:ring-2 
              focus:ring-blue-500 focus:ring-offset-2"
            title="إرسال"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2.5 rounded-full transition-colors duration-200 focus:outline-none 
              focus:ring-2 focus:ring-offset-2 ${
                isRecording
                  ? 'bg-red-500 text-white focus:ring-red-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-500'
              }`}
            title="تسجيل صوتي"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </form>
    </div>
  )
}

export default React.memo(MessageInput)
