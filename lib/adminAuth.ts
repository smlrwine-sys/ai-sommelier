import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_EMAIL = 'furusawa.keita@sommelier-wine.co.jp';
export const ADMIN_SESSION_COOKIE = 'ai_sommelier_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

export function getConfiguredAdminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
}

export function validateAdminCredentials(email: string, password: string) {
  const adminPassword = getConfiguredAdminPassword();
  return (
    Boolean(adminPassword)
    && email.trim().toLowerCase() === ADMIN_EMAIL
    && passwordsMatch(password, adminPassword)
  );
}

export function createAdminSessionCookieValue() {
  const adminPassword = getConfiguredAdminPassword();
  if (!adminPassword) return '';

  const payload: AdminSessionPayload = {
    email: ADMIN_EMAIL,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = signPayload(encodedPayload, adminPassword);

  return `${encodedPayload}.${signature}`;
}

export function isValidAdminSessionCookie(value: string | undefined) {
  const adminPassword = getConfiguredAdminPassword();
  if (!value || !adminPassword) return false;

  const [encodedPayload, suppliedSignature] = value.split('.');
  if (!encodedPayload || !suppliedSignature) return false;

  const expectedSignature = signPayload(encodedPayload, adminPassword);
  if (!safeEqual(suppliedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as Partial<AdminSessionPayload>;

    return (
      payload.email === ADMIN_EMAIL
      && typeof payload.exp === 'number'
      && payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function getAdminAuthError(request: NextRequest) {
  const adminPassword = getConfiguredAdminPassword();

  if (!adminPassword) {
    return NextResponse.json(
      { error: 'サーバー環境変数 ADMIN_PASSWORD が設定されていません。' },
      { status: 500 }
    );
  }

  const suppliedPassword = request.headers.get('x-admin-password');
  if (suppliedPassword && passwordsMatch(suppliedPassword, adminPassword)) {
    return null;
  }

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (isValidAdminSessionCookie(sessionCookie)) {
    return null;
  }

  return NextResponse.json(
    { error: '管理者ログインが必要です。' },
    { status: 401 }
  );
}

export function getAdminSessionCookieOptions(maxAge = ADMIN_SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  };
}

function signPayload(encodedPayload: string, adminPassword: string) {
  return createHmac('sha256', adminPassword)
    .update(encodedPayload)
    .digest('base64url');
}

function passwordsMatch(suppliedPassword: string, adminPassword: string) {
  return safeEqual(suppliedPassword, adminPassword);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length
    && timingSafeEqual(leftBuffer, rightBuffer);
}
