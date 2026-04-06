import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { store } from './store';

import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-toast-bg)',
              color: 'var(--color-toast-text)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: 'var(--color-success)',
                secondary: 'var(--color-toast-text)',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: 'var(--color-error)',
                secondary: 'var(--color-toast-text)',
              },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
