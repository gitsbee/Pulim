(() => {
  const subject = document.currentScript.dataset.subject;
  const target = location.origin;
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.append(script);
  });

  function scopedStorage(storage, namespace) {
    const prefix = namespace + ':';
    return new Proxy({
      getItem(key) { return storage.getItem(prefix + key); },
      setItem(key, value) { storage.setItem(prefix + key, value); },
      removeItem(key) { storage.removeItem(prefix + key); },
    }, {
      ownKeys() { return Object.keys(storage).filter(key => key.startsWith(prefix)).map(key => key.slice(prefix.length)); },
      getOwnPropertyDescriptor() { return { configurable: true, enumerable: true }; },
    });
  }

  let started = false;
  addEventListener('message', async event => {
    if (event.source !== parent || event.origin !== target || parent === window) return;
    const info = event.data;
    if (info?.type !== 'pulleem:study' || !/^[A-Za-z0-9_-]{1,128}$/.test(info.account)) return;
    if (started) return;
    started = true;
    const namespace = 'pulleem:' + info.account + ':' + subject;
    window.studyBridge = {
      namespace,
      vocabulary: info.vocabulary,
      local: scopedStorage(localStorage, namespace),
      session: scopedStorage(sessionStorage, namespace),
      report(record) { parent.postMessage({ type: 'pulleem:attempt', record }, target); },
    };
    if (subject === 'math') {
      try {
        await load('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js');
      } catch { /* The math renderer has a text fallback. */ }
    }
    try {
      await load('./' + subject + '.js');
      document.body.classList.add('study-ready');
    } catch {
      const notice = document.querySelector('.study-loading');
      notice.setAttribute('role', 'alert');
      notice.textContent = '연습 화면을 불러오지 못했습니다. 새로고침해 주세요.';
    }
  });
})();
