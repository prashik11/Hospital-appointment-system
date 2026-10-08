const buckets = new Map();

function consumeRateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (!bucket && buckets.size >= 50_000) {
      for (const [existingKey, existingBucket] of buckets) {
        if (existingBucket.resetAt <= now) buckets.delete(existingKey);
      }
      if (buckets.size >= 50_000) buckets.delete(buckets.keys().next().value);
    }
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return { allowed: bucket.count <= limit, retryAfterMs: bucket.resetAt - now };
}

function rateLimitMiddleware({ limit, windowMs, key = (req) => req.ip || "unknown" }) {
  return (req, res, next) => {
    const result = consumeRateLimit(key(req), { limit, windowMs });
    if (!result.allowed) {
      res.set("Retry-After", String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    return next();
  };
}

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
cleanup.unref();

module.exports = { consumeRateLimit, rateLimitMiddleware };
