# La casa de los agentes de Analytics Copilot

Esta rama no lleva código de la extensión. Es la memoria y el manual de los dos
agentes que trabajan sobre ella. Nada de aquí llega a los usuarios.

| Archivo | De quién | Qué es |
|---|---|---|
| `MANUAL-REVISOR.md` | Revisor semanal (lunes) | Cómo trabaja: fuentes, criterio, PR |
| `MANUAL-POSTS.md` | Agente de ideas de post (jueves) | Cómo escribe: material, formato, voz |
| `IDEAS.md` | Revisor | Lista viva de mejoras de la extensión, puntuadas |
| `APRENDIZAJES.md` | Revisor | Lecciones de lo que Antonio aprueba, cierra o comenta |
| `CAMBIOS.md` | Los dos | Registro de cambios que cada agente se ha hecho a sí mismo, y propuestas pendientes |

## Cómo se mejoran solos

Cada agente tiene dos capas:

- **La constitución**, en las instrucciones de su rutina en claude.ai. No la pueden
  tocar. Solo la cambian Antonio y Claude en una sesión.
- **Su manual**, en esta rama. Lo leen al empezar y lo pueden mejorar al terminar.

| Nivel | Qué | Cómo |
|---|---|---|
| 🟢 Solo | Las secciones del manual marcadas 🟢: fuentes, temas de investigación, formato, orden de los pasos, casos de prueba, lecciones | Lo cambian, lo apuntan en `CAMBIOS.md` y lo cuentan en su mensaje de Telegram |
| 🟠 Con permiso | Las secciones marcadas 🟠 (umbral, voz de marca, qué se envía o publica) y todo lo que toque a otro agente | Lo proponen por Telegram con "💡 Propuesta" y lo aplican cuando Antonio responde "sí" |
| 🔴 Nunca | Publicar sin Antonio, la rama main, claves, conectores, su constitución, el documento del agente de noticias | Prohibido |

Antonio responde en Telegram. El agente de noticias pasa esas respuestas a la
sección "Feedback para otros agentes" de su documento, y los agentes la leen en su
siguiente ejecución.
