/* Native dialogs keep project stories keyboard accessible without plugin dependencies. */
(() => {
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
    const details = dialog.querySelector('.modal-content');
    if (details) details.id = `${id}-details`;
    const spread = make('section', 'dossier-spread');
    const rail = make('aside', 'dossier-rail');
    rail.append(make('span', 'dossier-micro', 'COLLECTED / NOTES'), make('h3', '', 'Field notes'));
    const images = [...dialog.querySelectorAll('img')].filter(img => img.getAttribute('src'));
    const selected = make('img', 'dossier-image');
    selected.src = image?.src || images[0]?.src || '';
    selected.alt = `${title} — selected artwork`;
    const choices = [image, ...images].filter(Boolean).filter((img, index, all) => all.findIndex(other => other.src === img.src) === index).slice(0, 3);
    choices.forEach((source, index) => {
      const thumb = make('button', 'dossier-thumbnail');
      thumb.type = 'button';
      thumb.setAttribute('aria-label', `View ${title} image ${index + 1}`);
      thumb.setAttribute('aria-pressed', String(index === 0));
      const photo = make('img', ''); photo.src = source.src; photo.alt = ''; photo.loading = 'lazy';
      thumb.append(photo, make('span', '', `FRAGMENT / 0${index + 1}`));
      thumb.addEventListener('click', () => {
        selected.src = source.src;
        selected.alt = `${title} — artwork ${index + 1}`;
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
    card.addEventListener('click', e => { e.preventDefault(); dialog.showModal(); document.body.classList.add('dialog-open'); });
    dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); dialog.querySelectorAll('video,audio').forEach(media => media.pause()); });
  });
  const count = document.getElementById('project-count');
  const filter = value => {
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
