import { createClient } from '@supabase/supabase-js';

// Mismos IDs que los links de suscripcion viejos en plan-vencido/page.jsx.
const PLAN_IDS = {
  pro: '3067c71cd277415ba7a4fcc568b6fd79',
  multi: 'ceffd835393d4218af243f774da1399c',
};

export async function POST(request) {
  try {
    const { barId, planKey } = await request.json();

    if (!barId || !planKey || !PLAN_IDS[planKey]) {
      return new Response(JSON.stringify({ error: 'Faltan datos o plan invalido' }), { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: bar } = await supabase
      .from('bares')
      .select('id, email')
      .eq('id', barId)
      .maybeSingle();

    if (!bar) {
      return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404 });
    }

    // Creamos la suscripcion en MP con external_reference = bar.id.
    // Asi el webhook puede identificar el negocio sin importar con que
    // cuenta / email de Mercado Pago termine pagando el usuario.
    const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        preapproval_plan_id: PLAN_IDS[planKey],
        external_reference: bar.id,
        payer_email: bar.email || undefined,
        back_url: 'https://troco.lat/plan-vencido',
        status: 'pending',
      }),
    });

    const preapproval = await mpRes.json();

    if (!mpRes.ok) {
      console.error('[crear-suscripcion-mp] error MP:', preapproval);
      return new Response(JSON.stringify({ error: 'No se pudo iniciar la suscripcion' }), { status: 500 });
    }

    return new Response(JSON.stringify({ init_point: preapproval.init_point }), { status: 200 });
  } catch (err) {
    console.error('[crear-suscripcion-mp] ERROR:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
