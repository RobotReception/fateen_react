import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./app/App"
import "./index.css"

// ── Auto-reload on stale chunk errors (after new deploy) ──
// Shows a smooth loading screen then reloads — the user sees a natural transition.
const RELOAD_KEY = "chunk-reload"

function smoothReload() {
  const lastReload = sessionStorage.getItem(RELOAD_KEY)
  const now = Date.now()
  if (lastReload && now - Number(lastReload) < 10_000) return // prevent loop

  sessionStorage.setItem(RELOAD_KEY, String(now))

  // Show a full-screen loading overlay so the reload feels seamless
  const overlay = document.createElement("div")
  overlay.setAttribute("style", `
    position:fixed; inset:0; z-index:999999;
    background:var(--t-page, #f9fafb);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;
    opacity:0; transition:opacity 0.25s ease;
  `)
  overlay.innerHTML = `
    <div style="width:36px;height:36px;border:3px solid var(--t-border, #e5e7eb);border-top-color:var(--t-accent, #0145b2);border-radius:50%;animation:spin 0.8s linear infinite"></div>
    <p style="font-size:14px;color:var(--t-text-muted, #6b7280);font-family:inherit;margin:0">جاري تحديث التطبيق...</p>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `
  document.body.appendChild(overlay)
  requestAnimationFrame(() => { overlay.style.opacity = "1" })

  // Reload after the overlay fades in
  setTimeout(() => window.location.reload(), 350)
}

function isChunkError(msg: string) {
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    msg.includes("error loading dynamically imported module") ||
    (msg.includes("Failed to fetch") && msg.includes("/assets/"))
  )
}

window.addEventListener("error", (e) => {
  if (isChunkError(e.message || "")) smoothReload()
})

window.addEventListener("unhandledrejection", (e) => {
  if (isChunkError(String(e.reason?.message || e.reason || ""))) smoothReload()
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
