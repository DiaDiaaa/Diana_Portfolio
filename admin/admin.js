const $ = id => document.getElementById(id);
const apiRoot = 'https://api.github.com/repos/DiaDiaaa/Diana_Portfolio';
const branch = 'design/memory-chapters';
let token = '', posts = [], photos = [], baseSha = '', baseTree = '', dirty = false;
const status = message => { $('status').textContent = message; };
async function api(path, method = 'GET', body) {
  const response = await fetch(apiRoot + path, {method, headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json'}, ...(body ? {body: JSON.stringify(body)} : {})});
  if (!response.ok) throw new Error(response.status === 401 ? '授权已失效，请重新连接。' : response.status === 403 ? '没有写入权限或请求次数过多，请检查令牌权限。' : `GitHub 请求失败 (${response.status})。修改仍在页面中，请稍后重试。`);
  return response.json();
}
const decode = value => new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g, '')), c => c.charCodeAt(0)));
function clearPhotos() { photos.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); }); photos = []; }
function renderPhotos() {
  $('gallery').replaceChildren();
  photos.forEach((photo, i) => {
    const card = document.createElement('div'); card.className = 'photo';
    const img = document.createElement('img'); img.src = photo.preview || '../' + photo.src; img.alt = photo.alt;
    const label = document.createElement('label'); label.textContent = i === 0 ? '封面 · 照片说明' : `照片 ${i + 1} · 说明`;
    const input = document.createElement('input'); input.value = photo.alt; input.maxLength = 300; input.oninput = () => { photo.alt = input.value; dirty = true; }; label.append(input);
    const actions = document.createElement('div'); actions.className = 'actions';
    [['←', -1], ['→', 1], ['移除', 0]].forEach(([text, delta]) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = text; button.setAttribute('aria-label', `${text} 照片 ${i + 1}`);
      button.disabled = delta !== 0 && (i + delta < 0 || i + delta >= photos.length);
      button.onclick = () => { if (delta) [photos[i], photos[i + delta]] = [photos[i + delta], photos[i]]; else { if (photo.preview) URL.revokeObjectURL(photo.preview); photos.splice(i, 1); } dirty = true; renderPhotos(); }; actions.append(button);
    });
    card.append(img, label, actions); $('gallery').append(card);
  });
}
function selectPost(id) {
  const post = posts.find(p => p.id === id); clearPhotos();
  for (const key of ['title', 'subtitle', 'note', 'date']) $(key).value = post?.[key] || '';
  $('kind').value = post?.kind || 'photography'; photos = (post?.images || []).map(p => ({...p})); dirty = false; renderPhotos();
}
function populate(id = '') {
  $('albums').replaceChildren(new Option('＋ 新建相册', ''));
  posts.forEach(p => $('albums').add(new Option(p.title, p.id))); $('albums').value = id; selectPost(id);
}
let selected = '';
$('albums').onchange = () => { if (dirty && !confirm('放弃尚未发布的修改？')) { $('albums').value = selected; return; } selected = $('albums').value; selectPost(selected); };
$('editor').addEventListener('input', () => { dirty = true; });
$('connect-form').onsubmit = async event => {
  event.preventDefault(); token = $('token').value.trim(); $('token').value = '';
  const button = event.submitter; button.disabled = true; status('正在连接 GitHub…');
  try {
    const head = await api('/git/ref/heads/' + branch); baseSha = head.object.sha;
    const commit = await api('/git/commits/' + baseSha); baseTree = commit.tree.sha;
    const file = await api('/contents/data/journal.json?ref=' + baseSha); posts = JSON.parse(decode(file.content));
    if (!Array.isArray(posts)) throw new Error('相册数据格式不正确。');
    populate(); $('workspace').hidden = false; $('workspace').disabled = false; $('connection').hidden = true; status('已连接。选择已有相册，或开始一篇新手记。');
  } catch (error) { token = ''; status(error.message); } finally { button.disabled = false; }
};
$('disconnect').onclick = () => { if (dirty && !confirm('断开连接并放弃未发布的修改？')) return; token = ''; clearPhotos(); dirty = false; $('workspace').hidden = true; $('workspace').disabled = true; $('connection').hidden = false; status('已断开连接，授权令牌已清除。'); };
async function compress(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 30 * 1024 * 1024) throw new Error(`${file.name}：请使用 30MB 以下的 JPG、PNG 或 WebP。`);
  const bitmap = await createImageBitmap(file); const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .86)); if (!blob) throw new Error('照片转换失败。');
  return {src: `img/journal/${crypto.randomUUID()}.jpg`, alt: file.name.replace(/\.[^.]+$/, ''), blob, preview: URL.createObjectURL(blob)};
}
$('photos').onchange = async () => {
  const files = [...$('photos').files]; if (files.length + photos.length > 40) { status('每篇最多 40 张照片，请分成多个相册。'); $('photos').value = ''; return; }
  $('workspace').disabled = true;
  try { for (let i = 0; i < files.length; i++) { status(`正在处理照片 ${i + 1} / ${files.length}…`); photos.push(await compress(files[i])); dirty = true; } status('照片已准备好；可以调整顺序和说明。'); }
  catch (error) { status(error.message); } finally { $('photos').value = ''; renderPhotos(); $('workspace').disabled = false; }
};
const base64 = blob => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); });
$('editor').onsubmit = async event => {
  event.preventDefault(); if (!photos.length) { status('请至少添加一张照片。'); return; }
  if (!$('title').value.trim()) { status('请输入标题。'); return; }
  $('workspace').disabled = true;
  try {
    const head = await api('/git/ref/heads/' + branch);
    if (head.object.sha !== baseSha) throw new Error('仓库已有新修改。为避免覆盖，本次未发布。请保留文字和原照片，重新连接后再编辑。');
    const tree = [];
    for (let i = 0; i < photos.length; i++) if (photos[i].blob) {
      status(`正在上传照片 ${i + 1} / ${photos.length}…`);
      const blob = await api('/git/blobs', 'POST', {content: await base64(photos[i].blob), encoding: 'base64'});
      tree.push({path: photos[i].src, mode: '100644', type: 'blob', sha: blob.sha});
    }
    const id = selected || 'journal-' + crypto.randomUUID();
    const post = {...posts.find(p => p.id === id), id, kind: $('kind').value, title: $('title').value.trim(), subtitle: $('subtitle').value.trim(), date: $('date').value, note: $('note').value, images: photos.map(({src, alt}) => ({src, alt}))};
    const next = selected ? posts.map(p => p.id === id ? post : p) : [post, ...posts];
    tree.push({path: 'data/journal.json', mode: '100644', type: 'blob', content: JSON.stringify(next, null, 2) + '\n'});
    status('正在保存相册…');
    const newTree = await api('/git/trees', 'POST', {base_tree: baseTree, tree});
    const commit = await api('/git/commits', 'POST', {message: `Update journal: ${post.title}`, tree: newTree.sha, parents: [baseSha]});
    await api('/git/refs/heads/' + branch, 'PATCH', {sha: commit.sha, force: false});
    baseSha = commit.sha; baseTree = newTree.sha; posts = next; selected = id; dirty = false;
    // Keep local previews until Pages finishes building; no need to upload these blobs again.
    photos.forEach(p => { delete p.blob; });
    $('albums').replaceChildren(new Option('＋ 新建相册', '')); posts.forEach(p => $('albums').add(new Option(p.title, p.id))); $('albums').value = id;
    status('已保存到 GitHub，正在等待网站部署。通常几分钟后可在 Journal 看到更新。');
    const link = document.createElement('a'); link.href = '../journal.html?post=' + encodeURIComponent(id); link.target = '_blank'; link.rel = 'noopener'; link.textContent = ' 查看相册 ↗'; $('status').append(link);
  } catch (error) { status(error.message + '\n未确认发布成功，编辑内容仍保留在本页。'); }
  finally { $('workspace').disabled = false; }
};
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
