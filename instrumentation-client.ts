import { initBotId } from 'botid/client/core';

// Define the paths that need bot protection.
// These must match the ACTUAL routed paths in this app (see app/ tree).
// BotID only injects the client challenge here; each route below must also
// call checkBotId() from 'botid/server' to actually reject bots.

initBotId({
  protect: [
    // Checkout / payment abuse
    { path: '/api/shop/checkout', method: 'POST' },
    { path: '/api/shop/orders/*/sync-payment', method: 'POST' },

    // Auth: credential stuffing, signup spam, magic-link abuse.
    // The auth UI lives at /auth/* but all POSTs go to /api/auth/*.
    { path: '/api/auth/*', method: 'POST' },

    // Admin API — every verb, not just POST, so data enumeration via GET
    // is blocked too.
    { path: '/api/admin/*', method: 'GET' },
    { path: '/api/admin/*', method: 'POST' },
    { path: '/api/admin/*', method: 'PUT' },
    { path: '/api/admin/*', method: 'PATCH' },
    { path: '/api/admin/*', method: 'DELETE' },

    // Cheap public write endpoints bots target
    { path: '/api/newsletter/subscribe', method: 'POST' },
    { path: '/api/shop/promo/validate', method: 'POST' },
    { path: '/api/shop/reviews', method: 'POST' },
  ],
});
