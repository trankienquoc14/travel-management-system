/**
 * Security, Rate Limiting, FAQ Caching, Input Validation, and Structured Logging
 * for TravelVN ERP AI Chatbot.
 */

const MAX_QUESTION_LENGTH = 600;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 25;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const rateLimitStore = new Map();
const responseCache = new Map();

/**
 * Validate and sanitize user input question.
 */
function validateQuestion(rawQuestion) {
  if (typeof rawQuestion !== 'string') {
    return { valid: false, error: 'Câu hỏi không hợp lệ.' };
  }
  const cleaned = rawQuestion
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return { valid: false, error: 'Vui lòng nhập nội dung câu hỏi.' };
  }
  if (cleaned.length > MAX_QUESTION_LENGTH) {
    return {
      valid: false,
      error: `Câu hỏi quá dài (tối đa ${MAX_QUESTION_LENGTH} ký tự). Vui lòng rút gọn nội dung.`
    };
  }
  return { valid: true, question: cleaned };
}

/**
 * Sliding-window rate limiter by client key (IP or session).
 */
function checkRateLimit(clientKey = 'anonymous') {
  const now = Date.now();
  const timestamps = rateLimitStore.get(clientKey) || [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(clientKey, recent);
    const oldest = recent[0];
    const retryAfterSec = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000));
    return { allowed: false, retryAfterSec };
  }

  recent.push(now);
  rateLimitStore.set(clientKey, recent);

  // Periodic cleanup if map grows large
  if (rateLimitStore.size > 1000) {
    for (const [k, list] of rateLimitStore.entries()) {
      const validList = list.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (validList.length === 0) rateLimitStore.delete(k);
      else rateLimitStore.set(k, validList);
    }
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - recent.length };
}

/**
 * Get cached response for generic (non-personalized, single-turn/FAQ) questions.
 */
function getCachedResponse(cacheKey) {
  const entry = responseCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

function setCachedResponse(cacheKey, data) {
  if (responseCache.size > 300) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(cacheKey, { data, createdAt: Date.now() });
}

/**
 * Redact potential PII (emails, long digit sequences like phone/CCCD) for logs.
 */
function redactForLog(text = '') {
  return String(text)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/\b\d{9,15}\b/g, '[REDACTED_NUMBER]');
}

/**
 * Structured logger for AI chat interactions.
 */
function logAIChat({ question, responseTimeMs, mode, toolsUsed = [], status = 'ok', userId = null }) {
  const preview = redactForLog(question).slice(0, 120);
  const entry = {
    ts: new Date().toISOString(),
    service: 'chat-service-ai',
    status,
    mode,
    responseTimeMs,
    userId: userId ? `user_${userId}` : 'guest',
    toolsUsed,
    questionPreview: preview
  };
  console.log('[AI_CHAT_LOG]', JSON.stringify(entry));
}

module.exports = {
  validateQuestion,
  checkRateLimit,
  getCachedResponse,
  setCachedResponse,
  logAIChat,
  redactForLog
};
