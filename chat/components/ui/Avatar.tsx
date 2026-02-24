import { User } from '../../types'
import React from 'react'

type AvatarProps = {
  readonly assigned_to: string
  readonly className?: string
  readonly isOnline: boolean
  readonly last_message: string
  readonly last_message_type: string
  readonly last_timestamp: string
  readonly lifecycle: string
  readonly platform: string
  readonly profile_photo: string
  readonly sender_name: string

  readonly showStatus?: boolean
  readonly size?: 'sm' | 'md' | 'lg'
  readonly unread_count: number
}

const Avatar: React.FC<AvatarProps> = ({
  assigned_to,
  className = '',
  isOnline,
  last_message,
  last_message_type,
  last_timestamp,
  lifecycle,
  platform,
  platform_icon,
  profile_photo,
  sender_name,
  showStatus = true,
  size = 'md',
  unread_count,
  user,
}) => {
  const sizeClasses = {
    lg: 'w-12 h-12',
    md: 'w-10 h-10',
    sm: 'w-8 h-8',
  }

  const statusSizeClasses = {
    lg: 'w-3 h-3 outline-2 ',
    md: 'w-3 h-3 outline-2 ',
    sm: 'w-2 h-2 outline ',
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center`}
      >
        {profile_photo ? (
          <img
            alt={sender_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
            src={profile_photo}
          />
        ) : (
          <span
            className={`text-gray-600 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
          >
            {sender_name?.charAt(0)?.toUpperCase()}
          </span>
        )}
      </div>
      {showStatus && (
        <div
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]}  rounded-full ${
            isOnline ? 'outline-green-400 ' : 'outline-gray-400'
          }`}
        >
          <img
            className="w-full h-full object-cover"
            onError={(event) => {
              const target = event.target as HTMLImageElement
              target.style.display = 'none'
            }}
            src={platform_icon}
          />
        </div>
      )}
    </div>
  )
}

export default React.memo(Avatar)
