# Cuaderno del revisor semanal

Lo lee el agente de revisión semanal antes de trabajar y lo actualiza al terminar.
Vive en esta rama (`revisor-memoria`) para no mezclarse con el código: nada de aquí
llega a los usuarios de la extensión.

## Cómo se usa

- **Al empezar:** leer este archivo entero y, después, lo que Antonio hizo con las PR
  anteriores (`gh pr list --state all --search "head:revision/" --limit 10` y sus
  comentarios con `gh pr view <n> --comments`).
- **Al terminar:** apuntar en "Lecciones" lo aprendido esta semana y añadir una línea al
  "Registro". Una lección es algo que cambia cómo trabajar la próxima vez, no un resumen.
  - PR fusionada → qué tipo de cambio le sirvió.
  - PR cerrada sin fusionar → por qué (si lo dijo) y qué evitar.
  - Comentario suyo → la preferencia que expresa, tal cual.
- Si una lección deja de ser cierta, se tacha o se borra. Máximo 40 lecciones: si se pasa,
  se fusionan las parecidas.

## Lo que ya se sabe de Antonio (29-10-2026)

- Quiere cambios que arreglen algo que se pueda reproducir o que sigan una novedad oficial
  de Google. No le interesan los cambios de estilo ni los refactors.
- Revisa poco código: la descripción de la PR tiene que bastar para decidir. Qué fallaba,
  cómo se nota en la extensión y por qué el arreglo es seguro, en lenguaje claro.
- Aprobar la PR publica en la Chrome Web Store sin más pasos. Por eso cada PR sube la
  versión y tiene que poder salir a sus usuarios tal cual.
- Time Travel se aplica a todo el navegador a propósito. No proponer limitarlo por dominio.
- Todo en español. Sin rastro de Claude en commits, código ni docs.

## Lecciones

(vacío)

## Registro

| Fecha | Qué hice | Resultado |
|---|---|---|
| 2026-10-29 | v1.4.2 preparada a mano en local: 6 fallos, Lab por dominio, tests/qa.js | Fusionada |
