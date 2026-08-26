import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateFirestoreConnection } from './lib/firebase';

// Validate Firestore connection on boot
validateFirestoreConnection().catch((err) => {
  console.error('Firestore startup connection test:', err);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

