import type { AddToCartResult } from '../context/useCart'
import type { Product } from '../types'

export function getAddToCartFeedback(
  product: Product,
  requestedQuantity: number,
  result: AddToCartResult,
) {
  if (product.inventoryQuantity <= 0) {
    return { tone: 'alert' as const, message: `${product.name} is out of stock. Please check back later.` }
  }

  if (result.addedQuantity === 0) {
    return {
      tone: 'alert' as const,
      message: result.inventoryRemainingQuantity === 0
        ? `All available ${product.name} stock is already in your cart.`
        : `You already have the maximum allowed quantity of ${product.name} in your cart.`,
    }
  }

  if (result.addedQuantity < requestedQuantity) {
    return {
      tone: 'alert' as const,
      message: result.inventoryRemainingQuantity === 0
        ? `Only ${result.addedQuantity} ${result.addedQuantity === 1 ? 'unit' : 'units'} of ${product.name} could be added; that is all the available stock.`
        : `Only ${result.addedQuantity} ${result.addedQuantity === 1 ? 'unit' : 'units'} of ${product.name} could be added; the cart quantity limit was reached.`,
    }
  }

  return {
    tone: 'success' as const,
    message: result.inventoryRemainingQuantity === 0
      ? `Added ${result.addedQuantity} × ${product.name}. All available stock is now in your cart.`
      : result.remainingQuantity === 0
        ? `Added ${result.addedQuantity} × ${product.name}. The cart quantity limit has been reached.`
        : `Added ${result.addedQuantity} × ${product.name} to your cart.`,
  }
}
