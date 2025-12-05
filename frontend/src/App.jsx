import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Journals from './pages/Journals'
import JournalDetail from './pages/JournalDetail'
import Trademarks from './pages/Trademarks'
import TrademarkDetail from './pages/TrademarkDetail'
import Search from './pages/Search'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/journals" element={<Journals />} />
        <Route path="/journals/:id" element={<JournalDetail />} />
        <Route path="/trademarks" element={<Trademarks />} />
        <Route path="/trademarks/:id" element={<TrademarkDetail />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </Layout>
  )
}

export default App
