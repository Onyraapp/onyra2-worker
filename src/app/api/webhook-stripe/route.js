import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.text();
    console.log('[webhook-stripe] body recibido:', body);

    const sig = request.headers.get('stripe-signature');
    console.log('[webhook-stripe] stripe-signature:', sig, '| STRIPE_WEBHOOK_SECRET seteado:', !!process.env.STRIPE_WEBHOOK_SECRET);

    if (sig && process.env.STRIPE_WEBHOOK_SECRET) {
      const parts = sig.split(',');
      const ts = parts.find(p => p.startsWith('t='))?.slice(2);
      const v1 = parts.find(p => p.startsWith('v1='))?.slice(3);
      const crypto = await import('crypto');
      const signedPayload = `${ts}.${body}`;
      const hmac = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(signedPayload).digest('hex');
      console.log('[webhook-stripe] hmac calculado:', hmac, '| v1 recibido:', v1, '| coinciden:', hmac === v1);
      if (hmac !== v1) {
        console.log('[webhook-stripe] RECHAZADO por firma invalida');
        return new Response('Invalid signature', { status: 400 });
      }
    } else {
      console.log('[webhook-stripe] sin verificacion de firma (falta header o secret)');
    }

    const event = JSON.parse(body);
    console.log('[webhook-stripe] event.type:', event.type);

    if (event.type !== 'checkout.session.completed') {
      return new Response('ok', { status: 200 });
    }

    const session = event.data?.object;
    if (!session) return new Response('ok', { status: 200 });

    if (session.payment_status !== 'paid') {
      console.log('[webhook-stripe] payment_status no es paid:', session.payment_status);
      return new Response('ok', { status: 200 });
    }

    const email = session.customer_details?.email || session.customer_email;
    const amount = session.amount_total; // en centavos de USD

    // Mapeo por monto (USD 6.99 -> pro, USD 14.99 -> multi). Ver PLANES en plan-vencido/page.jsx.
    let planKey = null;
    if (amount === 699) planKey = 'pro';
    else if (amount === 1499) planKey = 'multi';

    console.log('[webhook-stripe] email:', email, '| amount:', amount, '| planKey:', planKey);

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

    console.log('[webhook-stripe] barId resuelto:', barId);

    if (barId) {
      const vence = new Date();
      vence.setMonth(vence.getMonth() + 1);
      await supabase
        .from('bares')
        .update({ plan_activo: true, plan: planKey, trial_hasta: vence.toISOString() })
        .eq('id', barId);
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('[webhook-stripe] ERROR no manejado:', err);
    return new Response('error: ' + err.message, { status: 500 });
  }
}
