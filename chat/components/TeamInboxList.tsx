import { useGetTeamInboxQuery } from '../store'
import {
  ChatStore,
  setActiveInboxFilter,
  setSelectedTeamInbox,
} from '../store2'
import { ChevronDown, ChevronRight, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { useStore } from 'zustand'

export function TeamInboxList() {
  const selectedTeamInbox = useStore(
    ChatStore,
    (state) => state.activeInboxFilter
  )

  const { data } = useGetTeamInboxQuery()
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border-t border-gray-100 p-3">
      <button
        className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span>Team Inbox</span>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="w-3 h-3" />
          </button>
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="space-y-1">
          {data?.teams?.map((team) => (
            <button
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTeamInbox?.team_id === team.team_id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              key={team._id}
              onClick={() => setActiveInboxFilter({ team_id: team.team_id })}
              type="button"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4" />
                <span className="truncate">{team.name}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedTeamInbox?.team_id === team.team_id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {team.members_count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
