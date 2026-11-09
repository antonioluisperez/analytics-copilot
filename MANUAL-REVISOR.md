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
y de página completa con editor. Popup y panel de DevTools. Enlace «Proponer una mejora» en el
pie de Inicio, a las plantillas de issue idea/fallo (v1.5.0). Aviso de page_view de GA4
duplicado en la tarjeta de GA4 del Tag Scanner (v1.6.0, si se fusiona). Todo local. Detalle en
ARQUITECTURA.md del repo. **Mantén esta sección al día** cuando una PR tuya añada algo.

## 🟢 Paso 0. Antes de nada

- Comprueba que puedes empujar (git push --dry-run origin revisor-memoria). Si no, dilo en la
  primera línea del parte: sin memoria guardada, la semana siguiente se trabaja a ciegas.
- Toda propuesta va a "Propuestas pendientes" de CAMBIOS.md ANTES de mandar el parte, con
  el mismo número que lleva en Telegram.

## 🟢 Si algo falla

Si no puedes guardar en GitHub, abrir la PR, leer el documento de noticias o pasar la
prueba por algo que no sea tu cambio, o si te bloquea el sistema de permisos, manda en el
momento un mensaje aparte, antes del parte:

```
⚠️ <b>REVISOR · Algo ha fallado</b>
{qué ha fallado, en una frase llana}
{qué tiene que hacer Antonio, con el enlace si lo hay; o «No tienes que hacer nada, lo reintento el lunes»}
```

Nada de códigos de error ni jerga. El 2-11 se perdió una semana de trabajo por un permiso
de GitHub que solo podía dar Antonio, y no lo entendió hasta dos días después.

## 🟢 Paso 1. Recoge candidatas de seis fuentes

Apúntalas TODAS en IDEAS.md con su puntuación.

1. **Las noticias de la semana.** Documento "Memoria del agente de noticias"
   (https://claude.ai/code/artifact/76113102-6e7e-4424-8290-4428a2dd1497), sección
   "Historial de noticias enviadas", últimos 7 días. Confirma cada una en la
   documentación oficial (developers.google.com, support.google.com, blog.google,
   developer.chrome.com): el documento es un resumen, no una fuente.
2. **Lo que piden los usuarios.** Issues abiertos (gh issue list) y reseñas de la Store (a 09-11:
   54 usuarios y 3 valoraciones de 5/5; basta con mirar si sube el número de valoraciones):
   https://chromewebstore.google.com/detail/analytics-copilot/icnecmnkghkklcjmolmmcljdodeglfpe/reviews
   Y, antes que nada, las filas del agente "revisor" que empiezan por "IDEA DE ANTONIO:"
   en "Feedback para otros agentes" (las manda él con /idea por Telegram). Van primero
   en IDEAS.md y pasan el mismo filtro, pero en el parte le contestas siempre a cada una,
   aunque sea para decirle por qué no entra.
3. **Tu investigación.** Un tema por semana, en rotación: Consent Mode · GA4 y sus
   parámetros · GTM y server-side · Google Ads y atribución · otras herramientas de QA
   (Tag Assistant, Omnibug, dataslayer, dataLayer Inspector) · flujos de trabajo de un
   analista. Apunta en el Registro cuál tocaste para seguir la rotación (09-11: GA4 y sus parámetros → toca GTM y server-side). Pregunta guía:
   ¿qué comprueba a mano un analista que la extensión podría enseñarle en un clic?
4. **Fallos en el código** que puedas reproducir: datos mal leídos, avisos falsos,
   estados perdidos cuando Chrome duerme el service worker, carreras, errores en consola.
5. **Diseño y uso.** Ejecuta node tests/qa.js y mira tests/capturas/: textos que no se
   entienden, pasos de más, cosas cortadas, incoherencias entre herramientas.
6. **La biblioteca de Antonio.** Sección "Biblioteca de Antonio (📌)" del mismo
   documento: lo que él ha visto en LinkedIn y le ha parecido bueno (skills, trucos,
   herramientas). Las filas nuevas desde tu última revisión. Que él lo haya guardado
   ya dice que le interesa, pero pasa el mismo filtro. Ve a la fuente original, nunca
   a LinkedIn. Si sale una PR o una propuesta de ahí, dilo en el "## Origen".

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
- Sin rastro de Claude en la PR. Si al crearla se añade solo un pie tipo "Generated by
  Claude Code" (pasó en la PR #1), quítalo con gh pr edit antes de mandar el parte, y
  comprueba que la descripción no dice "Claude" en ningún sitio.
  Ojo (09-11): editarla con `gh api` (PATCH) vuelve a añadir el pie; usa la herramienta de
  GitHub `update_pull_request`, que no lo añade, y vuelve a leer la descripción para confirmarlo.

## 🟢 Paso 5. El parte (PARTE.md)

Desde el 5-11 el parte no va por Telegram: lo escribes en PARTE.md (primera línea, la fecha
de hoy) y el jefe del equipo de noticias se lo pasa a Antonio el lunes a las 18:00, junto con
sus noticias. Él lo resume, así que escribe claro y completo. Tus propuestas le llegan como
R1, R2… y Antonio contesta «sí R3»; tú lo verás como «sí 3» en Feedback para otros agentes.

Antonio lo lee en el móvil y tiene que entenderlo a la primera y saber qué hacer.
Lenguaje llano, como si se lo contaras en persona. Prohibido en el parte: "PR", número
de versión, puntos o puntuaciones, "candidatas", nombres de archivos o de funciones y
siglas sin explicar. Di "la mejora" y qué nota quien usa la extensión. Máximo 900
caracteres. Plantilla exacta (quita lo que no aplique; nada de saludos):

```
🔧 <b>REVISOR · Analytics Copilot</b> · {dd mmm}
━━━━━━━━━━
<b>Esta semana</b>
{1 o 2 frases: qué he mejorado y para qué le sirve a quien usa la extensión}
(o, si no hay mejora: {por qué no, en una frase})

<b>Lo que tienes que hacer</b>
1. Si te parece bien, abre el enlace y pulsa «Merge pull request»: se publica sola. Si no, no hagas nada. {enlace}
2. ¿Quieres un post sobre esto? Responde «post sí».
3. 💡 {N}. {Para la extensión / Para los bots}: {qué propongo y qué ganas, en una frase} → «sí {N}» o «no {N}»
(si no hay nada que hacer: «Nada esta semana.»)

<b>Me he ajustado</b>
{qué he cambiado en mi forma de trabajar, en una frase}
━━━━━━━━━━
```

- Posts en pausa desde el 4-11 (Antonio acaba de entrar en Product Hackers y no va a
  publicar en LinkedIn por ahora): quita el punto 2 hasta que esto cambie.
- Los puntos 1 y 2 solo van si hay mejora. Cada propuesta es una línea 💡 y sigue la
  numeración de CAMBIOS.md.
- Las propuestas son para la extensión y para los bots (los tres agentes: noticias,
  revisor y posts). Si tienes una buena de cada tipo, manda las dos.
- Lo técnico (lo que descartaste, puntuaciones, pruebas) va en la descripción de la PR,
  no en el parte.

## 🟢 Cómo mejorarte

- Al terminar, pregúntate: ¿qué me ha hecho perder tiempo, qué fuente no ha servido, qué
  he puntuado mal según lo que Antonio decidió después? Si la respuesta cambia cómo
  trabajar, cambia este manual (solo secciones 🟢) y apúntalo en CAMBIOS.md.
- Lo que no puedas cambiar tú (🟠 o de otro agente) va como propuesta en el parte.
