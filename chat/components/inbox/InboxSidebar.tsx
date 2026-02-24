import useChat, { useGetInboxQuery, useGetTeamInboxQuery } from '../../store'
import { type InboxFilter } from '../../types'
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Phone,
  Plus,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react'
import React from 'react'

const InboxSidebar: React.FC = () => {
  const {
    activeInboxFilter,
    getInboxStats,
    selectedTeamInbox,
    setActiveInboxFilter,
    setSelectedTeamInbox,
    setSidebarCollapsed,
    sidebarCollapsed,
  } = useChat()

  const stats = getInboxStats()

  const { data } = useGetInboxQuery()
  const { data: TeamRespons } = useGetTeamInboxQuery()

  // const mainFilters=data?.mine ??[]
  const mainFilters: Array<{
    color?: string
    count: number
    icon: React.ReactNode
    key: InboxFilter
    label: string
  }> = [
    {
      count: data?.all,
      icon: <MessageSquare className="w-4 h-4" />,
      key: 'all',
      label: 'All',
    },
    {
      count: data?.mine,
      icon: <UserCheck className="w-4 h-4" />,
      key: 'mine',
      label: 'Mine',
    },
    {
      count: data?.unassigned,
      icon: <UserX className="w-4 h-4" />,
      key: 'unassigned',
      label: 'Unassigned',
    },
    {
      count: stats.incomingCalls,
      icon: <Phone className="w-4 h-4" />,
      key: 'incoming_calls',
      label: 'Incoming Calls',
    },
  ]

  const lifecycleFilters = data?.lifecycles ?? []
  const [expandedSections, setExpandedSections] = React.useState({
    campaigns: false,
    industries: false,
    teamInbox: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (sidebarCollapsed) {
    return (
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
            className={`p-2 rounded-lg transition-colors relative ${
              activeInboxFilter === filter.key
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            key={filter.key}
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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
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

      <div className="flex-1 overflow-y-auto">
        {/* Main Filters */}
        <div className="p-3">
          <div className="space-y-1">
            {mainFilters.map((filter) => (
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
        </div>

        {/* Lifecycle Section */}
        <div className="border-t border-gray-100">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Lifecycle
            </h3>
            <div className="space-y-1">
              {lifecycleFilters?.map((filter) => (
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
                    <span className={filter.color}>{filter.icon}</span>
                    <span>{filter.name}</span>
                  </div>
                  {filter.count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        activeInboxFilter === filter.key
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
        </div>

        {/* Team Inbox Section */}
        <div className="border-t border-gray-100">
          <div className="p-3">
            <button
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700"
              onClick={() => toggleSection('teamInbox')}
              type="button"
            >
              <span>Team Inbox</span>
              <div className="flex items-center space-x-1">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Plus className="w-3 h-3" />
                </button>
                {expandedSections.teamInbox ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </div>
            </button>

            {expandedSections.teamInbox && (
              <div className="space-y-1">
                {TeamRespons?.teams.map((team) => (
                  <button
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedTeamInbox === team.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    key={team.id}
                    onClick={() =>
                      setSelectedTeamInbox(
                        selectedTeamInbox === team.id ? null : team.id
                      )
                    }
                    type="button"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4" />
                      <span className="truncate">{team.name}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedTeamInbox === team.id
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
        </div>
      </div>
    </div>
  )
}

export default React.memo(InboxSidebar)
