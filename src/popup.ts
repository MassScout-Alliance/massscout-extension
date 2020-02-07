document.getElementById('entry')!.onclick = () => {
  chrome.windows.create({
    type: 'popup',
    url: 'performance.html',
    focused: true
  });
};

document.getElementById('manage')!.onclick = () => {
  chrome.tabs.create({
    active: true,
    url: 'manage.html'
  });
};

document.getElementById('import')!.onclick = () => {
  chrome.tabs.create({
    active: true,
    url: 'import.html'
  });
};

document.getElementById('analyze')!.onclick = () => {
  chrome.tabs.create({
    active: true,
    url: 'analyze_overview.html'
  });
};