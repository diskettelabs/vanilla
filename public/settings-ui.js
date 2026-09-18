document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.settings-tab');
  const panes = document.querySelectorAll('.settings-tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (typeof Sounds !== 'undefined') Sounds.tabSwitch();
      // Remove active from all tabs and panes
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      // Add active to clicked tab
      tab.classList.add('active');
      
      // Add active to corresponding pane
      const paneId = `tab-${tab.dataset.tab}`;
      const pane = document.getElementById(paneId);
      if (pane) {
        pane.classList.add('active');
      }
    });
  });
});
