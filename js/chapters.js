/* Native dialogs keep project stories keyboard accessible without plugin dependencies. */
(() => {
  // Decorative only: the fixed clock face is an illustration, not a time display.
  document.querySelectorAll('.experience-intro, .journal-intro').forEach(section => {
    const ornament = document.createElement('div');
    ornament.className = 'lunar-ornament';
    ornament.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = 'img/decor/lunar-compass.svg?v=original-1'; image.alt = '';
    ornament.append(image);
    const caption = document.createElement('span');
    caption.textContent = 'LUNAR ARCHIVE / 小小宇宙'; ornament.append(caption);
    if (section.matches('.experience-intro')) {
      document.body.classList.add('experience-lunar-page');
      ornament.classList.add('lunar-background');
      caption.remove();
      document.body.prepend(ornament);
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      let queued = false;
      const rotate = () => {
        image.style.transform = `rotate(${motion.matches ? 0 : window.scrollY * 0.045}deg)`;
        queued = false;
      };
      window.addEventListener('scroll', () => {
        if (!queued) { queued = true; requestAnimationFrame(rotate); }
      }, {passive: true});
      motion.addEventListener('change', rotate);
      rotate();
    } else section.append(ornament);
  });
  const cards = [...document.querySelectorAll('.portfolio_item')];
  cards.forEach((card, i) => {
    const title = card.querySelector('.item_info span')?.textContent.trim() || 'Project';
    const category = card.querySelector('em')?.textContent.trim() || '';
    card.dataset.category = category;
    const image = card.querySelector('img');
    if (image) { image.alt = `${title} project preview`; image.loading = 'lazy'; }
    const label = document.createElement('span');
    label.className = 'project-number'; label.textContent = String(i + 1).padStart(2, '0'); card.prepend(label);
    const id = card.getAttribute('href')?.replace('#', '');
    const content = document.getElementById(id);
    if (!content) return;
    const dialog = document.createElement('dialog');
    dialog.id = id; dialog.className = 'chapter-dialog'; dialog.setAttribute('aria-label', title);
    content.querySelector('.close-popup-modal')?.remove();
    while (content.firstChild) dialog.append(content.firstChild);
    content.replaceWith(dialog);
    const make = (tag, className, text) => {
      const node = document.createElement(tag);
      node.className = className;
      if (text) node.textContent = text;
      return node;
    };
    const number = String(i + 1).padStart(2, '0');
    const ticketMeta = make('div', 'ticket-meta');
    ticketMeta.append(make('span', 'ticket-admit', `ADMIT ONE / ${number}`), make('span', 'ticket-invitation', 'A little world awaits'), make('span', 'ticket-barcode'));
    ticketMeta.lastChild.setAttribute('aria-hidden', 'true');
    card.querySelector('.item_info').append(ticketMeta);
    card.setAttribute('aria-haspopup', 'dialog');

    const details = dialog.querySelector('.modal-content');
    if (details) details.id = `${id}-details`;
    const spread = make('section', 'dossier-spread');
    const rail = make('aside', 'dossier-rail');
    rail.append(make('span', 'dossier-micro', 'COLLECTED / NOTES'), make('h3', '', 'Field notes'));
    const images = [...dialog.querySelectorAll('img')].filter(img => img.getAttribute('src'));
    const selected = make('img', 'dossier-image');
    const curatedMedia = {
      'modal-01': [
        {src: 'img/work/DreamChaser/M7Wsp0.png', label: 'LEVEL DESIGN / 01'},
        {src: 'img/work/DreamChaser/story.gif', label: 'STORY SEQUENCE / GIF'},
        {src: 'img/work/DreamChaser/bnahkM.png', label: 'LEVEL DESIGN / 03'}
      ]
    };
    const choices = curatedMedia[id] || [image, ...images].filter(Boolean)
      .filter((img, index, all) => all.findIndex(other => other.src === img.src) === index)
      .slice(0, 3).map((img, index) => ({src: img.src, label: `FRAGMENT / 0${index + 1}`}));
    selected.src = choices[0]?.src || '';
    selected.alt = `${title} — ${choices[0]?.label || 'selected artwork'}`;
    choices.forEach((source, index) => {
      const thumb = make('button', 'dossier-thumbnail');
      thumb.type = 'button';
      thumb.setAttribute('aria-label', `View ${title}: ${source.label}`);
      thumb.setAttribute('aria-pressed', String(index === 0));
      const photo = make('img', ''); photo.src = source.src; photo.alt = ''; photo.loading = 'lazy';
      thumb.append(photo, make('span', '', source.label));
      thumb.addEventListener('click', () => {
        selected.src = source.src;
        selected.alt = `${title} — ${source.label}`;
        rail.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button === thumb)));
      });
      rail.append(thumb);
    });
    rail.append(make('p', 'dossier-scribble', 'Small details,\nwhole new worlds.'), make('span', 'dossier-mark', '✧'));
    const notes = make('div', 'dossier-notes');
    notes.append(make('div', 'dossier-running', 'AIDE-MÉMOIRE / CREATIVE ARCHIVE'), make('h2', 'dossier-title', `No.${number} / ${title}`));
    const meta = [...dialog.querySelectorAll('h3')].map(h => h.textContent.trim()).filter(Boolean);
    const box = make('div', 'dossier-note-box');
    box.append(make('span', 'dossier-watermark', number), make('span', 'dossier-micro', 'THE PROJECT'), make('h3', '', category));
    if (meta.length) box.append(make('p', '', meta.slice(0, 3).join(' · ')));
    notes.append(box);
    const summary = dialog.querySelector('.modal-content p');
    const story = make('div', 'dossier-note-box dossier-summary');
    story.append(make('span', 'dossier-micro', 'A NOTE FROM THIS CHAPTER'), make('p', '', summary?.textContent.trim() || 'Explore the artwork, process, and details behind this project below.'));
    notes.append(story);
    const actions = make('div', 'dossier-actions');
    const primary = dialog.querySelector('.cute-button');
    if (primary) { const link = primary.cloneNode(true); link.className = 'dossier-action'; actions.append(link); }
    const read = make('a', 'dossier-read', 'Read the full story ↓'); read.href = `#${id}-details`;
    read.addEventListener('click', event => { event.preventDefault(); details?.scrollIntoView({behavior: 'instant', block: 'start'}); });
    actions.append(read); notes.append(actions);
    const titleCard = make('div', 'dossier-title-card');
    titleCard.append(make('span', 'dossier-micro', 'DIANA YEE / SELECTED WORK'), make('h3', '', 'A little world,\na story to keep.'), make('p', '', `// CHAPTER ${number} — ${category.toUpperCase()}`));
    notes.append(titleCard);
    const artwork = make('figure', 'dossier-artwork');
    artwork.append(selected, make('figcaption', '', `${title} / A fragment of the story`));
    spread.append(rail, notes, artwork);
    dialog.prepend(spread);
    if (details) details.prepend(make('div', 'dossier-details-heading', 'PROCESS, DETAILS & EXPLORATIONS'));
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'dialog-close'; close.textContent = 'Close chapter ×';
    close.addEventListener('click', () => dialog.close()); dialog.prepend(close);
    const scene = make('div', 'ticket-scene');
    scene.setAttribute('aria-hidden', 'true');
    const boarding = make('div', 'boarding-ticket');
    const mainPass = make('div', 'boarding-main');
    mainPass.append(make('p', 'boarding-brand', 'diana / creative journeys'), make('span', 'boarding-label', 'A PASS INTO ANOTHER WORLD'), make('h2', '', title));
    const route = make('div', 'boarding-route');
    route.append(make('span', '', 'IDEA'), make('span', '', '→'), make('span', '', 'WORLD'));
    mainPass.append(route, make('p', 'boarding-label', `${category.toUpperCase()} · CHAPTER ${number} · DIANA YEE`));
    const stub = make('div', 'boarding-stub');
    stub.append(make('span', 'boarding-label', 'KEEP THIS LITTLE MEMORY'), make('strong', '', number), make('p', '', title), make('span', 'ticket-barcode'));
    boarding.append(mainPass, stub);
    const delivery = make('div', 'postcard-delivery');
    const postcard = make('div', 'delivered-postcard');
    const postcardImage = make('img', ''); postcardImage.src = image.src; postcardImage.alt = '';
    postcard.append(postcardImage, make('span', '', `A postcard from ${title}`));
    const cabinet = make('div', 'file-cabinet');
    cabinet.append(make('span', 'cabinet-label', 'DIANA’S ARCHIVE / SELECTED WORK'), make('div', 'cabinet-slot'), make('div', 'cabinet-drawer'));
    delivery.append(postcard); scene.append(boarding, cabinet, delivery);
    const stage = make('section', 'project-opening'); stage.hidden = true;
    stage.setAttribute('aria-label', `Opening ${title}`);
    const cancel = make('button', 'cancel-ticket', 'Back to tickets ×'); cancel.type = 'button';
    stage.append(scene, cancel);
    card.parentElement.after(stage);
    let revealTimer;
    const resetOpening = () => {
      clearTimeout(revealTimer);
      stage.hidden = true; stage.classList.remove('ticket-entering');
    };
    document.addEventListener('chapter-opening', resetOpening);
    const reveal = () => {
      resetOpening(); dialog.showModal(); dialog.scrollTop = 0;
      document.body.classList.add('dialog-open'); close.focus({preventScroll: true});
    };
    cancel.addEventListener('click', () => { resetOpening(); card.focus({preventScroll: true}); });
    stage.addEventListener('keydown', e => { if (e.key === 'Escape') { resetOpening(); card.focus(); } });
    card.addEventListener('click', e => {
      e.preventDefault(); document.dispatchEvent(new Event('chapter-opening'));
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { reveal(); return; }
      stage.hidden = false; stage.classList.add('ticket-entering');
      stage.scrollIntoView({behavior: 'smooth', block: 'center'});
      cancel.focus({preventScroll: true});
      revealTimer = setTimeout(reveal, 1600);
    });
    dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); dialog.querySelectorAll('video,audio').forEach(media => media.pause()); });
  });
  const count = document.getElementById('project-count');
  const filter = value => {
    document.dispatchEvent(new Event('chapter-opening'));
    let visible = 0;
    cards.forEach(card => {
      const category = card.dataset.category;
      const show = value === 'all' || category === value || (value === 'stories' && !['Game Design', 'Visual Design'].includes(category));
      card.parentElement.hidden = !show;
      if (show) visible++;
    });
    if (count) count.textContent = `${String(visible).padStart(2, '0')} projects`;
  };
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    filter(button.dataset.filter);
  }));
  filter('all');
  document.querySelectorAll('video').forEach(video => { video.preload = 'none'; });
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.chapter-header nav a').forEach(a => {
    if (a.getAttribute('href').split('#')[0] === page) a.setAttribute('aria-current', 'page');
  });
})();
