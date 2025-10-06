// src/app/api/chatbot/route.ts
import { NextRequest, NextResponse } from 'next/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 10000;
const REQUEST_TIMEOUT_MS = 45000;

// Simple in-memory rate limiter (token bucket per IP)
const rateLimiter = new Map<string, { tokens: number; lastRefill: number }>();
const RATE_LIMIT_TOKENS = 10;
const RATE_LIMIT_REFILL_MS = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = rateLimiter.get(ip);

  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_TOKENS, lastRefill: now };
    rateLimiter.set(ip, bucket);
  }

  // Refill tokens
  const timeSinceRefill = now - bucket.lastRefill;
  if (timeSinceRefill > RATE_LIMIT_REFILL_MS) {
    bucket.tokens = RATE_LIMIT_TOKENS;
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false;
}

function sanitizeMessage(message: string): string {
  // Remove control characters except newlines, tabs
  return message.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

interface ChatbotRequest {
  property_id: string;
  message: string;
}

interface ChatbotResponseItem {
  property_id?: string;
  run_id?: string;
  user_message?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[chatbot] Request received');

  // Check webhook URL is configured
  const webhookUrl = process.env.N8N_CHATBOT_WEBHOOK;
  if (!webhookUrl) {
    console.error('[chatbot] N8N_CHATBOT_WEBHOOK not configured');
    return NextResponse.json(
      { error: 'Chatbot service not configured', details: 'Missing webhook URL' },
      { status: 500 }
    );
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    console.warn('[chatbot] Rate limit exceeded for IP:', ip);
    return NextResponse.json(
      { error: 'Rate limit exceeded', details: 'Please wait before sending another message' },
      { status: 429 }
    );
  }

  // Parse and validate request body
  let body: ChatbotRequest;
  try {
    body = await request.json();
  } catch (err) {
    console.error('[chatbot] Failed to parse JSON:', err);
    return NextResponse.json(
      { error: 'Invalid JSON', details: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  // Validate property_id
  if (!body.property_id || typeof body.property_id !== 'string' || body.property_id.trim() === '') {
    return NextResponse.json(
      { error: 'Invalid payload', details: { property_id: 'Required, must be non-empty string' } },
      { status: 400 }
    );
  }

  // Optional: validate UUID format (best-effort)
  if (!UUID_REGEX.test(body.property_id.trim())) {
    console.warn('[chatbot] property_id does not match UUID format:', body.property_id);
    // Allow it anyway, but log warning
  }

  // Validate message
  if (!body.message || typeof body.message !== 'string') {
    return NextResponse.json(
      { error: 'Invalid payload', details: { message: 'Required, must be string' } },
      { status: 400 }
    );
  }

  const trimmedMessage = body.message.trim();
  if (trimmedMessage.length === 0) {
    return NextResponse.json(
      { error: 'Invalid payload', details: { message: 'Must not be empty' } },
      { status: 400 }
    );
  }

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: 'Invalid payload', details: { message: `Maximum length is ${MAX_MESSAGE_LENGTH} characters` } },
      { status: 400 }
    );
  }

  // Sanitize message
  const sanitizedMessage = sanitizeMessage(trimmedMessage);

  // Forward to n8n webhook
  const payload: ChatbotRequest = {
    property_id: body.property_id.trim(),
    message: sanitizedMessage,
  };

  console.log('[chatbot] Forwarding to n8n:', { property_id: payload.property_id, messageLength: payload.message.length });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('[chatbot] Upstream n8n error:', response.status, response.statusText);
      let errorDetails = `HTTP ${response.status}`;
      try {
        const errorBody = await response.text();
        errorDetails += `: ${errorBody.substring(0, 200)}`;
      } catch {
        // ignore
      }

      return NextResponse.json(
        { error: 'Upstream n8n error', details: errorDetails },
        { status: 502 }
      );
    }

    // Parse and return response verbatim
    const responseData: ChatbotResponseItem[] = await response.json();
    const duration = Date.now() - startTime;
    console.log('[chatbot] Success in', duration, 'ms, items:', responseData.length);

    return NextResponse.json(responseData);

  } catch (err: any) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      console.error('[chatbot] Request timeout after', REQUEST_TIMEOUT_MS, 'ms');
      return NextResponse.json(
        { error: 'Request timeout', details: 'n8n webhook did not respond within 45 seconds' },
        { status: 504 }
      );
    }

    console.error('[chatbot] Network error:', err);
    return NextResponse.json(
      { error: 'Upstream n8n error', details: err.message || 'Network error' },
      { status: 502 }
    );
  }
}
