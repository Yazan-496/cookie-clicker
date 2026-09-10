import { Buffer } from 'buffer'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// @solana/web3.js expects Node's Buffer to exist in the browser.
globalThis.Buffer = globalThis.Buffer ?? Buffer

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
