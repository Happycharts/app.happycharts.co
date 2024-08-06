// /api/apps/add.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  const { appName, url, userName } = await request.json();
  const supabase = createClient();
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('apps')
      .insert({ name: appName, url, organization: orgId, creator_id: userId, creator_name: userName });

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'App added successfully' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error adding app' }, { status: 500 });
  }
}
