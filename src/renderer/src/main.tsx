import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TeleprompterApp } from './app/TeleprompterApp';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeleprompterApp />
  </StrictMode>,
);
