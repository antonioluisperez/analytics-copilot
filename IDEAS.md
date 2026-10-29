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
| Enlace "Proponer una mejora" en la extensión que abra un issue con plantilla, para que los usuarios aporten ideas | Antonio, 29-10 | 2 | 3 | 3 | 3 | 11 |
| Plantillas de issue en el repo (fallo / idea) para que las propuestas lleguen ordenadas | Antonio, 29-10 | 1 | 3 | 3 | 3 | 10 |
| El Lab de popup.html y panel.html se han separado (el panel no tiene tarjetas plegables ni aria) | Revisión 29-10 | 1 | 3 | 3 | 2 | 9 |
| La captura de consola se queda activa en todas las webs y entre reinicios del navegador; avisar más claro o limitarla a la pestaña | Revisión 29-10 | 2 | 3 | 3 | 2 | 10 |
| Detección de CMP: `window.CookieConsent` no es exclusivo de Cookiebot (lo usa también la librería cookieconsent) | Revisión 29-10 | 1 | 3 | 2 | 3 | 9 |
| El override de Time Travel llega después de los primeros scripts de la página: GTM puede leer la fecha real al cargar | Revisión 29-10 | 2 | 2 | 3 | 1 | 8 |

## Hechas

| Idea | Versión |
|---|---|
| Consent lee el snippet estándar de gtag (`arguments`) | v1.4.2 |
| Tag Scanner sin IDs falsos; reglas de bloqueo sin duplicar | v1.4.2 |
| Cookie Audit no pierde eventos con el service worker dormido | v1.4.2 |
| Lab solo en su dominio; Time Travel `instanceof Date`; Cache Storage por sitio | v1.4.2 |

## Descartadas

| Idea | Motivo |
|---|---|
| Limitar Time Travel a un dominio | Antonio lo quiere para todo el navegador (29-10) |
