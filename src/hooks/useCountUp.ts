import { useEffect, useRef, useState } from 'react'

/** Animate a number from 0 to target (easeOutCubic) once `start` is true. */
export function useCountUp(target: number, duration = 1100, start = true) {
  const [val, setVal] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    if (!start) {
      setVal(0)
      return
    }
    let t0: number | null = null
    const tick = (t: number) => {
      if (t0 === null) t0 = t
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setVal(target)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, start])

  return val
}
