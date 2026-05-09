/**
 * L'ÉTÉ — NariVibes Brand
 * Shared Product Catalog
 * Summer 2024 Collection
 */

const PRODUCTS = [
  {
    id: 'aurelia-linen-dress',
    name: 'Aurelia Linen Dress',
    material: 'Natural Linen',
    price: 2800,
    priceDisplay: '₹2,800',
    category: 'dresses',
    collection: 'Summer 2024',
    colors: [
      { name: 'Ivory', hex: '#F5F0E8' },
      { name: 'Sand', hex: '#C8B89A' },
      { name: 'Sage', hex: '#8A9B7C' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'Crafted from pure natural linen, the Aurelia Dress embodies effortless summer elegance. Its relaxed silhouette flows gracefully from a delicate smocked bodice to a sweeping midi length. Designed for the woman who moves through the world with quiet confidence.',
    details: [
      '100% Natural Linen — pre-washed for softness',
      'Hand-wash cold or gentle machine cycle',
      'Lay flat to dry; do not tumble dry',
      'Cool iron on reverse to preserve texture',
      'Exclusive Summer 2024 Collection'
    ],
    images: [
      'https://images.pexels.com/photos/10317113/pexels-photo-10317113.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/36134867/pexels-photo-36134867.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 18,
    featured: false,
    badge: undefined
  },

  {
    id: 'riviera-sun-hat',
    name: 'Riviera Sun Hat',
    material: 'Woven Straw',
    price: 1200,
    priceDisplay: '₹1,200',
    category: 'accessories',
    collection: 'Summer 2024',
    colors: [
      { name: 'Natural', hex: '#D4B896' },
      { name: 'Honey', hex: '#C49A45' }
    ],
    sizes: ['One Size'],
    description:
      'Hand-woven by artisans using traditional techniques, the Riviera Sun Hat is the ultimate companion for sun-drenched days. Its wide, structured brim offers generous shade while the grosgrain ribbon band adds a touch of refined detail. A timeless summer essential that travels beautifully.',
    details: [
      '100% Natural Toquilla Straw — ethically sourced',
      'Grosgrain ribbon interior band for comfort',
      'Spot clean only with damp cloth',
      'Store in the provided dust bag to retain shape',
      'Handcrafted — minor natural variations are a mark of authenticity'
    ],
    images: [
      'https://images.pexels.com/photos/14377294/pexels-photo-14377294.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4155246/pexels-photo-4155246.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 30,
    featured: false,
    badge: undefined
  },

  {
    id: 'azure-silk-trousers',
    name: 'Azure Silk Trousers',
    material: 'Sandwashed Silk',
    price: 2500,
    priceDisplay: '₹2,500',
    category: 'trousers',
    collection: 'Summer 2024',
    colors: [
      { name: 'Azure', hex: '#6FA3C0' },
      { name: 'Ivory', hex: '#F5F0E8' },
      { name: 'Blush', hex: '#E8C4B8' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'The Azure Silk Trousers are a study in refined luxury — their sandwashed finish gives the silk a matte, lived-in softness that drapes impeccably with every step. A wide, elasticated waistband ensures comfort without sacrificing the clean, tailored line. Effortlessly pairs with a silk cami or classic white linen shirt.',
    details: [
      '100% Sandwashed Mulberry Silk',
      'Dry clean recommended; hand-wash in cool water with silk detergent',
      'Do not wring; roll in a towel to remove excess water',
      'Steam to remove creases — do not iron directly',
      'Fully lined with silk habotai'
    ],
    images: [
      'https://images.pexels.com/photos/8767569/pexels-photo-8767569.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/35962173/pexels-photo-35962173.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 12,
    featured: false,
    badge: undefined
  },

  {
    id: 'cami-silk-top',
    name: 'Cami Silk Top',
    material: 'Crepe de Chine',
    price: 1800,
    priceDisplay: '₹1,800',
    category: 'tops',
    collection: 'Summer 2024',
    colors: [
      { name: 'Champagne', hex: '#F0DEB4' },
      { name: 'Blush', hex: '#E8C4B8' },
      { name: 'Midnight', hex: '#2A2A3E' },
      { name: 'Ivory', hex: '#F5F0E8' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'The Cami Silk Top is sculpted from the finest Crepe de Chine — a fabric prized for its fluid drape and subtle matte sheen. Adjustable silk-covered straps and a gently curved neckline make it equally beautiful worn alone or layered beneath a linen blazer. A foundational piece for the modern wardrobe.',
    details: [
      '100% Silk Crepe de Chine — 16 momme weight',
      'Hand-wash cold or dry clean',
      'Do not tumble dry; hang to air dry away from direct sunlight',
      'Low iron on silk setting, reverse side only',
      'Adjustable spaghetti straps with silk-covered hardware'
    ],
    images: [
      'https://images.pexels.com/photos/8767580/pexels-photo-8767580.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2933636/pexels-photo-2933636.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 22,
    featured: false,
    badge: undefined
  },

  {
    id: 'solano-leather-sandal',
    name: 'Solano Leather Sandal',
    material: 'Vachetta Leather',
    price: 2200,
    priceDisplay: '₹2,200',
    category: 'footwear',
    collection: 'Summer 2024',
    colors: [
      { name: 'Natural Tan', hex: '#C49A65' },
      { name: 'Cognac', hex: '#8B4513' }
    ],
    sizes: ['35', '36', '37', '38', '39', '40', '41'],
    description:
      'The Solano Sandal is a love letter to the Italian Riviera — handcrafted from buttery Vachetta leather that develops a rich patina over time. A contoured footbed and hand-stitched straps mold naturally to the foot, making these sandals as comfortable as they are beautiful. Wear them from the beach to the boulevard.',
    details: [
      '100% Full-grain Vachetta Leather upper and footbed',
      'Leather sole with natural rubber reinforcement',
      'Handcrafted in limited quantities',
      'Condition with leather cream periodically; avoid prolonged water exposure',
      'Natural patina development is a hallmark of Vachetta leather'
    ],
    images: [
      'https://images.pexels.com/photos/368740/pexels-photo-368740.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3155234/pexels-photo-3155234.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 14,
    featured: false,
    badge: undefined
  },

  {
    id: 'classic-linen-shirt',
    name: 'Classic Linen Shirt',
    material: 'Pure White Linen',
    price: 1600,
    priceDisplay: '₹1,600',
    category: 'tops',
    collection: 'Summer 2024',
    colors: [
      { name: 'White', hex: '#FAFAF8' },
      { name: 'Ecru', hex: '#EDE0CB' },
      { name: 'Sky', hex: '#B8D4E3' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    description:
      'The Classic Linen Shirt is an eternal wardrobe cornerstone, reimagined with precise tailoring and a slightly relaxed fit that flows beautifully in the summer breeze. Stone-washed European linen ensures a softness from the very first wear. Wear it open over a swimsuit or tucked into silk trousers for effortless polish.',
    details: [
      '100% European Stone-washed Linen — OEKO-TEX certified',
      'Mother-of-pearl buttons',
      'Machine wash cool, gentle cycle',
      'Tumble dry low or line dry',
      'Iron while slightly damp for a crisp finish; wrinkles are natural and part of its character'
    ],
    images: [
      'https://images.pexels.com/photos/5439054/pexels-photo-5439054.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/8886950/pexels-photo-8886950.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 35,
    featured: false,
    badge: undefined
  },

  {
    id: 'silk-sun-dress',
    name: 'Silk Sun Dress',
    material: 'Sandwashed Silk',
    price: 2900,
    priceDisplay: '₹2,900',
    category: 'dresses',
    collection: 'Summer 2024',
    colors: [
      { name: 'Saffron', hex: '#F4A832' },
      { name: 'Ivory', hex: '#F5F0E8' },
      { name: 'Terracotta', hex: '#C0622D' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'The Silk Sun Dress is the centrepiece of the Summer 2024 Collection — a fluid maxi silhouette in the finest sandwashed silk that catches every shift of light. A tie-detail halter neck and open back create a sensuous yet graceful form. This is the dress for every sun-drenched memory you are yet to make.',
    details: [
      '100% Sandwashed Mulberry Silk — 22 momme',
      'Fully self-lined with silk charmeuse',
      'Dry clean recommended; hand-wash cold as alternative',
      'Steam to refresh; do not iron directly on silk',
      'Adjustable halter tie neck for a custom fit'
    ],
    images: [
      'https://images.pexels.com/photos/6387638/pexels-photo-6387638.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/8710793/pexels-photo-8710793.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 8,
    featured: true,
    badge: 'New Arrival'
  },

  {
    id: 'riviera-sunglasses',
    name: 'Riviera Sunglasses',
    material: 'Acetate Frame',
    price: 1500,
    priceDisplay: '₹1,500',
    category: 'accessories',
    collection: 'Summer 2024',
    colors: [
      { name: 'Tortoiseshell', hex: '#8B5E2A' },
      { name: 'Ivory', hex: '#F5F0E8' },
      { name: 'Noir', hex: '#1A1A1A' }
    ],
    sizes: ['One Size'],
    description:
      'Inspired by the golden era of French Riviera glamour, the Riviera Sunglasses marry oversized drama with everyday wearability. Crafted from Italian bio-acetate with polarised mineral glass lenses, they offer exceptional UV protection without compromising clarity. Arrives in a hand-stitched suede case.',
    details: [
      'Italian bio-acetate frame — lightweight and hypoallergenic',
      'Polarised mineral glass lenses with UV400 protection',
      'Gold-plated stainless steel hinges',
      'Includes hand-stitched suede case and microfibre cloth',
      'Clean lenses with the provided cloth only'
    ],
    images: [
      'https://images.pexels.com/photos/3193648/pexels-photo-3193648.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/947844/pexels-photo-947844.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 20,
    featured: false,
    badge: undefined
  },

  {
    id: 'woven-straw-tote',
    name: 'Woven Straw Tote',
    material: 'Natural Straw',
    price: 1800,
    priceDisplay: '₹1,800',
    category: 'accessories',
    collection: 'Summer 2024',
    colors: [
      { name: 'Natural', hex: '#D4B896' },
      { name: 'Natural/Black', hex: '#C4A882' }
    ],
    sizes: ['One Size'],
    description:
      'The Woven Straw Tote is a summer essential that transitions from market mornings to seaside afternoons with ease. Hand-woven by skilled artisans using sustainably sourced straw, it features a supple leather interior, a zip-close inner pocket, and leather-wrapped handles. Generously sized to carry everything you need.',
    details: [
      'Sustainably sourced natural straw exterior',
      'Full leather lining — Italian vegetable-tanned',
      'Interior zip pocket and two open slip pockets',
      'Leather-wrapped top handles; 30cm drop',
      'Spot clean exterior; wipe leather interior with damp cloth'
    ],
    images: [
      'https://images.pexels.com/photos/8093163/pexels-photo-8093163.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/6045068/pexels-photo-6045068.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 16,
    featured: false,
    badge: 'Bestseller'
  },

  {
    id: 'coastal-wrap-skirt',
    name: 'Coastal Wrap Skirt',
    material: 'Linen Blend',
    price: 1400,
    priceDisplay: '₹1,400',
    category: 'trousers',
    collection: 'Summer 2024',
    colors: [
      { name: 'Sand', hex: '#C8B89A' },
      { name: 'White', hex: '#FAFAF8' },
      { name: 'Stripe', hex: '#B8C9D4' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'The Coastal Wrap Skirt channels the effortless spirit of summer with its relaxed wrap silhouette and breathable linen blend fabric. A generous tie allows the fit to be adjusted to your preference, from a demure midi to a playful side split. The ultimate piece for travel, the beach, or an alfresco dinner.',
    details: [
      '55% Linen, 45% Cotton — pre-washed for softness',
      'Self-tie wrap design with an adjustable fit',
      'Machine wash cool, gentle cycle',
      'Line dry recommended to preserve fabric integrity',
      'Cool iron if required'
    ],
    images: [
      'https://images.pexels.com/photos/5447529/pexels-photo-5447529.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/16239658/pexels-photo-16239658.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 25,
    featured: false,
    badge: undefined
  },

  {
    id: 'tan-leather-sandal',
    name: 'Tan Leather Sandal',
    material: 'Full Grain Leather',
    price: 1800,
    priceDisplay: '₹1,800',
    category: 'footwear',
    collection: 'Summer 2024',
    colors: [
      { name: 'Tan', hex: '#B8864E' },
      { name: 'White', hex: '#F0EDE8' }
    ],
    sizes: ['35', '36', '37', '38', '39', '40', '41'],
    description:
      'A pared-back summer staple, the Tan Leather Sandal is built on a single principle: that true quality requires no excess ornamentation. Full-grain leather upper straps and a padded leather footbed offer enduring comfort, while the slim profile and clean lines ensure it pairs with everything from a wrap skirt to wide-leg trousers.',
    details: [
      '100% Full-grain vegetable-tanned leather upper',
      'Cushioned leather-wrapped footbed',
      'Rubber-reinforced leather outsole for durability',
      'Wipe clean with a slightly damp cloth; condition seasonally',
      'Handcrafted — allow a short break-in period'
    ],
    images: [
      'https://images.pexels.com/photos/13991819/pexels-photo-13991819.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/8751931/pexels-photo-8751931.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 20,
    featured: false,
    badge: undefined
  },

  {
    id: 'linen-wide-leg-pants',
    name: 'Linen Wide-Leg Pants',
    material: 'Premium Linen',
    price: 2200,
    priceDisplay: '₹2,200',
    category: 'trousers',
    collection: 'Summer 2024',
    colors: [
      { name: 'Ivory', hex: '#F5F0E8' },
      { name: 'Camel', hex: '#C9A96E' },
      { name: 'Black', hex: '#1A1A1A' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'The Linen Wide-Leg Pants redefine relaxed sophistication. Cut from premium Irish linen with a generous sweep through the leg, they move with the grace of a wider silhouette while remaining breathable in even the warmest climates. An elasticated waistband with a covered drawstring ensures an effortless, comfortable fit all day long.',
    details: [
      '100% Premium Irish Linen — OEKO-TEX Standard 100 certified',
      'Elasticated waistband with interior drawstring',
      'Two side seam pockets',
      'Machine wash cool; line dry for best results',
      'Natural linen creasing is expected and part of the aesthetic'
    ],
    images: [
      'https://images.pexels.com/photos/10317106/pexels-photo-10317106.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/10317127/pexels-photo-10317127.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    stock: 19,
    featured: true,
    badge: undefined
  }
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Returns a single product by its slug id, or undefined if not found.
 * @param {string} id
 * @returns {Object|undefined}
 */
function getProductById(id) {
  return PRODUCTS.find(function (product) {
    return product.id === id;
  });
}

/**
 * Returns all products belonging to the specified category.
 * @param {string} category - 'dresses' | 'tops' | 'trousers' | 'accessories' | 'footwear'
 * @returns {Object[]}
 */
function getProductsByCategory(category) {
  return PRODUCTS.filter(function (product) {
    return product.category === category;
  });
}

/**
 * Returns all products marked as featured.
 * @returns {Object[]}
 */
function getFeaturedProducts() {
  return PRODUCTS.filter(function (product) {
    return product.featured === true;
  });
}

/**
 * Returns related products from the same category, excluding the given product.
 * Falls back to products from other categories if not enough same-category products exist.
 * @param {string} productId
 * @param {number} count - number of related products to return (default 3)
 * @returns {Object[]}
 */
function getRelatedProducts(productId, count) {
  if (count === undefined) {
    count = 3;
  }

  var source = getProductById(productId);
  if (!source) {
    return PRODUCTS.slice(0, count);
  }

  var sameCategory = PRODUCTS.filter(function (product) {
    return product.category === source.category && product.id !== productId;
  });

  if (sameCategory.length >= count) {
    return sameCategory.slice(0, count);
  }

  // Pad with products from other categories if needed
  var others = PRODUCTS.filter(function (product) {
    return product.category !== source.category && product.id !== productId;
  });

  return sameCategory.concat(others).slice(0, count);
}
