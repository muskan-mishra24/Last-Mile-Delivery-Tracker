function getAllowedOrigins(envOrigins = '') {
  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://last-mile-delivery-tracker-frontend.onrender.com',
    'https://last-mile-delivery-tracker-1-035t.onrender.com',
    'https://last-mile-delivery-tracker-hl9j.onrender.com',
  ];

  const parsed = (envOrigins || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...defaults, ...parsed])];
}

function isAllowedOrigin(origin, allowedOrigins = getAllowedOrigins()) {
  if (!origin) return true;
  if (origin === 'null') return false;

  const normalized = origin.toLowerCase();
  return allowedOrigins.some((allowed) => normalized === allowed.toLowerCase()) || normalized.endsWith('.onrender.com');
}

function corsOptions() {
  const allowedOrigins = getAllowedOrigins(process.env.CORS_ORIGIN);

  return {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

module.exports = {
  getAllowedOrigins,
  isAllowedOrigin,
  corsOptions,
};
