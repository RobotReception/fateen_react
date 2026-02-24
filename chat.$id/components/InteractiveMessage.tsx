export const InteractiveMessage = ({
  content,
  onSelect,
}: {
  content: {
    text?: string
    buttons?: { id: string; title: string }[]
    options?: { id: string; title: string }[]
  }
  onSelect: (optionId: string) => void
}) => (
  <div className="flex flex-col gap-2">
    {content.text && (
      <p className="text-sm font-medium text-gray-800">{content.text}</p>
    )}

    {/* أزرار تفاعلية */}
    {content.buttons && (
      <div className="flex flex-wrap gap-2">
        {content.buttons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onSelect(btn.id)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition"
          >
            {btn.title}
          </button>
        ))}
      </div>
    )}

    {/* قائمة خيارات */}
    {content.options && (
      <select
        className="px-2 py-1 rounded-md border border-gray-300 bg-white text-sm"
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">اختر خيارًا</option>
        {content.options.map((opt) => (
          <option
            key={opt.id}
            value={opt.id}
          >
            {opt.title}
          </option>
        ))}
      </select>
    )}
  </div>
)
