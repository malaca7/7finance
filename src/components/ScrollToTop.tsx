import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Rola para o topo da página suavemente ao mudar de rota
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto' // 'auto' é mais rápido e evita comportamentos estranhos em SPAs
    });
  }, [pathname]);

  return null;
}
