import { commentsConfig } from './journal-config.js';
const $ = selector => document.querySelector(selector);
const make = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
};
const viewer = $('.photo-viewer');
let activeImages = [], activeIndex = 0;
function showPhoto(index) {
  activeIndex = (index + activeImages.length) % activeImages.length;
  const photo = activeImages[activeIndex];
  $('#viewer-image').src = photo.src;
  $('#viewer-image').alt = photo.alt;
  $('#viewer-caption').textContent = `${activeIndex + 1} / ${activeImages.length} · ${photo.alt}`;
}
$('.photo-close').addEventListener('click', () => viewer.close());
$('.photo-prev').addEventListener('click', () => showPhoto(activeIndex - 1));
$('.photo-next').addEventListener('click', () => showPhoto(activeIndex + 1));
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); showPhoto(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
viewer.addEventListener('close', () => document.body.classList.remove('dialog-open'));
async function loadComments(post) {
  if (!commentsConfig.serverURL) return;
  const status = $('#comment-status');
  status.textContent = '正在加载留言…';
  try {
    const url = new URL(commentsConfig.serverURL);
    if (url.protocol !== 'https:') throw new Error('HTTPS required');
    const base = `https://unpkg.com/@waline/client@${commentsConfig.clientVersion}/dist/`;
    const css = make('link', ''); css.rel = 'stylesheet'; css.href = `${base}waline.css`; document.head.append(css);
    const { init } = await import(`${base}waline.js`);
    init({
      el: '#journal-comments', serverURL: url.href,
      // Stable across query strings, deploy aliases, and local previews.
      path: `/journal/${post.id}`, lang: 'zh-CN',
      login: 'disable', meta: ['nick'], requiredMeta: ['nick'],
      wordLimit: [1, 1000], pageSize: 10,
      imageUploader: false, search: false, emoji: false,
      reaction: false, pageview: false,
    });
    status.textContent = '昵称与留言会公开显示。请勿填写私人联系方式。';
  } catch {
    status.textContent = '留言暂时无法加载，请稍后刷新重试。';
  }
}
try {
  const response = await fetch('data/journal.json');
  if (!response.ok) throw new Error('Journal unavailable');
  const posts = await response.json();
  const id = new URLSearchParams(location.search).get('post');
  if (id) {
    const post = posts.find(entry => entry.id === id);
    if (!post) {
      $('#journal-error').hidden = false;
      $('#journal-error').textContent = '没有找到这篇手记，你可以从下方相册重新选择。';
    } else {
      $('#journal-index').hidden = true;
      $('.journal-intro').hidden = true;
      $('#journal-entry').hidden = false;
      document.title = `${post.title} — Diana’s Journal`;
      $('#entry-subtitle').textContent = `${post.kind === 'plog' ? 'PLOG' : 'PHOTOGRAPHY'} / ${post.subtitle}`;
      $('#entry-title').textContent = post.title;
      $('#entry-note').textContent = post.note;
      activeImages = post.images;
      post.images.forEach((photo, index) => {
        const figure = make('figure', 'entry-photo');
        const button = make('button', ''); button.type = 'button'; button.setAttribute('aria-label', `放大照片：${photo.alt}`);
        const img = make('img', ''); img.src = photo.src; img.alt = photo.alt; img.loading = index ? 'lazy' : 'eager';
        button.append(img); button.addEventListener('click', () => { showPhoto(index); viewer.showModal(); document.body.classList.add('dialog-open'); });
        figure.append(button, make('figcaption', '', `${String(index + 1).padStart(2, '0')} / ${photo.alt}`));
        $('#entry-gallery').append(figure);
      });
      loadComments(post);
    }
  }
  posts.forEach(post => {
    const card = make('article', 'journal-card'); card.dataset.kind = post.kind;
    const link = make('a', 'journal-card-image'); link.href = `journal.html?post=${encodeURIComponent(post.id)}`;
    const img = make('img', ''); img.src = post.images[0].src; img.alt = post.images[0].alt; img.loading = 'lazy';
    link.append(img, make('span', 'journal-photo-count', `${post.images.length} PHOTOS ↗`));
    const text = make('div', 'journal-card-copy');
    text.append(make('p', 'eyebrow', post.kind === 'plog' ? 'DAILY PLOG / 日常' : 'PHOTOGRAPHY / 摄影'));
    const heading = make('h2', ''); const titleLink = make('a', '', post.title); titleLink.href = link.href; heading.append(titleLink);
    const note = make('a', 'journal-note-link', '看照片 · 留句话 ↗'); note.href = `${link.href}#comments-title`;
    text.append(heading, make('p', '', post.note), note); card.append(link, text); $('#journal-grid').append(card);
  });
  const filter = kind => {
    let count = 0;
    document.querySelectorAll('.journal-card').forEach(card => { card.hidden = kind !== 'all' && kind !== card.dataset.kind; if (!card.hidden) count++; });
    $('#journal-count').textContent = `${count} 篇手记`;
  };
  document.querySelectorAll('[data-kind]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-kind]').forEach(other => other.setAttribute('aria-pressed', String(button === other)));
    filter(button.dataset.kind);
  }));
  filter('all');
  if (location.hash === '#comments-title' && !$('#journal-entry').hidden) $('#comments-title').scrollIntoView();
} catch {
  $('#journal-error').hidden = false;
}
