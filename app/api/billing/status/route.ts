import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';
import { paypalConfigured, paypalMode, PLAN_PRICES } from '../../../../utils/paypal';
import { lemonConfigured } from '../../../../utils/lemonsqueezy';
import { dodoConfigured, dodoTestMode, trialDaysLeft } from '../../../../utils/dodo';
import { BANK_KEYS, bankReference, requiresPaymentSetup, type BankDetails } from '../../../../utils/billingAccess';

export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const { data } = await admin
    .from('businesses')
    .select('plan, plan_until, billing_status, billing_provider, paypal_subscription_id, billing_subscription_id, billing_portal_url, created_at')
    .eq('id', businessId)
    .maybeSingle();

  const { data: cfg } = await admin.from('billing_config').select('key, value').like('key', 'bank:%');
  const bank: BankDetails = {};
  for (const row of cfg || []) {
    const k = String(row.key).slice(5) as (typeof BANK_KEYS)[number];
    if ((BANK_KEYS as readonly string[]).includes(k) && row.value) bank[k] = String(row.value);
  }
  const bankEnabled = Boolean(bank.recipient && (bank.account || bank.iban));

  const dodo = dodoConfigured();
  const provider = dodo ? 'dodo' : lemonConfigured() ? 'lemonsqueezy' : paypalConfigured() ? 'paypal' : null;
  const row = data || {};
  return NextResponse.json({
    plan: data?.plan === 'starter' ? 'starter' : 'pro',
    planUntil: data?.plan_until || null,
    billingStatus: data?.billing_status || null,
    billingProvider: data?.billing_provider || null,
    hasSubscription: Boolean(data?.billing_subscription_id || data?.paypal_subscription_id),
    portalUrl: data?.billing_portal_url || null,
    provider,
    testMode: dodo && dodoTestMode(),
    trialEnds: data?.created_at ? new Date(Date.parse(data.created_at) + 30 * 86400000).toISOString() : null,
    trialDaysLeft: trialDaysLeft(data?.created_at, data?.billing_provider === 'dodo' && Boolean(data?.billing_subscription_id)),
    // Izbor paketa se nameće tek kad kartica radi s pravim novcem (Dodo live); uplatnica je do tada samo opcija.
    requiresPayment: requiresPaymentSetup(row, dodo && !dodoTestMode()),
    bank: bankEnabled ? { ...bank, reference: bankReference(businessId) } : null,
    paypal: { enabled: paypalConfigured(), sandbox: paypalMode() === 'sandbox' },
    prices: PLAN_PRICES,
  });
}
