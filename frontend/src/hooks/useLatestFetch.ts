import { useEffect, useRef } from 'react'

// Aynı listeyi hedefleyen birden fazla fetch (filtre efekti + silme sonrası
// el ile refetch gibi) çakışabiliyor; yalnızca en son dispatch edilenin
// sonucu uygulanmalı. next() bir istek başlatılırken çağrılır, isCurrent()
// o isteğin yanıtını uygularken kontrol edilir — araya giren bir istek veya
// bileşenin unmount olması onu geçersiz kılar.
export function useLatestFetch() {
  const seqRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  function next(): number {
    return ++seqRef.current
  }

  function isCurrent(seq: number): boolean {
    return mountedRef.current && seqRef.current === seq
  }

  return { next, isCurrent }
}
