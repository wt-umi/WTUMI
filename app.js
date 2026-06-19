(() => {
  /* ----------------------------------------------------------
     0a. Force every <video> to loop forever. The `loop` HTML
         attribute is set in markup, but we also set the property
         and add an `ended` fallback so clips with a stray end
         frame (or browsers that miss the attribute) still restart.
     ---------------------------------------------------------- */
  document.querySelectorAll('video').forEach(v => {
    v.loop = true;
    v.addEventListener('ended', () => {
      v.currentTime = 0;
      v.play().catch(() => {});
    });
  });

  /* ----------------------------------------------------------
     0b. Apply `data-speed` to any <video> as its playbackRate.
         HTML has no attribute for this, so we set it in JS once
         per element and re-apply on `loadedmetadata` since some
         browsers reset rate when a new source loads.
     ---------------------------------------------------------- */
  document.querySelectorAll('video[data-speed]').forEach(v => {
    const rate = parseFloat(v.dataset.speed);
    if (!Number.isFinite(rate) || rate <= 0) return;
    const apply = () => { v.playbackRate = rate; };
    apply();
    v.addEventListener('loadedmetadata', apply);
  });

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
  const sectionIds = ['capabilities', 'policy-comparison', 'data-collection',
                      'abstract', 'framework', 'hardware', 'target-pose-correction',
                      'force-prediction', 'ik-admittance', 'results', 'bibtex'];
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
     2. Scale/blur slideshow. Side cards shrink and blur; click
        a side card (or arrow) to bring it forward. Used by both
        the Capabilities and Data Collection sections.
     ---------------------------------------------------------- */
  const initSlideshow = (root, { trackSel, cardSel, prevSel, nextSel, xOffPct = 60 }) => {
    const track = root.querySelector(trackSel);
    if (!track) return;
    const cards = [...track.querySelectorAll(cardSel)];
    if (!cards.length) return;
    let active = 0;

    const slots = {
    "-2": { x: -32 },
    "-1": { x: -16 },
    "0": { x: 0 },
    "1": { x: 16 },
    "2": { x: 32 },
  };

    const layout = () => {
      const total = cards.length;
      cards.forEach((card, i) => {
        let dist = i - active;
        if (dist >  total / 2) dist -= total;
        if (dist < -total / 2) dist += total
        const slot = slots[dist];
        const abs     = Math.abs(dist);
        const opacity = 1 - abs * 0.20;
        const scale   = 1 - abs * 0.10;
        if (!slot) {
          card.style.opacity = 0;
          return;
        }

        const isWide = card.classList.contains('cap-card--wide');
        let x = slots[dist].x;
        if(isWide){
            x *= 0.82;
          }
        

        card.style.top = '50%';
        card.style.left = '50%';
        card.style.transform = `translate(calc(-50% + ${x}vw), -50%) scale(${scale})`;
        
        card.style.opacity   = opacity;
        card.style.zIndex    = 10 - abs;
        card.style.filter    = abs === 0 ? 'none' : 'blur(1px) brightness(.8)';
        card.classList.toggle('active', abs === 0);
      });
    };

    const setActive = (i) => {
      active = ((i % cards.length) + cards.length) % cards.length;
      layout();
    };

    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        if (i !== active) setActive(i);
      });
    });

    root.querySelector(prevSel)?.addEventListener('click', () => setActive(active - 1));
    root.querySelector(nextSel)?.addEventListener('click', () => setActive(active + 1));

    root.tabIndex = 0;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setActive(active - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive(active + 1); }
    });

    layout();
  };

  const capCarousel = document.getElementById('cap-carousel');
  if (capCarousel) {
    initSlideshow(capCarousel, {
      trackSel: '.cap-track', cardSel: '.cap-card',
      prevSel:  '.cap-prev',  nextSel: '.cap-next',
      xOffPct: 60, // portrait cards — wider spread
    });
  }

  const dcCarousel = document.getElementById('dc-carousel');
  if (dcCarousel) {
    initSlideshow(dcCarousel, {
      trackSel: '.dc-track', cardSel: '.dc-card',
      prevSel:  '.dc-prev',  nextSel: '.dc-next',
      xOffPct: 40, // landscape cards — tighter spread
    });
  }

  /* ----------------------------------------------------------
     3. Generalization — task tabs + object selector.
        Switching tasks reveals only that task's object buttons
        and selects the first one. Clicking an object button
        updates the rollout-speed label (and would swap the
        video sources once you wire them up).
     ---------------------------------------------------------- */
  const taskTabs   = [...document.querySelectorAll('#task-tabs .task-tab')];
  const taskPanels = [...document.querySelectorAll('#task-panels .task-panel')];

  if (taskTabs.length && taskPanels.length) {
    const switchTask = (task) => {
      taskTabs.forEach(t => t.classList.toggle('is-active', t.dataset.task === task));
      taskPanels.forEach(p => p.classList.toggle('is-active', p.dataset.task === task));
    };

    taskTabs.forEach(tab => tab.addEventListener('click', () => switchTask(tab.dataset.task)));
    const initial = taskTabs.find(t => t.classList.contains('is-active'))?.dataset.task || taskTabs[0]?.dataset.task;
    switchTask(initial);
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
