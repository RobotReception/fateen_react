import { type Snippet } from '../chatComposer.store'

type SnippetDropdownProps = {
  readonly onSelect: (text: Snippet) => void
  readonly snippets: Snippet[]
  readonly visible: boolean
}

export const SnippetDropdown = ({
  onSelect,
  snippets,
  visible,
}: SnippetDropdownProps) => {
  if (!visible || snippets.length === 0) return null

  // const filtered = snippets.filter((s) =>
  //   s.text.toLowerCase().includes(query.toLowerCase())
  // )

  return (
    <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
      {snippets.map((snippet) => (
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
          key={snippet._id}
          onClick={() => onSelect(snippet)}
          type="button"
        >
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {snippet.name}
            </div>
            <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {snippet.message_type}
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
            {snippet.message_type === 'text' &&
              snippet.content?.text &&
              snippet.content.text}
            {snippet.message_type !== 'text' &&
              snippet.content?.caption &&
              snippet.content.caption}
            {!snippet.content?.text &&
              !snippet.content?.caption &&
              snippet.name}
          </div>
        </button>
      ))}
    </div>
  )
}
