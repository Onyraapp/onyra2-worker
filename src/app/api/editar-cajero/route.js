import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, nombre, email, requesterId, requesterRol } = await request.json();

    if (!userId || !nombre || !email) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Solo puede editar: un admin del mismo bar, o el propio usuario editando su perfil.
    const { data: target, error: targetError } = await supabaseAdmin
      .from('usuarios')
      .select('id, bar_id, email')
      .eq('id', userId)
      .single();
    if (targetError) throw targetError;

    const esUnoMismo = requesterId === userId;
    let permitido = esUnoMismo;

    if (!permitido && requesterRol === 'admin') {
      const { data: requester, error: requesterError } = await supabaseAdmin
        .from('usuarios')
        .select('bar_id, rol')
        .eq('id', requesterId)
        .single();
      if (requesterError) throw requesterError;
      permitido = requester.rol === 'admin' && requester.bar_id === target.bar_id;
    }

    if (!permitido) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Si cambia el email, hay que actualizarlo también en el usuario de autenticación,
    // no solo en la tabla usuarios (si no, se desincroniza el login).
    if (email !== target.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email, email_confirm: true });
      if (authError) throw authError;
    }

    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ nombre, email })
      .eq('id', userId);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
