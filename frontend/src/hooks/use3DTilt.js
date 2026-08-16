import { useRef, useCallback } from "react"

export function use3DTilt({ max = 12, scale = 1.04, glare = true } = {}) {
  const ref = useRef(null)
  const glareRef = useRef(null)
  const raf = useRef(null)

  const onMouseMove = useCallback((e) => {
    if (!ref.current) return
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      const rotateX = (0.5 - y) * max * 2
      const rotateY = (x - 0.5) * max * 2
      el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale},${scale},${scale})`
      el.style.transition = "transform 0.08s linear"
      if (glare && glareRef.current) {
        const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90
        const dist = Math.hypot(x - 0.5, y - 0.5) * 2
        glareRef.current.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,${dist * 0.18}) 0%, transparent 80%)`
        glareRef.current.style.opacity = "1"
      }
    })
  }, [max, scale, glare])

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
    ref.current.style.transition = "transform 0.5s cubic-bezier(0.25,1,0.5,1)"
    if (glare && glareRef.current) {
      glareRef.current.style.opacity = "0"
    }
  }, [glare])

  const glareStyle = {
    position: "absolute", inset: 0, borderRadius: "inherit",
    pointerEvents: "none", zIndex: 9, opacity: 0,
    transition: "opacity 0.3s",
  }

  return { ref, glareRef, glareStyle, handlers: { onMouseMove, onMouseLeave } }
}
