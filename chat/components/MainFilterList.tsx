import { useGetInboxQuery } from '../store'
import { ChatStore, setActiveInboxFilter } from '../store2'
import { MessageSquare, UserCheck, UserX } from 'lucide-react'
import { useStore } from 'zustand'

export function MainFilterList() {
  const activeInboxFilter = useStore(
    ChatStore,
    (state) => state.activeInboxFilter
  )
  const user_id = getUserInfo()?.user.user_id

  const { data } = useGetInboxQuery()

  const filters = [
    {
      count: data?.all,
      icon: <MessageSquare className="w-4 h-4" />,
      key: {},
      label: 'All',
    },
    {
      count: data?.mine,
      icon: <UserCheck className="w-4 h-4" />,
      key: { assigned_to: user_id },
      label: 'Mine',
    },
    {
      count: data?.unassigned,
      icon: <UserX className="w-4 h-4" />,
      key: { is_assigned: false },
      label: 'Unassigned',
    },
  ]

  return (
    <div className="p-3 space-y-1">
      {filters.map((filter) => (
        <button
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            activeInboxFilter === filter.key
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          key={filter.key}
          onClick={() => setActiveInboxFilter(filter.key)}
          type="button"
        >
          <div className="flex items-center space-x-3">
            {filter.icon}
            <span>{filter.label}</span>
          </div>
          {filter.count > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                activeInboxFilter === filter.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filter.count > 999 ? '999+' : filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
