/* Troca de tema compartilhada pelo portfólio e pelas três demonstrações.
   Uso: <script src="/tema-transicao.js" data-botao="seletor do botão" data-claro="#cor" data-escuro="#cor" defer></script>
   - data-botao: o botão de tema da página; o círculo abre a partir do centro dele.
   - data-claro / data-escuro: cor de fundo de cada tema, gravada no <meta name="theme-color">.
   O tema inicial continua no script inline do <head> de cada página (aplicado antes da primeira pintura).
   Clique: grava a chave 'tema' no localStorage e, com View Transitions e sem movimento reduzido, a tela nova abre
   num círculo que cresce a partir do botão (640ms) enquanto a antiga fica parada. Sem suporte ou com movimento
   reduzido, a troca é instantânea. Troca vinda de outra aba (evento 'storage'): instantânea, sem animação.
   As regras só valem com html.vt-theme, então a transição de navegação demo <-> portfólio ("demo-pagina") não muda. */
(function () {
  var s = document.currentScript, d = document, r = d.documentElement;
  var botao = (s && s.dataset.botao) || 'button.theme';
  var cor = { light: s && s.dataset.claro, dark: s && s.dataset.escuro };

  // CSS da animação, num lugar só. Nas demos o <html> se chama "demo-pagina" (navegação); durante a troca de tema
  // ele volta a ser "root", para o círculo valer na página inteira e o nome da navegação não entrar na troca.
  var css = d.createElement('style');
  css.textContent =
    'html.vt-theme{view-transition-name:root}' +
    'html.vt-theme::view-transition-old(root){animation:none}' +
    'html.vt-theme::view-transition-new(root){animation:tema-circulo 640ms cubic-bezier(0.7,0,0.2,1) both}' +
    '@keyframes tema-circulo{from{clip-path:circle(0 at var(--wx) var(--wy))}to{clip-path:circle(var(--wr) at var(--wx) var(--wy))}}';
  d.head.appendChild(css);

  var meta = function (t) { if (cor[t]) d.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', cor[t]); }); };
  var atual = function () { return r.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); };

  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest(botao);
    if (!b) return;
    var next = atual() === 'dark' ? 'light' : 'dark';
    var aplicar = function () { r.dataset.theme = next; };
    if (d.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var q = b.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2;
      r.style.setProperty('--wx', x + 'px'); r.style.setProperty('--wy', y + 'px');
      r.style.setProperty('--wr', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
      r.classList.add('vt-theme');
      try { d.startViewTransition(aplicar).finished.finally(function () { r.classList.remove('vt-theme'); }); }
      catch (err) { r.classList.remove('vt-theme'); aplicar(); }
    } else aplicar();
    meta(next);
    try { localStorage.setItem('tema', next); } catch (err) {}
  });

  addEventListener('storage', function (e) {
    if (e.key === 'tema' && (e.newValue === 'light' || e.newValue === 'dark')) { r.dataset.theme = e.newValue; meta(e.newValue); }
  });
  meta(atual());
})();
