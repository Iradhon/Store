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
import { CartProvider } from './context/CartContext'
import { OrderProvider } from './context/OrderContext'
import { AuthProvider } from './context/AuthContext'
import { CatalogProvider } from './context/CatalogContext'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <AuthProvider>
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
                  <Route path="admin/products" element={<AdminCatalog />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </OrderProvider>
        </CartProvider>
      </CatalogProvider>
    </AuthProvider>
  )
}

export default App
