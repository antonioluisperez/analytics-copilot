// Visor y editor de la última captura (guardada en IndexedDB por el popup).
// Anota antes de compartir: flechas, cajas, texto y difuminado de datos sensibles.
// Todo local; nada sale del navegador.
//
// RENDIMIENTO — las capturas de página completa son enormes (2880×18522 = 53 MP).
// Un canvas de ese tamaño ocupa ~200 MB y supera el límite de textura de la GPU
// (16.384 px), así que Chrome lo rasteriza por CPU y todo va a pedales.
// Por eso aquí NO existe ningún canvas del tamaño de la imagen:
//   · el fondo es un <img> (lo compone el navegador, coste cero)
//   · las anotaciones se dibujan en UNA capa del tamaño de lo VISIBLE (~5 MP),
//     con una transformación que permite seguir trabajando en coordenadas de la
//     imagen original; se redibuja al mover el ratón, al hacer scroll y al editar
//   · la imagen a tamaño completo solo se compone una vez, al exportar
const DB_NAME = "ac-shots";
const STORE = "shots";
const DPR_MAX = 2;

function dbGet(key) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const tx = req.result.transaction(STORE, "readonly");
      const g = tx.objectStore(STORE).get(key);
      g.onsuccess = () => resolve(g.result || null);
      g.onerror = () => reject(g.error);
    };
  });
}

const fmtSize = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.round(n / 1024) + " KB");

let img = null, rec = null, stage = null, capa = null, ctx = null, barra = null;
let anotaciones = [], enCurso = null, rafPend = false;
let tool = "move", color = "#ef4444";
let seleccion = -1;        // índice del elemento seleccionado
let arrastre = null;       // { idx, dx, dy } mientras se mueve
let grosor = 4, tamTexto = 28;
let S = 1;            // px mostrados por cada px natural de la imagen
let vista = null;     // zona visible en coordenadas de pantalla

// Ajusta la capa al trozo visible del lienzo y prepara la transformación
function ajustarCapa() {
  const r = stage.getBoundingClientRect();
  S = r.width / img.naturalWidth;
  const topBarra = barra ? barra.getBoundingClientRect().bottom : 0;
  const vx = Math.max(r.left, 0);
  const vy = Math.max(r.top, topBarra);
  const vw = Math.min(r.right, window.innerWidth) - vx;
  const vh = Math.min(r.bottom, window.innerHeight) - vy;
  if (vw <= 0 || vh <= 0) { capa.style.display = "none"; vista = null; return false; }

  capa.style.display = "block";
  capa.style.left = vx + "px";
  capa.style.top = vy + "px";
  capa.style.width = vw + "px";
  capa.style.height = vh + "px";

  const k = Math.min(window.devicePixelRatio || 1, DPR_MAX);
  const bw = Math.round(vw * k), bh = Math.round(vh * k);
  if (capa.width !== bw || capa.height !== bh) { capa.width = bw; capa.height = bh; }

  // Con esta transformación podemos dibujar en coordenadas de la imagen original
  ctx.setTransform(S * k, 0, 0, S * k, (r.left - vx) * k, (r.top - vy) * k);
  vista = { top: (vy - r.top) / S, bottom: (vy - r.top + vh) / S };
  return true;
}

function bbox(a) {
  const m = Math.max(grosor * 6, tamTexto * 2, 40);
  return {
    top: Math.min(a.y1, a.y2) - m,
    bottom: Math.max(a.y1, a.y2) + m + tamTexto,
  };
}

// Medidas reales del elemento, para seleccionarlo y resaltarlo
function medidas(a) {
  if (a.tipo === "text") {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = "700 " + tamTexto + "px system-ui, -apple-system, sans-serif";
    const w = ctx.measureText(a.texto || "").width;
    ctx.restore();
    const pad = tamTexto * 0.28;
    return { x: a.x1 - pad, y: a.y1 - pad, w: w + pad * 2, h: tamTexto + pad * 2 };
  }
  const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2);
  return { x: x, y: y, w: Math.abs(a.x2 - a.x1), h: Math.abs(a.y2 - a.y1) };
}

function distanciaASegmento(p, a) {
  const dx = a.x2 - a.x1, dy = a.y2 - a.y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((p.x - a.x1) * dx + (p.y - a.y1) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x1 + t * dx, cy = a.y1 + t * dy;
  return Math.hypot(p.x - cx, p.y - cy);
}

function contiene(a, p) {
  if (a.tipo === "arrow") return distanciaASegmento(p, a) <= Math.max(grosor * 3, 12);
  const m = medidas(a);
  const tol = Math.max(grosor, 6);
  return p.x >= m.x - tol && p.x <= m.x + m.w + tol && p.y >= m.y - tol && p.y <= m.y + m.h + tol;
}

// El de más arriba en la pila gana
function buscarEn(p) {
  for (let i = anotaciones.length - 1; i >= 0; i--) {
    if (contiene(anotaciones[i], p)) return i;
  }
  return -1;
}

function mover(a, dx, dy) {
  a.x1 += dx; a.y1 += dy; a.x2 += dx; a.y2 += dy;
}

function dibujarSeleccion(c, a) {
  const m = medidas(a);
  const pad = Math.max(grosor * 2, 10);
  c.save();
  c.strokeStyle = "#2563eb";
  c.lineWidth = Math.max(grosor * 0.6, 2);
  c.setLineDash([grosor * 3, grosor * 2]);
  c.strokeRect(m.x - pad, m.y - pad, m.w + pad * 2, m.h + pad * 2);
  c.restore();
}

function dibujarFlecha(c, a) {
  const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
  const cabeza = Math.max(grosor * 4, 14);
  c.strokeStyle = a.color; c.fillStyle = a.color;
  c.lineWidth = grosor; c.lineCap = "round";
  c.beginPath();
  c.moveTo(a.x1, a.y1);
  c.lineTo(a.x2 - Math.cos(ang) * cabeza * 0.6, a.y2 - Math.sin(ang) * cabeza * 0.6);
  c.stroke();
  c.beginPath();
  c.moveTo(a.x2, a.y2);
  c.lineTo(a.x2 - Math.cos(ang - 0.42) * cabeza, a.y2 - Math.sin(ang - 0.42) * cabeza);
  c.lineTo(a.x2 - Math.cos(ang + 0.42) * cabeza, a.y2 - Math.sin(ang + 0.42) * cabeza);
  c.closePath(); c.fill();
}

function dibujarRect(c, a) {
  c.strokeStyle = a.color; c.lineWidth = grosor;
  c.strokeRect(Math.min(a.x1, a.x2), Math.min(a.y1, a.y2),
               Math.abs(a.x2 - a.x1), Math.abs(a.y2 - a.y1));
}

// Pixela muestreando de la imagen ORIGINAL: en el PNG exportado el dato queda
// irrecuperable, no es un efecto visual reversible.
function dibujarBlur(c, a) {
  const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2);
  const w = Math.abs(a.x2 - a.x1), h = Math.abs(a.y2 - a.y1);
  if (w < 4 || h < 4) return;
  const px = Math.max(6, Math.round(Math.min(w, h) / 8));
  const tmp = document.createElement("canvas");
  tmp.width = Math.max(1, Math.round(w / px));
  tmp.height = Math.max(1, Math.round(h / px));
  tmp.getContext("2d").drawImage(img, x, y, w, h, 0, 0, tmp.width, tmp.height);
  c.imageSmoothingEnabled = false;
  c.drawImage(tmp, 0, 0, tmp.width, tmp.height, x, y, w, h);
  c.imageSmoothingEnabled = true;
}

function dibujarTexto(c, a) {
  c.font = "700 " + tamTexto + "px system-ui, -apple-system, sans-serif";
  c.textBaseline = "top";
  const m = c.measureText(a.texto);
  const pad = tamTexto * 0.28;
  c.fillStyle = "rgba(255,255,255,0.92)";
  c.fillRect(a.x1 - pad, a.y1 - pad, m.width + pad * 2, tamTexto + pad * 2);
  c.fillStyle = a.color;
  c.fillText(a.texto, a.x1, a.y1);
}

function pintar(c, a) {
  if (a.tipo === "arrow") dibujarFlecha(c, a);
  else if (a.tipo === "rect") dibujarRect(c, a);
  else if (a.tipo === "blur") dibujarBlur(c, a);
  else if (a.tipo === "text") dibujarTexto(c, a);
}

// Redibuja SOLO lo visible. Coste constante (~5 MP) sea cual sea el alto real.
function render() {
  rafPend = false;
  if (!ajustarCapa()) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, capa.width, capa.height);
  ctx.restore();
  for (const a of anotaciones) {
    if (a.__editando) continue;                                   // se está reeditando
    const b = bbox(a);
    if (b.bottom < vista.top || b.top > vista.bottom) continue;   // fuera de pantalla
    pintar(ctx, a);
  }
  if (enCurso) pintar(ctx, enCurso);
  if (seleccion >= 0 && anotaciones[seleccion]) dibujarSeleccion(ctx, anotaciones[seleccion]);
}

function activarHerramienta(nombre) {
  tool = nombre;
  if (capa) capa.style.cursor = nombre === "move" ? "default" : (nombre === "text" ? "text" : "crosshair");
  const tools = document.getElementById("shotTools");
  if (tools) {
    tools.querySelectorAll("[data-tool]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.tool === nombre);
    });
  }
}

function pedirRender() {
  if (rafPend) return;
  rafPend = true;
  requestAnimationFrame(render);
}

function aImagen(ev) {
  const r = stage.getBoundingClientRect();
  return { x: (ev.clientX - r.left) / S, y: (ev.clientY - r.top) / S };
}

function pedirTexto(pos, editarIdx) {
  // Solo un campo abierto a la vez
  const previo = stage.querySelector(".shot-text-input");
  if (previo) previo.blur();

  const input = document.createElement("input");
  input.className = "shot-text-input";
  input.type = "text";
  input.style.left = (pos.x * S) + "px";
  input.style.top = (pos.y * S) + "px";
  input.style.color = color;
  input.placeholder = "Escribe y pulsa Enter";
  if (editarIdx != null && anotaciones[editarIdx]) {
    input.value = anotaciones[editarIdx].texto || "";
    input.style.color = anotaciones[editarIdx].color;
    anotaciones[editarIdx].__editando = true;
    pedirRender();
  }
  stage.appendChild(input);

  const cerrar = (guardar) => {
    if (input.__cerrado) return;
    input.__cerrado = true;
    const txt = input.value.trim();
    if (editarIdx != null && anotaciones[editarIdx]) delete anotaciones[editarIdx].__editando;
    if (guardar && txt) {
      if (editarIdx != null && anotaciones[editarIdx]) {
        anotaciones[editarIdx].texto = txt;
        seleccion = editarIdx;
      } else {
        anotaciones.push({ tipo: "text", x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, texto: txt, color: color });
        seleccion = anotaciones.length - 1;
        activarHerramienta("move");   // recién insertado: listo para colocarlo
      }
      pedirRender();
    } else if (editarIdx != null && anotaciones[editarIdx] && !txt) {
      anotaciones.splice(editarIdx, 1);   // texto vaciado = borrar
      seleccion = -1;
      pedirRender();
    }
    input.remove();
  };

  input.addEventListener("keydown", (e) => {
    e.stopPropagation();                       // que Ctrl+Z no llegue al deshacer global
    if (e.key === "Enter") { e.preventDefault(); cerrar(true); }
    if (e.key === "Escape") { e.preventDefault(); cerrar(false); }
  });
  // El clic que crea el campo puede robarle el foco justo después; solo
  // escuchamos el blur cuando ya está enfocado de verdad.
  input.addEventListener("blur", () => { if (input.__listo) cerrar(true); });

  requestAnimationFrame(() => {
    input.focus({ preventScroll: true });
    setTimeout(() => { input.__listo = true; }, 150);
  });
}

// Único punto donde se crea un canvas del tamaño real de la imagen, y solo al
// copiar o descargar. Incluye las anotaciones, nunca el marco de selección.
function componerBlob() {
  return new Promise((resolve, reject) => {
    try {
      const out = document.createElement("canvas");
      out.width = img.naturalWidth;
      out.height = img.naturalHeight;
      const o = out.getContext("2d");
      o.drawImage(img, 0, 0);
      anotaciones.forEach((a) => pintar(o, a));
      out.toBlob((b) => (b ? resolve(b) : reject(new Error("el navegador no pudo generar el PNG"))), "image/png");
    } catch (e) {
      reject(e);
    }
  });
}

function avisar(msg, esError) {
  const previo = document.getElementById("shotToast");
  if (previo) previo.remove();
  const t = document.createElement("div");
  t.id = "shotToast";
  t.className = "shot-toast" + (esError ? " is-error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), esError ? 6000 : 2200);
}

async function copiar(btn) {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    avisar("Este navegador no permite copiar imágenes al portapapeles. Usa Descargar PNG.", true);
    return;
  }
  const txt = btn ? btn.textContent : null;
  if (btn) { btn.disabled = true; btn.textContent = "Copiando…"; }
  try {
    // Se le pasa la PROMESA a ClipboardItem, no el blob ya resuelto: componer una
    // captura de 50 MP tarda, y si se esperase antes de llamar a write() Chrome
    // daría por caducado el gesto del usuario y rechazaría la escritura.
    // Se guarda el blob al vuelo para poder informar de lo que se ha copiado:
    // si el tamaño no es el de la captura completa, algo ha ido mal.
    let copiado = null;
    const item = new ClipboardItem({
      "image/png": componerBlob().then((b) => { copiado = b; return b; }),
    });
    await navigator.clipboard.write([item]);
    avisar("Copiado: " + img.naturalWidth + "×" + img.naturalHeight + " px"
      + (copiado ? " · " + fmtSize(copiado.size) : "")
      + " · " + anotaciones.length + " anotacion" + (anotaciones.length === 1 ? "" : "es"));
  } catch (e) {
    avisar("No se pudo copiar: " + e.message + ". Usa Descargar PNG.", true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = txt; }
  }
}

async function exportar(btn) {
  const txt = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Generando…";
  try {
    const blob = await componerBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (rec && rec.filename) || "captura.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) {
    avisar("No se pudo generar el PNG: " + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = txt;
  }
}

// El "Copiar imagen" nativo de Chrome copiaría solo el fondo, sin las
// anotaciones, así que se sustituye por un menú propio.
function cerrarMenu() {
  const m = document.getElementById("shotMenu");
  if (m) m.remove();
  document.removeEventListener("mousedown", alPulsarFuera, true);
  window.removeEventListener("scroll", cerrarMenu);
  window.removeEventListener("resize", cerrarMenu);
}

// Cerrar solo si la pulsación cae FUERA del menú. Si se cierra en el mousedown
// de un botón del propio menú, el botón desaparece del DOM antes del mouseup y
// el navegador ya no llega a emitir su "click": la opción no hacía nada.
function alPulsarFuera(ev) {
  const m = document.getElementById("shotMenu");
  if (m && !m.contains(ev.target)) cerrarMenu();
}

function menuContextual(ev) {
  ev.preventDefault();
  cerrarMenu();
  const m = document.createElement("div");
  m.id = "shotMenu";
  m.className = "shot-menu";
  [
    ["📋  Copiar imagen con anotaciones", () => copiar(document.getElementById("shotPageCopy"))],
    ["⬇  Descargar PNG", () => exportar(document.getElementById("shotPageDownload"))],
  ].forEach(([texto, accion]) => {
    const b = document.createElement("button");
    b.textContent = texto;
    b.addEventListener("click", () => { cerrarMenu(); accion(); });
    m.appendChild(b);
  });
  document.body.appendChild(m);

  const r = m.getBoundingClientRect();
  m.style.left = Math.min(ev.clientX, window.innerWidth - r.width - 8) + "px";
  m.style.top = Math.min(ev.clientY, window.innerHeight - r.height - 8) + "px";

  // En el siguiente frame, para que no lo cierre el propio evento que lo abrió
  requestAnimationFrame(() => {
    document.addEventListener("mousedown", alPulsarFuera, true);
    window.addEventListener("scroll", cerrarMenu);
    window.addEventListener("resize", cerrarMenu);
  });
}

(async function () {
  const body = document.getElementById("shotPageBody");
  const meta = document.getElementById("shotPageMeta");
  const btnDescargar = document.getElementById("shotPageDownload");
  const tools = document.getElementById("shotTools");
  barra = document.querySelector(".shot-page-bar");

  try { rec = await dbGet("last"); } catch (e) {}

  if (!rec || !rec.blob) {
    body.innerHTML = '<p class="shot-page-empty">No hay ninguna captura guardada. Haz una desde el icono de la cámara de la extensión.</p>';
    btnDescargar.disabled = true;
    const bc = document.getElementById("shotPageCopy");
    if (bc) bc.disabled = true;
    if (tools) tools.style.display = "none";
    return;
  }

  img = new Image();
  await new Promise((res, rej) => {
    img.onload = res; img.onerror = rej;
    img.src = URL.createObjectURL(rec.blob);
  });

  stage = document.createElement("div");
  stage.id = "shotStage";
  stage.className = "shot-stage";
  img.className = "shot-base";
  stage.appendChild(img);

  capa = document.createElement("canvas");
  capa.className = "shot-layer";
  ctx = capa.getContext("2d");

  grosor = Math.max(3, Math.round(img.naturalWidth / 500));
  tamTexto = Math.max(16, Math.round(img.naturalWidth / 90));

  body.innerHTML = "";
  body.appendChild(stage);
  document.body.appendChild(capa);   // fixed: fuera del flujo del documento
  render();

  try {
    const v = chrome.runtime.getManifest().version;
    const t = document.querySelector(".shot-page-title");
    if (t) t.appendChild(Object.assign(document.createElement("span"), {
      className: "shot-page-ver", textContent: "v" + v,
    }));
  } catch (e) {}

  meta.textContent = [
    rec.hostname || "",
    img.naturalWidth + " × " + img.naturalHeight + " px",
    fmtSize(rec.blob.size),
    rec.ts ? new Date(rec.ts).toLocaleString("es-ES") : "",
  ].filter(Boolean).join(" · ");
  document.title = "Captura de " + (rec.hostname || "página") + " — Analytics Copilot";

  window.addEventListener("scroll", pedirRender, { passive: true });
  window.addEventListener("resize", pedirRender);

  tools.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tool]");
    if (t) {
      activarHerramienta(t.dataset.tool);
      return;
    }
    const c = e.target.closest("[data-color]");
    if (c) {
      color = c.dataset.color;
      tools.querySelectorAll("[data-color]").forEach((b) => b.classList.toggle("is-active", b === c));
    }
  });

  const deshacer = () => { anotaciones.pop(); seleccion = -1; pedirRender(); };
  const borrarSeleccion = () => {
    if (seleccion < 0) return;
    anotaciones.splice(seleccion, 1);
    seleccion = -1;
    pedirRender();
  };
  document.getElementById("shotDelete").addEventListener("click", borrarSeleccion);
  document.getElementById("shotUndo").addEventListener("click", deshacer);
  document.getElementById("shotClear").addEventListener("click", () => { anotaciones = []; seleccion = -1; pedirRender(); });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); deshacer(); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && seleccion >= 0) { e.preventDefault(); borrarSeleccion(); }
    if ((e.metaKey || e.ctrlKey) && (e.key === "c" || e.key === "C")) {
      // Si hay texto seleccionado (la ruta, el tamaño…) manda el copiado normal
      if (String(window.getSelection() || "").length) return;
      e.preventDefault();
      copiar(document.getElementById("shotPageCopy"));
      return;
    }
    if (e.key === "Escape") { cerrarMenu(); seleccion = -1; pedirRender(); }
  });

  capa.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;          // el derecho abre el menú, no dibuja
    const p = aImagen(e);

    if (tool === "move") {
      const idx = buscarEn(p);
      seleccion = idx;
      if (idx >= 0) {
        e.preventDefault();
        arrastre = { idx: idx, x: p.x, y: p.y, movido: false };
      }
      pedirRender();
      return;
    }

    if (tool === "text") {
      e.preventDefault();     // si no, el foco salta del input al documento
      pedirTexto(p);
      return;
    }

    seleccion = -1;
    enCurso = { tipo: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: color };
    pedirRender();
  });

  capa.addEventListener("mousemove", (e) => {
    const p = aImagen(e);

    if (arrastre) {
      const a = anotaciones[arrastre.idx];
      if (a) {
        mover(a, p.x - arrastre.x, p.y - arrastre.y);
        arrastre.x = p.x; arrastre.y = p.y; arrastre.movido = true;
        pedirRender();
      }
      return;
    }

    if (enCurso) {
      enCurso.x2 = p.x; enCurso.y2 = p.y;
      pedirRender();
      return;
    }

    // Pista visual: la mano solo aparece sobre un elemento con la herramienta Mover
    capa.style.cursor = (tool === "move")
      ? (buscarEn(p) >= 0 ? "move" : "default")
      : (tool === "text" ? "text" : "crosshair");
  });

  // Doble clic sobre un texto: reeditarlo
  capa.addEventListener("dblclick", (e) => {
    const p = aImagen(e);
    const idx = buscarEn(p);
    if (idx >= 0 && anotaciones[idx].tipo === "text") {
      e.preventDefault();
      const a = anotaciones[idx];
      pedirTexto({ x: a.x1, y: a.y1 }, idx);
    }
  });

  window.addEventListener("mouseup", () => {
    if (arrastre) { arrastre = null; return; }
    if (!enCurso) return;
    const a = enCurso;
    enCurso = null;
    if (Math.abs(a.x2 - a.x1) > 5 || Math.abs(a.y2 - a.y1) > 5) {
      anotaciones.push(a);
      seleccion = anotaciones.length - 1;
      activarHerramienta("move");   // recién insertado: listo para colocarlo
    }
    pedirRender();
  });

  btnDescargar.addEventListener("click", () => exportar(btnDescargar));

  const btnCopiar = document.getElementById("shotPageCopy");
  btnCopiar.addEventListener("click", () => copiar(btnCopiar));
  document.addEventListener("contextmenu", (ev) => {
    // Sobre la imagen manda nuestro menú; el nativo copiaría la capa de
    // anotación (transparente, solo las flechas) en vez de la captura.
    if (ev.target === capa || ev.target === img || stage.contains(ev.target)) menuContextual(ev);
  }, true);
})();
