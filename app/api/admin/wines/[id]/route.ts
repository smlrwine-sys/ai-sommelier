import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuthError } from '@/lib/adminAuth';

export const runtime = 'nodejs';

const MUTABLE_WINE_FIELDS = [
  'name',
  'wine_type',
  'color_value',
  'origin',
  'bottle_price',
  'glass_price',
  'grape',
  'alcohol',
  'taste',
  'aromas',
  'comment',
  'image_url',
  'tags',
  'total_likes',
  'jan_code',
  'scene_retail',
  'scene_restaurant',
  'producer',
  'pairing_food',
] as const;

type MutableWineField = (typeof MUTABLE_WINE_FIELDS)[number];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = getAdminAuthError(request);
  if (authError) return authError;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabaseのサーバー環境変数が不足しています。' },
      { status: 500 }
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: '更新データを正しいJSON形式で送信してください。' },
      { status: 400 }
    );
  }

  if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) {
    return NextResponse.json(
      { error: '更新データの形式が正しくありません。' },
      { status: 400 }
    );
  }

  const source = requestBody as Record<string, unknown>;
  const updateData: Partial<Record<MutableWineField, unknown>> = {};

  for (const field of MUTABLE_WINE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      updateData[field] = source[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: '更新可能なワイン情報がありません。' },
      { status: 400 }
    );
  }

  if (
    typeof updateData.jan_code !== 'string'
    || updateData.jan_code.trim() === ''
  ) {
    return NextResponse.json(
      { error: 'JANコードは必須です。' },
      { status: 400 }
    );
  }

  if (typeof updateData.name !== 'string' || updateData.name.trim() === '') {
    return NextResponse.json(
      { error: 'ワイン名は必須です。' },
      { status: 400 }
    );
  }

  updateData.jan_code = updateData.jan_code.trim();
  updateData.name = updateData.name.trim();

  const { id } = await context.params;
  const { data, error } = await supabaseAdmin
    .from('wines')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    return createSupabaseErrorResponse(error);
  }

  if (!data) {
    return NextResponse.json(
      { error: '対象のワインが見つかりませんでした。' },
      { status: 404 }
    );
  }

  return NextResponse.json({ wine: data });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = getAdminAuthError(request);
  if (authError) return authError;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabaseのサーバー環境変数が不足しています。' },
      { status: 500 }
    );
  }

  const { id } = await context.params;
  const { data, error } = await supabaseAdmin
    .from('wines')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return createSupabaseErrorResponse(error);
  }

  if (!data) {
    return NextResponse.json(
      { error: '対象のワインが見つかりませんでした。' },
      { status: 404 }
    );
  }

  return NextResponse.json({ deletedId: data.id });
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createSupabaseErrorResponse(error: {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}) {
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
