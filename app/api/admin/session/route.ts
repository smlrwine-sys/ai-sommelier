import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_EMAIL,
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookieValue,
  getAdminSessionCookieOptions,
  getConfiguredAdminPassword,
  isValidAdminSessionCookie,
  validateAdminCredentials,
} from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const isAuthenticated = isValidAdminSessionCookie(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  );

  return NextResponse.json({
    authenticated: isAuthenticated,
    email: isAuthenticated ? ADMIN_EMAIL : null,
  });
}

export async function POST(request: NextRequest) {
  if (!getConfiguredAdminPassword()) {
    return NextResponse.json(
      { error: 'サーバー環境変数 ADMIN_PASSWORD が設定されていません。' },
      { status: 500 }
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'メールアドレスとパスワードを送信してください。' },
      { status: 400 }
    );
  }

  if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) {
    return NextResponse.json(
      { error: 'ログイン情報の形式が正しくありません。' },
      { status: 400 }
    );
  }

  const { email, password } = requestBody as Record<string, unknown>;
  if (
    typeof email !== 'string'
    || typeof password !== 'string'
    || !validateAdminCredentials(email, password)
  ) {
    return NextResponse.json(
      { error: 'メールアドレスまたはパスワードが正しくありません。' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    authenticated: true,
    email: ADMIN_EMAIL,
  });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    createAdminSessionCookieValue(),
    getAdminSessionCookieOptions()
  );

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({
    authenticated: false,
    email: null,
  });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    '',
    getAdminSessionCookieOptions(0)
  );

  return response;
}
