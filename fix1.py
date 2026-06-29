with open('src/app/(app)/cargar/page.jsx', 'r') as f:
    content = f.read()

# Quitar filtro de fecha
content = content.replace(
    ".eq('cerrado', false)\n        .gte('fecha', ayer < hoy ? ayer : hoy)\n        .order('fecha', { ascending: false })",
    ".eq('cerrado', false)\n        .order('fecha', { ascending: false })"
)

# Quitar variables ayer
content = content.replace(
    "    const hoy = realDateStr();\n    const ayer = todayStr();\n\n",
    "    const hoy = realDateStr();\n\n"
)

with open('src/app/(app)/cargar/page.jsx', 'w') as f:
    f.write(content)
print('OK')
