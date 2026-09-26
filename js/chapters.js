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
