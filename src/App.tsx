import { AppShell } from './app/AppShell'
import { RootRedirect } from './app/RootRedirect'
import { useAppRoute } from './app/useAppRoute'

function App() {
  const route = useAppRoute()

  if (route === 'root') {
    return <RootRedirect />
  }

  return <AppShell route={route} />
}

export default App
