import { LifeCycles } from './LifeCycles'
import Avatar from '@/routes/chat/components/ui/Avatar'
import { ChatStore } from '@/routes/chat/store2'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  DollarSign,
  Flame,
  MessageSquare,
  Star,
  Users,
  X as XIcon,
} from 'lucide-react'
import { useStore } from 'zustand'
import { UsersBrief } from './UsersBrief'
import { EnableAI } from './EnableAI'
import { AssginTeam } from './AssginTeam'

export const Header = () => {
  const chat = useStore(ChatStore, (state) => state.activeChat)
  const getStatusIcon = () => {
    switch (chat?.session_status) {
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

  const getLifecycleIcon = () => {
    switch (chat?.lifecycle) {
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

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3">
        <Avatar
          assigned_to={chat?.assigned_to}
          isOnline={!chat?.conversation_status.is_closed}
          platform_icon={chat?.platform_icon}
          profile_photo={chat?.profile_photo}
          sender_name={chat?.sender_name}
          size="md"
        />
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900">{chat?.sender_name}</h2>
            {getStatusIcon()}
            {chat?.priority === 'urgent' && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            {getLifecycleIcon()}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>
              {chat?.conversation_status.is_closed ? 'Offline' : 'Online now'}
            </span>
            <span>•</span>
            {/* <span>{getLifecycleLabel()}</span> */}
          </div>
        </div>
      </div>
      <div className="flex items-center  gap-1">
        <LifeCycles
         
        />
        <UsersBrief />
        <AssginTeam/>
        <EnableAI/>
      </div>
    </div>
  )
}
