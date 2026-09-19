// Bilingual dictionary (EN / FR) for the storefront.
// Admin-controlled strings (store name, hero text, section titles, tagline) are NOT here —
// those stay admin-editable in Settings. This covers the fixed UI chrome only.

export type Lang = 'en' | 'fr'

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
]

export const DEFAULT_LANG: Lang = 'en'
export const LANG_COOKIE = 'lang'

type Dict = Record<string, string>

const en: Dict = {
  // navbar
  'nav.shop': 'Shop',
  'nav.faq': 'FAQ',
  'nav.contact': 'Contact',
  'nav.searchPlaceholder': 'What are you looking for?',

  // footer
  'footer.about': 'Browse the catalog, pick your plan, and order directly through our social channels. Fast responses, no account needed.',
  'footer.quickLinks': 'Quick Links',
  'footer.howToBuy': 'How to buy',
  'footer.howToBuyText': 'Open any product, choose your duration, then message us on WhatsApp, Telegram or any channel shown on the product page. We confirm your order there.',
  'footer.rights': 'All rights reserved.',
  'footer.orderVia': 'Order via WhatsApp / Telegram • No account needed',
  'footer.terms': 'Terms',
  'footer.privacy': 'Privacy',

  // home — section fallback titles
  'home.browseCategories': 'Browse Categories',
  'home.featured': 'Featured',
  'home.popular': 'Popular',
  'home.newArrivals': 'New Arrivals',
  'home.howItWorks': 'How it works',
  'home.step1Title': 'Pick a product',
  'home.step1Text': 'Browse the catalog and choose the plan and duration that fits you.',
  'home.step2Title': 'Message us',
  'home.step2Text': 'Tap WhatsApp, Telegram or any contact button on the product page.',
  'home.step3Title': 'Get it',
  'home.step3Text': 'We confirm payment and deliver everything in the chat — quick and personal.',
  'home.trusted': 'Trusted Seller',
  'home.fastReplies': 'Fast Replies',
  'home.orderChat': 'Order via Chat',
  'home.contactUs': 'Contact Us',
  'home.emptyTitle': 'No products yet',
  'home.emptyText': 'Products added from the admin panel will appear here.',
  'home.from': 'From',

  // product card
  'card.featured': 'Featured',
  'card.details': 'Details',
  'card.more': 'more',
  'card.noProducts': 'No products found.',

  // product page
  'product.home': 'Home',
  'product.description': 'Description',
  'product.descriptionFallback': 'Contact us for full details about this product.',
  'product.related': 'Related Products',
  'product.popular': 'Popular',
  'product.orderChat': 'Order via chat',
  'product.fastReply': 'Fast reply',
  'product.trusted': 'Trusted seller',

  // purchase box
  'buy.periods': 'Available periods & prices',
  'buy.bestValue': 'Best value',
  'buy.days': 'days',
  'buy.perDay': '/day',
  'buy.selectedHint': 'Period selected ✓ — it will be included in your message below.',
  'buy.pickHint': 'Tap a period to choose it — the message you send will include the period and price.',
  'buy.howTo': 'How to buy this product',
  'buy.howToSelected': 'Great — now message us below and your chosen period is already in the text.',
  'buy.howToPick': 'Pick a period above, then message us on any channel below.',
  'buy.howToSingle': 'Message us on any channel below — tell us the product and we’ll confirm your order.',
  'buy.channelsSoon': 'Contact channels are being set up — check back soon.',
  'buy.msgHello': 'Hello! I want to buy: {name}',
  'buy.msgPeriod': 'Period: {name} ({days} days)',
  'buy.msgPrice': 'Price: {price} {currency}',
  'buy.copyLink': 'Copy link',

  // shop
  'shop.categories': 'Categories',
  'shop.allProducts': 'All Products',
  'shop.sortBy': 'Sort By',
  'shop.sortFeatured': 'Featured',
  'shop.priceAsc': 'Price: Low to High',
  'shop.priceDesc': 'Price: High to Low',
  'shop.newest': 'Newest',
  'shop.products': 'product',
  'shop.productsPlural': 'products',

  // search
  'search.title': 'Search',
  'search.for': 'for',
  'search.results': '{n} results',
  'search.type': 'Type something to search products.',
  'search.noResults': 'No results for “{q}”. Try different keywords.',

  // category page
  'category.subtitle': '{n} products • Pick a plan and order via WhatsApp, Telegram or your favorite app',

  // faq
  'faq.title': 'Frequently Asked Questions',
  'faq.subtitle': 'Everything about ordering — no account needed.',
  'faq.q1': 'How do I buy a product?',
  'faq.a1': 'Open the product page, choose the period/plan you want, then tap one of the contact buttons (WhatsApp, Telegram, …). Message us with the product name and period — we confirm your order and arrange payment directly in the chat. No registration, no balance, no checkout.',
  'faq.q2': 'How fast do you reply?',
  'faq.a2': 'We usually reply within minutes during the day. You’ll always see current response behavior once we start chatting.',
  'faq.q3': 'Do you have the plan I want?',
  'faq.a3': 'Every product page lists all available periods and their prices. If you need something custom, just message us — we often accommodate.',
  'faq.q4': 'Is it safe to order this way?',
  'faq.a4': 'Yes. You talk directly with us, payment is confirmed in the chat before anything is delivered, and everything you order is documented in the conversation.',
  'faq.reachUs': 'Reach us directly',

  // contact page
  'contact.title': 'Contact Us',
  'contact.subtitle': 'Reach us on any channel below — we usually reply within a few minutes. To order, tell us the product and period you want.',
  'contact.empty': 'Contact channels will appear here once configured.',

  // language switcher
  'lang.label': 'Language',

  // terms & privacy
  'terms.back': 'Back to store',
  'terms.title': 'Terms of Service',
  'terms.updated': 'Last updated: September 2026',
  'terms.orders': '1. Orders',
  'terms.ordersText': 'All orders are placed through our contact channels (WhatsApp, Telegram, etc.). By messaging us about a product you agree to these terms.',
  'terms.payment': '2. Payment',
  'terms.paymentText': 'Payment is arranged directly in the chat before delivery. Prices are listed on each product page per period.',
  'terms.delivery': '3. Delivery',
  'terms.deliveryText': 'Products are delivered through the same chat channel used for ordering, after payment confirmation.',
  'terms.refunds': '4. Refunds',
  'terms.refundsText': 'Refunds are handled case by case in the chat. Digital items already delivered may be non-refundable.',
  'terms.prohibited': '5. Prohibited Use',
  'terms.prohibitedText': 'Fraud, chargeback abuse, or reselling credentials without authorization may result in refusal of service.',
  'privacy.title': 'Privacy Policy',
  'privacy.updated': 'Last updated: September 2026',
  'privacy.collect': 'Data We Collect',
  'privacy.collectText': 'We do not require accounts. We only see what you send us in chat (your name and messages) and anonymous page-visit counts used to know which products are popular.',
  'privacy.use': 'How We Use Data',
  'privacy.useText': 'To process your order and improve the catalog. We do not sell data.',
  'privacy.analytics': 'Analytics',
  'privacy.analyticsText': 'Product pages count anonymous views (no profiles, no tracking cookies, no ads).',
}

const fr: Dict = {
  'nav.shop': 'Boutique',
  'nav.faq': 'FAQ',
  'nav.contact': 'Contact',
  'nav.searchPlaceholder': 'Que cherchez-vous ?',

  'footer.about': 'Parcourez le catalogue, choisissez votre offre et commandez directement via nos canaux sociaux. Réponses rapides, aucun compte requis.',
  'footer.quickLinks': 'Liens rapides',
  'footer.howToBuy': 'Comment acheter',
  'footer.howToBuyText': 'Ouvrez un produit, choisissez la durée, puis écrivez-nous sur WhatsApp, Telegram ou tout autre canal indiqué sur la page du produit. Nous confirmons la commande là-bas.',
  'footer.rights': 'Tous droits réservés.',
  'footer.orderVia': 'Commande via WhatsApp / Telegram • Aucun compte requis',
  'footer.terms': 'Conditions',
  'footer.privacy': 'Confidentialité',

  'home.browseCategories': 'Parcourir les catégories',
  'home.featured': 'En vedette',
  'home.popular': 'Populaires',
  'home.newArrivals': 'Nouveautés',
  'home.howItWorks': 'Comment ça marche',
  'home.step1Title': 'Choisissez un produit',
  'home.step1Text': 'Parcourez le catalogue et choisissez l’offre et la durée qui vous conviennent.',
  'home.step2Title': 'Écrivez-nous',
  'home.step2Text': 'Touchez WhatsApp, Telegram ou tout bouton de contact sur la page du produit.',
  'home.step3Title': 'Recevez-le',
  'home.step3Text': 'Nous confirmons le paiement et livrons tout dans la discussion — rapide et personnel.',
  'home.trusted': 'Vendeur fiable',
  'home.fastReplies': 'Réponses rapides',
  'home.orderChat': 'Commande par chat',
  'home.contactUs': 'Nous contacter',
  'home.emptyTitle': 'Aucun produit pour l’instant',
  'home.emptyText': 'Les produits ajoutés depuis le panneau d’administration apparaîtront ici.',
  'home.from': 'Dès',

  'card.featured': 'En vedette',
  'card.details': 'Détails',
  'card.more': 'de plus',
  'card.noProducts': 'Aucun produit trouvé.',

  'product.home': 'Accueil',
  'product.description': 'Description',
  'product.descriptionFallback': 'Contactez-nous pour tous les détails de ce produit.',
  'product.related': 'Produits similaires',
  'product.popular': 'Populaire',
  'product.orderChat': 'Commande par chat',
  'product.fastReply': 'Réponse rapide',
  'product.trusted': 'Vendeur fiable',

  'buy.periods': 'Périodes & prix disponibles',
  'buy.bestValue': 'Meilleure offre',
  'buy.days': 'jours',
  'buy.perDay': '/jour',
  'buy.selectedHint': 'Période choisie ✓ — elle sera incluse dans votre message ci-dessous.',
  'buy.pickHint': 'Touchez une période pour la choisir — votre message inclura la période et le prix.',
  'buy.howTo': 'Comment acheter ce produit',
  'buy.howToSelected': 'Parfait — écrivez-nous ci-dessous, votre période est déjà dans le texte.',
  'buy.howToPick': 'Choisissez une période ci-dessus, puis écrivez-nous sur un canal ci-dessous.',
  'buy.howToSingle': 'Écrivez-nous sur un canal ci-dessous — indiquez le produit et nous confirmerons la commande.',
  'buy.channelsSoon': 'Les canaux de contact sont en cours de configuration — revenez bientôt.',
  'buy.msgHello': 'Bonjour ! Je veux acheter : {name}',
  'buy.msgPeriod': 'Période : {name} ({days} jours)',
  'buy.msgPrice': 'Prix : {price} {currency}',
  'buy.copyLink': 'Copier le lien',

  'shop.categories': 'Catégories',
  'shop.allProducts': 'Tous les produits',
  'shop.sortBy': 'Trier par',
  'shop.sortFeatured': 'En vedette',
  'shop.priceAsc': 'Prix : croissant',
  'shop.priceDesc': 'Prix : décroissant',
  'shop.newest': 'Plus récents',
  'shop.products': 'produit',
  'shop.productsPlural': 'produits',

  'search.title': 'Recherche',
  'search.for': 'pour',
  'search.results': '{n} résultats',
  'search.type': 'Tapez quelque chose pour rechercher des produits.',
  'search.noResults': 'Aucun résultat pour « {q} ». Essayez d’autres mots-clés.',

  'category.subtitle': '{n} produits • Choisissez une offre et commandez via WhatsApp, Telegram ou votre application préférée',

  'faq.title': 'Questions fréquentes',
  'faq.subtitle': 'Tout sur la commande — aucun compte requis.',
  'faq.q1': 'Comment acheter un produit ?',
  'faq.a1': 'Ouvrez la page du produit, choisissez la période/l’offre voulue, puis touchez l’un des boutons de contact (WhatsApp, Telegram, …). Écrivez-nous le nom du produit et la période — nous confirmons la commande et organisons le paiement directement dans la discussion. Aucune inscription, aucun solde, aucun paiement en ligne.',
  'faq.q2': 'Répondez-vous vite ?',
  'faq.a2': 'Nous répondons généralement en quelques minutes pendant la journée. Vous verrez notre réactivité dès le premier message.',
  'faq.q3': 'Avez-vous l’offre que je veux ?',
  'faq.a3': 'Chaque page de produit liste toutes les périodes disponibles et leurs prix. Pour du sur-mesure, écrivez-nous — nous nous adaptons souvent.',
  'faq.q4': 'Est-il sûr de commander ainsi ?',
  'faq.a4': 'Oui. Vous discutez directement avec nous, le paiement est confirmé dans la discussion avant toute livraison, et tout est documenté dans la conversation.',
  'faq.reachUs': 'Joignez-nous directement',

  'contact.title': 'Contactez-nous',
  'contact.subtitle': 'Joignez-nous sur n’importe quel canal ci-dessous — nous répondons en quelques minutes. Pour commander, indiquez-nous le produit et la période voulus.',
  'contact.empty': 'Les canaux de contact apparaîtront ici une fois configurés.',

  'lang.label': 'Langue',

  'terms.back': 'Retour à la boutique',
  'terms.title': 'Conditions d’utilisation',
  'terms.updated': 'Mise à jour : septembre 2026',
  'terms.orders': '1. Commandes',
  'terms.ordersText': 'Toutes les commandes passent par nos canaux de contact (WhatsApp, Telegram, etc.). En nous écrivant au sujet d’un produit vous acceptez ces conditions.',
  'terms.payment': '2. Paiement',
  'terms.paymentText': 'Le paiement s’organise directement dans la discussion avant la livraison. Les prix sont indiqués sur chaque page de produit, par période.',
  'terms.delivery': '3. Livraison',
  'terms.deliveryText': 'Les produits sont livrés via le même canal de discussion utilisé pour la commande, après confirmation du paiement.',
  'terms.refunds': '4. Remboursements',
  'terms.refundsText': 'Les remboursements sont traités au cas par cas dans la discussion. Les produits numériques déjà livrés peuvent être non remboursables.',
  'terms.prohibited': '5. Utilisation interdite',
  'terms.prohibitedText': 'Les fraudes, abus de rétrofacturation ou revente d’identifiants sans autorisation peuvent entraîner un refus de service.',
  'privacy.title': 'Politique de confidentialité',
  'privacy.updated': 'Mise à jour : septembre 2026',
  'privacy.collect': 'Données collectées',
  'privacy.collectText': 'Aucun compte n’est requis. Nous voyons uniquement ce que vous nous envoyez en discussion (votre nom et vos messages) ainsi que des compteurs de pages anonymes servant à connaître les produits populaires.',
  'privacy.use': 'Utilisation des données',
  'privacy.useText': 'Pour traiter votre commande et améliorer le catalogue. Nous ne vendons aucune donnée.',
  'privacy.analytics': 'Statistiques',
  'privacy.analyticsText': 'Les pages de produits comptent des vues anonymes (aucun profil, aucun cookie de suivi, aucune publicité).',
}

export const dictionaries: Record<Lang, Dict> = { en, fr }

export function isLang(v: string | undefined | null): v is Lang {
  return v === 'en' || v === 'fr'
}

/** Translate a key with optional {var} interpolation. */
export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let str = dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key
  if (vars) for (const k of Object.keys(vars)) str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]))
  return str
}
