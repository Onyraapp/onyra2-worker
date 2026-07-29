import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, requesterId, requesterRol } = await request.json();

    if (!userId || !requesterId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }
    if (userId === requesterId) {
      return NextResponse.json({ error: 'No podés eliminar tu propia cuenta' }, { status: 400 });
    }
    if (requesterRol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // El admin solo puede eliminar usuarios de su propio bar.
    const [{ data: requester, error: requesterError }, { data: target, error: targetError }] = await Promise.all([
      supabaseAdmin.from('usuarios').select('bar_id, rol').eq('id', requesterId).single(),
      supabaseAdmin.from('usuarios').select('bar_id').eq('id', userId).single(),
    ]);
    if (requesterError) throw requesterError;
    if (targetError) throw targetError;

    if (requester.rol !== 'admin' || requester.bar_id !== target.bar_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // No se borra la fila: hay ventas, gastos y turnos que referencian a
    // este usuario (usuario_id), y borrarlo de verdad rompería ese
    // historial. En cambio, se da de baja lógica (activo = false) y se
    // banea la cuenta de autenticación para que no pueda volver a entrar.
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ activo: false })
      .eq('id', userId);
    if (updateError) throw updateError;

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    if (banError) throw banError;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
