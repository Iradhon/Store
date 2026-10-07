import Home from './component/Home'
import Main from './component/Main'
import Products from './component/product'
import ProductDetail from './component/ProductDetail'
import Cart from './component/cart'
import Checkout from './component/Checkout'
import OrderSuccess from './component/OrderSuccess'
import Orders from './component/Orders'
import { CartProvider } from './context/CartContext'
import { OrderProvider } from './context/OrderContext'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
  return (
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
              <Route path="order-success/:orderId" element={<OrderSuccess />} />
              <Route path="orders" element={<Orders />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </OrderProvider>
    </CartProvider>
  )
}

export default App