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
| Tag Scanner: avisar de «instalación no soportada»: un ID G-/AW-/DC- cargado por gtm.js (gtm.js?id=G-…) o gtag('config') sueltos junto a gtm.js. Google actualiza los snippets para que GTM deje de esperar esos config (anunciado 17-11 para enero de 2027, «pronto» en la ayuda) y avisó por correo a los contenedores afectados | Pista del 18-11 + noticia [Ext] del 18-11 (Antonio la marcó útil en la encuesta) + support.google.com/tagmanager/answer/17231523, confirmado el 23-11 | 3 | 3 | 3 | 2 | 11 |
| Cookie Audit > Conversiones: avisar si una conversión de Google Ads sale sin transaction_id (oid): si se recarga la página de gracias se cuenta dos veces. Hoy se enseña cuando está, pero no se avisa cuando falta | Investigación 23-11 (Google Ads y atribución); Google Ads recomienda el transaction ID para deduplicar | 2 | 3 | 3 | 3 | 11 |
| «Desde dónde se sirven» (v1.7.0): cubrir también los hits de Google Ads (/pagead/conversion, /ccm/collect) además de los de GA4, para ver si la conversión de Ads pasa por el gateway | Investigación 23-11, sigue a v1.7.0 | 2 | 3 | 2 | 3 | 10 |
| Consent > Pings: mostrar el gcd decodificado de cada hit (al tocarlo) y avisar si un hit sale con Consent Mode inactivo (bandera de la posición 9 del gcd) o con GPC; sigue a v1.6.1 | Investigación 16-11 (Consent, librería consent-string) | 2 | 3 | 2 | 2 | 9 |
| GTM: avisar si el mismo contenedor GTM-XXXX se carga dos veces en la página (comprobar antes si el Tag Scanner ya lo hace) | Investigación 16-11 (GTM) | 2 | 3 | 2 | 3 | 10 |
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
| Tag Scanner dice desde dónde se sirven las etiquetas de Google: ruta propia (gateway / server-side) o directo a Google, y avisa si hay hits de GA4 que se saltan la ruta propia (propuesta 5, «sí 5» del 16-11) | v1.7.0 (PR #4, fusionada 24-11) |
| Consent lee el gcd por bits: mayúsculas con declare y delegación, sin estados falsos (idea de Antonio, 12-11) | v1.6.1 (PR #3, fusionada 16-11) |
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
| Botón «Copiar informe de QA» en Inicio (propuesta 4) | «no 4» de Antonio (10-11). Además, Consent ya tenía «Copiar informe» |
| page_view al volver con bfcache en GTM (9-11) | Comportamiento buscado de GTM; el aviso de duplicado (≤ 3 s, misma URL) no salta al volver atrás (16-11) |
| Geolocalización de google_tag_data.xcd (Thyngster, 10-11) | No documentada por Google y no cambia una comprobación de QA hoy (16-11) |
| Conversion Lift, ValueTrack de AI Max, EDPB interés legítimo (semana 10-16/11) | No se ven desde el navegador (16-11) |
| Safari arregla los beacons de pagehide (Technology Preview 257, 20-11) | La extensión solo corre en Chrome: no se ve desde ella (23-11) |
| Search Journey Awareness, Ads Decoded A/B, Business Hub de ChatGPT, Shopify network_access y abandonedCheckoutUrl (semana 17-23/11) | No se ven desde el navegador o no cambian una comprobación de QA en la web (23-11) |
