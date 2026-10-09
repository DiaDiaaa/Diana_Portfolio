/* Local bilingual copy; original nodes and event handlers remain intact. */
(async () => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'language-toggle';
  button.dataset.noTranslate = 'true';
  document.querySelector('.chapter-header')?.append(button);
  let language = 'en';
  try { language = localStorage.getItem('portfolio-language') === 'zh' ? 'zh' : 'en'; } catch {}
  let dictionaries;
  try {
    const response = await fetch('data/translations.json?v=bilingual-1');
    if (!response.ok) throw new Error('Translation file unavailable');
    dictionaries = await response.json();
  } catch { button.textContent = 'Language unavailable'; button.disabled = true; return; }
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const saved = new WeakMap();
  const patterns = Object.fromEntries(Object.entries(dictionaries).map(([lang, dictionary]) => {
    const keys = Object.keys(dictionary).sort((a,b) => b.length-a.length);
    return [lang, new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')];
  }));
  function translate(text) {
    const source = normalize(text);
    if (!source) return text;
    let output = dictionaries[language][source];
    if (output === undefined) output = source.replace(patterns[language], match => dictionaries[language][match]);
    if (language === 'zh') output = output
      .replace(/(\d+) projects/g, '$1 个项目').replace(/(\d+) PHOTOS/g, '$1 张照片')
      .replace(/ADMIT ONE \/ /g, '单人入场 / ').replace(/LEVEL DESIGN/g, '关卡设计')
      .replace(/STORY SEQUENCE/g, '故事片段').replace(/FRAGMENT/g, '片段')
      .replace(/A postcard from /g, '来自以下作品的明信片：').replace(/A fragment of the story/g, '故事的一角')
      .replace(/CHAPTERS/g, '篇章').replace(/CHAPTER/g, '篇章').replace(/project preview/g, '项目预览');
    else output = output.replace(/(\d+) 篇手记/g, '$1 entries');
    return text.replace(source, output) === text && source !== text.trim() ? output : text.replace(text.trim(), output);
  }
  function update(node, key, current, write) {
    const state = saved.get(node) || {};
    if (!state[key] || current !== state[key].last) state[key] = {original: current};
    const output = translate(state[key].original);
    state[key].last = output; saved.set(node, state);
    if (current !== output) write(output);
  }
  function apply() {
    observer.disconnect();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('script,style,noscript,[data-no-translate],#journal-comments'))
        update(node, 'text', node.nodeValue, value => node.nodeValue = value);
    }
    document.querySelectorAll('[alt],[aria-label],[placeholder],[title]').forEach(node => {
      if (node.closest('[data-no-translate],#journal-comments')) return;
      ['alt','aria-label','placeholder','title'].forEach(key => {
        if (node.hasAttribute(key)) update(node,key,node.getAttribute(key),value=>node.setAttribute(key,value));
      });
    });
    update(document.head, 'title', document.title, value => document.title = value);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    button.textContent = language === 'zh' ? 'EN / 中文 ✓' : 'EN ✓ / 中文';
    button.setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换为中文');
    observer.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['alt','aria-label','placeholder','title']});
  }
  const observer = new MutationObserver(apply);
  button.addEventListener('click', () => {
    language = language === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem('portfolio-language',language); } catch {}
    apply();
  });
  apply();
})();
