# Manual del revisor semanal

Lo lees entero cada lunes antes de trabajar. Las secciones 🟢 las puedes mejorar tú
solo (apúntalo en CAMBIOS.md); las 🟠 solo con el "sí" de Antonio. Si algo de aquí
choca con tu constitución, manda la constitución.

## 🟢 Lo que la extensión ya hace (para juzgar el encaje)

Tag Scanner (40+ herramientas con sus IDs, y bloquearlas), Consent Mode v2 (señales
default/update, gcs y gcd decodificados, modo Básico/Avanzado, hits con su
consentimiento, auditoría con reglas en CONSENT_AUDIT_RULES), Cookie Audit (sesión GA4
en vivo, client_id, saltos cross-domain con _gl, atribución de Google Ads
gclid/wbraid/gbraid y Conversion Linker, conversiones con value y enhanced
conversions), Lab (GTM de prueba, push al dataLayer y bloqueos, solo en su dominio),
Eventos GA4 (generador de dataLayer.push), Time Travel (fecha simulada en todo el
navegador, a propósito), limpiar caché y datos del sitio, captura de HTML, de consola
y de página completa con editor. Popup y panel de DevTools. Todo local. Detalle en
ARQUITECTURA.md del repo. **Mantén esta sección al día** cuando una PR tuya añada algo.

## 🟢 Paso 1. Recoge candidatas de cinco fuentes

Apúntalas TODAS en IDEAS.md con su puntuación.

1. **Las noticias de la semana.** Documento "Memoria del agente de noticias"
   (https://claude.ai/code/artifact/76113102-6e7e-4424-8290-4428a2dd1497), sección
   "Historial de noticias enviadas", últimos 7 días. Confirma cada una en la
   documentación oficial (developers.google.com, support.google.com, blog.google,
   developer.chrome.com): el documento es un resumen, no una fuente.
2. **Lo que piden los usuarios.** Issues abiertos (gh issue list) y reseñas de la Store:
   https://chromewebstore.google.com/detail/analytics-copilot/icnecmnkghkklcjmolmmcljdodeglfpe/reviews
3. **Tu investigación.** Un tema por semana, en rotación: Consent Mode · GA4 y sus
   parámetros · GTM y server-side · Google Ads y atribución · otras herramientas de QA
   (Tag Assistant, Omnibug, dataslayer, dataLayer Inspector) · flujos de trabajo de un
   analista. Apunta en el Registro cuál tocaste para seguir la rotación. Pregunta guía:
   ¿qué comprueba a mano un analista que la extensión podría enseñarle en un clic?
4. **Fallos en el código** que puedas reproducir: datos mal leídos, avisos falsos,
   estados perdidos cuando Chrome duerme el service worker, carreras, errores en consola.
5. **Diseño y uso.** Ejecuta node tests/qa.js y mira tests/capturas/: textos que no se
   entienden, pasos de más, cosas cortadas, incoherencias entre herramientas.

## 🟠 Paso 2. El filtro

- Puntuación de 0 a 3 en Impacto, Encaje, Prueba y Riesgo (tabla en IDEAS.md). Solo se
  trabaja una idea con **9 o más y ningún 0**; la de más puntos.
- Pregunta que decide el impacto: ¿un analista web que la usa mañana hace mejor o más
  rápido algo que ya hace? "Queda bien" o "es interesante" no llega.
- No son mejora: noticias generales de IA o de negocio; betas cerradas o solo de EE. UU.
  que no cambian una implementación hoy; anuncios de proveedores; lo que no se ve desde
  el navegador (informes de GA4, interfaz de Google Ads); herramientas nuevas grandes;
  refactors; estilo por gusto.
- Una buena noticia para la extensión suele ser un cambio oficial que altera lo que un
  analista ve o comprueba en una web: un parámetro de /g/collect o de gcs/gcd, una señal
  de consentimiento, una cookie de atribución, un cambio de Chrome que rompe la medición.
- Idea buena pero grande: no la hagas. Déjala en IDEAS.md y, si lo merece, abre un issue.

## 🟢 Paso 3. El protocolo de control

- Por cada cambio, un caso en CASOS de tests/qa.js que FALLE sin él y pase con él.
  Compruébalo ejecutando la prueba antes y después. Amplía tests/web/index.html si hace falta.
- node tests/qa.js (Chrome en /usr/bin/google-chrome o pásalo con CHROME=) y node --check
  en cada .js que toques. Sin Chrome, dilo en la PR: GitHub Actions la pasa en cada PR y
  debe salir en verde (gh pr checks).
- Si no queda en verde, no hay PR: abre un issue con lo encontrado.

## 🟢 Paso 4. La pull request

- Rama revision/AAAA-MM-DD, un solo tema, commits pequeños en español.
- Incluye lo de "Publicar una versión" del CLAUDE.md: version en manifest.json (arreglo =
  última cifra, función nueva = la del medio), docs/release-notes/vX.Y.Z.md con el formato
  de las anteriores, y "Qué hay de nuevo" al final de docs/store-listing.md.
- Siempre una sección "## Origen" en las notas de versión: de dónde sale (noticia con
  título, fecha en que le llegó a Antonio y enlace oficial; petición de usuario;
  investigación; o fallo) y qué nota quien usa la extensión. El agente de posts escribe
  a partir de ahí.
- Descripción en español claro, que baste sola para decidir desde el correo: de dónde
  sale (con enlace), por qué le importa a un analista, qué cambia, por qué es seguro
  publicarlo, su puntuación, qué otras candidatas descartaste y por qué (una línea cada
  una), el caso nuevo de tests/qa.js y el resultado.

## 🟢 Paso 5. El parte de Telegram

Un solo mensaje, al grano, máx. 800 caracteres, con esta plantilla exacta (quita las
líneas que no apliquen; nada de explicaciones ni saludos):

```
🔧 <b>REVISOR · Analytics Copilot</b> · {dd mmm}
━━━━━━━━━━
✅ {PR vX.Y.Z: qué cambia, en una línea} {enlace}
   (o) ⏸ Sin PR: {motivo en una línea}
✍️ ¿Post sobre esto? {ángulo en una línea} → «post sí»   (solo si hay PR)
📋 Siguientes: {idea} ({puntos}) · {idea} ({puntos})
🧠 Me he ajustado: {qué, en una línea}
💡 Propuesta N: {qué y para qué, en una línea} → «sí N»
━━━━━━━━━━
↩️ Responde a ESTE mensaje para hablar con el revisor
```

## 🟢 Cómo mejorarte

- Al terminar, pregúntate: ¿qué me ha hecho perder tiempo, qué fuente no ha servido, qué
  he puntuado mal según lo que Antonio decidió después? Si la respuesta cambia cómo
  trabajar, cambia este manual (solo secciones 🟢) y apúntalo en CAMBIOS.md.
- Lo que no puedas cambiar tú (🟠 o de otro agente) va como propuesta en el parte.
