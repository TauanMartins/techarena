import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import App from './App';
import { InstallProvider } from './features/installation/InstallProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InstallProvider>
      <App />
    </InstallProvider>
  </StrictMode>,
);
