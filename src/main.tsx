import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Tipografía redondeada Fredoka (OFL-1.1), empaquetada localmente por Vite: no depende de servicios externos.
import '@fontsource-variable/fredoka';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
