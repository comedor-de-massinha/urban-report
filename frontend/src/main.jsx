import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{ duration: 4000 }}
        children={(t) => (
          <div
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm w-full
              ${t.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => toast.remove(t.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
