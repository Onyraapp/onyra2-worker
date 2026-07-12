import { createClient } from '@supabase/supabase-js';

// Mismos IDs que los links de suscripcion en plan-vencido/page.jsx.
// Fijos porque son "Planes" pre-creados en Mercado Pago, no algo que
// nuestra API genere dinamicamente.
const PLAN_POR_PREAPPROVAL_ID = {
  '3067c71cd277415ba7a4fcc568b6fd79': 'pro',
  'ceffd835393d4218af243f774da1399c': 'multi',
};

async function buscarBarPorEmail(supabase, email) {
  if (!email) return null;
  const { data: bar } = await supabase
    .from('bares').select('id, plan').eq('email', email).maybeSingle();
  if (bar) return bar;
  const { data: usuario } = await supabase
    .from('usuarios').select('bar_id').eq('email', email).maybeSingle();
  if (usuario?.bar_id) {
    const { data: barPorUsuario } = await supabase
      .from('bares').select('id, plan').eq('id', usuario.bar_id).maybeSingle();
    return barPorUsuario || null;
  }
  return null;
}

async function activarPlan(supabase, barId, planKey) {
  const vence = new Date();
  vence.setMonth(vence.getMonth() + 1);
  await supabase
    .from('bares')
    .update({ plan_activo: true, plan: planKey, trial_hasta: vence.toISOString() })
    .eq('id', barId);
  console.log('[webhook-mp] plan activado:', { barId, planKey, vence: vence.toISOString() });
}

export async function POST(request) {
  try {
  const body = await request.text();
  console.log('[webhook-mp] body recibido:', body);

  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  const urlParams = new URL(request.url).searchParams;
  const dataId = urlParams.get('data.id') || urlParams.get('id');
  console.log('[webhook-mp] xSignature:', xSignature, '| xRequestId:', xRequestId, '| dataId (url):', dataId, '| MP_WEBHOOK_SECRET seteado:', !!process.env.MP_WEBHOOK_SECRET, '| MP_ACCESS_TOKEN seteado:', !!process.env.MP_ACCESS_TOKEN);

  if (xSignature) {
    const parts = xSignature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.slice(3);
    const v1 = parts.find(p => p.startsWith('v1='))?.slice(3);
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
    console.log('[webhook-mp] manifest:', manifest, '| hmac calculado:', hmac, '| v1 recibido:', v1, '| coinciden:', hmac === v1);
    if (hmac !== v1) {
      console.log('[webhook-mp] RECHAZADO por firma invalida');
      return new Response('Invalid signature', { status: 400 });
    }
  } else {
    console.log('[webhook-mp] sin header x-signature, se omite verificacion');
  }

  const payload = JSON.parse(body);
  const { type, data } = payload;
  console.log('[webhook-mp] type:', type, '| data:', data);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Caso 1: alguien se suscribio (o cambio de estado) a un Plan de MP.
  // Aca SI tenemos el preapproval_plan_id, que nos dice que plan es,
  // sin depender de metadata que nunca llega desde un link estatico.
  if (type === 'subscription_preapproval') {
    const preapprovalId = data?.id;
    if (!preapprovalId) return new Response('ok', { status: 200 });

    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const preapproval = await mpRes.json();
    console.log('[webhook-mp] preapproval:', preapproval);

    if (preapproval.status !== 'authorized') {
      console.log('[webhook-mp] preapproval sin autorizar todavia, status:', preapproval.status);
      return new Response('ok', { status: 200 });
    }

    const planKey = PLAN_POR_PREAPPROVAL_ID[preapproval.preapproval_plan_id];
    const email = preapproval.payer_email;
    console.log('[webhook-mp] planKey resuelto:', planKey, '| email:', email);

    if (!planKey || !email) {
      console.log('[webhook-mp] no se pudo resolver plan o email, se omite');
      return new Response('ok', { status: 200 });
    }

    const bar = await buscarBarPorEmail(supabase, email);
    if (bar) {
      await activarPlan(supabase, bar.id, planKey);
    } else {
      console.log('[webhook-mp] no se encontro bar para email:', email);
    }
    return new Response('ok', { status: 200 });
  }

  // Caso 2: cobro individual (alta de suscripcion o renovacion mensual).
  // Para renovaciones no hace falta saber el plan: el bar ya lo tiene
  // guardado de cuando se activo la suscripcion (Caso 1). Solo extendemos
  // el vencimiento.
  if (type === 'payment') {
    const paymentId = data?.id;
    if (!paymentId) return new Response('ok', { status: 200 });

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();
    console.log('[webhook-mp] payment:', payment);

    if (payment.status !== 'approved') return new Response('ok', { status: 200 });

    const email = payment.payer?.email;
    const bar = await buscarBarPorEmail(supabase, email);
    if (!bar) {
      console.log('[webhook-mp] no se encontro bar para email:', email);
      return new Response('ok', { status: 200 });
    }

    // Si ya tiene un plan pago guardado, es una renovacion: lo mantenemos.
    // Si todavia esta en trial (primer pago sin pasar por el Caso 1 antes,
    // por ejemplo cobro con tarjeta directo), usamos metadata.plan si vino.
    const planKey = (bar.plan && bar.plan !== 'trial') ? bar.plan : payment.metadata?.plan;
    if (!planKey) {
      console.log('[webhook-mp] no se pudo determinar el plan para el bar:', bar.id);
      return new Response('ok', { status: 200 });
    }

    await activarPlan(supabase, bar.id, planKey);
    return new Response('ok', { status: 200 });
  }

  return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('[webhook-mp] ERROR no manejado:', err);
    return new Response('error: ' + err.message, { status: 500 });
  }
}
