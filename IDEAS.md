# Ideas de mejora de Analytics Copilot

La lista viva del revisor semanal. Aquí se apunta TODO lo que podría mejorar la
extensión, venga de donde venga, con su puntuación. Cada lunes se añade lo nuevo,
se repuntúa lo que haya cambiado y se trabaja en la idea con más puntos, si llega al
mínimo. Las ideas no se borran: pasan a "Hechas" o a "Descartadas" con el motivo.

## Cómo se puntúa (de 0 a 3 cada una)

| Criterio | 0 | 3 |
|---|---|---|
| **Impacto** para un analista web | Curiosidad o noticia general | Cambia una tarea de QA que hace a menudo (Consent, GA4, GTM, Ads) en muchas webs |
| **Encaje** con la extensión | Pide permisos nuevos o algo que no se ve desde el navegador | Cabe en una herramienta que ya existe |
| **Prueba** | Rumor, beta solo en EE. UU. o un proveedor vendiendo | Documentación oficial o fallo reproducido |
| **Riesgo** (al revés) | Toca muchas piezas o el motor de captura | Cambio pequeño y cubierto por tests/qa.js |

Se trabaja una idea solo si suma **9 o más** y ninguna nota es 0. Si ninguna llega,
esa semana no hay PR.

## Pendientes

| Idea | De dónde sale | Impacto | Encaje | Prueba | Riesgo | Total |
|---|---|---|---|---|---|---|
| Consent: aviso cuando un hit de Google (GA4/Ads) sale antes del `consent default` (sin gcs o con hora anterior). Google pide el default antes de cualquier config/event. (09-11: repuntuada, depende de leer `gcd`, cuyo formato Google no documenta → riesgo de avisos falsos) | Investigación 03-11 (Consent Mode) | 3 | 3 | 2 | 1 | 9 |
| Tag Scanner: sacar también los IDs de GA4 (`tid`) de los hits /g/collect reales; hoy no salen si gtag se sirve desde un dominio propio o un sGTM con cargador personalizado | Investigación 09-11 (GA4) | 2 | 3 | 2 | 3 | 10 |
| GA4: avisar si los hits de producción llevan `_dbg=1` o `ep.debug_mode` (debug_mode olvidado: ensucia DebugView y lo quita el filtro de tráfico de desarrolladores) | Investigación 09-11 (GA4) | 2 | 3 | 2 | 3 | 10 |
| Consent + Tag Scanner: avisar si Clarity o Hotjar (session replay) cargan con analytics_storage denegado; la CNIL pide consentimiento previo y enmascarado | Noticia 09-11 (CNIL, session replay) | 2 | 2 | 3 | 2 | 9 |
| page_view duplicado: ver también los eventos que van agrupados en el cuerpo de un POST (interceptor), no solo los de la URL | Investigación 09-11 (GA4), sigue a v1.6.0 | 2 | 3 | 2 | 1 | 8 |
| Cookie Audit: "fuente al aterrizar" (utm_*, gclid, referrer) para ver de un vistazo cómo llega la sesión; útil ahora que Gemini quita utm_source | Noticia 02-11 (Gemini sin UTM) | 2 | 3 | 2 | 2 | 9 |
| El Lab de popup.html y panel.html se han separado (el panel no tiene tarjetas plegables ni aria) | Revisión 29-10 | 1 | 3 | 3 | 2 | 9 |
| La captura de consola se queda activa en todas las webs y entre reinicios del navegador; avisar más claro o limitarla a la pestaña | Revisión 29-10 | 2 | 3 | 3 | 2 | 10 |
| Detección de CMP: `window.CookieConsent` no es exclusivo de Cookiebot (lo usa también la librería cookieconsent) | Revisión 29-10 | 1 | 3 | 2 | 3 | 9 |
| El override de Time Travel llega después de los primeros scripts de la página: GTM puede leer la fecha real al cargar | Revisión 29-10 | 2 | 2 | 3 | 1 | 8 |

## Hechas

| Idea | Versión |
|---|---|
| Tag Scanner avisa del `page_view` de GA4 duplicado (mismo ID y URL, ≤ 3 s) | v1.6.0 (PR #2, fusionada 09-11) |
| Enlace "Proponer una mejora" en Inicio + plantillas de issue (idea / fallo) | v1.5.0 (PR #1, fusionada 05-11) |
| Consent lee el snippet estándar de gtag (`arguments`) | v1.4.2 |
| Tag Scanner sin IDs falsos; reglas de bloqueo sin duplicar | v1.4.2 |
| Cookie Audit no pierde eventos con el service worker dormido | v1.4.2 |
| Lab solo en su dominio; Time Travel `instanceof Date`; Cache Storage por sitio | v1.4.2 |

## Descartadas

| Idea | Motivo |
|---|---|
| Limitar Time Travel a un dominio | Antonio lo quiere para todo el navegador (29-10) |
| Shopify network_access: las apps declaran sus orígenes (05-11) | Afecta a apps de Shopify, no a lo que ve un analista en la web (09-11) |
| GA4 Data Manager, MCP de GA4, Looker Studio Union (semana 03-09/11) | No se ven desde el navegador (09-11) |
| sGTM pasa la IP completa a etiquetas de Ads (11-01-2027) | Ocurre en el servidor; no se ve desde el navegador (03-11) |
