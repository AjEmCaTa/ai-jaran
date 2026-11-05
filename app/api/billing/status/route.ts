import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';
import { paypalConfigured, paypalMode, PLAN_PRICES } from '../../../../utils/paypal';

export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const { data } = await admin
    .from('businesses')
    .select('plan, plan_until, billing_status, paypal_subscription_id, created_at')
    .eq('id', businessId)
    .maybeSingle();
  return NextResponse.json({
    plan: data?.plan === 'starter' ? 'starter' : 'pro',
    planUntil: data?.plan_until || null,
    billingStatus: data?.billing_status || null,
    hasSubscription: Boolean(data?.paypal_subscription_id),
    trialEnds: data?.created_at ? new Date(Date.parse(data.created_at) + 30 * 86400000).toISOString() : null,
    paypal: { enabled: paypalConfigured(), sandbox: paypalMode() === 'sandbox' },
    prices: PLAN_PRICES,
  });
}
