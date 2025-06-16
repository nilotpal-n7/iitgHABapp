import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MessList from './MessPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MessList />
  </StrictMode>,
)
