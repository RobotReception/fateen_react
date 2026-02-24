// FilePreview.tsx placeholder (used above)
// In real code, you'd place this in its own file and enhance preview behavior
export const FilePreview: FC<{
  readonly file: File
  readonly onRemove: () => void
}> = ({ file, onRemove }) => (
  <div className="border rounded p-2 bg-gray-100 relative">
    <p className="text-sm">File: {file.name}</p>
    <button
      className="absolute top-1 right-1 text-xs text-red-500"
      onClick={onRemove}
    >
      ✕
    </button>
  </div>
)
