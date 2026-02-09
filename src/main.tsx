import React from 'react';
import ReactDOM from 'react-dom/client'
import App from '@/App' // 1. Utilise l'import relatif direct ici
import './styles/globals.css' // 2. Vérifie que le dossier styles est bien dans src

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)