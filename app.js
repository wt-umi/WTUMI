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

  // Position-based scroll-spy: the active section is the one whose top
  // edge has most recently crossed (downward) a reference line at 30%
  // of viewport height. Robust against tall sections and fast scrolls.
  const sectionIds = ['capabilities', 'generalization', 'data-collection',
                      'abstract', 'framework', 'hardware', 'results', 'bibtex'];
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const setActive = (id) => {
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
  };

  const findActive = () => {
    const triggerY = window.innerHeight * 0.30;
    let best = null, bestTop = -Infinity;
    for (const sec of sections) {
      const top = sec.getBoundingClientRect().top;
      if (top <= triggerY && top > bestTop) {
        bestTop = top;
        best = sec;
      }
    }
    if (best)  setActive(best.id);
    else       navLinks.forEach(l => l.classList.remove('active'));
  };

  let rafPending = false;
  const schedule = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; findActive(); });
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load',   schedule); // re-check after images settle
  findActive();

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
