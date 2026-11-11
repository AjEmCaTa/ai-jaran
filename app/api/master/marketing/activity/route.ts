import { NextRequest, NextResponse } from 'next/server';
import { requireMasterAdmin } from '../../../../../utils/masterAuth';

export const dynamic = 'force-dynamic';

// Zadnje radnje u marketingu i zadnji uvozi (samo za čitanje).
export async function GET(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const [log, imports] = await Promise.all([
    admin.from('marketing_activity_log').select('id, actor, action, entity, entity_id, details, created_at').order('created_at', { ascending: false }).limit(30),
    admin.from('marketing_imports').select('id, file_name, legal_basis, source, total_rows, inserted, duplicates, invalid, created_by, created_at').order('created_at', { ascending: false }).limit(10),
  ]);
  if (log.error || imports.error) return NextResponse.json({ error: 'Evidenciju nije moguće učitati.' }, { status: 500 });
  return NextResponse.json({ activity: log.data || [], imports: imports.data || [] });
}
