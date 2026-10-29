# Analytics Copilot — memoria del proyecto

Extensión de Chrome (Manifest V3) de **QA de analítica web**, de Antonio Luis Pérez.
Publicada en la Chrome Web Store y en GitHub con licencia MIT.

- Store: https://chromewebstore.google.com/detail/analytics-copilot/icnecmnkghkklcjmolmmcljdodeglfpe
- Repo: https://github.com/antonioluisperez/analytics-copilot
- Landing: https://antonioluisperez.com/analytics-copilot/ (la mantiene **otro** proyecto de Claude)

## Estructura

```
manifest.json      Manifest V3
background.js      Service worker: motor del Cookie Audit, inyecciones, Lab
ui/                Popup, panel DevTools, visor de capturas, lógica y estilos
content/           Content scripts dinámicos
icons/             Iconos de la extensión + fuentes SVG
docs/              Material de publicación (ver abajo)
capturas/          LOCAL, fuera de git: originales en bruto de las capturas
dist/              LOCAL, fuera de git: ZIPs de cada release
```

`docs/` es lo que se publica y lo que consumen terceros:

| Ruta | Para qué | Quién lo lee |
|---|---|---|
| `docs/screenshots/` | Imágenes finales 1280×800 sobre slate `#1F2937` | README, landing y ficha de la Store |
| `docs/landing-brief.md` | Especificación completa de la página del portfolio | El agente que lleva antonioluisperez.com |
| `docs/release-notes/vX.Y.Z.md` | Qué cambia en la web en cada versión | El mismo agente |
| `docs/store-listing.md` | Propósito único, justificación de permisos, descripción y "Qué hay de nuevo" | Antonio, al subir a la Store |

Regenerar una imagen de `docs/screenshots/` = recortar el original de `capturas/`, escalarlo y centrarlo en un lienzo 1280×800 de color `#1F2937` (con PIL). Recortar siempre el borde del navegador: deja una línea oscura de 1px que canta sobre el fondo slate.

## Reglas que costaron caro — no repetir

- **Nada de sprites SVG externos.** Un `<use href="icons.svg#id">` hacía que el popup dejara de abrirse tras el primer uso, sin ningún error visible. El sprite va **incrustado** en `popup.html` y `panel.html`.
- **`popup.html` y `panel.html` son gemelos.** Comparten `popup.js` y `styles.css`: todo cambio de markup va en los dos.
- **Nunca `new Function()` ni `eval()`.** Motivó un rechazo de la Store. El generador de eventos usa esquemas declarativos, no código evaluado.
- **`chrome.permissions.request()` solo dentro de un gesto del usuario**; si no, cierra el popup.
- **`cookies` es permiso opcional**: nada de `chrome.cookies.*` en el nivel superior de `background.js` — el service worker peta con *status code 15*. Va detrás de `permissions.contains`.
- **El motor de captura funciona; no tocarlo** salvo petición explícita (`shotMeasure`, `shotScrollTo`, `shotPrepare`, `shotHideFixedNow`, `shotRestore`, `shotPrimeLazy`, `captureFullPage` en `ui/popup.js`). La escala se deriva de `img.width / innerWidth`, nunca de `devicePixelRatio`.
- **Ningún canvas del tamaño de la captura.** Superan el límite de textura de la GPU (16.384 px) y Chrome rasteriza por CPU: el editor se vuelve inusable. `ui/shot.js` pinta en una capa del tamaño de lo visible. Explicado en ARQUITECTURA.md.
- **Las capturas sueltas van a `capturas/`**, nunca a la raíz: un `git add -A` las publica.

## Cómo se añade contenido

- **Regla de auditoría de Consent** → un objeto más en `CONSENT_AUDIT_RULES` (`ui/popup.js`)
- **Evento de dataLayer** → un objeto más en `DL_EVENT_SCHEMAS` (`ui/popup.js`)

Ambos son declarativos: añadir uno no toca lógica.

## Pruebas

`node tests/qa.js` carga la extensión en un Chrome real y comprueba cada fallo que ya pasó una vez (Consent con `arguments`, IDs falsos, reglas duplicadas, Time Travel, Lab por dominio, service worker dormido). GitHub la pasa en cada push y PR (`.github/workflows/qa.yml`). **Todo arreglo añade su caso a `CASOS`**, que falle sin el arreglo y pase con él.

## Publicar una versión

Aprobar (fusionar) la PR que sube la versión **es** publicar: `.github/workflows/publicar.yml` vuelve a pasar la prueba, crea el tag y la release con el ZIP y lo sube a la Chrome Web Store, que lo revisa en 1-3 días. Por eso la PR ya lleva todo:

1. `version` subida en `manifest.json` (arreglo = la última cifra, feature nueva = la media)
2. **`docs/release-notes/vX.Y.Z.md` siempre**, para el agente de la web
3. `docs/store-listing.md` (texto de "Qué hay de nuevo") y `docs/landing-brief.md` si cambia el número de herramientas
4. `tests/qa.js` en verde, sin `new Function`/`eval` y sin referencias a empresas, correos ni a Claude

Si faltan los secretos `CWS_*` del repo, la release se crea igual y la subida a la Store queda para hacerla a mano. Los ZIP también se pueden generar en local, en `dist/`.

## Revisor semanal

Un agente en la nube (https://claude.ai/code/routines/trig_01Sd2hc9YnEDDfhey3Sa4hJj) revisa el repo los lunes y abre como mucho una PR en una rama `revision/`. Aprende de lo que Antonio fusiona, cierra o comenta. Su manual (`MANUAL-REVISOR.md`), sus lecciones, su lista de ideas puntuadas y el registro de cambios que se hace a sí mismo están en la rama `revisor-memoria` (ver su README). Lo pequeño se lo cambia solo; lo importante lo propone por Telegram.

## Convenciones

- Todo en **español**: UI, documentación y mensajes de commit
- **Sin rastro de empresas ni de Claude** en código, docs o commits — el repo es personal y público
- Los commits van a nombre de `antonioluisperez`
- **No empujar a main sin que Antonio lo pida.** En local se trabaja y se avisa; el revisor semanal solo empuja a sus ramas `revision/` y a `revisor-memoria`
- No inventar ni generar capturas de la extensión: si falta una vista, pedírsela
