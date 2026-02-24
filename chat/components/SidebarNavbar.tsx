import { setSidebarCollapsed } from '../store2'
import { MessageSquare, X } from 'lucide-react'

type Props = {
  readonly collapsedOnly?: boolean
}

export function SidebarNavbar({ collapsedOnly }: Props) {
  if (collapsedOnly) {
    return (
      // <button
      //   className="p-2 hover:bg-gray-100 rounded-lg"
      //   onClick={() => setSidebarCollapsed(false)}
      //   type="button"
      // >
      //   <MessageSquare className="w-5 h-5 text-gray-600" />
      // </button>
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
        <button
          className="p-2 hover:bg-gray-100 rounded-lg"
          onClick={() => setSidebarCollapsed(false)}
          type="button"
        >
          <MessageSquare className="w-5 h-5 text-gray-600" />
        </button>
        {mainFilters.map((filter) => (
          <button
            key={filter.code}
            className={`p-2 rounded-lg transition-colors relative ${
              activeInboxFilter === filter.key
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveInboxFilter(filter.key)}
            title={filter.label}
            type="button"
          >
            {filter.icon}
            {filter.count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {filter.count > 99 ? '99+' : filter.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
        <button
          className="p-1 hover:bg-gray-100 rounded"
          onClick={() => setSidebarCollapsed(true)}
          type="button"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}
