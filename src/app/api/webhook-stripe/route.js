import { createClient } from '@supabase/supabase-js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    const crypto = await import('crypto');
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t=')).slice(2);
    const v1 = elements.find(e => e.startsWith('v1=')).slice(3);
    const payload = `${timestamp}.${body}`;
    const hmac = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
    if (hmac !== v1) throw new Error('Invalid signature');
    event = JSON.parse(body);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const priceId = session.line_items?.data?.[0]?.price?.id || '';
    const plan = priceId === 'price_1TcnFY2fy49WJZAKZyoSmm4S' ? 'multilocal' : 'pro';

    if (email) {
      const { data: bar } = await supabase
        .from('bares')
        .select('id')
        .eq('email', email)
        .single();

      if (bar) {
        const vence = new Date();
        vence.setMonth(vence.getMonth() + 1);
        await supabase
          .from('bares')
          .update({ plan_activo: true, plan, trial_hasta: vence.toISOString() })
          .eq('id', bar.id);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const email = event.data.object?.customer_email;
    if (email) {
      const { data: bar } = await supabase
        .from('bares')
        .select('id')
        .eq('email', email)
        .single();
      if (bar) {
        await supabase
          .from('bares')
          .update({ plan_activo: false })
          .eq('id', bar.id);
      }
    }
  }

  return new Response('ok', { status: 200 });
}
