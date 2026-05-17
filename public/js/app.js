// Main App Entry - loads all modules and initializes
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

(async function init() {
  await loadScript('/js/api.js');
  await loadScript('/js/ui.js');
  await loadScript('/js/login.js');
  await loadScript('/js/layout.js');
  await loadScript('/js/dashboard.js');
  await loadScript('/js/goalsheets.js');
  await loadScript('/js/modals.js');
  await loadScript('/js/pages.js');

  // Check if already logged in
  try {
    const data = await API.me();
    window.currentUser = data.user;
    renderApp();
    navigate('dashboard');
  } catch {
    renderLogin();
  }
})();
