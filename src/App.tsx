import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import ListingDetail from './pages/ListingDetail'
import AuthPage from './pages/AuthPage'
import NewListing from './pages/NewListing'
import MessagesPage from './pages/MessagesPage'
import MyListings from './pages/MyListings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/new" element={<NewListing />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:id" element={<MessagesPage />} />
        <Route path="/mine" element={<MyListings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  )
}
