/**
 * L'ÉTÉ — NariVibes Brand
 * Shared Cart Management Module
 * localStorage-based, no external dependencies
 */

const Cart = {

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  /**
   * Reads and parses the cart items from localStorage.
   * Returns an empty array if nothing is stored or parsing fails.
   * @returns {Object[]}
   */
  _getItems() {
    try {
      const raw = localStorage.getItem('lete_cart');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('[Cart] Failed to read from localStorage:', e);
      return [];
    }
  },

  /**
   * Serialises and saves the cart items array to localStorage.
   * @param {Object[]} items
   */
  _save(items) {
    try {
      localStorage.setItem('lete_cart', JSON.stringify(items));
    } catch (e) {
      console.error('[Cart] Failed to save to localStorage:', e);
    }
  },

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Returns the current array of cart items.
   * @returns {Object[]}
   */
  getItems() {
    return this._getItems();
  },

  /**
   * Adds a product variant to the cart.
   * If the same productId + color + size combination already exists in the cart,
   * its quantity is incremented rather than creating a duplicate entry.
   *
   * @param {Object} product  - A product object from the PRODUCTS catalog
   * @param {string} color    - Selected colour name (e.g. "Ivory")
   * @param {string} size     - Selected size (e.g. "M" or "38")
   * @param {number} [qty=1]  - Quantity to add
   */
  addItem(product, color, size, qty = 1) {
    if (!product || !color || !size) {
      console.warn('[Cart] addItem requires product, color and size.');
      return;
    }

    const items = this._getItems();

    // Look for an existing matching entry
    const existing = items.find(
      (item) =>
        item.productId === product.id &&
        item.color === color &&
        item.size === size
    );

    if (existing) {
      existing.qty += qty;
    } else {
      // Generate a unique cart item ID (timestamp + random suffix)
      const cartItemId =
        'ci_' +
        Date.now().toString(36) +
        '_' +
        Math.random().toString(36).slice(2, 8);

      items.push({
        cartItemId,
        productId:    product.id,
        name:         product.name,
        material:     product.material,
        price:        product.price,
        priceDisplay: product.priceDisplay,
        image:        Array.isArray(product.images) && product.images.length > 0
                        ? product.images[0]
                        : '',
        color,
        size,
        qty
      });
    }

    this._save(items);
    this.updateBadge();
  },

  /**
   * Removes the cart item with the given cartItemId entirely.
   * @param {string} cartItemId
   */
  removeItem(cartItemId) {
    const items = this._getItems().filter(
      (item) => item.cartItemId !== cartItemId
    );
    this._save(items);
    this.updateBadge();
  },

  /**
   * Adjusts the quantity of a cart item by a delta value (+1 or -1).
   * If the resulting quantity reaches 0 or below, the item is removed.
   * @param {string} cartItemId
   * @param {number} delta - Typically +1 or -1
   */
  updateQty(cartItemId, delta) {
    const items = this._getItems();
    const item = items.find((i) => i.cartItemId === cartItemId);

    if (!item) {
      console.warn('[Cart] updateQty: item not found —', cartItemId);
      return;
    }

    item.qty += delta;

    const updated = item.qty > 0
      ? items
      : items.filter((i) => i.cartItemId !== cartItemId);

    this._save(updated);
    this.updateBadge();
  },

  /**
   * Returns the total number of individual units across all cart items.
   * @returns {number}
   */
  getCount() {
    return this._getItems().reduce((sum, item) => sum + item.qty, 0);
  },

  /**
   * Returns the cart subtotal as a raw number (no shipping).
   * @returns {number}
   */
  getSubtotal() {
    return this._getItems().reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
  },

  /**
   * Returns the cart subtotal as a formatted Indian Rupee string.
   * @returns {string} e.g. "₹36,000"
   */
  getSubtotalDisplay() {
    return this.formatPrice(this.getSubtotal());
  },

  /**
   * Calculates the shipping cost.
   * FREE (0) for orders with a subtotal of ₹5,000 or above; otherwise ₹500.
   * @returns {number}
   */
  getShipping() {
    return this.getSubtotal() >= 5000 ? 0 : 500;
  },

  /**
   * Returns the shipping cost as a display string.
   * @returns {string} "FREE" or "₹500"
   */
  getShippingDisplay() {
    const shipping = this.getShipping();
    return shipping === 0 ? 'FREE' : this.formatPrice(shipping);
  },

  /**
   * Returns the order total (subtotal + shipping) as a raw number.
   * @returns {number}
   */
  getTotal() {
    return this.getSubtotal() + this.getShipping();
  },

  /**
   * Returns the order total as a formatted Indian Rupee string.
   * @returns {string} e.g. "₹36,500"
   */
  getTotalDisplay() {
    return this.formatPrice(this.getTotal());
  },

  /**
   * Clears all items from the cart and updates the badge.
   */
  clear() {
    this._save([]);
    this.updateBadge();
  },

  /**
   * Updates every element with the class 'cart-count-badge' to reflect
   * the current cart item count. Hides the badge when the count is zero.
   */
  updateBadge() {
    const count = this.getCount();
    const badges = document.querySelectorAll('.cart-count-badge');

    badges.forEach((badge) => {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = '';
        badge.setAttribute('aria-label', count + ' items in cart');
      } else {
        badge.textContent = '0';
        badge.style.display = 'none';
        badge.setAttribute('aria-label', 'Cart is empty');
      }
    });
  },

  /**
   * Formats a numeric amount using Indian number formatting (lakh/crore grouping)
   * and prepends the Rupee symbol.
   *
   * Examples:
   *   formatPrice(9500)  → "₹9,500"
   *   formatPrice(24500) → "₹24,500"
   *   formatPrice(100000)→ "₹1,00,000"
   *
   * @param {number} amount
   * @returns {string}
   */
  formatPrice(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0';

    // Use Intl.NumberFormat for reliable Indian locale formatting
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
        .format(amount)
        .replace('₹', '₹')      // Normalise symbol (Intl may render as ₹ or Rs)
        .replace(/^Rs\.?\s*/, '₹')  // Fallback: replace "Rs" with ₹
        .trim();
    } catch (e) {
      // Manual fallback for environments where Intl is unavailable
      const str = Math.round(amount).toString();
      let result = '';
      let len = str.length;

      if (len <= 3) {
        result = str;
      } else {
        // Last 3 digits
        result = str.slice(len - 3);
        len -= 3;
        // Remaining digits in groups of 2
        while (len > 0) {
          const chunk = len >= 2 ? str.slice(len - 2, len) : str.slice(0, len);
          result = chunk + ',' + result;
          len -= 2;
        }
      }

      return '₹' + result;
    }
  }

};

// ---------------------------------------------------------------------------
// Initialise badge on page load
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());
