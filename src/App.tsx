import Home from './component/Home'
import Main from './component/Main'
import Products from './component/product'
import ProductDetail from './component/ProductDetail'
import Cart from './component/cart'
import Checkout from './component/Checkout'
import OrderDetails from './component/OrderDetails'
import Orders from './component/Orders'
import Auth from './component/Auth'
import AdminCatalog from './component/AdminCatalog'
import AdminLayout from './component/AdminLayout'
import AdminDashboard from './component/AdminDashboard'
import AdminCategories from './component/AdminCategories'
import AdminOrders from './component/AdminOrders'
import AdminCustomers from './component/AdminCustomers'
import AccountLayout from './component/AccountLayout'
import AccountOverview from './component/AccountOverview'
import AccountWishlist from './component/AccountWishlist'
import AccountProfile from './component/AccountProfile'
import AccountAddresses from './component/AccountAddresses'
import { CartProvider } from './context/CartContext'
import { OrderProvider } from './context/OrderContext'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { CatalogProvider } from './context/CatalogContext'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CatalogProvider>
          <CartProvider>
            <OrderProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Main />}>
                    <Route index element={<Home />} />
                    <Route path="products" element={<Products />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:orderId" element={<OrderDetails />} />
                    <Route path="auth" element={<Auth />} />
                    <Route path="account" element={<AccountLayout />}>
                      <Route index element={<AccountOverview />} />
                      <Route path="orders" element={<div className="account-orders"><Orders /></div>} />
                      <Route path="orders/:orderId" element={<div className="account-orders"><OrderDetails /></div>} />
                      <Route path="wishlist" element={<AccountWishlist />} />
                      <Route path="profile" element={<AccountProfile />} />
                      <Route path="addresses" element={<AccountAddresses />} />
                    </Route>
                    <Route path="admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<AdminCatalog />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="customers" element={<AdminCustomers />} />
                    </Route>
                  </Route>
                </Routes>
              </BrowserRouter>
            </OrderProvider>
          </CartProvider>
        </CatalogProvider>
      </WishlistProvider>
    </AuthProvider>
  )
}

export default App
