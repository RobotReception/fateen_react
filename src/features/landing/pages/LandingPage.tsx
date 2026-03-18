import { useEffect, useRef } from "react"

/**
 * LandingPage — renders the static landing page HTML inside the React app.
 * Fetches /landing.html, extracts <body> content + <style> blocks,
 * injects them, and runs the embedded <script> logic.
 */
export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/landing.html")
        const html = await res.text()
        if (cancelled || !containerRef.current) return

        const parser = new DOMParser()
        const doc = parser.parseFromString(html, "text/html")

        // ── 1. Inject inline <style> blocks ──
        const styles = doc.querySelectorAll("style")
        const styleElements: HTMLStyleElement[] = []
        styles.forEach((s) => {
          const el = document.createElement("style")
          el.textContent = s.textContent
          el.setAttribute("data-landing", "true")
          document.head.appendChild(el)
          styleElements.push(el)
        })

        // ── 2. Inject <link> stylesheets (e.g. Google Fonts, landing/style.css) ──
        const links = doc.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"]')
        const linkElements: HTMLElement[] = []
        links.forEach((l) => {
          const el = l.cloneNode(true) as HTMLElement
          el.setAttribute("data-landing", "true")
          document.head.appendChild(el)
          linkElements.push(el)
        })

        // ── 3. Inject body content ──
        const bodyHTML = doc.body.innerHTML
        // Remove <script> tags from body HTML (we'll execute them separately)
        const cleanBody = bodyHTML.replace(/<script[\s\S]*?<\/script>/gi, "")
        containerRef.current.innerHTML = cleanBody

        // ── 4. Override body styles for landing ──
        const savedBodyStyles = {
          fontFamily: document.body.style.fontFamily,
          background: document.body.style.background,
          color: document.body.style.color,
          direction: document.body.style.direction,
          lineHeight: document.body.style.lineHeight,
          cursor: document.body.style.cursor,
          overflowX: document.body.style.overflowX,
        }
        document.body.style.fontFamily = "'Tajawal', sans-serif"
        document.body.style.cursor = "none"
        document.body.style.overflowX = "hidden"
        document.documentElement.style.scrollBehavior = "smooth"
        document.documentElement.style.scrollPaddingTop = "80px"

        // ── 5. Execute scripts ──
        const scripts = doc.querySelectorAll("script")
        scripts.forEach((s) => {
          if (s.textContent) {
            try {
              // eslint-disable-next-line no-new-func
              new Function(s.textContent)()
            } catch (e) {
              console.warn("[LandingPage] Script error:", e)
            }
          }
        })

        // ── Cleanup function ──
        cleanupRef.current = () => {
          // Remove injected styles
          styleElements.forEach((el) => el.remove())
          linkElements.forEach((el) => el.remove())
          // Restore body styles
          Object.assign(document.body.style, savedBodyStyles)
          document.documentElement.style.scrollBehavior = ""
          document.documentElement.style.scrollPaddingTop = ""
          // Remove cursor elements that may have been added
          document.getElementById("cur")?.remove()
          document.getElementById("cur-ring")?.remove()
          // Clear container
          if (containerRef.current) containerRef.current.innerHTML = ""
        }
      } catch (e) {
        console.error("[LandingPage] Failed to load:", e)
      }
    }

    load()

    return () => {
      cancelled = true
      cleanupRef.current?.()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      id="landing-root"
      style={{ minHeight: "100vh" }}
    />
  )
}
