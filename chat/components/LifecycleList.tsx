import { useGetInboxQuery } from '../store'
import { ChatStore, setActiveInboxFilter } from '../store2'
import { useStore } from 'zustand'

export function LifecycleList() {
  const activeInboxFilter = useStore(
    ChatStore,
    (state) => state.activeInboxFilter
  )
  const { data } = useGetInboxQuery()
  const lifecycles = data?.lifecycles ?? []

  if (!lifecycles.length) return null

  return (
    <div className="border-t border-gray-100 p-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Lifecycle
      </h3>
      <div className="space-y-1">
        {lifecycles.map((filter) => (
          <button
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              activeInboxFilter?.lifecycle === filter.code
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            key={filter.code}
            onClick={() => setActiveInboxFilter({ lifecycle: filter.code })}
            type="button"
          >
            <div className="flex items-center space-x-3">
              <span className={filter.color}>{filter.icon}</span>
              <span>{filter.name}</span>
            </div>
            {filter.count > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  activeInboxFilter?.lifecycle === filter.code
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {filter.count > 99 ? '99+' : filter.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
