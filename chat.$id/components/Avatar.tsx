import React from 'react'

type AvatarProps = {
  readonly className?: string
  readonly size?: 'sm' | 'md' | 'lg'
  readonly user: { name: string; profile_photo: string }
}

const Avatar: React.FC<AvatarProps> = ({
  className = '',
  size = 'md',
  user,
}) => {
  const sizeClasses = {
    lg: 'w-12 h-12',
    md: 'w-10 h-10',
    sm: 'w-8 h-8',
  }

  const statusSizeClasses = {
    lg: 'w-3 h-3 border-2 border-white',
    md: 'w-3 h-3 border-2 border-white',
    sm: 'w-2.5 h-2.5 border border-white',
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]}  rounded-full overflow-hidden bg-gray-200 flex items-center justify-center`}
      >
        {user.profile_photo ? (
          <img
            alt={user?.name}
            className="w-full h-full object-cover"
            onError={(event) => {
              const target = event.target as HTMLImageElement
              target.style.display = 'none'
            }}
            src={user.profile_photo}
          />
        ) : (
          <span
            className={`text-gray-600 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )
}

export default React.memo(Avatar)
