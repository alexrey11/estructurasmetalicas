import { useEffect, useState } from 'react';

export function useAhora(intervaloMs = 1000): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs]);

  return ahora;
}
