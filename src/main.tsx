import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import App from './App';

function Root() {
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
      });
    }
  }, []);

  return <React.StrictMode><App /></React.StrictMode>;
}

createRoot(document.getElementById('root')!).render(<Root />);
