// Prueba de la extensión en un Chrome real, sin dependencias.
//
//   node tests/qa.js            (CHROME=ruta si Chrome no está en la ruta por defecto)
//
// Carga una copia de la extensión con los permisos ya concedidos (los opcionales no
// se pueden aceptar sin un clic), abre tests/web/ en http://localhost:8799 y abre el
// popup como pestaña, con chrome.tabs.query apuntando a esa web. Cada caso de
// CASOS comprueba un fallo que ya pasó una vez. Sale con código 1 si alguno falla.
// Deja capturas del popup en tests/capturas/ (fuera de git).
//
// Chrome solo deja cargar extensiones sin firmar por CDP con --remote-debugging-pipe
// y --enable-unsafe-extension-debugging: por eso habla por pipe y no por WebSocket.
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SALIDA = path.join(__dirname, 'capturas');
const PUERTO = 8799;
const WEB = `http://localhost:${PUERTO}/`;
const OTRA_WEB = `http://127.0.0.1:${PUERTO}/`;
const CHROME = process.env.CHROME || (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : '/usr/bin/google-chrome');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Copia de la extensión con permisos concedidos ----------
const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'ac-ext-'));
for (const f of ['manifest.json', 'background.js', 'ui', 'content', 'icons']) {
    fs.cpSync(path.join(RAIZ, f), path.join(ext, f), { recursive: true });
}
const manifest = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8'));
manifest.host_permissions = manifest.optional_host_permissions;
delete manifest.optional_host_permissions;
manifest.permissions.push(...(manifest.optional_permissions || []));
delete manifest.optional_permissions;
fs.writeFileSync(path.join(ext, 'manifest.json'), JSON.stringify(manifest, null, 2));

// ---------- Web de prueba ----------
const srv = http.createServer((req, res) => {
    const f = path.join(__dirname, 'web', req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
    fs.readFile(f, (e, b) => {
        if (e) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(b);
    });
}).listen(PUERTO);

// ---------- Chrome por pipe ----------
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'ac-perfil-'));
const args = ['--headless=new', '--remote-debugging-pipe', '--enable-unsafe-extension-debugging',
    `--user-data-dir=${perfil}`, '--no-first-run', '--hide-scrollbars', 'about:blank'];
if (process.platform === 'linux') args.push('--no-sandbox');
const chrome = spawn(CHROME, args, { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
let id = 0, buf = '';
const pend = new Map();
const errores = [];
chrome.stdio[4].on('data', (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf('\0')) >= 0) {
        const m = JSON.parse(buf.slice(0, i));
        buf = buf.slice(i + 1);
        if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); continue; }
        if (m.method === 'Runtime.exceptionThrown') errores.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
        if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errores.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200));
        if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && m.params.entry.source !== 'network') errores.push(m.params.entry.text.slice(0, 200));
    }
});
const cdp = (method, params = {}, sessionId) => new Promise((r) => {
    const n = ++id;
    pend.set(n, r);
    chrome.stdio[3].write(JSON.stringify({ id: n, method, params, sessionId }) + '\0');
});

const STUB_TABS = `if (window.chrome && chrome.tabs) { const q = chrome.tabs.query.bind(chrome.tabs);
    chrome.tabs.query = () => q({ url: ['${WEB}*', '${OTRA_WEB}*'] }); }`;

let extId, web, popT, pop;
async function abrirPopup() {
    popT = (await cdp('Target.createTarget', { url: 'about:blank' })).result.targetId;
    pop = (await cdp('Target.attachToTarget', { targetId: popT, flatten: true })).result.sessionId;
    await cdp('Page.enable', {}, pop);
    await cdp('Runtime.enable', {}, pop);
    await cdp('Log.enable', {}, pop);
    await cdp('Emulation.setDeviceMetricsOverride', { width: 420, height: 640, deviceScaleFactor: 1, mobile: false }, pop);
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: STUB_TABS }, pop);
    await cdp('Page.navigate', { url: `chrome-extension://${extId}/ui/popup.html` }, pop);
    await espera(1500);
}
async function ev(expr, sess = pop) {
    const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sess);
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'excepción');
    return r.result?.result?.value;
}
async function navegar(url) { await cdp('Page.navigate', { url }, web); await espera(3000); }
async function foto(nombre) {
    const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, pop);
    fs.writeFileSync(path.join(SALIDA, nombre + '.png'), Buffer.from(r.result.data, 'base64'));
}
const pestanaAuditada = `(async () => Number(Object.keys((await chrome.storage.session.get('auditTabs')).auditTabs || {})[0]))()`;

// ---------- Casos: cada uno devuelve null si pasa o el motivo si falla ----------
const CASOS = [
    ['Consent Mode lee el snippet estándar de gtag (arguments, no arrays)', async () => {
        await ev("navigateTo('consent'); 1"); await espera(2500); await foto('consent');
        const d = await ev('({ w: lastConsentData.waitForUpdate, r: lastConsentData.regions, p: lastConsentData.urlPassthrough, x: lastConsentData.adsDataRedaction, reglas: auditConsent(lastConsentData).map(f => f.ruleId) })');
        if (d.w !== 500) return 'wait_for_update = ' + d.w;
        if (d.r.join() !== 'ES,FR') return 'region = ' + d.r.join();
        if (d.p !== true || d.x !== true) return 'url_passthrough/ads_data_redaction no leídos';
        const falsos = d.reglas.filter((r) => ['wait-for-update-missing', 'url-passthrough-hint', 'ads-data-redaction-recommended'].includes(r));
        return falsos.length ? 'avisos falsos: ' + falsos.join(', ') : null;
    }],
    ['Tag Scanner no saca IDs de textos como IMG-12345 o DRAW-99999', async () => {
        await ev("navigateTo('tags'); 1"); await espera(2500); await foto('tags');
        const ids = await ev("[...document.querySelectorAll('#tagsResults .tags-id')].map(e => e.textContent)");
        if (!ids.includes('G-QATEST1234')) return 'no detecta G-QATEST1234';
        const malos = ids.filter((i) => ['G-12345', 'AW-99999'].includes(i));
        return malos.length ? 'falsos positivos: ' + malos.join(', ') : null;
    }],
    ['Bloquear desde Tags tras varios escaneos no duplica reglas', async () => {
        const antes = errores.length;
        await ev('(async () => { for (let i = 0; i < 3; i++) await runTagScan(); })()');
        const r = await ev(`(async () => { const cb = document.querySelector('#tagsResults input[data-block-pattern]');
            cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 1500));
            return (await chrome.declarativeNetRequest.getDynamicRules()).length; })()`);
        const nuevos = errores.slice(antes).filter((e) => /unique ID/.test(e));
        await ev("(async () => { labBlocks = []; await chrome.storage.local.remove('labConfig'); await labApplyBlockRules(); })()");
        return nuevos.length ? nuevos[0] : r !== 1 ? r + ' reglas en vez de 1' : null;
    }],
    ['Time Travel cambia la fecha y new Date() sigue siendo instanceof Date', async () => {
        await ev('chrome.storage.local.set({ timeTravelEnabled: true, timeTravelTarget: Date.UTC(2025, 0, 1, 12) })');
        await cdp('Page.reload', {}, web); await espera(2500);
        const d = await ev('({ anyo: new Date().getFullYear(), esDate: new Date() instanceof Date, texto: typeof Date() })', web);
        await ev("navigateTo('timetravel'); 1"); await espera(600); await foto('timetravel');
        await ev('chrome.storage.local.set({ timeTravelEnabled: false, timeTravelTarget: null })');
        await cdp('Page.reload', {}, web); await espera(1500);
        if (d.anyo !== 2025) return 'año ' + d.anyo;
        if (!d.esDate) return 'instanceof Date = false';
        return d.texto !== 'string' ? 'Date() sin new no devuelve texto' : null;
    }],
    ['El Lab solo actúa en el dominio donde se guarda', async () => {
        await ev("navigateTo('lab'); 1"); await espera(800);
        const r = await ev(`(async () => { labGtmEnabled.checked = true; labGtmId.value = 'GTM-QA12345';
            labAddBlock('googletagmanager.com/gtag'); await labSaveAndReload();
            await new Promise(r => setTimeout(r, 2500));
            const t = async (initiator) => (await chrome.declarativeNetRequest.testMatchOutcome({ url: 'https://www.googletagmanager.com/gtag/js?id=G-X', type: 'script', initiator, tabId: -1 })).matchedRules.length;
            return { dominio: (await chrome.storage.local.get('labConfig')).labConfig.domain, aqui: await t('${WEB.slice(0, -1)}'), fuera: await t('${OTRA_WEB.slice(0, -1)}') }; })()`);
        await foto('lab');
        const gtmAqui = await ev(`!!document.querySelector('script[src*="GTM-QA12345"]')`, web);
        await navegar(OTRA_WEB);
        const gtmFuera = await ev(`!!document.querySelector('script[src*="GTM-QA12345"]')`, web);
        await navegar(WEB);
        await ev('(async () => { await labClearAll(); })()');
        if (r.dominio !== 'localhost') return 'dominio guardado: ' + r.dominio;
        if (r.aqui !== 1 || r.fuera !== 0) return `bloqueo aquí=${r.aqui} fuera=${r.fuera}`;
        if (!gtmAqui) return 'no inyecta el GTM en su dominio';
        return gtmFuera ? 'inyecta el GTM en otra web' : null;
    }],
    ['Cookie Audit registra el salto cross-domain aunque Chrome duerma el worker', async () => {
        await ev("navigateTo('crossdomain'); caStartAudit(); 1"); await espera(2500);
        await cdp('Target.closeTarget', { targetId: popT }); await espera(1500);
        const workers = (await cdp('Target.getTargets')).result.targetInfos.filter((t) => t.type === 'service_worker' && t.url.includes(extId));
        for (const w of workers) await cdp('Target.closeTarget', { targetId: w.targetId });
        await espera(1500);
        await navegar(OTRA_WEB);
        await abrirPopup();
        const tl = await ev(`(async () => { const id = await ${pestanaAuditada};
            return new Promise(r => chrome.runtime.sendMessage({ type: 'audit-get-timeline', tabId: id, since: 0 }, x => r(x && x.ok ? x.items.map(e => e.type) : [x && x.error]))); })()`);
        await ev("navigateTo('crossdomain'); 1"); await espera(1000); await foto('cookie-audit');
        return tl.includes('xdomain') ? null : 'timeline: ' + tl.join(', ');
    }],
];

(async () => {
    fs.mkdirSync(SALIDA, { recursive: true });
    const carga = await cdp('Extensions.loadUnpacked', { path: ext });
    if (!carga.result) throw new Error('No carga la extensión: ' + JSON.stringify(carga.error));
    extId = carga.result.id;
    const webT = (await cdp('Target.createTarget', { url: WEB })).result.targetId;
    web = (await cdp('Target.attachToTarget', { targetId: webT, flatten: true })).result.sessionId;
    await cdp('Page.enable', {}, web);
    await cdp('Runtime.enable', {}, web);
    await espera(3500);
    await abrirPopup();
    await foto('inicio');

    let fallos = 0;
    for (const [nombre, caso] of CASOS) {
        let motivo;
        try { motivo = await caso(); } catch (e) { motivo = 'excepción: ' + e.message.split('\n')[0]; }
        console.log((motivo ? '✗ ' : '✓ ') + nombre + (motivo ? '\n    ' + motivo : ''));
        if (motivo) fallos++;
    }
    // Los errores de bloqueo provocados a propósito ya se comprueban en su caso
    const sueltos = errores.filter((e) => !/unique ID/.test(e));
    console.log((sueltos.length ? '✗ ' : '✓ ') + 'Sin errores en la consola del popup' + (sueltos.length ? '\n    ' + sueltos.slice(0, 5).join('\n    ') : ''));
    if (sueltos.length) fallos++;
    console.log(`\n${CASOS.length + 1 - fallos} de ${CASOS.length + 1} bien · capturas en tests/capturas/`);
    chrome.kill(); srv.close();
    process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); chrome.kill(); srv.close(); process.exit(1); });
