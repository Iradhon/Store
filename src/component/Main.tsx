import { Outlet } from 'react-router-dom'
import Navbar from './nav'
import Footer from './footer'
import { useWishlist } from '../context/useWishlist'
import '../component/styles/main.css'

export default function Main() {
  const { notice, noticeTone } = useWishlist()

  return (
    <>
      <Navbar />
      {notice && <div className={`account-toast${noticeTone === 'error' ? ' account-toast--error' : ''}`} role={noticeTone === 'error' ? 'alert' : 'status'} aria-live="polite">{notice}</div>}
      <main className="main" role="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
