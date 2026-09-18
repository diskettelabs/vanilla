(() => {
  const iconFiles = {
    "arrow-left": "arrow-up",
    "arrow-right": "arrow-up",
    "arrow-up": "arrow-up",
    "brain-circuit": "brain",
    "chevron-down": "chevron-right",
    "chevron-left": "chevron-right",
    "chevron-right": "chevron-right",
    "circle-alert": "alert-circle",
    "circle-check": "check-circle",
    "clock-3": "clock",
    cloud: "cloud",
    "columns-2": "columns",
    copy: "copy",
    download: "download",
    eye: "eye",
    "eye-off": "eye-off",
    file: "file",
    "file-plus-2": "file-plus",
    "folder-closed": "folder",
    "folder-open": "folder-open",
    "hard-drive": "hard-drive",
    info: "info",
    keyboard: "keyboard",
    "message-circle": "message",
    "message-circle-more": "message-more",
    mic: "mic",
    palette: "palette",
    "panel-left-close": "sidebar",
    "panel-left-open": "sidebar",
    paperclip: "paperclip",
    pencil: "pencil",
    "pencil-line": "pencil-line",
    pin: "pin",
    "refresh-cw": "refresh",
    search: "search",
    "settings-2": "settings",
    "shield-check": "shield",
    sparkles: "sparkles",
    square: "stop",
    "square-pen": "new-chat",
    "trash-2": "trash",
    "triangle-alert": "alert-triangle",
    upload: "upload",
    "wand-sparkles": "wand",
    wrench: "tools",
    x: "close",
  };

  function render(root = document) {
    root.querySelectorAll("i[data-icon]").forEach((node) => {
      const file = iconFiles[node.dataset.icon];
      if (!file) return;
      node.classList.add("app-icon");
      node.style.setProperty("--icon-url", `url(\"./assets/icons/${file}.svg\")`);
      const size = node.dataset.iconSize;
      if (size) {
        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
      }
    });
  }

  const observer = new MutationObserver((mutations) => {
    const hasIcon = mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) =>
      node.nodeType === 1 && (node.matches?.("i[data-icon]") || node.querySelector?.("i[data-icon]"))
    ));
    if (hasIcon) queueMicrotask(() => render());
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.VanillaIcons = { render };
  render();
})();
