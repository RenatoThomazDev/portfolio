/* "Folha saindo da prancheta": a passagem entre o portfólio e as demonstrações, toda feita NO PORTFÓLIO, com a Web
   Animations API. A demonstração não anima: abre pronta, com a mesma cor de fundo do último quadro da folha.

   Ida (window.folha.decolar, chamado por ProjectMedia.tsx no clique da miniatura e do "Abrir demonstração"):
     0-120ms   a fita solta e a miniatura descola (classe .levanta, sections.css);
     120-550ms um clone da miniatura (overlay fixo) voa da posição do card até cobrir a tela e endireita;
     550-650ms a folha assenta (um quique curto na sombra), vira a cor de fundo da demo e a navegação acontece.
   Volta: a demo linka para "/#projetos". Chegando daqui (referrer de uma demo, sem ser recarga), o portfólio abre
   coberto pela cor da demo, rola até o projeto e a folha encolhe da tela inteira até a miniatura, inclina e pousa;
   a fita cola de novo (.colado/.ja e .recola, que já existem). Voltar pelo botão do navegador com a página em cache
   (bfcache) faz o mesmo pouso.
   Sem JS, sem element.animate ou com movimento reduzido: link comum, sem nada disso.
   Carregado no <head>, sem defer: a capa da volta precisa entrar antes da primeira pintura. */
(function () {
  var r = document.documentElement;
  // Cor de fundo de cada demo nos dois temas, e se ela segue o sistema quando não há escolha salva (a clínica abre
  // no claro). Igual ao script de tema do <head> de cada demo; mudar os dois juntos.
  var DEMOS = { clinica: ['#FBFAF6', '#0B0B0C', false], orcamentos: ['#F6F6F8', '#0B0B0C', true], automacao: ['#F4F6F4', '#0B0B0C', true] };
  var VOO = 430, ASSENTA = 100, DESCOLA = 120, POUSO = 500, CAB = 64;
  var SAIDA = 'cubic-bezier(0.33, 1, 0.68, 1)'; // easeOutCubic: o voo fica visível, sem chegar quase todo no primeiro quadro
  var SOMBRA_LONGA = 'drop-shadow(0 22px 22px rgba(40, 28, 10, 0.42))', SEM_SOMBRA = 'drop-shadow(0 0 0 rgba(40, 28, 10, 0))';

  function pode() { return 'animate' in Element.prototype && !matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function tema() { var t = null; try { t = localStorage.getItem('tema'); } catch (e) {} return t === 'light' || t === 'dark' ? t : null; }
  function escuroAqui() { var t = r.dataset.theme || tema(); return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; }
  // tema com que a demo vai abrir (a clínica abre no claro quando não há escolha salva)
  function temaDemo(slug) { var d = DEMOS[slug]; return tema() || (d && d[2] && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function corDemo(slug) { var d = DEMOS[slug]; return d ? d[temaDemo(slug) === 'dark' ? 1 : 0] : null; }

  /* A captura da tela que vai abrir: abaixo de 768px, a versão mobile (375x812 a 2x, WebP); acima, a desktop. As duas
     no tema com que a demo abre. Pré-carregada e decodificada junto com o prefetch da demo; no clique só entra se já
     estiver pronta (senão a folha voa só com a miniatura do card). */
  var capturas = {};
  function urlCaptura(slug) {
    var e = temaDemo(slug) === 'dark' ? '-escuro' : '';
    return innerWidth < 768 ? '/projetos/' + slug + '-tela' + e + '.webp' : '/projetos/' + slug + e + '.png';
  }
  /* Fontes de cada demo (o mesmo endereço do <link> no <head> dela; mudar os dois juntos). A demo carrega esse CSS
     sem bloquear a primeira pintura; aqui ele e os arquivos de fonte (subconjunto latin) vão para o cache do
     navegador junto com o prefetch, e a demo já abre com as fontes certas, igual à captura. */
  var FONTES = {
    clinica: 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap',
    orcamentos: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
    automacao: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600&display=swap'
  };
  var aquecidas = {};
  function aquecerFontes(slug) {
    if (aquecidas[slug] || !FONTES[slug] || !window.fetch) return; aquecidas[slug] = 1;
    // <link rel="preload"> com o mesmo destino da demo (style, font): o Google varia a resposta por Sec-Fetch-Dest,
    // e um fetch() comum ficava no cache como outra entrada (medido: a demo esperava ~150ms a mais)
    function pre(href, as) {
      return new Promise(function (ok, erro) {
        var l = document.createElement('link'); l.rel = 'preload'; l.as = as; l.href = href;
        if (as === 'font') { l.type = 'font/woff2'; l.crossOrigin = 'anonymous'; }
        l.onload = ok; l.onerror = erro; document.head.appendChild(l);
      });
    }
    var css = pre(FONTES[slug], 'style');
    // o texto do CSS (só para achar os arquivos de fonte do subconjunto latin)
    fetch(FONTES[slug]).then(function (res) { return res.text(); }).then(function (txt) {
      var arquivos = [css];
      txt.split('/*').forEach(function (bloco) {
        if (!/^ latin \*\//.test(bloco)) return;
        var m = bloco.match(/url\(([^)]+\.woff2)\)/); if (m) arquivos.push(pre(m[1], 'font'));
      });
      return Promise.all(arquivos);
    }).then(function () {
      // tudo no cache: a demo pode carregar o CSS das fontes bloqueando (custa milissegundos) e pintar já com elas
      try { sessionStorage.setItem('fontes-' + slug, '1'); } catch (e) {}
    }).catch(function () {});
  }
  function preparar(slug) {
    if (!DEMOS[slug]) return;
    aquecerFontes(slug);
    var u = urlCaptura(slug); if (capturas[u]) return;
    var im = new Image(), c = capturas[u] = { img: im, pronta: false };
    im.src = u;
    im.decode().then(function () { c.pronta = true; }, function () {});
  }
  function capturaPronta(slug) { var c = capturas[urlCaptura(slug)]; return c && c.pronta ? c.img : null; }
  function px(n) { return Math.round(n * 100) / 100 + 'px'; }
  // rotação e escala em torno do centro (cx, cy) da folha, que anda junto com ela
  function giro(cx, cy, a, s) { return 'translate(' + px(cx) + ',' + px(cy) + ') rotate(' + a + 'deg) scale(' + s + ') translate(' + px(-cx) + ',' + px(-cy) + ')'; }
  function recorte(q, W, H, raio, folga) {
    return 'inset(' + px(q.top - folga) + ' ' + px(W - q.right - folga) + ' ' + px(H - q.bottom - folga) + ' ' + px(q.left - folga) + ' round ' + raio + ')';
  }
  function el(tag, cls, pai) { var e = document.createElement(tag); e.className = cls; if (pai) pai.appendChild(e); return e; }

  /* Monta a folha e devolve as poses "card" (na posição da miniatura) e "tela" (cobrindo a tela) de cada camada. */
  function montar(media, slug) {
    var W = innerWidth, H = innerHeight, b = media.getBoundingClientRect(), cs = getComputedStyle(r);
    // A moldura pode estar girada (grade da home: -1°, 0,5°, -0,5°, propriedade rotate). O retângulo da folha é o
    // da miniatura sem giro nem escala (offsetWidth/Height), centrado onde ela está; o giro entra na pose "card".
    var fr = media.closest('.p-frame'), g0 = fr ? parseFloat(getComputedStyle(fr).rotate) || 0 : 0;
    var mw = media.offsetWidth || b.width, mh = media.offsetHeight || b.height, cx0 = b.left + b.width / 2, cy0 = b.top + b.height / 2;
    var q = { left: cx0 - mw / 2, top: cy0 - mh / 2, right: cx0 + mw / 2, bottom: cy0 + mh / 2, width: mw, height: mh };
    var raio = getComputedStyle(media).borderTopLeftRadius || '0px';
    var img = Array.prototype.find.call(media.querySelectorAll('img'), function (i) { return i.offsetWidth > 0; });
    var cap = capturaPronta(slug);
    var veu = el('div', 'folha-veu', document.body);
    veu.style.background = escuroAqui() ? '#000' : 'rgb(28, 20, 8)';
    var voo = el('div', 'folha-voo', document.body);
    var borda = el('i', 'folha-borda', voo); borda.style.background = cs.getPropertyValue('--line-strong');
    // o papel tem a cor de fundo da demo: no celular a captura não ocupa a altura toda e o resto já é a demo
    var papel = el('i', 'folha-papel', voo); papel.style.background = corDemo(slug) || cs.getPropertyValue('--paper');
    // Cada imagem: no fim, na largura da tela e alinhada no topo (como a demo abre); no começo, reduzida (escala
    // uniforme) cobrindo o card como a miniatura. A proporção vem da própria imagem. Com a captura pronta, duas
    // camadas no mesmo caminho: a captura da tela que vai abrir, opaca, por baixo, e a miniatura do card por cima,
    // num quadro opaco (cor da demo) que some com fade curto. Nunca as duas semitransparentes ao mesmo tempo.
    function camada(src, ar, pai) {
      var e = el('img', 'folha-foto', pai || papel); e.alt = ''; e.src = src;
      var iw0 = Math.max(q.width, q.height * ar);
      e.style.width = px(W); e.style.height = px(W / ar); e.style.left = '0px';
      return { el: e, card: 'translate(' + px(q.left + (q.width - iw0) / 2) + ',' + px(q.top) + ') scale(' + (iw0 / W) + ')', tela: 'translate(0px,0px) scale(1)' };
    }
    var fotos = [], mini = null;
    if (cap) {
      fotos.push(camada(cap.src, cap.naturalWidth / cap.naturalHeight));
      mini = el('i', 'folha-mini', papel); mini.style.background = corDemo(slug);
    }
    if (img) fotos.push(camada(img.currentSrc || img.src, img.naturalWidth ? img.naturalWidth / img.naturalHeight : 1.6, mini));
    var carimbo = el('span', 'folha-carimbo', papel);
    var rot = media.querySelector('.p-folha span'); carimbo.innerHTML = '<span class="mono">' + (rot ? rot.textContent : '') + '</span>';
    var m0 = q.width * 0.06, m1 = Math.min(32, W * 0.05);
    carimbo.style.right = px(m1); carimbo.style.bottom = px(m1);
    var fundo = el('i', 'folha-fundo', papel); fundo.style.background = corDemo(slug) || cs.getPropertyValue('--paper');
    var tela = { top: 0, left: 0, right: W, bottom: H };
    return {
      veu: veu, voo: voo, carimbo: carimbo, fundo: fundo, mini: mini,
      // giro da moldura + o descolar (-2°); no pouso termina no giro da própria moldura
      card: { giro: giro(cx0, cy0, g0 - 2, 1.03), giroReto: giro(cx0, cy0, g0, 1) },
      tela: { giro: giro(W / 2, H / 2, 0, 1) },
      // [elemento, propriedade, pose no card, pose na tela] de tudo que anda junto com a folha
      trilhas: [
        [borda, 'clipPath', recorte(q, W, H, raio, 0), recorte(tela, W, H, '0px', 0)],
        [papel, 'clipPath', recorte(q, W, H, raio, -1), recorte(tela, W, H, '0px', 0)],
        [carimbo, 'transform', 'translate(' + px(q.right - m0 - (W - m1)) + ',' + px(q.bottom - m0 - (H - m1)) + ')', 'translate(0px,0px)']
      ].concat(fotos.map(function (x) { return [x.el, 'transform', x.card, x.tela]; }))
    };
  }
  function desmontar(f) { f.voo.remove(); f.veu.remove(); }

  /* ---------- Ida ---------- */
  var saindo = false, espera = 0;
  function decolar(media, href) {
    if (saindo) return; saindo = true;
    // [data-demo]: o card da home (.project) ou o bloco das páginas de projeto e de serviço
    var frame = media.closest('.p-frame'), slug = media.closest('[data-demo]').dataset.demo;
    // de onde saiu: o "Voltar ao portfólio" da demo usa quando não houver referrer (app/demos/[demo]/route.ts)
    try { sessionStorage.setItem('folha-origem', location.pathname); } catch (e) {}
    // clique sem passar o mouse antes (teclado, ou toque que não gerou touchstart): o prefetch e a captura começam
    // aqui, no início da animação; a captura só entra se ficar pronta a tempo
    prefetch(media.closest('[data-demo]'));
    function sair() {
      if (frame) frame.classList.add('levanta');
      setTimeout(function () {
        var f = montar(media, slug), c = f.card, t = f.tela, fim = VOO / (VOO + ASSENTA);
        media.style.opacity = '0';
        var o = { duration: VOO + ASSENTA, fill: 'both' };
        // a pose de partida é a da miniatura descolada (rotate -2deg, scale 1.03); endireita até 0 grau
        f.voo.animate([{ offset: 0, transform: c.giro, filter: SOMBRA_LONGA, easing: SAIDA }, { offset: fim, transform: t.giro, filter: SEM_SOMBRA },
          { offset: fim + (1 - fim) * 0.4, transform: t.giro, filter: 'drop-shadow(0 2px 2px rgba(40, 28, 10, 0.28))' }, { offset: 1, transform: t.giro, filter: SEM_SOMBRA }], o);
        f.trilhas.forEach(function (a) {
          var k0 = { offset: 0, easing: SAIDA }, k1 = { offset: fim }, k2 = { offset: 1 }; k0[a[1]] = a[2]; k1[a[1]] = a[3]; k2[a[1]] = a[3];
          a[0].animate([k0, k1, k2], o);
        });
        // o carimbo some com fade nos últimos 100ms, terminando junto com o assentar
        f.carimbo.animate([{ offset: 0, opacity: 1 }, { offset: 1 - 100 / (VOO + ASSENTA), opacity: 1 }, { offset: 1, opacity: 0 }], o);
        if (f.mini) {
          // sai com a miniatura do card; com a folha quase do tamanho final (de 185 a 255ms do voo, quando ela já
          // passou de ~85% da altura da tela e as duas imagens quase coincidem), só a miniatura some, em 70ms
          // (ease-out), e mostra a captura opaca que já estava por baixo. O último quadro é o topo da demo.
          var a0 = 185 / (VOO + ASSENTA), a1 = 255 / (VOO + ASSENTA);
          f.mini.animate([{ offset: 0, opacity: 1 }, { offset: a0, opacity: 1, easing: 'ease-out' }, { offset: a1, opacity: 0 }, { offset: 1, opacity: 0 }], o);
        } else {
          // sem a captura pronta: no assentar, a folha vira a cor de fundo da demo, e a troca continua sem flash
          f.fundo.animate([{ offset: 0, opacity: 0 }, { offset: fim, opacity: 0 }, { offset: 1, opacity: 1 }], o);
        }
        f.veu.animate([{ opacity: 0 }, { opacity: 0.25 }], { duration: 200, easing: 'ease-out', fill: 'both' });
        setTimeout(function () {
          location.assign(href);
          // A folha fica na tela até a demo pintar. Se passar de 300ms (rede lenta, prefetch que não chegou), uma
          // linha de "carregando" corre no topo, na cor da tinta do tema da demo, para não parecer travado.
          espera = setTimeout(function () {
            var l = el('i', 'folha-carregando', document.body);
            l.style.color = temaDemo(slug) === 'dark' ? '#ECE4D2' : '#2A2620';
          }, 300);
        }, VOO + ASSENTA);
      }, DESCOLA);
    }
    // Na home a folha sai da moldura do card ativo do carrossel: o "Abrir demonstração" é dele, e os outros cards
    // são inertes (Classico.tsx). No celular o "Abrir demonstração" fica abaixo do texto e a miniatura pode estar
    // fora da tela: antes de descolar, a página rola (300ms, easeOutCubic) até deixar a folha inteira à vista.
    var q = media.getBoundingClientRect();
    if (q.top >= CAB && q.bottom <= innerHeight) { sair(); return; }
    var de = scrollY, para = Math.max(0, de + q.top - Math.max(CAB, (innerHeight - q.height) / 2)), t0 = performance.now();
    (function passo(agora) {
      var k = Math.min(1, (agora - t0) / 300);
      scrollTo({ top: de + (para - de) * (1 - Math.pow(1 - k, 3)), behavior: 'instant' });
      if (k < 1) requestAnimationFrame(passo); else sair();
    })(t0);
  }

  // Faixa de Projetos da home (.cc, Classico.tsx): põe o slide da demo como ativo, sem fade nem entrada (.cc-sem por
  // dois quadros), e marca data-voltou: a troca automática fica parada. Roda antes da hidratação; o carrossel lê o
  // data-pos e o data-voltou do DOM ao montar e também ouve "carrossel-ativar". Fora do carrossel não faz nada.
  function naFrente(p) {
    var cc = p.closest('.cc'); if (!cc) return;
    var ps = Array.prototype.slice.call(cc.querySelectorAll('.projects > .project')), k = ps.indexOf(p);
    if (k < 0) return;
    cc.dataset.voltou = '1';
    cc.classList.add('cc-sem');
    ps.forEach(function (x, i) { x.dataset.pos = i === k ? '0' : '1'; });
    cc.dispatchEvent(new CustomEvent('carrossel-ativar', { detail: k, bubbles: true }));
    void cc.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () { cc.classList.remove('cc-sem'); }); });
  }

  /* ---------- Volta ---------- */
  // A volta começa com a captura da tela de onde a pessoa saiu: espera ela decodificar (até 250ms, com a capa da cor
  // da demo na tela); se não der tempo, pousa só com a miniatura.
  function pousarComCaptura(slug) {
    preparar(slug);
    var c = capturas[urlCaptura(slug)];
    Promise.race([c ? c.img.decode() : Promise.resolve(), new Promise(function (ok) { setTimeout(ok, 250); })]).then(function () { pousar(slug); }, function () { pousar(slug); });
  }
  function pousar(slug) {
    var p = document.querySelector('[data-demo="' + slug + '"]'), media = p && p.querySelector('.p-media'), frame = p && p.querySelector('.p-frame');
    if (!media || !frame) { r.classList.remove('folha-volta'); return; }
    frame.classList.remove('levanta');
    frame.classList.add('colado', 'ja', 'pousando');
    // carrossel da home: o card desta demo fica ativo (sem deslizar), depois a página centraliza
    naFrente(p);
    media.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    var f = montar(media, slug), c = f.card, t = f.tela, enc = 0.7;
    media.style.opacity = '0';
    r.classList.remove('folha-volta');
    var o = { duration: POUSO, fill: 'both' }, ENCOLHE = 'cubic-bezier(0.4, 0, 0.2, 1)';
    // encolhe até a miniatura já inclinada (rotate -2deg, scale 1.03) e, nos últimos 150ms, endireita e pousa
    f.voo.animate([{ offset: 0, transform: t.giro, filter: SEM_SOMBRA, easing: ENCOLHE }, { offset: enc, transform: c.giro, filter: SOMBRA_LONGA, easing: SAIDA },
      { offset: 1, transform: c.giroReto, filter: 'drop-shadow(0 1px 1px rgba(40, 28, 10, 0.2))' }], o);
    f.trilhas.forEach(function (a) {
      var k0 = { offset: 0, easing: ENCOLHE }, k1 = { offset: enc }, k2 = { offset: 1 }; k0[a[1]] = a[3]; k1[a[1]] = a[2]; k2[a[1]] = a[2];
      a[0].animate([k0, k1, k2], o);
    });
    // o carimbo aparece com fade nos primeiros 100ms do encolhimento
    f.carimbo.animate([{ offset: 0, opacity: 0 }, { offset: 100 / POUSO, opacity: 1 }, { offset: 1, opacity: 1 }], o);
    if (f.mini) {
      // o inverso da ida: começa como a tela da demo (a captura) e, com a folha ainda quase do tamanho da tela
      // (40 a 110ms), só a miniatura entra por cima em 70ms (ease-out); a captura fica opaca por baixo
      f.mini.animate([{ offset: 0, opacity: 0 }, { offset: 40 / POUSO, opacity: 0, easing: 'ease-out' }, { offset: 110 / POUSO, opacity: 1 }, { offset: 1, opacity: 1 }], o);
    } else {
      // começa na cor de fundo da demo (o último quadro dela) e mostra a miniatura logo no início
      f.fundo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'both' });
    }
    f.veu.animate([{ offset: 0, opacity: 0.25 }, { offset: 0.6, opacity: 0.25 }, { offset: 1, opacity: 0 }], o).finished.then(function () {
      media.style.opacity = '';
      desmontar(f);
      frame.classList.remove('pousando', 'ja');
      frame.classList.add('recola');
    });
  }

  // Chegando de uma demo pelo link "Voltar ao portfólio": cobre a tela com a cor da demo antes da primeira pintura,
  // tira o "#projetos" do endereço (senão o navegador rola até a âncora e a folha não pousa no centro) e pousa
  // quando a página estiver lida. Recarregar a página não repete o pouso.
  var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  // na home ou nas páginas de projeto e de serviço (a demo volta para a página de onde saiu)
  var vem = /^\/((projetos|servicos)\/[a-z-]+)?$/.test(location.pathname) && (!nav || nav.type !== 'reload') && document.referrer.match(/\/demos\/([a-z]+)/);
  if (vem && DEMOS[vem[1]] && pode()) {
    r.classList.add('folha-volta');
    r.style.setProperty('--folha-capa', corDemo(vem[1]));
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
    document.addEventListener('DOMContentLoaded', function () { pousarComCaptura(vem[1]); });
  }

  addEventListener('pageshow', function (e) {
    if (!e.persisted || !saindo) return;
    // de volta pelo botão do navegador com a página em cache: a folha ainda cobre a tela; ela pousa no card
    saindo = false; clearTimeout(espera);
    document.querySelectorAll('.folha-voo, .folha-veu, .folha-carregando').forEach(function (x) { x.remove(); });
    var m = document.querySelector('.p-frame.levanta .p-media'), slug = m && m.closest('[data-demo]').dataset.demo;
    if (m) m.style.opacity = '';
    if (slug && pode()) pousar(slug); else document.querySelectorAll('.p-frame.levanta').forEach(function (x) { x.classList.remove('levanta'); });
  });

  /* Prefetch da demo assim que o mouse entra no card, no primeiro toque, no pointerdown, no foco ou, por último, no
     início da animação: depois dos 650ms a navegação não espera a rede. Regras de especulação onde existem (medido:
     a demo chega como "navigational-prefetch"); senão <link rel="prefetch">. Junto: a captura e as fontes da demo. */
  var buscadas = {};
  function prefetch(alvo) {
    if (alvo && alvo.target) alvo = alvo.target;
    var p = alvo && alvo.closest && alvo.closest('[data-demo]'), a = p && p.querySelector('.p-link');
    if (!a) return;
    preparar(p.dataset.demo); // a captura da tela que vai abrir (por tamanho e tema de agora)
    if (buscadas[a.href]) return; buscadas[a.href] = 1;
    var s;
    if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
      s = document.createElement('script'); s.type = 'speculationrules'; s.textContent = JSON.stringify({ prefetch: [{ source: 'list', urls: [a.href] }] });
    } else { s = document.createElement('link'); s.rel = 'prefetch'; s.href = a.href; }
    document.head.appendChild(s);
  }
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('touchstart', prefetch, { passive: true });
  document.addEventListener('pointerdown', prefetch, { passive: true });
  document.addEventListener('focusin', prefetch);

  // prefetch exposto: o carrossel da home (Classico.tsx) pede o da demo do card que fica ativo
  window.folha = { pode: pode, decolar: decolar, prefetch: prefetch };
})();
