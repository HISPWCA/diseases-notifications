import { Provider } from '@dhis2/app-runtime'
import { HeaderBar } from '@dhis2/ui'
import Datalist from './components/Datalist'
import { FULL_ROUTE } from './utils/api.routes'

export const BASE_ROUTE = FULL_ROUTE.substring(0, FULL_ROUTE.indexOf('/api'))

const App = () => {
  return (
    <Provider config={{ apiVersion: 29, baseUrl: BASE_ROUTE }}>
      <HeaderBar appName="Alert and Outbreak Management" />

      <div style={{ height: window.innerHeight - 50 }} className='bg-slate-50 overflow-hidden'>
        <div className='container- mx-auto- px-4- '>
          <Datalist />
        </div>

        {/* <div style={{ marginTop: '10px', textAlign: 'center', color: 'rgba(0,0,0,0.8)' }}>
          <em>
            <small>
              Proudly built by HISPWCA
            </small>
          </em>
        </div> */}
      </div>
    </Provider>
  )
}

export default App
