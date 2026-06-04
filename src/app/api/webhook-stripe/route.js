import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const body = await request.json();
  const { type, data } = body;

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
