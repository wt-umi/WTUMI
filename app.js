(() => {
  /* ----------------------------------------------------------
     1. Floating nav: show after scrolling past the sentinel,
        highlight the most-visible section.
     ---------------------------------------------------------- */
  const nav      = document.querySelector('.floating-nav');
  const trigger  = document.getElementById('nav-trigger');
  const navLinks = [...document.querySelectorAll('.nav-item')];

  if (trigger && nav) {
    new IntersectionObserver(([entry]) => {
      nav.classList.toggle('visible', !entry.isIntersecting);
    }, { threshold: 0 }).observe(trigger);
  }

  const sectionRatios = new Map();
  const sectionObs = new IntersectionObserver(entries => {
    for (const e of entries) {
      const id = e.target.id;
      if (e.isIntersecting) sectionRatios.set(id, e.intersectionRatio);
      else                  sectionRatios.delete(id);
    }
    if (!sectionRatios.size) return;
    let active = null, maxRatio = -1;
    for (const [id, r] of sectionRatios) {
      if (r > maxRatio) { maxRatio = r; active = id; }
    }
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === active));
  }, { threshold: [0, .15, .3, .45, .6, .75, .9, 1] });

  ['capabilities', 'generalization', 'data-collection', 'abstract', 'bibtex'].forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObs.observe(el);
  });

  /* ----------------------------------------------------------
     2. Capabilities — Next button cycles through child videos
        (no-op until you add video files yourself).
     ---------------------------------------------------------- */
  document.querySelectorAll('.cap-card .cap-next').forEach(btn => {
    btn.addEventListener('click', () => {
      // Hook up your video-cycle logic here.
    });
  });

  /* ----------------------------------------------------------
     3. Generalization carousel — scale/blur side cards,
        click a side card to bring it forward.
     ---------------------------------------------------------- */
  const carousel = document.getElementById('gen-carousel');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const cards = [...track.querySelectorAll('.env-card')];
    let active = 0;

    cards.forEach((card, i) => {
      card.addEventListener('click', (e) => {
        if (i === active) return;
        if (e.target.closest('.env-next')) return;
        setActive(i);
      });
      card.querySelector('.env-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        // Hook up per-card video cycling here.
      });
    });

    function layout() {
      const total = cards.length;
      cards.forEach((card, i) => {
        let dist = i - active;
        if (dist >  total / 2) dist -= total;
        if (dist < -total / 2) dist += total;
        const abs     = Math.abs(dist);
        const scale   = 1 - abs * 0.10;
        const opacity = 1 - abs * 0.20;
        const xOff    = dist * 30;
        card.style.transform = `translateX(${xOff}%) scale(${scale})`;
        card.style.opacity   = opacity;
        card.style.zIndex    = 10 - abs;
        card.style.filter    = abs === 0 ? 'none' : 'blur(1px) brightness(.8)';
        card.classList.toggle('active', abs === 0);
      });
    }

    function setActive(i) {
      active = ((i % cards.length) + cards.length) % cards.length;
      layout();
    }

    carousel.querySelector('.carousel-prev').addEventListener('click', () => setActive(active - 1));
    carousel.querySelector('.carousel-next').addEventListener('click', () => setActive(active + 1));
    layout();
  }

  /* ----------------------------------------------------------
     4. Data collection: bag reveal animation
        (closed → open → reveal). When you add a real video,
        give it an `ended` listener that resets `data-step="0"`.
     ---------------------------------------------------------- */
  const bag = document.getElementById('backpack');
  if (bag) {
    const trigger = () => {
      if (bag.dataset.step !== '0') return;
      bag.dataset.step = '1';
      setTimeout(() => { bag.dataset.step = '2'; }, 1300);
    };
    bag.querySelector('.backpack-text')?.addEventListener('click', trigger);
    bag.querySelector('.backpack-images')?.addEventListener('click', trigger);
  }

  /* ----------------------------------------------------------
     5. BibTeX copy
     ---------------------------------------------------------- */
  document.querySelectorAll('.cite-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const target = document.querySelector(btn.dataset.copyTarget || '#bibtex-code');
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.innerText);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = target.innerText;
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1500);
    });
  });
})();
