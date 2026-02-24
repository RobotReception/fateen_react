type PlatformMetadata = {
  message: {
    mid: string
    text: string
  }
  recipient: {
    id: string
  }
  sender: {
    id: string
  }
  timestamp: number
}

type ConversationStatus = {
  close_category: string
  close_reason: string
  closed_at: string
  is_closed: boolean // ISO date string
}

type Conversation = {
  _id: string
  assigned_to: string
  // unclear from example, assuming string or empty string
  close_reason: string
  conversation_opened_at: string
  conversation_status: ConversationStatus
  conversation_summary: string
  // ISO date string
  created_at: string
  // ISO date string
  custom_fields: string | ''
  customer_id: string
  email: string
  enable_ai: boolean
  favorite: boolean
  isOnline: boolean
  isRead: boolean
  is_assigned: boolean
  language: string
  last_direction: string
  last_message: string
  last_message_type: string
  // ISO date string
  last_profile_update: string
  last_read_message_id: string
  // ISO date string
  last_sender_id: string
  last_timestamp: string
  lifecycle: string
  // no info, default to any[]
  muted: boolean
  session_status: string
  platform: string
  platform_icon: string
  sender_name: string
  tags: string[]
  profile_photo: string
  platform_metadata: PlatformMetadata
  phone_number: string
  session_id: string
  status_history: any[]
  team_id: string
  unread_count: number
  priority: string
  // ISO date string
  updated_at: string
}
