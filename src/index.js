import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { EuiProvider } from '@elastic/eui'
import  { Toaster } from 'react-hot-toast'
import '@elastic/eui/dist/eui_theme_light.css'
import 'react-tabs/style/react-tabs.css'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <EuiProvider colorMode='light'>
      <App />

      <Toaster
        position='top-center'
        reverseOrder={false} />
    </EuiProvider>
  </React.StrictMode>
)

reportWebVitals()
