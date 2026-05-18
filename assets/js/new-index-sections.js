/* =====================================================================
   new-index-sections.js
   Drives the parts of the .header-cst / .work-card sections that came
   with the markup ported from index.html:
     - Hero scaleX(1.5) -> scaleX(1) reveal on .header-cst .caption h1
       (matches imm-net/common/js/common_scripts.js: $(...).addClass("normal"))
     - Cards pin / scale-down stack on scroll (port of assets/js/scripts.js
       GSAP ScrollTrigger block, lines 88-131)
   The existing inline scripts at the bottom of new_index.html still drive
   .wow fade-in and .counter number animation, so those aren't duplicated here.
   ===================================================================== */
(function () {
  'use strict';

  /* Refresh-while-scrolled-down was leaving one of the work-card pins stuck.
     Cause: the browser restores the previous scroll position before Lenis
     and the cards-stack ScrollTriggers initialise, so the pins come up
     marked "active" but ScrollTrigger.update() hasn't run yet — one card
     ends up frozen in the pinned state.
     Fix: opt out of automatic scroll restoration and reset to top before
     anything is wired up. The page always boots from a clean state. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (window.scrollY > 0) window.scrollTo(0, 0);

  function revealHero() {
    var h1 = document.querySelector('.header-cst .caption h1');
    if (h1) h1.classList.add('normal');
  }

  /* Lenis smooth scroll, hooked into GSAP's ticker so ScrollTrigger pins
     stay in sync with the smoothed scroll position. */
  function initSmoothScroll() {
    if (typeof Lenis === 'undefined') return;
    if (window.matchMedia('(hover: none)').matches) return; // skip on touch — native scroll feels better there
    // Defaults — `lerp` controls wheel smoothing (lower = smoother, higher = snappier).
    var lenis = new Lenis({ lerp: 0.1 });
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function loop(t) { lenis.raf(t); requestAnimationFrame(loop); })(performance.now());
    }
  }

  // refreshOnceAfterLoad removed — without ScrollSmoother, ScrollTrigger
  // recalculates positions itself when the page changes height. No manual
  // refresh needed.

  /* Faithful port of assets/js/scripts.js lines 88-131.
     The selector and trigger config match the original exactly. */
  function initCardsScrollStack() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.innerWidth <= 991) return;
    gsap.registerPlugin(ScrollTrigger);

    var cards = gsap.utils.toArray('.cards .card-item');
    if (!cards.length) return;

    var stickDistance = 0;

    var firstCardST = ScrollTrigger.create({
      trigger: cards[0],
      start: 'center center'
    });

    var lastCardST = ScrollTrigger.create({
      trigger: cards[cards.length - 1],
      start: 'center center'
    });

    var pinCount = cards.length - 1;
    gsap.set(cards[cards.length - 1], { position: 'relative', zIndex: 102 });

    cards.forEach(function (card, index) {
      if (index >= pinCount) return;
      var scale = 1 - (cards.length - index) * 0.045;
      var scaleDown = gsap.to(card, {
        scale: scale,
        'transform-origin': '"50% ' + (lastCardST.start + stickDistance) + '"'
      });
      ScrollTrigger.create({
        trigger: card,
        start: 'center center',
        end: function () { return lastCardST.start + stickDistance; },
        pin: true,
        pinSpacing: false,
        ease: 'none',
        animation: scaleDown,
        toggleActions: 'restart none none reverse'
      });
    });
  }

  // Initialise smoother BEFORE other ScrollTriggers register — they auto-detect it.
  initSmoothScroll();
  revealHero();

  // Cards pin/scale waits for window.load so image heights are final and
  // ScrollTrigger registers their start/end positions correctly the first time.
  if (document.readyState === 'complete') {
    initCardsScrollStack();
  } else {
    window.addEventListener('load', initCardsScrollStack);
  }
})();
