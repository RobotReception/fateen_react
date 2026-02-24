export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  isOnline: boolean
  lastSeen?: Date
  role?: string
  department?: string
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  timestamp: Date
  isRead: boolean
  messageType: 'text' | 'image' | 'file'
  attachments?: Attachment[]
  replyTo?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface Attachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
}

export interface Chat {
  id: string
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  isPinned: boolean
  isTyping?: string[]
  createdAt: Date
  updatedAt: Date
  status: 'open' | 'pending' | 'resolved' | 'closed'
  assignedTo?: string
  assignedBy?: string
  tags: string[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  source:
    | 'whatsapp'
    | 'telegram'
    | 'email'
    | 'web'
    | 'facebook'
    | 'instagram'
    | 'sms'
    | 'phone'
  lifecycle:
    | 'new_lead'
    | 'vip_lead'
    | 'hot_lead'
    | 'payment'
    | 'customer'
    | 'cold_lead'
  team?: string
  workflow?: {
    name: string
    status: string
    assignedAgent?: string
  }
}

export interface TypingIndicator {
  chatId: string
  userId: string
  userName: string
}

export type InboxFilter =
  | 'all'
  | 'mine'
  | 'unassigned'
  | 'incoming_calls'
  | 'new_lead'
  | 'vip_lead'
  | 'hot_lead'
  | 'payment'
  | 'customer'
  | 'cold_lead'

export interface InboxStats {
  total: number
  mine: number
  unassigned: number
  incomingCalls: number
  newLead: number
  vipLead: number
  hotLead: number
  payment: number
  customer: number
  coldLead: number
}

export interface TeamInbox {
  id: string
  name: string
  count: number
  type: 'sales' | 'marketing' | 'support' | 'custom'
}

export interface Campaign {
  id: string
  name: string
  type: string
  status: 'active' | 'paused' | 'completed'
}

export interface Industry {
  id: string
  name: string
  category: 'education' | 'retail' | 'healthcare' | 'technology'
}
