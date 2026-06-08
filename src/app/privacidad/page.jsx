// src/app/privacidad/page.jsx
export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto">
      <div className="mb-8">
        <a href="/" className="text-blue-600 text-sm">← Volver</a>
      </div>
      <h1 className="text-2xl font-bold mb-6">Política de Privacidad — Troco</h1>
      <div className="flex flex-col gap-4 text-sm text-gray-700">
        <p className="text-xs text-gray-400">Última actualización: Junio 2026</p>
        <h2 className="text-base font-bold mt-4">Nuestro compromiso</h2>
        <p>Los datos de tu negocio son tuyos. Troco se compromete a no divulgarlos, no venderlos y no usarlos para beneficio propio.</p>
        <h2 className="text-base font-bold mt-4">Qué datos recopilamos</h2>
        <p>Recopilamos email, nombre y datos operativos del negocio como ventas, gastos, retenciones y reportes ingresados en la app.</p>
        <h2 className="text-base font-bold mt-4">Cómo usamos los datos</h2>
        <p>Los datos se usan exclusivamente para proveer el servicio de control de caja. No los compartimos con terceros.</p>
        <h2 className="text-base font-bold mt-4">Seguridad técnica</h2>
        <p>Encriptación en tránsito y en reposo. Control de acceso por roles. Auditoría de accesos. Backups cifrados.</p>
        <h2 className="text-base font-bold mt-4">Eliminación de cuenta</h2>
        <p>Para solicitar la eliminación de tu cuenta y datos, enviá un email a trocolatam@gmail.com con el asunto "Eliminar cuenta".</p>
        <h2 className="text-base font-bold mt-4">Incidentes</h2>
        <p>Ante cualquier brecha de seguridad te notificamos dentro de las 72 horas con detalle de lo ocurrido y medidas tomadas.</p>
        <h2 className="text-base font-bold mt-4">Contacto</h2>
        <p>trocolatam@gmail.com</p>
      </div>
    </div>
  );
}
