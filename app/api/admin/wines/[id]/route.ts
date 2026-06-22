import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const suppliedPassword = request.headers.get('x-admin-password');

  if (!adminPassword) {
    return NextResponse.json(
      { error: 'サーバー環境変数 ADMIN_PASSWORD が設定されていません。' },
      { status: 500 }
    );
  }

  if (!suppliedPassword || !passwordsMatch(suppliedPassword, adminPassword)) {
    return NextResponse.json(
      { error: '管理者パスワードが正しくありません。' },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabaseのサーバー環境変数が不足しています。' },
      { status: 500 }
    );
  }

  const { id } = await context.params;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabaseAdmin
    .from('wines')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      { status: 400 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: '対象のワインが見つかりませんでした。' },
      { status: 404 }
    );
  }

  return NextResponse.json({ deletedId: data.id });
}

function passwordsMatch(suppliedPassword: string, adminPassword: string) {
  const suppliedBuffer = Buffer.from(suppliedPassword);
  const adminBuffer = Buffer.from(adminPassword);

  return suppliedBuffer.length === adminBuffer.length
    && timingSafeEqual(suppliedBuffer, adminBuffer);
}
