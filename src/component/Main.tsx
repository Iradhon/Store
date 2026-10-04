import { Outlet } from 'react-router-dom'
import Navbar from './nav'
import Footer from './footer'

export default function Main() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}