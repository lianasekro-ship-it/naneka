/**
 * Naneka — Bilingual translations (English / Swahili)
 *
 * Usage:
 *   const { t } = useLanguage();
 *   t('buyNow') → "Buy Now" or "Nunua Sasa"
 */

export const translations = {
  en: {
    // Navigation
    shop:               'Shop',
    track:              'Track Order',
    about:              'About Us',
    home:               'Home',

    // Actions
    buyNow:             'Buy Now',
    addToCart:          'Add to Cart',
    checkout:           'Checkout',
    placeOrder:         'Place Order',
    trackOrder:         'Track Order',
    viewAll:            'View All',
    tryItOn:            'Try It On',
    close:              'Close',
    back:               'Back',
    retry:              'Try Again',
    refresh:            'Refresh',
    signIn:             'Sign In',
    signOut:            'Sign Out',
    continue:           'Continue',

    // Product
    price:              'Price',
    inStock:            'In Stock',
    outOfStock:         'Out of Stock',
    deliveryFee:        'Delivery Fee',
    subtotal:           'Subtotal',
    total:              'Total',
    currency:           'TZS',

    // Checkout
    customerName:       'Full Name',
    phone:              'Phone Number',
    deliveryAddress:    'Delivery Address',
    paymentMethod:      'Payment Method',
    mobileMoney:        'Mobile Money',
    cashOnDelivery:     'Cash on Delivery',
    orderNotes:         'Notes (optional)',
    namePlaceholder:    'e.g. Amina Mohamed',
    phonePlaceholder:   'e.g. 0712 345 678',
    addressPlaceholder: 'Street, area, landmark...',

    // Order tracking
    trackYourOrder:     'Track Your Order',
    liveOrderStatus:    'Live Order Status',
    orderId:            'Order ID',
    orderIdHint:        'Enter your Order ID from your confirmation message',
    enterOrderId:       'e.g. DB219AC5 or full Order ID',
    trackButton:        'Track Order →',
    orderStatus:        'Order Status',
    driver:             'Driver',
    driverPhone:        'Driver Phone',
    eta:                'ETA',
    lastPosition:       'Last Known Position',
    viewOnMaps:         'View on Maps →',
    liveTracking:       'Live Tracking',
    placed:             'Placed',
    name:               'Name',

    // Order statuses
    status_pending_payment:  'Awaiting Payment',
    status_paid:             'Payment Confirmed',
    status_preparing:        'Preparing Your Order',
    status_ready_for_pickup: 'Ready — Driver Notified',
    status_out_for_delivery: 'Out for Delivery',
    status_delivered:        'Delivered',
    status_cancelled:        'Cancelled',

    // OTP / Auth
    otpTitle:           'Sign In to Continue',
    otpSubtitle:        'We\'ll send a verification code to your phone',
    enterPhone:         'Phone Number',
    sendCode:           'Send Code',
    enterCode:          'Verification Code',
    verify:             'Verify & Continue',
    resendCode:         'Resend code',
    codeSentTo:         'Code sent to',
    wrongNumber:        'Wrong number?',

    // Errors
    errorGeneric:       'Something went wrong. Please try again.',
    errorNetwork:       'Network error. Check your connection.',
    errorNotFound:      'Not found.',

    // Misc
    loading:            'Loading…',
    poweredBy:          'Powered by Naneka',
    allRights:          'All rights reserved.',
    freeDelivery:       'Free delivery on orders over TZS 50,000',
    bestSellers:        'Best Sellers',
    newArrivals:        'New Arrivals',
    madeInTZ:           'Made in Tanzania',
    bulkDeals:          'Bulk Deals',
    recentlyViewed:     'Recently Viewed',
    categories:         'Categories',
    search:             'Search products…',
  },

  sw: {
    // Navigation
    shop:               'Duka',
    track:              'Fuatilia Agizo',
    about:              'Kuhusu Sisi',
    home:               'Nyumbani',

    // Actions
    buyNow:             'Nunua Sasa',
    addToCart:          'Ongeza Kwenye Mkoba',
    checkout:           'Lipia',
    placeOrder:         'Weka Agizo',
    trackOrder:         'Fuatilia Agizo',
    viewAll:            'Ona Yote',
    tryItOn:            'Jaribu',
    close:              'Funga',
    back:               'Rudi',
    retry:              'Jaribu Tena',
    refresh:            'Onyesha Upya',
    signIn:             'Ingia',
    signOut:            'Toka',
    continue:           'Endelea',

    // Product
    price:              'Bei',
    inStock:            'Ipo Dukani',
    outOfStock:         'Haipatikani',
    deliveryFee:        'Nauli ya Uwasilishaji',
    subtotal:           'Jumla Ndogo',
    total:              'Jumla',
    currency:           'TZS',

    // Checkout
    customerName:       'Jina Kamili',
    phone:              'Nambari ya Simu',
    deliveryAddress:    'Anwani ya Uwasilishaji',
    paymentMethod:      'Njia ya Malipo',
    mobileMoney:        'Pesa ya Simu',
    cashOnDelivery:     'Lipa Unapopokea',
    orderNotes:         'Maelezo (si lazima)',
    namePlaceholder:    'mf. Amina Mohamed',
    phonePlaceholder:   'mf. 0712 345 678',
    addressPlaceholder: 'Mtaa, eneo, alama...',

    // Order tracking
    trackYourOrder:     'Fuatilia Agizo Lako',
    liveOrderStatus:    'Hali ya Agizo Moja kwa Moja',
    orderId:            'Nambari ya Agizo',
    orderIdHint:        'Ingiza nambari ya agizo kutoka ujumbe wa uthibitisho',
    enterOrderId:       'mf. DB219AC5 au nambari kamili',
    trackButton:        'Fuatilia Agizo →',
    orderStatus:        'Hali ya Agizo',
    driver:             'Dereva',
    driverPhone:        'Simu ya Dereva',
    eta:                'Muda wa Kuwasili',
    lastPosition:       'Mahali Alipoonekana',
    viewOnMaps:         'Ona Kwenye Ramani →',
    liveTracking:       'Ufuatiliaji wa Moja kwa Moja',
    placed:             'Iliwekwa',
    name:               'Jina',

    // Order statuses
    status_pending_payment:  'Inasubiri Malipo',
    status_paid:             'Malipo Yamethibitishwa',
    status_preparing:        'Inaandaliwa',
    status_ready_for_pickup: 'Iko Tayari — Dereva Amearifiwa',
    status_out_for_delivery: 'Inawasiliwa',
    status_delivered:        'Imewasiliwa',
    status_cancelled:        'Imefutwa',

    // OTP / Auth
    otpTitle:           'Ingia ili Uendelee',
    otpSubtitle:        'Tutakutumia nambari ya uthibitisho kwa simu yako',
    enterPhone:         'Nambari ya Simu',
    sendCode:           'Tuma Nambari',
    enterCode:          'Nambari ya Uthibitisho',
    verify:             'Thibitisha na Endelea',
    resendCode:         'Tuma tena',
    codeSentTo:         'Nambari imetumwa kwa',
    wrongNumber:        'Nambari mbaya?',

    // Errors
    errorGeneric:       'Hitilafu imetokea. Tafadhali jaribu tena.',
    errorNetwork:       'Hitilafu ya mtandao. Angalia muunganiko wako.',
    errorNotFound:      'Haikupatikana.',

    // Misc
    loading:            'Inapakia…',
    poweredBy:          'Inaendeshwa na Naneka',
    allRights:          'Haki zote zimehifadhiwa.',
    freeDelivery:       'Uwasilishaji bure kwa manunuzi zaidi ya TZS 50,000',
    bestSellers:        'Bidhaa Maarufu',
    newArrivals:        'Ziingia Mpya',
    madeInTZ:           'Made in Tanzania',
    bulkDeals:          'Nunua Wingi',
    recentlyViewed:     'Uliziona Hivi Karibuni',
    categories:         'Makundi',
    search:             'Tafuta bidhaa…',
  },
};
