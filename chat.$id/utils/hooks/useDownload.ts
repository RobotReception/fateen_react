import { useMutation } from '@tanstack/react-query'

export const useDownload = () => {
  return useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`فشل التحميل: ${response.statusText}`)
      }

      const blob = await response.blob()

      // جلب اسم الملف من الـ URL
      const urlParts = url.split('/')
      const filename = urlParts[urlParts.length - 1] || 'download'

      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      return true
    },

    onError: (error: any) => {
      refs.toast({
        detail: error?.message || 'حدث خطأ أثناء التحميل',
        life: 3_000,
        severity: 'error',
        summary: 'خطأ',
      })
    },
  })
}
