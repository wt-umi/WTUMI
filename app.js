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
     3. Generalization — task tabs + object selector.
        Switching tasks reveals only that task's object buttons
        and selects the first one. Clicking an object button
        updates the rollout-speed label (and would swap the
        video sources once you wire them up).
     ---------------------------------------------------------- */
  const taskTabs       = [...document.querySelectorAll('#task-tabs .task-tab')];
  const objButtons     = [...document.querySelectorAll('#object-buttons .obj-btn')];
  const speedIndicator = document.getElementById('speed-indicator');

  if (taskTabs.length && objButtons.length) {
    const selectObject = (btn) => {
      objButtons.forEach(b => b.classList.toggle('is-active', b === btn));
      if (speedIndicator && btn.dataset.speed) {
        speedIndicator.textContent = `Rollout Speed: ${btn.dataset.speed}`;
      }
      // Hook your per-object video swap here, e.g.:
      //   document.getElementById('vid-ours').src = `assets/videos/${btn.dataset.task}/ours/${btn.dataset.obj}.mp4`;
    };

    const switchTask = (task) => {
      taskTabs.forEach(t => t.classList.toggle('is-active', t.dataset.task === task));
      let firstVisible = null;
      objButtons.forEach(btn => {
        const match = btn.dataset.task === task;
        btn.hidden = !match;
        btn.classList.remove('is-active');
        if (match && !firstVisible) firstVisible = btn;
      });
      if (firstVisible) selectObject(firstVisible);
    };

    taskTabs.forEach(tab => tab.addEventListener('click', () => switchTask(tab.dataset.task)));
    objButtons.forEach(btn => btn.addEventListener('click', () => selectObject(btn)));

    const initial = taskTabs.find(t => t.classList.contains('is-active'))?.dataset.task
                 || taskTabs[0].dataset.task;
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
