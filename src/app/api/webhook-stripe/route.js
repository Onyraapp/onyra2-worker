import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const body = await request.text();
  
  // Verificar firma de MP
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  const urlParams = new URL(request.url).searchParams;
  const dataId = urlParams.get('data.id');

  if (xSignature) {
    const parts = xSignature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.slice(3);
    const v1 = parts.find(p => p.startsWith('v1='))?.slice(3);
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
    if (hmac !== v1) {
      return new Response('Invalid signature', { status: 400 });
    }
  }

  const payload = JSON.parse(body);
  const { type, data } = payload;

  if (type !== 'payment') {
    return new Response('ok', { status: 200 });
  }

  const paymentId = data?.id;
  if (!paymentId) return new Response('ok', { status: 200 });

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
  });
  const payment = await mpRes.json();

  if (payment.status !== 'approved') {
    return new Response('ok', { status: 200 });
  }

  const email = payment.payer?.email;
  const planKey = payment.metadata?.plan;

  if (!email || !planKey) return new Response('ok', { status: 200 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let barId = null;
  const { data: bar } = await supabase
    .from('bares')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (bar) {
    barId = bar.id;
  } else {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('bar_id')
      .eq('email', email)
      .maybeSingle();
    if (usuario) barId = usuario.bar_id;
  }

  if (barId) {
    const vence = new Date();
    vence.setMonth(vence.getMonth() + 1);
    await supabase
      .from('bares')
      .update({ plan_activo: true, plan: planKey, trial_hasta: vence.toISOString() })
      .eq('id', barId);
  }

  return new Response('ok', { status: 200 });
}
