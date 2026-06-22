import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("main.jsx executing!");

try {
  const rootElement = document.getElementById('root');
  console.log("Root element:", rootElement);
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log("createRoot.render called successfully!");
} catch (error) {
  console.error("Error in main.jsx:", error);
}
