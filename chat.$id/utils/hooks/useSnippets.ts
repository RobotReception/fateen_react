// File: useSnippets.ts

const fetchSnippets = async () => {
  try {
    const { data } = await Client.GET('/api/backend/v1/api/snippets')
    if (data?.data) {
      setSnippets(data.data.snippets)
    }
  } catch (error) {
    console.error('Error fetching snippets:', error)
  }
}

import { useEffect, useMemo, useState } from 'react'

export type Snippet = {
  id: string
  title: string
  content: string
}

export function useSnippetsLogic(
  message: string,
  setMessage: (val: string) => void
) {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)

  useEffect(() => {
    getSnippets().then(setSnippets).catch(console.error)
  }, [])

  const filteredSnippets = useMemo(() => {
    if (!message.startsWith('/')) return []
    const query = message.slice(1).toLowerCase()
    return snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query)
    )
  }, [message, snippets])

  const showSnippets = message.startsWith('/') && filteredSnippets.length > 0

  const handleSnippetSelect = (snippet: Snippet | null) => {
    setSelectedSnippet(snippet)
    if (snippet) {
      setMessage(snippet.content)
    }
  }

  return {
    selectedSnippet,
    showSnippets,
    filteredSnippets,
    handleSnippetSelect,
  }
}
