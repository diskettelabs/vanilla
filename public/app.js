let themeGreeting = false;
let themePlaceholder = false;
let themeStylesEl = null;
let themeFaviconLink = null;
const originalBrandLogo = document.querySelector(".brand-logo")?.outerHTML || null;
const originalTitle = document.title;

function icon(name, className = "", size = 18) {
  const classes = className ? ` class="${className}"` : "";
  return `<i data-icon="${name}"${classes} data-icon-size="${size}" aria-hidden="true"></i>`;
}

const TRASH_ICON = icon("trash-2", "trash-icon", 14);
const EDIT_ICON = icon("pencil", "edit-icon", 14);

const els = {
  shell: document.querySelector(".app-shell"),
  sidebarToggle: document.querySelector(".sidebar-toggle"),
  mainSidebarToggle: document.querySelector(".main-sidebar-toggle"),
  conversationList: document.querySelector("#conversationList"),
  emptyState: document.querySelector("#emptyState"),
  greeting: document.querySelector("#greeting"),
  messages: document.querySelector("#messages"),
  composer: document.querySelector("#composer"),
  omnibar: document.querySelector(".omnibar"),
  promptInput: document.querySelector("#promptInput"),
  submitButton: document.querySelector("#submitButton"),
  submitIcon: document.querySelector("#submitIcon"),
  dictationButton: document.querySelector("#dictationButton"),
  dictationLabel: document.querySelector("#dictationLabel"),
  modelPicker: document.querySelector(".model-picker"),
  modelButton: document.querySelector("#modelButton"),
  activeModel: document.querySelector("#activeModel"),
  modelSearch: document.querySelector("#modelSearch"),
  modelOptions: document.querySelector("#modelOptions"),
  providerPicker: document.querySelector("#providerPicker"),
  settingsModelPicker: document.querySelector("#settingsModelPicker"),
  themePicker: document.querySelector("#themePicker"),
  densityPicker: document.querySelector("#densityPicker"),
  textSizePicker: document.querySelector("#textSizePicker"),
  accentPicker: document.querySelector("#accentPicker"),
  logoPositionPicker: document.querySelector("#logoPositionPicker"),
  sidebarOpenToggle: document.querySelector("#sidebarOpenToggle"),
  reduceMotionToggle: document.querySelector("#reduceMotionToggle"),
  enterToSendToggle: document.querySelector("#enterToSendToggle"),
  showStatsToggle: document.querySelector("#showStatsToggle"),
  desktopNotificationsToggle: document.querySelector("#desktopNotificationsToggle"),
  customIconInput: document.querySelector("#customIconInput"),
  customIconReset: document.querySelector("#customIconReset"),
  customIconPreview: document.querySelector("#customIconPreview"),
  soundEffectsToggle: document.querySelector("#soundEffectsToggle"),
  typingToggle: document.querySelector("#typingToggle"),
  typingStylePicker: document.querySelector("#typingStylePicker"),
  soundVolumeSlider: document.querySelector("#soundVolumeSlider"),
  soundVolumeValue: document.querySelector("#soundVolumeValue"),
  ambientToggle: document.querySelector("#ambientToggle"),
  musicTrackPicker: document.querySelector("#musicTrackPicker"),
  compareToggle: document.querySelector("#compareToggle"),
  lmStudioToggle: document.querySelector("#lmStudioToggle"),
  lmStudioSetupHint: document.querySelector("#lmStudioSetupHint"),
  lmStudioCheckButton: document.querySelector("#lmStudioCheckButton"),
  lmStudioStatus: document.querySelector("#lmStudioStatus"),
  aiderToggle: document.querySelector("#aiderToggle"),
  gooseToggle: document.querySelector("#gooseToggle"),
  openCodeToggle: document.querySelector("#openCodeToggle"),
  customPromptInput: document.querySelector("#customPromptInput"),
  customPromptBadge: document.querySelector("#customPromptBadge"),
  webSearchToggle: document.querySelector("#webSearchToggle"),
  workspaceToolsToggle: document.querySelector("#workspaceToolsToggle"),
  workspaceModal: document.querySelector("#workspaceModal"),
  workspaceFileList: document.querySelector("#workspaceFileList"),
  workspaceNewButton: document.querySelector("#workspaceNewButton"),
  workspaceRefreshButton: document.querySelector("#workspaceRefreshButton"),
  workspaceOpenButton: document.querySelector("#workspaceOpenButton"),
  workspacePathLabel: document.querySelector("#workspacePathLabel"),
  workspaceEditor: document.querySelector("#workspaceEditor"),
  workspaceFileName: document.querySelector("#workspaceFileName"),
  workspaceFileContent: document.querySelector("#workspaceFileContent"),
  workspaceSaveButton: document.querySelector("#workspaceSaveButton"),
  workspaceEditorClose: document.querySelector("#workspaceEditorClose"),
  searchBackendPicker: document.querySelector("#searchBackendPicker"),
  braveApiKeyInput: document.querySelector("#braveApiKeyInput"),
  braveKeyRow: document.querySelector("#braveKeyRow"),
  dictationEnginePicker: document.querySelector("#dictationEnginePicker"),
  dictationEngineNote: document.querySelector("#dictationEngineNote"),
  cpuStat: document.querySelector("#cpuStat"),
  gpuStat: document.querySelector("#gpuStat"),
  ramStat: document.querySelector("#ramStat"),
  searchModal: document.querySelector("#searchModal"),
  settingsModal: document.querySelector("#settingsModal"),
  searchInput: document.querySelector("#searchInput"),
  searchResults: document.querySelector("#searchResults"),
  settingsButton: document.querySelector("#settingsButton"),
  exportChatButton: document.querySelector("#exportChatButton"),
  exportModal: document.querySelector("#exportModal"),
  exportConversationName: document.querySelector("#exportConversationName"),
  exportDownloadButton: document.querySelector("#exportDownloadButton"),
  exportCopyButton: document.querySelector("#exportCopyButton"),
  compareModal: document.querySelector("#compareModal"),
  comparePrompt: document.querySelector("#comparePrompt"),
  compareModelList: document.querySelector("#compareModelList"),
  compareCount: document.querySelector("#compareCount"),
  compareRunButton: document.querySelector("#compareRunButton"),
  compareStopButton: document.querySelector("#compareStopButton"),
  compareResults: document.querySelector("#compareResults"),
  promptModal: document.querySelector("#promptModal"),
  conversationPromptInput: document.querySelector("#conversationPromptInput"),
  conversationPromptSave: document.querySelector("#conversationPromptSave"),
  conversationPromptClear: document.querySelector("#conversationPromptClear"),
  promptPillLabel: document.querySelector("#promptPillLabel"),
  installModal: document.querySelector("#installModal"),
  hfInstallButton: document.querySelector("#hfInstallButton"),
  hfSearchInput: document.querySelector("#hfSearchInput"),
  hfSortSelect: document.querySelector("#hfSortSelect"),
  hfResults: document.querySelector("#hfResults"),
  hfDetail: document.querySelector("#hfDetail"),
  hfBackButton: document.querySelector(".hf-back-button"),
  hfProgress: document.querySelector("#hfProgress"),
  downloadModelsButton: document.querySelector("#downloadModelsButton"),
  ollamaModal: document.querySelector("#ollamaModal"),
  ollamaSearchInput: document.querySelector("#ollamaSearchInput"),
  ollamaResults: document.querySelector("#ollamaResults"),
  ollamaProgress: document.querySelector("#ollamaProgress"),
  fileInput: document.querySelector("#fileInput"),
  attachmentPreview: document.querySelector("#attachmentPreview"),
  displayNameInput: document.querySelector("#displayNameInput"),
  apiKeysList: document.querySelector("#apiKeysList"),
  uninstallButton: document.querySelector("#uninstallButton"),
  uninstallModal: document.querySelector("#uninstallModal"),
  uninstallConfirmButton: document.querySelector("#uninstallConfirmButton"),
  setupModal: document.querySelector("#setupModal"),
  autoNameToggle: document.querySelector("#autoNameToggle"),
  updateBanner: document.querySelector("#updateBanner"),
  updateBannerText: document.querySelector("#updateBannerText"),
  updateBannerAction: document.querySelector("#updateBannerAction"),
  updateStatusLine: document.querySelector("#updateStatusLine"),
  updateStatusSub: document.querySelector("#updateStatusSub"),
  updateCheckButton: document.querySelector("#updateCheckButton"),
  updateInstallButton: document.querySelector("#updateInstallButton"),
  recentlyDeletedButton: document.querySelector("#recentlyDeletedButton"),
  recentlyDeletedCount: document.querySelector("#recentlyDeletedCount"),
  deletedModal: document.querySelector("#deletedModal"),
  deletedModalNote: document.querySelector("#deletedModalNote"),
  deletedList: document.querySelector("#deletedList"),
  deletedRestoreButton: document.querySelector("#deletedRestoreButton"),
  deletedDeleteButton: document.querySelector("#deletedDeleteButton"),
  deletedRetentionPicker: document.querySelector("#deletedRetentionPicker"),
  agentBar: document.querySelector("#agentBar"),
  agentDirInput: document.querySelector("#agentDirInput"),
  agentDirBrowse: document.querySelector("#agentDirBrowse"),
  agentStatus: document.querySelector("#agentStatus"),
  agentSidebar: document.querySelector(".agent-sidebar"),
  agentSidebarDir: document.querySelector("#agentSidebarDir"),
  agentProjectAdd: document.querySelector("#agentProjectAdd"),
  projectList: document.querySelector("#projectList"),
  agentFileList: document.querySelector("#agentFileList"),
  agentFilesUp: document.querySelector("#agentFilesUp"),
  agentFilesRefresh: document.querySelector("#agentFilesRefresh"),
  agentDataSummary: document.querySelector("#agentDataSummary"),
  agentModeToggle: document.querySelector("#agentModeToggle"),
  agentSessionList: document.querySelector("#agentSessionList"),
  agentNewSession: document.querySelector("#agentNewSession"),
  agentFolderModal: document.querySelector("#agentFolderModal"),
  agentFolderPath: document.querySelector("#agentFolderPath"),
  agentFolderGoButton: document.querySelector("#agentFolderGoButton"),
  agentFolderUp: document.querySelector("#agentFolderUp"),
  agentFolderNative: document.querySelector("#agentFolderNative"),
  agentFolderRefresh: document.querySelector("#agentFolderRefresh"),
  agentFolderHint: document.querySelector("#agentFolderHint"),
  agentFolderList: document.querySelector("#agentFolderList"),
  agentFolderSelect: document.querySelector("#agentFolderSelect"),
};

const dropdowns = {};

const state = {
  conversations: [],
  deletedConversations: [],
  selectedDeletedId: null,
  activeConversation: null,
  providers: [],
  modelOptions: [],
  currentProvider: "ollama",
  currentModel: "llama2",
  runningConversationId: null,
  streamAbort: null,
  activeAssistant: null,
  uploading: false,
  tokenQueue: "",
  tokenText: "",
  tokenPump: null,
  streamComplete: false,
  pendingAttachment: null,
  themes: [],
  voskModel: null,
  voskRecognizer: null,
  audioContext: null,
  mediaStream: null,
  audioProcessor: null,
  isRecording: false,
  scrollLocked: true, // Track if auto-scroll is enabled
  settings: {
    theme: localStorage.getItem("vanilla-theme") || "default",
    density: localStorage.getItem("vanilla-density") || "comfortable",
    textSize: localStorage.getItem("vanilla-text-size") || "regular",
    accent: localStorage.getItem("vanilla-accent") || "sky",
    sidebar: localStorage.getItem("vanilla-sidebar") || "open",
    reduceMotion: localStorage.getItem("vanilla-reduce-motion") === "true",
    enterToSend: localStorage.getItem("vanilla-enter-to-send") !== "false",
    showStats: localStorage.getItem("vanilla-show-stats") !== "false",
    soundEffects: localStorage.getItem("vanilla-sound-effects") === "true",
    typingSounds: localStorage.getItem("vanilla-typing-sounds") === "true",
    typingStyle: localStorage.getItem("vanilla-typing-style") || "mechanical",
    soundVolume: (() => {
      const v = parseFloat(localStorage.getItem("vanilla-sound-volume"));
      return Number.isNaN(v) ? 0.9 : Math.max(0, Math.min(1, v));
    })(),
    ambientMusic: localStorage.getItem("vanilla-ambient-music") === "true",
    musicTrack: localStorage.getItem("vanilla-ambient-track") || "vanilla",
    showCompare: localStorage.getItem("vanilla-show-compare") === "true",
    showLmStudio: localStorage.getItem("vanilla-show-lmstudio") === "true",
    showAider: localStorage.getItem("vanilla-show-aider") !== "false",
    showGoose: localStorage.getItem("vanilla-show-goose") !== "false",
    showOpenCode: localStorage.getItem("vanilla-show-opencode") !== "false",
    autoName: localStorage.getItem("vanilla-auto-name") !== "false",
    assistantLogo: localStorage.getItem("vanilla-assistant-logo") || "side",
    userName: localStorage.getItem("vanilla-user-name") || "",
    customPrompt: localStorage.getItem("vanilla-custom-prompt") || "",
    webSearch: localStorage.getItem("vanilla-web-search") !== "false",
    searchBackend: localStorage.getItem("vanilla-search-backend") || "duckduckgo",
    braveApiKey: localStorage.getItem("vanilla-brave-key") || "",
    workspaceTools: localStorage.getItem("vanilla-workspace-tools") !== "false",
    dictationEngine: localStorage.getItem("vanilla-dictation-engine") || "vosk",
    deletedRetentionDays: Number(localStorage.getItem("vanilla-deleted-retention-days")) || 30,
    customIcon: localStorage.getItem("vanilla-custom-icon") || "",
    desktopNotifications: localStorage.getItem("vanilla-desktop-notifications") !== "false",
    agentDir: localStorage.getItem("vanilla-agent-dir") || "",
    agentMode: localStorage.getItem("vanilla-agent-mode") !== "false",
  },
  mode: localStorage.getItem("vanilla-mode") === "agent" ? "agent" : "chat",
  agentFileStack: [],
  agentPickDir: "",
};

let settingsHydrated = false;
let settingsSaveTimer = null;

async function loadPersistentSettings() {
  try {
    const data = await api("/api/settings");
    if (data?.settings && typeof data.settings === "object") {
      Object.assign(state.settings, data.settings);
    }
  } catch {
    // Browser-local settings remain a complete offline fallback.
  } finally {
    settingsHydrated = true;
  }
}

function queueSettingsSave() {
  if (!settingsHydrated) return;
  clearTimeout(settingsSaveTimer);
  settingsSaveTimer = setTimeout(() => {
    const { braveApiKey: _secret, ...safeSettings } = state.settings;
    api("/api/settings", { method: "PUT", body: JSON.stringify({ settings: safeSettings }) }).catch(() => {});
  }, 250);
}

const themeNames = [
  "aurora", "blue-moon", "chocolate", "dragonfruit", "dreamsicle", "lavender", "lemon", "lime",
  "mint", "monochrome", "peach", "plum", "raspberry", "strawberry", "vanilla",
];

const greetings = [
  "Ready when you are.",
  "What are we working on?",
  "Drop in the problem and we will sort it out.",
  "What needs a second set of eyes?",
  "Where should we start?",
  "Show me the rough draft.",
  "What should we make better?",
  "What are we shipping today?",
  "What is the blocker?",
  "What needs a clean pass?",
  "What are we solving, {name}?",
  "What should we tackle first, {name}?",
  "Ready when you are, {name}.",
  "Send context and we will map it out.",
  "What is the goal for this one?",
  "Give me the short version first.",
  "What deserves attention today?",
  "Let us make this easier.",
  "What should be clearer?",
  "What can I help you finish?"
];

function api(path, options = {}) {
  const { timeoutMs, ...fetchOptions } = options;
  const timeoutController = timeoutMs ? new AbortController() : null;
  const timeout = timeoutMs ? setTimeout(() => timeoutController.abort(), timeoutMs) : null;
  return fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...fetchOptions,
    signal: timeoutController?.signal || options.signal,
  }).then(async (res) => {
    if (!res.ok) {
      let errorData = null;
      try {
        errorData = await res.json();
      } catch {}
      
      // Extract user-friendly error message and action if available
      const userMessage = errorData?.error || `${res.status} ${res.statusText}`;
      const action = errorData?.action || null;
      
      const error = new Error(userMessage);
      error.action = action;
      error.statusCode = res.status;
      error.recoverable = errorData?.recoverable !== false;
      throw error;
    }
    return res.json();
  }).catch((error) => {
    if (error.name === "AbortError") {
      const err = new Error(timeoutMs ? `Request timed out after ${Math.round(timeoutMs / 1000)}s` : "Request was cancelled");
      err.action = timeoutMs ? "The server took too long to respond. Check your connection and try again." : null;
      err.recoverable = true;
      throw err;
    }
    if (error.message === "Failed to fetch" || error.message.includes("NetworkError")) {
      const err = new Error("Cannot connect to server");
      err.action = "Check that the server is running and you have an internet connection.";
      err.recoverable = true;
      throw err;
    }
    throw error;
  }).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function isMacLike() {
  const uaDataPlatform = navigator.userAgentData?.platform || "";
  const platform = navigator.platform || "";
  const userAgent = navigator.userAgent || "";
  const fingerprint = `${uaDataPlatform} ${platform} ${userAgent}`;

  if (/Linux|X11|Ubuntu|CrOS/i.test(fingerprint)) return false;
  if (/Win/i.test(fingerprint)) return false;
  if (/Android/i.test(fingerprint)) return false;

  return /Mac|iPhone|iPad|iPod/i.test(fingerprint);
}

function getApiKey(provider) {
  return localStorage.getItem(`vanilla-api-key-${provider}`) || "";
}

function setApiKey(provider, key) {
  const stored = key.trim();
  if (stored) localStorage.setItem(`vanilla-api-key-${provider}`, stored);
  else localStorage.removeItem(`vanilla-api-key-${provider}`);
}

const TOGGLE_GATED_PROVIDERS = {
  lmstudio: "showLmStudio",
  aider: "showAider",
  goose: "showGoose",
  opencode: "showOpenCode",
};

function isProviderUsable(provider) {
  const settingKey = TOGGLE_GATED_PROVIDERS[provider.id];
  if (settingKey) return state.settings[settingKey] === true;
  if (!provider.requiresKey) return true;
  return Boolean(provider.hasKey || getApiKey(provider.id));
}

function usableProviders() {
  return (state.providers || []).filter(isProviderUsable);
}

function setShortcuts() {
  const isMac = isMacLike();
  const shortcuts = {
    "new-chat": isMac ? "⌘+⇧+O" : "Ctrl+Shift+O",
    search: isMac ? "⌘+K" : "Ctrl+K",
    workspace: isMac ? "⌘+⇧+F" : "Ctrl+Shift+F",
    "open-settings": isMac ? "⌘+," : "Ctrl+,",
    "toggle-sidebar": isMac ? "⌘+B" : "Ctrl+B",
  };

  Object.entries(shortcuts).forEach(([name, value]) => {
    document.querySelectorAll(`[data-shortcut="${name}"]`).forEach((el) => {
      el.textContent = value;
    });
  });
}

function getUserName() {
  return state.settings.userName || "";
}

function applyName(text) {
  const name = getUserName();
  if (!name) return text.replace(/,?\s*\{name\}|\{name\},?\s*/g, "").trim();
  return text.replace(/\{name\}/g, name);
}

function chooseGreeting() {
  if (themeGreeting) return;
  const hour = new Date().getHours();
  const name = getUserName();
  const timeSpecific = [];
  if (hour >= 0 && hour < 4) {
    timeSpecific.push("I'm here for the 2AM grind.", `Light mode at 2AM is crazy${name ? `, ${name}` : ""}.`, "Quiet hours, loud ideas.");
  } else if (hour >= 5 && hour < 10) {
    timeSpecific.push(`Morning${name ? `, ${name}` : ""}. What's first?`, "Fresh day, fresh thread.");
  } else if (hour >= 17 && hour < 22) {
    timeSpecific.push(`Evening mode${name ? `, ${name}` : ""}. What are we making?`, "Let's close the loop on something.");
  }
  const pool = timeSpecific.length ? timeSpecific : greetings;
  els.greeting.textContent = applyName(pool[Math.floor(Math.random() * pool.length)]);
}

function setMode(mode) {
  const allowed = state.settings.agentMode !== false;
  const prev = state.mode;
  state.mode = mode === "agent" && allowed ? "agent" : "chat";
  const isAgent = state.mode === "agent";
  if (prev && prev !== state.mode) Sounds.modeSwitch(state.mode);
  document.body.dataset.mode = state.mode;
  document.body.dataset.agentUi = String(allowed);
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    const active = tab.dataset.mode === state.mode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  const modeTabs = document.getElementById("modeTabs");
  if (modeTabs) modeTabs.style.display = allowed ? "" : "none";
  if (els.agentBar) els.agentBar.hidden = !isAgent;
  if (els.agentDirInput) els.agentDirInput.value = state.settings.agentDir || "";
  if (els.agentSidebarDir) {
    els.agentSidebarDir.textContent = state.settings.agentDir || "Default workspace";
    els.agentSidebarDir.title = state.settings.agentDir || "";
  }
  if (els.agentStatus) {
    els.agentStatus.textContent = state.settings.agentDir
      ? "Agent tools are scoped to this folder."
      : "Set a folder to scope the agent's tools.";
  }
  const mismatched = state.activeConversation && (state.activeConversation.mode || "chat") !== state.mode;
  if (mismatched) {
    state.activeConversation = null;
    els.messages.innerHTML = "";
  }
  if (isAgent) {
    state.agentFileStack = [];
    refreshAgentSidebar();
  }
  if (!allowed && els.agentSidebar) els.agentSidebar.style.display = "none";
  els.promptInput.placeholder = isAgent
    ? "Describe a coding task for the agent…"
    : (themePlaceholder || PROMPT_PLACEHOLDERS[placeholderIndex] || "What are we working on?");
  if (isAgent) {
    els.greeting.textContent = state.settings.agentDir
      ? `Agent ready in ${state.settings.agentDir}. What should we build?`
      : "Agent ready. Point it at a folder and describe a task.";
  } else {
    const empty = !state.activeConversation || !state.activeConversation.messages?.length;
    if (empty) {
      els.emptyState.hidden = false;
      if (!themeGreeting) chooseGreeting();
    }
  }
  els.emptyState.hidden = state.activeConversation && state.activeConversation.messages?.length;
  localStorage.setItem("vanilla-mode", state.mode);
  refreshConversations();
  if (isAgent) setTimeout(() => els.promptInput.focus(), 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(text, streaming = false) {
  let value = escapeHtml(text);
  if (streaming) {
    value = value.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    value = value.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    value = value.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    value = value.replace(/\$([^$\n]+)\$/g, '<span class="math-inline">$1</span>');
    return value;
  }
  return value
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderTable(lines) {
  const rows = lines.filter(Boolean).map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
  const head = rows[0] || [];
  const body = rows.slice(2);
  return `<div class="table-wrap"><table><thead><tr>${head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function extractThinking(markdown) {
  const blocks = [];
  const cleaned = markdown.replace(/<think>([\s\S]*?)<\/think>/gi, (_, content) => {
    blocks.push(content.trim());
    return "";
  });
  return { cleaned, blocks };
}

function detectLanguage(declaredLang, code) {
  // If language is explicitly declared, normalize and use it
  if (declaredLang) {
    const normalized = declaredLang.toLowerCase().trim();
    const langMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'py': 'python',
      'rb': 'ruby',
      'sh': 'bash',
      'shell': 'bash',
      'zsh': 'bash',
      'yml': 'yaml',
      'md': 'markdown',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'sql': 'sql',
      'go': 'go',
      'rust': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'dart': 'dart',
      'r': 'r',
      'xml': 'xml',
      'diff': 'diff',
      'git': 'git',
      'dockerfile': 'docker',
      'makefile': 'makefile',
      'graphql': 'graphql',
    };
    return langMap[normalized] || normalized;
  }
  
  // Auto-detect language based on code patterns
  const trimmed = code.trim();
  
  // JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {}
  }
  
  // HTML/XML
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return 'html';
  if (trimmed.startsWith('<?xml')) return 'xml';
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return 'html';
  
  // JavaScript/TypeScript patterns
  if (/^(import|export|const|let|var|function|class|interface|type)\s/m.test(trimmed)) {
    if (/:\s*[A-Z][a-zA-Z<>[\]|&]+[;=]/.test(trimmed)) return 'typescript';
    return 'javascript';
  }
  
  // Python
  if (/^(def|class|import|from|if __name__|print\()/m.test(trimmed)) return 'python';
  
  // Bash/Shell
  if (/^#!\/bin\/(ba)?sh/.test(trimmed)) return 'bash';
  if (/^\$\s|^(echo|cd|ls|mkdir|chmod)\s/m.test(trimmed)) return 'bash';
  
  // CSS/SCSS
  if (/^[.#]?[a-zA-Z-_][\w-]*\s*\{/.test(trimmed)) return 'css';
  
  // SQL
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/mi.test(trimmed)) return 'sql';
  
  // Default to plain text for unknown languages
  return '';
}

function renderMarkdown(markdown, { streaming = false } = {}) {
  const { cleaned, blocks } = extractThinking(markdown);
  const chunks = [];
  const fenceParts = cleaned.split(/```/);
  for (let i = 0; i < fenceParts.length; i++) {
    const part = fenceParts[i];
    if (i % 2 === 1) {
      // This is inside a code fence
      const firstBreak = part.indexOf("\n");
      const lang = firstBreak > -1 ? part.slice(0, firstBreak).trim() : "";
      const code = firstBreak > -1 ? part.slice(firstBreak + 1) : part;
      
      // During streaming, if this is the last fence and incomplete, still render as code box
      if (streaming && i === fenceParts.length - 1) {
        const detectedLang = detectLanguage(lang, code);
        const langClass = detectedLang ? `language-${detectedLang}` : "";
        const langDisplay = detectedLang || lang || "code";
        chunks.push(`<div class="code-box"><div class="code-head"><span>${escapeHtml(langDisplay)}</span><button type="button" data-copy-code>${icon("copy", "", 14)}Copy</button></div><pre class="line-numbers"><code class="${langClass}">${escapeHtml(code.trimEnd())}</code></pre></div>`);
      } else {
        const detectedLang = detectLanguage(lang, code);
        const langClass = detectedLang ? `language-${detectedLang}` : "";
        const langDisplay = detectedLang || lang || "code";
        chunks.push(`<div class="code-box"><div class="code-head"><span>${escapeHtml(langDisplay)}</span><button type="button" data-copy-code>${icon("copy", "", 14)}Copy</button></div><pre class="line-numbers"><code class="${langClass}">${escapeHtml(code.trimEnd())}</code></pre></div>`);
      }
      continue;
    }
    chunks.push(renderMarkdownBlock(part, streaming));
  }

  if (blocks.length) {
    chunks.unshift(blocks.map((block) => `<details class="thinking"><summary>Thinking</summary><p>${inlineMarkdown(block)}</p></details>`).join(""));
  }
  return chunks.join("");
}

function renderMarkdownBlock(markdown, streaming) {
  const lines = markdown.replace(/\n{3,}/g, "\n\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = [];
  let ordered = false;
  let table = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join("\n"), streaming).replace(/\n/g, "<br>")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    html.push(`<${ordered ? "ol" : "ul"}>${list.map((item) => `<li>${inlineMarkdown(item, streaming)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`);
    list = [];
  };
  const flushTable = () => {
    if (!table.length) return;
    html.push(renderTable(table));
    table = [];
  };

  for (const line of lines) {
    if (/^\s*\|.+\|\s*$/.test(line)) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }
    flushTable();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2], streaming)}</h${level}>`);
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    const number = line.match(/^\s*\d+\.\s+(.+)$/);
    if (bullet || number) {
      flushParagraph();
      const nextOrdered = Boolean(number);
      if (list.length && ordered !== nextOrdered) flushList();
      ordered = nextOrdered;
      list.push((bullet || number)[1]);
      continue;
    }
    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${inlineMarkdown(quote[1], streaming)}</blockquote>`);
      continue;
    }
    const mathBlock = line.match(/^\$\$(.+)\$\$$/);
    if (mathBlock) {
      flushParagraph();
      flushList();
      html.push(`<span class="math-block">${escapeHtml(mathBlock[1])}</span>`);
      continue;
    }
    paragraph.push(line);
  }

  flushTable();
  flushParagraph();
  flushList();
  return html.join("");
}

function groupLabel(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((startToday - startDate) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return "last week";
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toLowerCase();
}

function renderConversationList() {
  els.conversationList.innerHTML = "";
  if (!state.conversations.length) {
    const empty = document.createElement("div");
    empty.className = "conversation-empty";
    empty.innerHTML = `<div class="conversation-empty-icon">${icon("message-circle-more", "", 18)}</div>
      <p class="conversation-empty-text">No chats yet. Start a new one.</p>`;
    els.conversationList.append(empty);
    return;
  }
  let lastGroup = "";
  for (const conv of state.conversations) {
    const group = groupLabel(conv.updatedAt || conv.createdAt);
    if (group !== lastGroup) {
      const heading = document.createElement("div");
      heading.className = "date-heading";
      heading.textContent = group;
      els.conversationList.append(heading);
      lastGroup = group;
    }
    const row = document.createElement("div");
    row.className = "conversation-row";
    row.setAttribute("role", "listitem");
    row.setAttribute("aria-current", state.activeConversation?.id === conv.id ? "true" : "false");
    row.classList.toggle("is-pinned", Boolean(conv.pinned));

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "conversation-open";
    openButton.textContent = conv.title || "Untitled";
    openButton.title = conv.title || "Untitled";
    openButton.addEventListener("click", () => loadConversation(conv.id));

    const pinButton = document.createElement("button");
    pinButton.type = "button";
    pinButton.className = "conversation-pin";
    pinButton.title = conv.pinned ? "Unpin chat" : "Pin chat";
    pinButton.setAttribute("aria-label", conv.pinned ? "Unpin chat" : "Pin chat");
    pinButton.classList.toggle("is-pinned", Boolean(conv.pinned));
    pinButton.innerHTML = icon("pin", "", 14);
    pinButton.addEventListener("click", (event) => {
      event.stopPropagation();
      Sounds.pin();
      togglePin(conv.id);
    });

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "conversation-rename";
    renameButton.title = "Rename chat";
    renameButton.setAttribute("aria-label", "Rename chat");
    renameButton.innerHTML = EDIT_ICON;
    renameButton.addEventListener("click", (event) => {
      event.stopPropagation();
      Sounds.rename();
      showRenameInput(conv.id, conv.title, row, openButton);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "conversation-delete";
    deleteButton.title = "Delete chat";
    deleteButton.setAttribute("aria-label", "Delete chat");
    deleteButton.innerHTML = TRASH_ICON;
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (deleteButton.dataset.armed === "true") {
        deleteConversation(conv.id);
        return;
      }
      deleteButton.dataset.armed = "true";
      deleteButton.classList.add("is-armed");
      deleteButton.textContent = "Delete?";
      clearTimeout(deleteButton._timer);
      deleteButton._timer = setTimeout(() => {
        deleteButton.dataset.armed = "false";
        deleteButton.classList.remove("is-armed");
        deleteButton.innerHTML = TRASH_ICON;
      }, 2500);
    });

    row.append(openButton, pinButton, renameButton, deleteButton);
    els.conversationList.append(row);
  }
}

let mascotNapTimer = null;

function armMascotNap(mascot) {
  if (mascotNapTimer) clearTimeout(mascotNapTimer);
  mascotNapTimer = setTimeout(() => {
    if (mascot?.isConnected) {
      mascot.classList.add("is-napping");
      mascot.parentElement.querySelector(".mascot-zzz")?.classList.add("show");
    }
  }, 30000);
}

async function togglePin(id) {
  try {
    const data = await api(`/api/conversations/${encodeURIComponent(id)}/pin`, { method: "PATCH" });
    if (state.activeConversation?.id === id) state.activeConversation.pinned = data.pinned;
    await refreshConversations();
    if (data.pinned && !localStorage.getItem("vanilla-pinned-before")) {
      localStorage.setItem("vanilla-pinned-before", "1");
      Sounds.sparkle();
      showNotification("First pin! It's a keeper.", "success");
    } else {
      showNotification(data.pinned ? "Chat pinned" : "Chat unpinned", "success");
    }
  } catch (error) {
    showNotification(error.action || error.message || "Failed to update pin", "error");
  }
}

async function deleteConversation(id) {
  try {
    const retentionDays = Number(state.settings.deletedRetentionDays) || 30;
    const data = await api(`/api/conversations/${encodeURIComponent(id)}?retentionDays=${retentionDays}`, { method: "DELETE" });
    if (state.activeConversation?.id === id) {
      state.activeConversation = null;
      els.messages.innerHTML = "";
      els.emptyState.hidden = false;
      chooseGreeting();
    }
    await refreshConversations();
    await refreshDeletedConversations();
    const days = data.retentionDays || retentionDays;
    showNotification(`Chat moved to Recently Deleted. Restorable for ${days} day${days === 1 ? "" : "s"}.`);
    Sounds.delete();
  } catch (error) {
    showNotification(error.action || error.message || "Failed to delete chat", "error");
  }
}

async function refreshDeletedConversations() {
  try {
    state.deletedConversations = await api(`/api/conversations/deleted?mode=${encodeURIComponent(state.mode || "chat")}`);
  } catch {
    state.deletedConversations = [];
  }
  const count = state.deletedConversations.length;
  if (els.recentlyDeletedButton) els.recentlyDeletedButton.hidden = count === 0;
  if (els.recentlyDeletedCount) {
    els.recentlyDeletedCount.hidden = count === 0;
    els.recentlyDeletedCount.textContent = String(count);
  }
  if (els.deletedModal && !els.deletedModal.hidden) renderDeletedList();
}

function openRecentlyDeleted() {
  renderDeletedList();
  openModal(els.deletedModal);
}

function daysRemainingLabel(days) {
  if (days <= 0) return "expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function renderDeletedList() {
  if (!els.deletedList) return;
  els.deletedList.innerHTML = "";

  if (!state.deletedConversations.length) {
    const empty = document.createElement("div");
    empty.className = "deleted-empty";
    empty.textContent = "Nothing in Recently Deleted.";
    els.deletedList.append(empty);
    setDeletedSelection(null);
    if (els.deletedModalNote) els.deletedModalNote.textContent = "Deleted chats are kept for a short window, then permanently removed.";
    return;
  }

  for (const conv of state.deletedConversations) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "deleted-row";
    row.dataset.id = conv.id;
    row.setAttribute("role", "listitem");
    row.classList.toggle("is-selected", state.selectedDeletedId === conv.id);
    row.addEventListener("click", () => setDeletedSelection(conv.id));

    const info = document.createElement("span");
    info.className = "deleted-row-info";
    const title = document.createElement("span");
    title.className = "deleted-row-title";
    title.textContent = conv.title || "Untitled";
    const meta = document.createElement("span");
    meta.className = "deleted-row-meta";
    const deletedDate = new Date(conv.deletedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    meta.textContent = `deleted ${deletedDate}`;
    info.append(title, meta);

    const countdown = document.createElement("span");
    countdown.className = "deleted-row-countdown";
    countdown.textContent = daysRemainingLabel(conv.daysRemaining);

    row.append(info, countdown);
    els.deletedList.append(row);
  }

  if (!state.deletedConversations.some((c) => c.id === state.selectedDeletedId)) {
    setDeletedSelection(state.deletedConversations[0]?.id || null);
  }
  updateDeletedModalNote();
}

function setDeletedSelection(id) {
  state.selectedDeletedId = id || null;
  els.deletedList?.querySelectorAll(".deleted-row").forEach((row) => {
    row.classList.toggle("is-selected", state.selectedDeletedId === row.dataset.id);
  });
  if (els.deletedRestoreButton) els.deletedRestoreButton.disabled = !state.selectedDeletedId;
  if (els.deletedDeleteButton) els.deletedDeleteButton.disabled = !state.selectedDeletedId;
}

function updateDeletedModalNote() {
  if (!els.deletedModalNote) return;
  const selected = state.deletedConversations.find((c) => c.id === state.selectedDeletedId);
  if (selected) {
    const days = Number(selected.retentionDays) || 30;
    els.deletedModalNote.textContent = `This chat is recoverable for up to ${days} days. After that it is permanently deleted.`;
  } else {
    els.deletedModalNote.textContent = "Select a chat to restore it or delete it forever.";
  }
}

async function restoreDeleted(id) {
  try {
    const data = await api(`/api/conversations/${encodeURIComponent(id)}/restore`, { method: "POST" });
    state.deletedConversations = state.deletedConversations.filter((c) => c.id !== id);
    if (state.selectedDeletedId === id) state.selectedDeletedId = null;
    await refreshConversations();
    renderDeletedList();
    if (data.conversation?.id) loadConversation(data.conversation.id);
    if (els.deletedModal) els.deletedModal.hidden = true;
    showNotification("Chat restored", "success");
    Sounds.success();
  } catch (error) {
    showNotification(error.action || error.message || "Failed to restore chat", "error");
  }
}

async function permanentlyDeleteDeleted(id) {
  try {
    await api(`/api/conversations/${encodeURIComponent(id)}/permanent`, { method: "DELETE" });
    state.deletedConversations = state.deletedConversations.filter((c) => c.id !== id);
    if (state.selectedDeletedId === id) state.selectedDeletedId = null;
    renderDeletedList();
    await refreshDeletedConversations();
    showNotification("Chat permanently deleted", "success");
    Sounds.delete();
  } catch (error) {
    showNotification(error.action || error.message || "Failed to permanently delete chat", "error");
  }
}

function bindRecentlyDeleted() {
  els.recentlyDeletedButton?.addEventListener("click", openRecentlyDeleted);
  els.deletedRestoreButton?.addEventListener("click", () => {
    if (state.selectedDeletedId) restoreDeleted(state.selectedDeletedId);
  });
  els.deletedDeleteButton?.addEventListener("click", () => {
    if (state.selectedDeletedId) permanentlyDeleteDeleted(state.selectedDeletedId);
  });
}

function showRenameInput(conversationId, currentTitle, rowElement, openButton) {
  // Create input field
  const input = document.createElement("input");
  input.type = "text";
  input.className = "conversation-rename-input";
  input.value = currentTitle || "";
  input.placeholder = "Enter chat name";
  
  // Store the original button for restoring later
  const originalButton = openButton.cloneNode(true);
  
  // Replace the open button with the input
  openButton.replaceWith(input);
  input.focus();
  input.select();
  
  // Flag to prevent multiple saves
  let saving = false;
  let saved = false;
  
  // Function to save the new title
  const saveTitle = async () => {
    if (saving || saved) return;
    
    const newTitle = input.value.trim();
    if (!newTitle || newTitle === currentTitle) {
      // Restore original button if no change
      saved = true;
      input.replaceWith(originalButton);
      originalButton.addEventListener("click", () => loadConversation(conversationId));
      return;
    }
    
    saving = true;
    
    try {
      const data = await api(`/api/conversations/${encodeURIComponent(conversationId)}/title`, {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (data.title && state.activeConversation?.id === conversationId) {
        state.activeConversation.title = data.title;
      }
      
      saved = true;
      await refreshConversations();
      showNotification("Chat renamed", "success");
    } catch (error) {
      saved = true;
      showNotification(error.action || error.message || "Failed to rename chat", "error");
      // Restore original button on error
      input.replaceWith(originalButton);
      originalButton.addEventListener("click", () => loadConversation(conversationId));
    } finally {
      saving = false;
    }
  };
  
  // Function to cancel renaming
  const cancel = () => {
    if (saved) return;
    saved = true;
    input.replaceWith(originalButton);
    originalButton.addEventListener("click", () => loadConversation(conversationId));
  };
  
  // Save on Enter, cancel on Escape
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  });
  
  // Save on blur (when clicking away)
  input.addEventListener("blur", () => {
    // Small delay to allow other click events to fire first
    setTimeout(saveTitle, 100);
  });
}

async function autoNameConversation(id, force = false) {
  try {
    const params = force ? '?force=true' : '';
    const data = await api(`/api/conversations/${encodeURIComponent(id)}/name${params}`, { method: "POST" });
    if (data.title && state.activeConversation?.id === id) {
      state.activeConversation.title = data.title;
    }
    if (data.title) await refreshConversations();
    return data.title;
  } catch (error) {
    console.warn('Auto-naming failed:', error.message);
    return null;
  }
}

function prewarmTitleModel() {
  api("/api/names/prewarm", { method: "POST" }).catch(() => {});
}

function renderMessages(conv) {
  els.messages.innerHTML = "";
  const messages = conv?.messages || [];
  els.emptyState.hidden = messages.length > 0;
  renderBranchSwitcher(conv);
  const staggerStart = Math.max(0, messages.length - 6);
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    let wrap;
    if (msg.role === "user") {
      wrap = addUserMessage(msg.content, { animate: i >= staggerStart, id: msg.id });
    } else {
      wrap = addAssistantMessage(msg.content, { animate: i >= staggerStart, id: msg.id, done: true });
    }
    if (i >= staggerStart) wrap.style.animationDelay = `${(i - staggerStart) * 60}ms`;
  }
  requestAnimationFrame(() => {
    scrollToBottom();
    // Apply syntax highlighting to all loaded messages
    attachCodeCopy(els.messages);
  });
}

function renderBranchSwitcher(conv) {
  const branches = Array.isArray(conv?.branches) ? conv.branches : [];
  if (branches.length < 2) return;
  const activeIndex = Math.max(0, branches.findIndex((branch) => branch.id === conv.activeBranchId));
  const nav = document.createElement("nav");
  nav.className = "branch-switcher";
  nav.setAttribute("aria-label", "Conversation branches");
  nav.innerHTML = `
    <button type="button" aria-label="Previous branch" ${activeIndex === 0 ? "disabled" : ""}>${icon("chevron-left", "", 16)}</button>
    <span><strong>${escapeHtml(branches[activeIndex]?.label || `Branch ${activeIndex + 1}`)}</strong><small>${activeIndex + 1} of ${branches.length}</small></span>
    <button type="button" aria-label="Next branch" ${activeIndex === branches.length - 1 ? "disabled" : ""}>${icon("chevron-right", "", 16)}</button>`;
  const activate = async (index) => {
    const branch = branches[index];
    if (!branch || !conv.id) return;
    nav.dataset.loading = "true";
    try {
      const updated = await api(`/api/conversations/${encodeURIComponent(conv.id)}/branches/${encodeURIComponent(branch.id)}/activate`, { method: "POST" });
      state.activeConversation = updated;
      renderMessages(updated);
      showNotification(`Switched to ${branch.label || `branch ${index + 1}`}`, "info", 1800);
    } catch (error) {
      showNotification(error.message || "Could not switch branch", "error");
    }
  };
  nav.querySelector("button:first-child").addEventListener("click", () => activate(activeIndex - 1));
  nav.querySelector("button:last-child").addEventListener("click", () => activate(activeIndex + 1));
  els.messages.append(nav);
}

function addUserMessage(content, { id = crypto.randomUUID(), animate = true } = {}) {
  const wrap = document.createElement("article");
  wrap.className = "message user-message";
  wrap.dataset.messageId = id;
  if (!animate) wrap.style.animation = "none";
  const isLong = content.split("\n").length > 6 || content.length > 520;
  wrap.innerHTML = `
    <div class="user-bubble ${isLong ? "is-collapsed" : ""}">
      <div class="message-content">${escapeHtml(content)}</div>
      ${isLong ? '<button class="see-more" type="button">see more</button>' : ""}
    </div>
    <div class="message-actions">
      <button class="message-action" type="button" data-edit-message aria-label="Edit prompt" title="Edit prompt">${icon("pencil", "", 15)}</button>
      <button class="message-action" type="button" data-copy-message aria-label="Copy prompt" title="Copy prompt">${icon("copy", "", 15)}</button>
    </div>`;
  wrap.querySelector("[data-copy-message]").addEventListener("click", () => copyText(content));
  wrap.querySelector("[data-edit-message]").addEventListener("click", () => editPrompt(content, id));
  const seeMore = wrap.querySelector(".see-more");
  if (seeMore) {
    seeMore.addEventListener("click", () => {
      wrap.querySelector(".user-bubble").classList.toggle("is-collapsed");
      seeMore.textContent = seeMore.textContent === "see more" ? "see less" : "see more";
    });
  }
  els.messages.append(wrap);
  els.emptyState.hidden = true;
  scrollToBottom();
  return wrap;
}

function addAssistantMessage(content = "", { id = crypto.randomUUID(), animate = true, done = false } = {}) {
  const wrap = document.createElement("article");
  wrap.className = "message assistant-message";
  wrap.dataset.messageId = id;
  if (!animate) wrap.style.animation = "none";
  wrap.innerHTML = `
    <span class="assistant-mark">${icon("sparkles", "", 17)}</span>
    <div class="assistant-body">${done ? renderMarkdown(content) : loaderHtml()}</div>`;
  els.messages.append(wrap);
  els.emptyState.hidden = true;
  scrollToBottom();
  return wrap;
}

const LOADER_MESSAGES = [
  "Thinking...",
  "Putting this together...",
  "Working through the details...",
  "Drafting a clear answer...",
  "Almost there...",
];
let loaderMessageIndex = 0;

function loaderHtml() {
  return '<div class="typing-loader" aria-label="Waiting for response"><span></span><span></span><span></span><span class="loader-msg" data-cycle>Thinking...</span></div>';
}

function startLoaderRotation() {
  setInterval(() => {
    loaderMessageIndex = (loaderMessageIndex + 1) % LOADER_MESSAGES.length;
    const message = LOADER_MESSAGES[loaderMessageIndex];
    document.querySelectorAll("[data-cycle]").forEach((el) => {
      if (el.isConnected) el.textContent = message;
    });
  }, 1500);
}

const PROMPT_PLACEHOLDERS = [
  "What are we working on?",
  "Ask a question.",
  "Share context or paste code.",
  "Tell me what you want to build.",
  "What should we fix first?",
];
let placeholderIndex = 0;

function startPlaceholderRotation() {
  setInterval(() => {
    if (themePlaceholder || state.mode === "agent") return;
    placeholderIndex = (placeholderIndex + 1) % PROMPT_PLACEHOLDERS.length;
    els.promptInput.placeholder = PROMPT_PLACEHOLDERS[placeholderIndex];
  }, 8000);
}

function attachCodeCopy(root = document) {
  root.querySelectorAll("[data-copy-code]").forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const code = button.closest(".code-box")?.querySelector("code")?.textContent || "";
      copyText(code);
      button.textContent = "Copied";
      setTimeout(() => (button.textContent = "Copy"), 900);
    });
  });
  
  // Apply Prism syntax highlighting
  if (typeof Prism !== 'undefined') {
    root.querySelectorAll("pre code[class*='language-']").forEach((block) => {
      if (!block.classList.contains('prism-highlighted')) {
        Prism.highlightElement(block);
        block.classList.add('prism-highlighted');
      }
    });
  }
}

function scrollToBottom() {
  if (!state.scrollLocked) return; // Only auto-scroll if locked
  els.messages.scrollTop = els.messages.scrollHeight;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  Sounds.copy();
}

async function editPrompt(content, id) {
  els.promptInput.value = content;
  resizePrompt();
  els.promptInput.focus();
  els.composer.dataset.editingMessageId = id;
  els.composer.dataset.mode = "editing";
  els.promptInput.setAttribute("aria-label", "Edit prompt and create a branch");
  showNotification("Editing creates a new branch; the original stays available.", "info", 3200);
}

function resizePrompt() {
  els.promptInput.style.height = "auto";
  const naturalHeight = Math.min(els.promptInput.scrollHeight, 164);
  els.promptInput.style.height = `${naturalHeight}px`;
}

// Speech Recognition / Dictation
async function initDictation() {
  const engine = state.settings.dictationEngine || 'vosk';
  
  // Hide button if dictation is disabled
  if (engine === 'none') {
    if (els.dictationButton) {
      els.dictationButton.style.display = 'none';
    }
    return;
  }
  
  // Show button for VOSK
  if (els.dictationButton) {
    els.dictationButton.style.display = '';
  }
  
  // VOSK needs to check if library is loaded
  if (engine === 'vosk' && !window.Vosk) {
    if (els.dictationButton) {
      els.dictationButton.style.display = 'none';
    }
    return;
  }
}

async function toggleDictation() {
  const engine = state.settings.dictationEngine || 'vosk';
  
  if (engine === 'none') {
    showNotification("Voice dictation is disabled in settings", "warning");
    return;
  }
  
  if (engine === 'vosk' && !window.Vosk) {
    showNotification("VOSK library is not loaded", "warning");
    return;
  }

  if (state.isRecording) {
    stopDictation();
  } else {
    await startDictation();
  }
}

async function startDictation() {
  const engine = state.settings.dictationEngine || 'vosk';
  
  // Check if dictation is disabled
  if (engine === 'none') {
    showNotification("Voice dictation is disabled", "warning");
    return;
  }
  
  try {
    state.isRecording = true;
    Sounds.recordStart();
    Ambience.setDucked(true);
    
    els.dictationButton.dataset.active = 'true';
    els.dictationLabel.textContent = 'loading...';

    // Request microphone access
    state.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      }
    });

    // VOSK: Real-time browser-based recognition
    await startVoskDictation();

  } catch (error) {
    state.isRecording = false;
    els.dictationButton.dataset.active = 'false';
    els.dictationLabel.textContent = 'dictate';
    
    let message = "Speech recognition failed";
    let action = "Try again or type your message instead.";
    
    if (error.name === 'NotAllowedError') {
      message = "Microphone access denied";
      action = "Grant microphone permissions in your browser settings (usually in the address bar), then try again.";
    } else if (error.name === 'NotFoundError') {
      message = "No microphone detected";
      action = "Connect a microphone and refresh the page, or check your audio input settings.";
    } else if (error.message?.includes('model') || error.message?.includes('download')) {
      message = "Failed to load speech model";
      action = "Check your internet connection. The first use requires downloading a model file.";
    }
    
    showNotification(message, "error", 4000);
    if (action) {
      setTimeout(() => showNotification(action, "info", 5000), 500);
    }
  }
}

async function startVoskDictation() {
  // Create audio context
  state.audioContext = new AudioContext({ sampleRate: 16000 });
  const source = state.audioContext.createMediaStreamSource(state.mediaStream);

  // Load model if not loaded
  if (!state.voskModel) {
    els.dictationLabel.textContent = 'downloading model...';
    
    // Use our server as proxy to bypass CORS
    const model = await Vosk.createModel('/api/vosk-model');
    state.voskModel = model;
  }

  // Create recognizer with sample rate (must match AudioContext)
  state.voskRecognizer = new state.voskModel.KaldiRecognizer(16000);
  
  // Set up event handlers for results
  state.voskRecognizer.on("result", (message) => {
    if (message.result && message.result.text && message.result.text.trim()) {
      els.promptInput.value += message.result.text + ' ';
      resizePrompt();
    }
  });
  
  state.voskRecognizer.on("partialresult", (message) => {
    if (message.result && message.result.partial) {
      // Show partial results in button label for feedback
      const partial = message.result.partial.split(' ').slice(-3).join(' ');
      if (partial) els.dictationLabel.textContent = partial;
    }
  });
  
  els.dictationLabel.textContent = 'listening...';

  // Create audio processor
  const recognizerNode = state.audioContext.createScriptProcessor(4096, 1, 1);
  
  recognizerNode.onaudioprocess = (event) => {
    if (!state.isRecording) return;
    
    try {
      // Pass the AudioBuffer directly to Vosk
      state.voskRecognizer.acceptWaveform(event.inputBuffer);
    } catch (error) {
      // Silently ignore audio processing errors
    }
  };

  source.connect(recognizerNode);
  recognizerNode.connect(state.audioContext.destination);
  
  state.audioProcessor = recognizerNode;
}

function stopDictation() {
  state.isRecording = false;
  Sounds.recordStop();
  Ambience.setDucked(false);
  
  // Remove the VOSK recognizer
  if (state.voskRecognizer) {
    try {
      state.voskRecognizer.remove();
    } catch (e) {
      // Silently handle cleanup errors
    }
    state.voskRecognizer = null;
  }

  // Cleanup audio
  if (state.audioProcessor) {
    state.audioProcessor.disconnect();
    state.audioProcessor = null;
  }
  
  if (state.audioContext) {
    state.audioContext.close();
    state.audioContext = null;
  }
  
  if (state.mediaStream) {
    state.mediaStream.getTracks().forEach(track => track.stop());
    state.mediaStream = null;
  }

  els.dictationButton.dataset.active = 'false';
  els.dictationLabel.textContent = 'dictate';
}

async function refreshConversations() {
  try {
    const mode = state.mode || "chat";
    state.conversations = await api(`/api/conversations?mode=${encodeURIComponent(mode)}`);
    renderConversationList();
    if (mode === "agent") renderAgentSessions(state.conversations);
  } catch (error) {
    // Silently handle - conversations will show empty, user can still create new
  }
}

async function loadConversation(id) {
  Sounds.switchChat();
  try {
    const conv = await api(`/api/conversations/${encodeURIComponent(id)}`);
    state.activeConversation = conv;
    state.currentProvider = conv.provider || state.currentProvider;
    state.currentModel = conv.model || state.currentModel;
    if ((conv.mode || "chat") === "agent" && conv.workdir) {
      if (state.settings.agentDir !== conv.workdir) {
        state.settings.agentDir = conv.workdir;
        applySettings();
      }
      setMode("agent");
    } else if ((conv.mode || "chat") !== "agent" && state.mode !== "chat") {
      setMode("chat");
    }
    updateModelLabel();
    renderMessages(conv);
    renderConversationList();
    if (state.mode === "agent") renderAgentSessions(state.conversations);
    updatePromptPill();
  } catch (error) {
    showNotification(error.action || error.message || "Failed to load conversation", "error");
  }
}

function updateModelLabel() {
  els.activeModel.textContent = state.currentModel || "Choose model";
  syncSettingsSelects();
}

async function ensureConversation(message) {
  if (state.activeConversation) return state.activeConversation;
  const title = message.trim().split(/\s+/).slice(0, 7).join(" ") || "New Conversation";
  const conv = await api("/api/conversations", {
    method: "POST",
    body: JSON.stringify({
      title,
      model: state.currentModel,
      provider: state.currentProvider,
      autoTitle: state.settings.autoName,
      mode: state.mode === "agent" ? "agent" : "chat",
      workdir: state.mode === "agent" ? getAgentRoot() : "",
    }),
  });
  state.activeConversation = conv;
  await refreshConversations();
  renderConversationList();
  updatePromptPill();
  return conv;
}

async function newChat() {
  Sounds.newChat();
  state.activeConversation = null;
  els.messages.innerHTML = "";
  els.emptyState.hidden = false;
  chooseGreeting();
  renderConversationList();
  if (state.mode === "agent") renderAgentSessions(state.conversations);
  els.promptInput.value = "";
  resizePrompt();
  els.promptInput.focus();
  updatePromptPill();
}

async function submitPrompt(event) {
  event?.preventDefault();
  if (state.runningConversationId) {
    await stopStream();
    return;
  }
  const message = els.promptInput.value.trim();
  
  // Check if we have an attachment without a message
  if (!message && !state.pendingAttachment) return;

  const editingId = els.composer.dataset.editingMessageId;
  els.promptInput.value = "";
  delete els.composer.dataset.editingMessageId;
  delete els.composer.dataset.mode;
  els.promptInput.setAttribute("aria-label", "Message Vanilla");

  // Handle file upload if pending
  if (state.pendingAttachment) {
    await handleAttachmentUpload(message);
    return;
  }

  resizePrompt();

  try {
    let conv = await ensureConversation(message);
    if (editingId) {
      // Editing an existing message - regenerate from that point
      await api(`/api/conversations/${encodeURIComponent(conv.id)}/regenerate`, {
        method: "POST",
        body: JSON.stringify({ message, messageId: editingId }),
      });
      conv = await api(`/api/conversations/${encodeURIComponent(conv.id)}`);
      state.activeConversation = conv;
      renderMessages(conv);
    } else {
      // New message - just add it
      addUserMessage(message);
    }
    Sounds.send();
    await streamChat(conv.id, message, { messageAlreadySaved: Boolean(editingId) });
  } catch (error) {
    showAssistantError(error);
  }
}

async function handleAttachmentUpload(message) {
  if (!state.pendingAttachment) return;

  state.uploading = true;
  const { file, name, isImage } = state.pendingAttachment;
  const progress = createUploadProgress();

  try {
    const result = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          progress.querySelector(".upload-fill").style.width = `${pct}%`;
          progress.querySelector(".upload-label").textContent = `Uploading ${name} (${pct}%)`;
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201) {
          Sounds.upload();
          return resolve(JSON.parse(xhr.responseText));
        }
        try {
          const err = JSON.parse(xhr.responseText);
          const error = new Error(err.error || `Upload failed (${xhr.status})`);
          error.action = err.action || null;
          reject(error);
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed - network error"));
      xhr.ontimeout = () => reject(new Error("Upload timed out - try a smaller file"));
      
      const fd = new FormData();
      fd.append("file", file);
      xhr.send(fd);
    });

    progress.querySelector(".upload-fill").style.width = "100%";
    progress.querySelector(".upload-label").textContent = `Uploaded ${name}`;
    setTimeout(() => progress.remove(), 800);

    // Clear the attachment preview
    clearAttachment();
    resizePrompt();

    const ext = result.name.split(".").pop()?.toLowerCase();
    const isResultImage = /^(jpg|jpeg|png|gif|webp|avif)$/.test(ext);

    // Create visual message with image preview or file attachment
    let visualContent;
    if (isResultImage) {
      visualContent = `<img src="${result.url}" alt="${escapeHtml(result.name)}" style="max-width: 100%; border-radius: 12px; margin-top: 10px;">`;
    } else {
      visualContent = `<a href="${result.url}" target="_blank" class="file-attachment"><span class="file-icon">${ext.toUpperCase()}</span><span class="file-info"><span class="file-name">${escapeHtml(result.name)}</span><span class="file-meta">${escapeHtml(result.type)} · ${formatFileSize(result.size)}</span></span></a>`;
    }

    // Message sent to AI (just URL for context)
    const aiMessage = message 
      ? `${message}\n\n[Image: ${result.url}]`
      : `[Image: ${result.url}]`;

    // Message displayed to user (with visual preview)
    const displayMessage = message 
      ? `${escapeHtml(message)}\n\n${visualContent}`
      : visualContent;

    const conv = await ensureConversation(aiMessage);
    addUploadedMessage(displayMessage);
    await streamChat(conv.id, aiMessage);
  } catch (error) {
    progress.querySelector(".upload-fill").classList.add("upload-error");
    progress.querySelector(".upload-label").textContent = error.message;
    
    // Show detailed error with action
    if (error.action) {
      setTimeout(() => {
        progress.querySelector(".upload-label").textContent = error.action;
      }, 1500);
      setTimeout(() => progress.remove(), 4000);
    } else {
      setTimeout(() => progress.remove(), 2500);
    }
    
    showAssistantError(error);
  } finally {
    state.uploading = false;
  }
}

async function streamChat(conversationId, message, { messageAlreadySaved = false } = {}) {
  setRunning(conversationId, true);
  const assistant = addAssistantMessage("");
  state.activeAssistant = assistant.querySelector(".assistant-body");
  state.tokenQueue = "";
  state.tokenText = "";
  state.toolChips = [];
  state.responseNotified = false;

  state.activeAssistant.textContent = state.mode === "agent" ? "Agent attacking the task…" : "Loading model...";
  pumpTokens();

  const convPrompt = state.activeConversation?.customPrompt?.trim()
    ? state.activeConversation.customPrompt
    : "";
  const customPrompt = convPrompt || (state.settings.customPrompt || undefined);

  const controller = new AbortController();
  state.streamAbort = controller;

  try {
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        message,
        model: state.currentModel,
        provider: state.currentProvider,
        apiKey: getApiKey(state.currentProvider) || undefined,
        customPrompt,
        mode: state.mode,
        search: state.settings.webSearch,
        searchBackend: state.settings.searchBackend,
        searchApiKey: state.settings.searchBackend === "brave" ? (state.settings.braveApiKey || "") : undefined,
        workspaceTools: state.mode === "agent" ? true : state.settings.workspaceTools,
        agentDir: state.mode === "agent" ? (state.settings.agentDir || undefined) : undefined,
        messageAlreadySaved,
      }),
      signal: controller.signal,
    });
    if (!response.ok || !response.body) {
      let detail = `${response.status} ${response.statusText}`;
      try {
        detail = (await response.json()).error || detail;
      } catch {}
      throw new Error(detail);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;
    let hasReceivedTokens = false;
    
    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !done });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        if (!hasReceivedTokens) {
          const loader = state.activeAssistant.querySelector(".typing-loader");
          if (loader) loader.remove();
          state.tokenQueue = "";
          state.tokenText = "";
          hasReceivedTokens = true;
        }
        handleSsePart(part);
      }
    }
    if (buffer.trim()) handleSsePart(buffer);
    
    if (!hasReceivedTokens) {
      throw new Error("No response received from model");
    }
  } catch (error) {
    if (error.name !== "AbortError") showAssistantError(error.message, assistant);
  } finally {
    finishStream();
    setRunning(null, false);
    await refreshConversations();
    if (state.activeConversation?.id) {
      try {
        state.activeConversation = await api(`/api/conversations/${encodeURIComponent(state.activeConversation.id)}`);
      } catch {}
    }
    const updated = state.conversations.find((c) => c.id === conversationId);
    // Auto-name if setting is enabled and conversation has at least one exchange (2 messages: user + assistant)
    if (state.settings.autoName && updated && updated.autoTitle !== false && (updated.messageCount || 0) >= 2) {
      autoNameConversation(conversationId);
    }
  }
}

function handleSsePart(part) {
  for (const line of part.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    try {
      const event = JSON.parse(trimmed.slice(5).trim());
      if (event.type === "token") {
        state.tokenQueue += event.content || "";
      } else if (event.type === "done") {
        state.streamComplete = true;
        Sounds.receive();
        notifyResponseFinished();
      } else if (event.type === "tool_call") {
        addToolChip(event.name || "tool", event.args || {});
      } else if (event.type === "tool_result") {
        resolveToolChip(event.name || "tool", event.ok !== false);
      } else if (event.type === "tool_error") {
        addToolError(event.error || "Tool call failed");
      } else if (event.type === "error") {
        const error = new Error(event.error || "Stream failed");
        error.action = event.action || null;
        showAssistantError(error, state.activeAssistant?.closest(".assistant-message"));
      }
    } catch (error) {
      // Skip malformed SSE events silently
    }
  }
}

function notifyResponseFinished() {
  if (state.responseNotified || !state.settings.desktopNotifications || !document.hidden) return;
  state.responseNotified = true;
  const title = state.activeConversation?.title || "Vanilla";
  const body = "Your response is ready.";
  if (window.electronAPI?.notify) {
    window.electronAPI.notify(title, body);
  } else if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: state.settings.customIcon || undefined });
  }
}

function toolChipLabel(name, args) {
  const map = {
    web_search: ["searching web for", String(args?.query || "")],
    list_workspace_files: ["listing files", ""],
    read_file: ["reading", String(args?.path || "")],
    write_file: ["writing", String(args?.path || "")],
    delete_file: ["deleting", String(args?.path || "")],
    run_command: ["running", String(args?.command || "")],
  };
  const [verb, target] = map[name] || [name.replace(/_/g, " "), ""];
  return { verb, target };
}

function toolChipHtml(entry) {
  const cls = entry.status === "running" ? "tool-chip-running" : entry.status === "ok" ? "tool-chip-ok" : "tool-chip-error";
  const statusText = entry.status === "running" ? "…" : entry.status === "ok" ? "done" : "failed";
  const { verb, target } = toolChipLabel(entry.name, entry.args);
  const chipIcon = entry.name === "web_search" ? "search" : entry.name === "run_command" ? "wrench" : "folder-closed";
  return `<span class="tool-chip ${cls}" title="${entry.errorText ? escapeHtml(entry.errorText) : ""}">
    ${icon(chipIcon, "", 13)}
    <span class="tool-chip-verb">${escapeHtml(verb)}</span>
    ${target ? `<code class="tool-chip-target">${escapeHtml(target)}</code>` : ""}
    <span class="tool-chip-status">${statusText}</span>
  </span>`;
}

function addToolChip(name, args) {
  if (!state.activeAssistant) return;
  state.toolChips.push({ name, args: args || {}, status: "running" });
  renderAssistantBody();
}

function resolveToolChip(name, ok) {
  const idx = state.toolChips.findIndex((entry) => entry.status === "running" && entry.name === name);
  const entry = idx !== -1 ? state.toolChips[idx] : state.toolChips.find((item) => item.status === "running");
  if (!entry) return;
  entry.status = ok ? "ok" : "error";
  renderAssistantBody();
}

function addToolError(message) {
  if (!state.activeAssistant) return;
  state.toolChips.push({ name: "tool", args: {}, status: "error", errorText: message || "tool call failed" });
  renderAssistantBody();
}

function renderAssistantBody() {
  if (!state.activeAssistant) return;
  const chipsHtml = (state.toolChips || []).map(toolChipHtml).join("");
  const chipsBlock = chipsHtml ? `<div class="tool-chips">${chipsHtml}</div>` : "";
  state.activeAssistant.innerHTML = chipsBlock + renderMarkdown(state.tokenText, { streaming: true });
  attachCodeCopy(state.activeAssistant);
  scrollToBottom();
}

function pumpTokens() {
  if (!state.activeAssistant) return;
  const draw = () => {
    if (state.tokenQueue || (state.toolChips && state.toolChips.length)) {
      if (state.tokenQueue) {
        const take = Math.max(1, Math.min(10, Math.ceil(state.tokenQueue.length / 8)));
        state.tokenText += state.tokenQueue.slice(0, take);
        state.tokenQueue = state.tokenQueue.slice(take);
      }
      renderAssistantBody();
    }
    if (state.runningConversationId || state.tokenQueue) {
      state.tokenPump = requestAnimationFrame(draw);
    }
  };
  state.tokenPump = requestAnimationFrame(draw);
}

function finishStream() {
  const flushTokens = () => {
    if (state.tokenQueue && state.activeAssistant) {
      state.tokenText += state.tokenQueue;
      state.tokenQueue = "";
      renderAssistantBody();
    }
  };
  
  flushTokens();
  
  if (state.tokenPump) cancelAnimationFrame(state.tokenPump);
  state.activeAssistant = null;
  state.tokenPump = null;
  state.tokenQueue = "";
  state.tokenText = "";
  state.streamComplete = false;
}

async function stopStream() {
  const id = state.runningConversationId;
  if (!id) return;
  Sounds.stop();
  try {
    await api(`/api/chat/stop/${encodeURIComponent(id)}`, { method: "POST" });
  } catch (error) {
    // Silently handle - stream may have already completed
  }
  state.streamAbort?.abort();
  setRunning(null, false);
}

function setRunning(conversationId, running) {
  state.runningConversationId = running ? conversationId : null;
  els.submitButton.dataset.mode = running ? "stop" : "submit";
  els.submitButton.innerHTML = icon(running ? "square" : "arrow-up", "", 18);
  els.submitButton.title = running ? "Stop" : "Submit";
  els.submitButton.setAttribute("aria-label", running ? "Stop response" : "Submit message");
}

function showAssistantError(error, existingMessage) {
  Sounds.error();
  const wrap = existingMessage || addAssistantMessage("", { done: true });
  const body = wrap.classList?.contains("assistant-message") ? wrap.querySelector(".assistant-body") : wrap;
  
  const message = typeof error === "string" ? error : error?.message || "An unexpected error occurred";
  const action = error?.action || null;
  const recoverable = error?.recoverable !== false;
  
  let html = `<div class="error-message"><p><strong>${icon("circle-alert", "", 18)}${escapeHtml(message)}</strong></p>`;
  
  if (action) {
    html += `<p class="error-action">${escapeHtml(action)}</p>`;
  }
  
  if (recoverable && state.activeConversation?.id) {
    html += `<p class="error-recovery"><button type="button" class="retry-button" onclick="retryLastMessage()">Try Again</button></p>`;
  }
  
  html += `</div>`;
  
  if (body) body.innerHTML = html;
}

async function retryLastMessage() {
  if (!state.activeConversation?.id) return;
  
  try {
    // Get the last user message
    const messages = state.activeConversation.messages || [];
    const lastUserMsg = messages.filter(m => m.role === "user").pop();
    
    if (!lastUserMsg) {
      showNotification("No message to retry", "warning");
      return;
    }
    
    // Remove the last assistant error message if present
    await api(`/api/conversations/${encodeURIComponent(state.activeConversation.id)}/erase-last-response`, {
      method: "POST",
    });
    
    // Reload conversation and retry
    state.activeConversation = await api(`/api/conversations/${encodeURIComponent(state.activeConversation.id)}`);
    renderMessages(state.activeConversation);
    await streamChat(state.activeConversation.id, lastUserMsg.content);
  } catch (error) {
    showNotification(error.message || "Retry failed", "error");
  }
}

const SUCCESS_VARIANTS = {
  "Chat pinned": ["Chat pinned", "Pinned for later."],
  "Chat unpinned": ["Chat unpinned", "Removed from pinned."],
  "Chat renamed": ["Chat renamed", "Name updated."],
  "Chat exported": ["Chat exported", "Export ready."],
  "Chat deleted": ["Chat deleted", "Removed."],
};

function showNotification(message, type = "info", duration = 3000) {
  if (type === "success" && SUCCESS_VARIANTS[message]) {
    const variants = SUCCESS_VARIANTS[message];
    message = variants[Math.floor(Math.random() * variants.length)];
  }
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `app-notification app-notification-${type}`;
  
  const notificationIcons = { error: "circle-alert", success: "circle-check", warning: "triangle-alert", info: "info" };
  const iconContent = icon(notificationIcons[type] || notificationIcons.info, "", 18);
  
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${iconContent}</span>
      <span class="notification-message">${escapeHtml(message)}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  if (type === "success") Sounds.success();
  else if (type === "warning") Sounds.warning();
  
  // Trigger animation
  requestAnimationFrame(() => {
    notification.classList.add("show");
  });
  
  // Auto-dismiss
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

async function loadProvidersAndModels() {
  try {
    state.providers = await api("/api/providers");
  } catch (error) {

    state.providers = [{ id: "ollama", label: "Ollama (Local)", requiresKey: false, hasKey: false }];
  }

  els.activeModel.textContent = "Finding models";
  const usable = usableProviders();
  const optionGroups = await Promise.all(usable.map(async (provider) => {
    try {
      const params = new URLSearchParams({ provider: provider.id });
      if (provider.requiresKey) {
        const key = getApiKey(provider.id);
        if (key) params.set("apiKey", key);
      }
      const models = await api(`/api/models?${params.toString()}`, { timeoutMs: 10000 });
      return models.map((model) => ({ provider: provider.id, providerLabel: provider.label, model }));
    } catch (error) {
      const reason = error.action || error.message;
      return [{
        provider: provider.id,
        providerLabel: provider.label,
        model: "Unavailable",
        disabled: true,
        reason,
      }];
    }
  }));
  const options = optionGroups.flat();
  state.modelOptions = options;
  const firstUsable = options.find((option) => !option.disabled);
  if (firstUsable) {
    state.currentProvider = firstUsable.provider;
    state.currentModel = firstUsable.model;
  } else {
    showNotification("No models available. Configure a provider in Settings.", "error", 5000);
  }
  renderModelOptions();
  updateModelLabel();
}

async function checkLmStudio() {
  if (!els.lmStudioStatus) return;
  const status = els.lmStudioStatus;
  status.hidden = false;
  status.className = "lmstudio-status";
  status.textContent = "Checking…";
  els.lmStudioCheckButton.disabled = true;
  try {
    const models = await api("/api/models?provider=lmstudio", { timeoutMs: 5000 });
    if (Array.isArray(models) && models.length) {
      const preview = models.slice(0, 3).join(", ");
      status.textContent = `Connected. ${models.length} model${models.length === 1 ? "" : "s"} available (${preview}${models.length > 3 ? "..." : ""}).`;
      status.classList.add("ok");
    } else {
      status.textContent = "Connected, but no models are loaded. Load a model in LM Studio, then try again.";
      status.classList.add("ok");
    }
  } catch (error) {
    status.textContent = error.action || error.message || "Could not connect to LM Studio.";
    status.classList.add("bad");
  } finally {
    els.lmStudioCheckButton.disabled = false;
  }
}

function renderApiKeys() {
  if (!els.apiKeysList) return;
  const keyed = state.providers.filter((provider) => provider.requiresKey);
  if (!keyed.length) {
    els.apiKeysList.innerHTML = '<p class="muted-note">No cloud providers available.</p>';
    return;
  }
  els.apiKeysList.innerHTML = keyed.map((provider) => {
    const stored = getApiKey(provider.id);
    const configured = Boolean(provider.hasKey || stored);
    return `
      <div class="api-key-row" data-provider="${escapeHtml(provider.id)}">
        <span class="api-key-label">${escapeHtml(provider.label)}${configured ? ' <span class="api-key-badge">configured</span>' : ""}</span>
        <span class="api-key-input-wrap">
          <input class="settings-input api-key-input" type="password" placeholder="Paste your ${escapeHtml(provider.label)} API key" autocomplete="off" spellcheck="false" value="${escapeHtml(stored)}">
          <button class="api-key-toggle" type="button" aria-label="Show key" title="Show key">${icon("eye", "", 17)}</button>
        </span>
        <span class="api-key-save-wrap">
          <button class="api-key-save" type="button">Save</button>
          <span class="api-key-status" hidden></span>
        </span>
      </div>`;
  }).join("");

  els.apiKeysList.querySelectorAll(".api-key-row").forEach((row) => {
    const providerId = row.dataset.provider;
    const input = row.querySelector(".api-key-input");
    const status = row.querySelector(".api-key-status");

    row.querySelector(".api-key-toggle").addEventListener("click", (e) => {
      const button = e.currentTarget;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.innerHTML = icon(isPassword ? "eye-off" : "eye", "", 17);
      button.setAttribute("aria-label", isPassword ? "Hide key" : "Show key");
      button.setAttribute("title", isPassword ? "Hide key" : "Show key");
    });

    row.querySelector(".api-key-save").addEventListener("click", async () => {
      setApiKey(providerId, input.value);
      status.textContent = input.value.trim() ? "Saved" : "Removed";
      status.hidden = false;
      setTimeout(() => { status.hidden = true; }, 2000);
      await refreshProviders();
    });
  });
}

async function refreshProviders() {
  await loadProvidersAndModels();
  renderApiKeys();
}

function renderModelOptions() {
  const query = els.modelSearch.value.trim().toLowerCase();
  const filtered = state.modelOptions.filter((option) => {
    return `${option.providerLabel} ${option.model}`.toLowerCase().includes(query);
  });
  
  els.modelOptions.innerHTML = "";
  
  // Group models by provider
  const byProvider = {};
  for (const option of filtered) {
    if (!byProvider[option.provider]) {
      byProvider[option.provider] = {
        label: option.providerLabel,
        models: []
      };
    }
    byProvider[option.provider].models.push(option);
  }
  
  // Render each provider's models
  for (const [providerId, providerData] of Object.entries(byProvider)) {
    // Skip if only provider is Gemini and we have multiple model families
    const shouldGroupByFamily = providerId === 'gemini' && providerData.models.length > 5;
    
    if (shouldGroupByFamily) {
      // Group Gemini models by family
      const families = {};
      for (const model of providerData.models) {
        const family = extractModelFamily(model.model);
        if (!families[family]) families[family] = [];
        families[family].push(model);
      }
      
      // Create provider header
      const providerHeader = document.createElement("div");
      providerHeader.className = "model-group";
      providerHeader.textContent = providerData.label;
      els.modelOptions.append(providerHeader);
      
      // Create collapsible groups for each family
      for (const [familyName, familyModels] of Object.entries(families)) {
        const groupHeader = document.createElement("button");
        groupHeader.type = "button";
        groupHeader.className = "model-group-toggle";
        groupHeader.setAttribute("aria-expanded", "true");
        groupHeader.innerHTML = `
          <span class="model-group-chevron">▼</span>
          <span>${escapeHtml(familyName)} (${familyModels.length})</span>
        `;
        
        const groupModels = document.createElement("div");
        groupModels.className = "model-group-models";
        
        groupHeader.addEventListener("click", () => {
          const isExpanded = groupHeader.getAttribute("aria-expanded") === "true";
          groupHeader.setAttribute("aria-expanded", String(!isExpanded));
          groupModels.hidden = isExpanded;
        });
        
        els.modelOptions.append(groupHeader);
        els.modelOptions.append(groupModels);
        
        // Add models to this family group
        for (const option of familyModels) {
          const button = createModelButton(option);
          groupModels.append(button);
        }
      }
    } else {
      // Regular provider grouping (not Gemini or small list)
      const group = document.createElement("div");
      group.className = "model-group";
      group.textContent = providerData.label;
      els.modelOptions.append(group);
      
      for (const option of providerData.models) {
        const button = createModelButton(option);
        els.modelOptions.append(button);
      }
    }
  }
  
  syncSettingsSelects();
}

function extractModelFamily(modelName) {
  // Extract model family from name
  // Examples:
  //   gemini-2.5-flash -> Gemini 2.5
  //   gemini-3.1-pro -> Gemini 3.1
  //   gemini-2.0-flash-thinking-exp -> Gemini 2.0
  
  const lower = modelName.toLowerCase();
  
  // Check for embedding models
  if (lower.includes('embedding')) return 'Embedding Models';
  
  // Check for latest/experimental models
  if (lower.includes('latest') || lower.includes('-exp') || lower.endsWith('preview')) {
    return 'Latest & Experimental';
  }
  
  // Check for robotics/specialized models
  if (lower.includes('robotics')) return 'Robotics Models';
  if (lower.includes('thinking')) return 'Thinking Models';
  if (lower.includes('image')) return 'Image Generation';
  if (lower.includes('video')) return 'Video Models';
  
  // Extract version (e.g., "2.5", "3.1", "2.0")
  const versionMatch = lower.match(/(\d+\.\d+)/);
  if (versionMatch) {
    const version = versionMatch[1];
    // Capitalize first letter
    const modelBase = modelName.split('-')[0];
    const capitalizedBase = modelBase.charAt(0).toUpperCase() + modelBase.slice(1);
    return `${capitalizedBase} ${version}`;
  }
  
  // Fallback
  return 'Other Models';
}

function createModelButton(option) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "model-option";
  button.disabled = Boolean(option.disabled);
  button.setAttribute("aria-selected", option.provider === state.currentProvider && option.model === state.currentModel ? "true" : "false");
  button.innerHTML = option.disabled
    ? `<span>${escapeHtml(option.providerLabel)} unavailable</span><small>${escapeHtml(option.reason || "No models returned")}</small>`
    : `<span>${escapeHtml(option.model)}</span>`;
  button.addEventListener("click", () => {
    if (option.disabled) return;
    state.currentProvider = option.provider;
    state.currentModel = option.model;
    els.modelPicker.dataset.open = "false";
    els.modelButton.setAttribute("aria-expanded", "false");
    updateModelLabel();
    renderModelOptions();
  });
  return button;
}

function createSettingsDropdown(root, onChange) {
  const button = root.querySelector(".settings-picker-button");
  const label = root.querySelector(".settings-picker-label");
  const box = root.querySelector(".settings-picker-options");
  let items = [];
  let value = "";

  function render() {
    const match = items.find((item) => item.value === value);
    label.textContent = match ? match.label : "";
    root.dataset.value = value;
    box.querySelectorAll(".settings-picker-option").forEach((option, index) => {
      option.setAttribute("aria-selected", items[index]?.value === value ? "true" : "false");
    });
  }

  function close() {
    root.dataset.open = "false";
    button.setAttribute("aria-expanded", "false");
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (root.dataset.disabled === "true") return;
    const open = root.dataset.open !== "true";
    root.dataset.open = open ? "true" : "false";
    button.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.dataset.open === "true") close();
  });

  return {
    setOptions(list) {
      items = list;
      box.innerHTML = "";
      list.forEach((item) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "settings-picker-option";
        option.setAttribute("role", "option");
        option.disabled = Boolean(item.disabled);
        option.textContent = item.label;
        option.addEventListener("click", () => {
          if (item.disabled) return;
          value = item.value;
          close();
          render();
          if (typeof onChange === "function") onChange(value);
        });
        box.append(option);
      });
      render();
    },
    setValue(next) {
      value = next;
      render();
    },
    get value() {
      return value;
    },
  };
}

function bindSettingsDropdowns() {
  dropdowns.provider = createSettingsDropdown(els.providerPicker, () => {
    Sounds.click();
    state.currentProvider = dropdowns.provider.value;
    const firstModel = state.modelOptions.find((option) => option.provider === state.currentProvider && !option.disabled);
    if (firstModel) state.currentModel = firstModel.model;
    updateModelLabel();
    renderModelOptions();
  });
  dropdowns.model = createSettingsDropdown(els.settingsModelPicker, () => {
    Sounds.click();
    state.currentModel = dropdowns.model.value;
    updateModelLabel();
    renderModelOptions();
  });
  dropdowns.theme = createSettingsDropdown(els.themePicker, () => {
    state.settings.theme = dropdowns.theme.value;
    applySettings();
  });
  dropdowns.density = createSettingsDropdown(els.densityPicker, () => {
    state.settings.density = dropdowns.density.value;
    applySettings();
  });
  dropdowns.textSize = createSettingsDropdown(els.textSizePicker, () => {
    state.settings.textSize = dropdowns.textSize.value;
    applySettings();
  });
  dropdowns.accent = createSettingsDropdown(els.accentPicker, () => {
    state.settings.accent = dropdowns.accent.value;
    applySettings();
  });
  dropdowns.logoPosition = createSettingsDropdown(els.logoPositionPicker, () => {
    state.settings.assistantLogo = dropdowns.logoPosition.value;
    applySettings();
  });
  dropdowns.musicTrack = createSettingsDropdown(els.musicTrackPicker, () => {
    Sounds.click();
    state.settings.musicTrack = dropdowns.musicTrack.value;
    applySettings();
  });
  dropdowns.typingStyle = createSettingsDropdown(els.typingStylePicker, () => {
    Sounds.click();
    state.settings.typingStyle = dropdowns.typingStyle.value;
    applySettings();
    Sounds.setKeyStyle(state.settings.typingStyle);
    Sounds.previewTyping();
  });

  dropdowns.density.setOptions([
    { value: "comfortable", label: "Comfortable" },
    { value: "compact", label: "Compact" },
  ]);
  dropdowns.textSize.setOptions([
    { value: "small", label: "Small" },
    { value: "regular", label: "Regular" },
    { value: "large", label: "Large" },
  ]);
  dropdowns.accent.setOptions([
    { value: "sky", label: "Sky" },
    { value: "mint", label: "Mint" },
    { value: "peach", label: "Peach" },
    { value: "rose", label: "Rose" },
    { value: "lavender", label: "Lavender" },
  ]);
  dropdowns.logoPosition.setOptions([
    { value: "side", label: "Beside text" },
    { value: "top", label: "Above text" },
  ]);
  dropdowns.musicTrack.setOptions([
    { value: "vanilla", label: "Vanilla Haze" },
    { value: "golden", label: "Golden Hour" },
    { value: "midnight", label: "Midnight Lo-Fi" },
    { value: "rainy", label: "Rainy Day" },
    { value: "audio:2-am-debug-loop.mp3", label: "2 AM Debug Loop" },
    { value: "audio:coffee-ring-notebook.mp3", label: "Coffee Ring Notebook" },
    { value: "audio:porchlight-golden-hour.mp3", label: "Porchlight Golden Hour" },
    { value: "audio:terminal-rain.mp3", label: "Terminal Rain" },
    { value: "audio:paper-lantern-rain.mp3", label: "Paper Lantern Rain" },
    { value: "audio:dust-on-the-morning-keys.mp3", label: "Dust on the Morning Keys" },
  ]);
  dropdowns.typingStyle.setOptions([
    { value: "mechanical", label: "Mechanical" },
    { value: "typewriter", label: "Typewriter" },
    { value: "membrane", label: "Membrane" },
    { value: "cherry", label: "Cherry" },
  ]);
  dropdowns.typingStyle.setValue(state.settings.typingStyle || "mechanical");
  dropdowns.searchBackend = createSettingsDropdown(els.searchBackendPicker, () => {
    state.settings.searchBackend = dropdowns.searchBackend.value;
    applySettings();
  });
  dropdowns.searchBackend.setOptions([
    { value: "duckduckgo", label: "DuckDuckGo (no key)" },
    { value: "brave", label: "Brave Search (API key)" },
  ]);

  // Dictation engine picker
  dropdowns.dictationEngine = createSettingsDropdown(els.dictationEnginePicker, () => {
    const newEngine = dropdowns.dictationEngine.value;
    state.settings.dictationEngine = newEngine;
    applySettings();
    updateDictationNote();
  });
  dropdowns.dictationEngine.setOptions([
    { value: "vosk", label: "VOSK (Browser, ~40MB)" },
    { value: "none", label: "Disabled" },
  ]);

  dropdowns.deletedRetention = createSettingsDropdown(els.deletedRetentionPicker, () => {
    state.settings.deletedRetentionDays = Number(dropdowns.deletedRetention.value) || 30;
    applySettings();
  });
  dropdowns.deletedRetention.setOptions([
    { value: "7", label: "7 days" },
    { value: "14", label: "14 days" },
    { value: "30", label: "30 days" },
  ]);
  dropdowns.deletedRetention.setValue(String(state.settings.deletedRetentionDays || 30));
}

function updateDictationNote() {
  const engine = state.settings.dictationEngine;
  if (engine === "vosk") {
    els.dictationEngineNote.textContent = "VOSK runs in your browser, downloads ~40MB on first use. Decent accuracy, works offline.";
    if (els.dictationButton) els.dictationButton.style.display = '';
  } else {
    els.dictationEngineNote.textContent = "Voice dictation is off. Turn it on above to use voice input.";
    if (els.dictationButton) els.dictationButton.style.display = 'none';
  }
}

function syncSettingsSelects() {
  const usable = usableProviders();
  dropdowns.provider.setOptions(usable.map((provider) => ({ value: provider.id, label: provider.label })));
  dropdowns.provider.setValue(state.currentProvider);
  const models = state.modelOptions.filter((option) => option.provider === state.currentProvider && !option.disabled);
  dropdowns.model.setOptions(models.map((option) => ({ value: option.model, label: option.model })));
  dropdowns.model.setValue(state.currentModel);
}

async function refreshStats() {
  try {
    const stats = await api("/api/system/stats");
    const cpu = stats.cpu?.usagePercent;
    const ram = stats.memory?.pressurePercent;
    const gpuUsage = Array.isArray(stats.gpu) ? stats.gpu.find((gpu) => gpu.usagePercent != null)?.usagePercent : null;
    const gpuPressure = Array.isArray(stats.gpu) ? stats.gpu[0]?.pressure : null;
    els.cpuStat.textContent = `CPU: ${formatPercent(cpu)}`;
    els.ramStat.textContent = `RAM: ${formatPercent(ram)}`;
    els.gpuStat.textContent = gpuUsage == null ? `GPU: ${gpuPressure || "--"}` : `GPU: ${formatPercent(gpuUsage)}`;
  } catch (error) {
    els.cpuStat.textContent = "CPU: --";
    els.gpuStat.textContent = "GPU: --";
    els.ramStat.textContent = "RAM: --";
  }
}

function formatPercent(value) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}%` : "--";
}

function titleCase(value) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function injectClass(svg, classNames) {
  if (!classNames) return svg;
  const cleaned = svg.replace(/^<svg([^>]*?)\sclass="[^"]*"/i, "<svg$1");
  return cleaned.replace(/^<svg([^>]*)>/, (whole, rest) => `<svg class="${classNames}"${rest}>`);
}

function readableAccentText(color) {
  const hex = String(color || "").trim().match(/^#([\da-f]{6})$/i)?.[1];
  if (!hex) return "#ffffff";
  const [red, green, blue] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
  return ((red * 299 + green * 587 + blue * 114) / 1000) > 158 ? "#1d1d1f" : "#ffffff";
}

function applyTheme(theme) {
  const root = document.documentElement;
  const colors = theme?.colors;

  if (colors) {
    const darkTheme = readableAccentText(colors.background) === "#ffffff";
    root.style.colorScheme = darkTheme ? "dark" : "light";
    root.style.setProperty("--brand-logo-filter", darkTheme && !theme?.logo ? "invert(1)" : "none");
    root.style.setProperty("--bg", colors.background);
    root.style.setProperty("--text", colors.text);
    root.style.setProperty("--bubble", colors.userMessage);
    root.style.setProperty("--line", colors.border);
    root.style.setProperty("--panel", colors.assistantMessage);
    root.style.setProperty("--panel-strong", colors.secondary || colors.assistantMessage);
    root.style.setProperty("--soft", colors.assistantMessage);
    if (colors.surface) root.style.setProperty("--surface", colors.surface);
    else root.style.removeProperty("--surface");
  } else {
    root.style.colorScheme = "light";
    root.style.removeProperty("--brand-logo-filter");
    ["--bg", "--text", "--bubble", "--line", "--panel", "--panel-strong", "--soft", "--surface"].forEach((property) => {
      root.style.removeProperty(property);
    });
  }

  const accent = theme?.accent || "";
  if (accent) {
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-foreground", readableAccentText(accent));
  } else {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-foreground");
  }

  const brand = document.querySelector(".brand-logo");
  if (brand) {
    brand.outerHTML = theme?.logo ? injectClass(theme.logo, "brand-logo") : (originalBrandLogo || brand.outerHTML);
  }

  if (theme?.appName) document.title = theme.appName;
  else document.title = originalTitle;

  const hadThemedGreeting = themeGreeting;
  themeGreeting = Boolean(theme?.greeting);
  if (themeGreeting && els.greeting) els.greeting.textContent = theme.greeting;
  else if (hadThemedGreeting) chooseGreeting();

  themePlaceholder = Boolean(theme?.placeholder);
  if (themePlaceholder && els.promptInput) els.promptInput.placeholder = theme.placeholder;

  if (theme?.styles) {
    if (!themeStylesEl) {
      themeStylesEl = document.createElement("style");
      themeStylesEl.id = "theme-styles";
      document.head.appendChild(themeStylesEl);
    }
    themeStylesEl.textContent = theme.styles;
  } else if (themeStylesEl) {
    themeStylesEl.remove();
    themeStylesEl = null;
  }
}

function applyCustomIcon() {
  const candidate = state.settings.customIcon || "";
  const icon = /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,/i.test(candidate) ? candidate : "";
  if (els.customIconPreview) {
    els.customIconPreview.replaceChildren();
    if (icon) {
      const image = document.createElement("img");
      image.src = icon;
      image.alt = "Custom app icon preview";
      els.customIconPreview.append(image);
    } else {
      els.customIconPreview.textContent = "V";
    }
  }
  if (!themeFaviconLink) {
    themeFaviconLink = document.createElement("link");
    themeFaviconLink.rel = "icon";
    document.head.appendChild(themeFaviconLink);
  }
  themeFaviconLink.href = icon || "./assets/vanilla%20logomark.svg";
  window.electronAPI?.setAppIcon?.(icon || null);
}

function applySettings() {
  const { settings } = state;
  document.body.dataset.density = settings.density;
  document.body.dataset.textSize = settings.textSize;
  document.body.dataset.accent = settings.accent;
  document.body.dataset.assistantLogo = settings.assistantLogo;
  document.body.dataset.showStats = String(settings.showStats);
  document.body.dataset.reduceMotion = String(settings.reduceMotion);
  els.shell.dataset.sidebar = settings.sidebar;
  if (dropdowns.density) dropdowns.density.setValue(settings.density);
  if (dropdowns.textSize) dropdowns.textSize.setValue(settings.textSize);
  if (dropdowns.accent) dropdowns.accent.setValue(settings.accent);
  if (dropdowns.logoPosition) dropdowns.logoPosition.setValue(settings.assistantLogo);
  els.sidebarOpenToggle.checked = settings.sidebar === "open";
  els.reduceMotionToggle.checked = settings.reduceMotion;
  els.enterToSendToggle.checked = settings.enterToSend;
  els.showStatsToggle.checked = settings.showStats;
  if (els.desktopNotificationsToggle) els.desktopNotificationsToggle.checked = settings.desktopNotifications;
  if (els.soundEffectsToggle) els.soundEffectsToggle.checked = settings.soundEffects;
  Sounds.setEnabled(settings.soundEffects);
  if (els.typingToggle) els.typingToggle.checked = settings.typingSounds;
  Sounds.setKeyEnabled(settings.typingSounds);
  Sounds.setKeyStyle(settings.typingStyle || "mechanical");
  if (els.typingStylePicker) {
    if (dropdowns.typingStyle) dropdowns.typingStyle.setValue(settings.typingStyle || "mechanical");
    els.typingStylePicker.dataset.disabled = String(!settings.typingSounds);
  }
  if (els.soundVolumeSlider) {
    els.soundVolumeSlider.value = Math.round((settings.soundVolume || 0.9) * 100);
    els.soundVolumeSlider.disabled = !settings.soundEffects;
  }
  if (els.soundVolumeValue) els.soundVolumeValue.textContent = `${Math.round((settings.soundVolume || 0.9) * 100)}%`;
  Sounds.setVolume(settings.soundVolume || 0.9);
  if (els.soundVolumeSlider) {
    const pct = Math.round((settings.soundVolume || 0.9) * 100);
    els.soundVolumeSlider.style.setProperty("--fill", `${pct}%`);
  }
  if (els.ambientToggle) els.ambientToggle.checked = settings.ambientMusic;
  if (dropdowns.musicTrack) dropdowns.musicTrack.setValue(settings.musicTrack);
  if (els.musicTrackPicker) els.musicTrackPicker.dataset.disabled = String(!settings.ambientMusic);
  Ambience.setTrack(settings.musicTrack);
  Ambience.setEnabled(settings.ambientMusic);
  if (els.compareToggle) els.compareToggle.checked = settings.showCompare;
  if (els.lmStudioToggle) els.lmStudioToggle.checked = settings.showLmStudio;
  if (els.lmStudioSetupHint) els.lmStudioSetupHint.hidden = !settings.showLmStudio;
  if (els.aiderToggle) els.aiderToggle.checked = settings.showAider;
  if (els.gooseToggle) els.gooseToggle.checked = settings.showGoose;
  if (els.openCodeToggle) els.openCodeToggle.checked = settings.showOpenCode;
  if (els.agentDirInput && document.activeElement !== els.agentDirInput) {
    els.agentDirInput.value = settings.agentDir || "";
  }
  if (els.autoNameToggle) els.autoNameToggle.checked = settings.autoName;
  if (els.webSearchToggle) els.webSearchToggle.checked = settings.webSearch;
  if (els.workspaceToolsToggle) els.workspaceToolsToggle.checked = settings.workspaceTools;
  if (els.agentModeToggle) els.agentModeToggle.checked = settings.agentMode !== false;
  document.body.dataset.agentUi = String(settings.agentMode !== false);
  if (settings.agentMode === false && state.mode === "agent") setMode("chat");
  const searchPill = document.querySelector('[data-tool="search"]');
  if (searchPill) {
    searchPill.dataset.active = String(settings.webSearch);
    searchPill.setAttribute("aria-pressed", String(settings.webSearch));
  }
  const toolsPill = document.querySelector('[data-tool="tools"]');
  if (toolsPill) {
    toolsPill.dataset.active = String(settings.workspaceTools);
    toolsPill.setAttribute("aria-pressed", String(settings.workspaceTools));
  }
  if (dropdowns.searchBackend) dropdowns.searchBackend.setValue(settings.searchBackend);
  if (dropdowns.dictationEngine) dropdowns.dictationEngine.setValue(settings.dictationEngine);
  if (dropdowns.deletedRetention) dropdowns.deletedRetention.setValue(String(settings.deletedRetentionDays || 30));
  updateDictationNote();
  if (els.braveKeyRow) els.braveKeyRow.hidden = settings.searchBackend !== "brave";
  if (els.braveApiKeyInput && document.activeElement !== els.braveApiKeyInput) {
    els.braveApiKeyInput.value = settings.braveApiKey || "";
  }
  if (els.searchBackendPicker) els.searchBackendPicker.dataset.disabled = String(!settings.webSearch);
  if (els.displayNameInput && document.activeElement !== els.displayNameInput) {
    els.displayNameInput.value = settings.userName || "";
  }
  if (els.customPromptInput && document.activeElement !== els.customPromptInput) {
    els.customPromptInput.value = settings.customPrompt || "";
  }
  if (els.customPromptBadge) {
    els.customPromptBadge.hidden = !settings.customPrompt || settings.customPrompt.trim() === "";
  }
  const theme = state.themes.find((item) => item.name === settings.theme);
  applyTheme(theme);
  applyCustomIcon();
  localStorage.setItem("vanilla-theme", settings.theme);
  localStorage.setItem("vanilla-density", settings.density);
  localStorage.setItem("vanilla-text-size", settings.textSize);
  localStorage.setItem("vanilla-accent", settings.accent);
  localStorage.setItem("vanilla-sidebar", settings.sidebar);
  localStorage.setItem("vanilla-reduce-motion", String(settings.reduceMotion));
  localStorage.setItem("vanilla-enter-to-send", String(settings.enterToSend));
  localStorage.setItem("vanilla-show-stats", String(settings.showStats));
  localStorage.setItem("vanilla-sound-effects", String(settings.soundEffects));
  localStorage.setItem("vanilla-typing-sounds", String(settings.typingSounds));
  localStorage.setItem("vanilla-typing-style", settings.typingStyle || "mechanical");
  localStorage.setItem("vanilla-sound-volume", String(settings.soundVolume || 0.9));
  localStorage.setItem("vanilla-ambient-music", String(settings.ambientMusic));
  localStorage.setItem("vanilla-ambient-track", settings.musicTrack);
  localStorage.setItem("vanilla-show-compare", String(settings.showCompare));
  localStorage.setItem("vanilla-show-lmstudio", String(settings.showLmStudio));
  localStorage.setItem("vanilla-show-aider", String(settings.showAider));
  localStorage.setItem("vanilla-show-goose", String(settings.showGoose));
  localStorage.setItem("vanilla-show-opencode", String(settings.showOpenCode));
  localStorage.setItem("vanilla-auto-name", String(settings.autoName));
  localStorage.setItem("vanilla-assistant-logo", settings.assistantLogo);
  localStorage.setItem("vanilla-user-name", settings.userName || "");
  localStorage.setItem("vanilla-custom-prompt", settings.customPrompt || "");
  localStorage.setItem("vanilla-web-search", String(settings.webSearch));
  localStorage.setItem("vanilla-workspace-tools", String(settings.workspaceTools));
  localStorage.setItem("vanilla-search-backend", settings.searchBackend);
  localStorage.setItem("vanilla-brave-key", settings.braveApiKey || "");
  localStorage.setItem("vanilla-dictation-engine", settings.dictationEngine || "vosk");
  localStorage.setItem("vanilla-deleted-retention-days", String(settings.deletedRetentionDays || 30));
  localStorage.setItem("vanilla-custom-icon", settings.customIcon || "");
  localStorage.setItem("vanilla-desktop-notifications", String(settings.desktopNotifications));
  localStorage.setItem("vanilla-agent-dir", settings.agentDir || "");
  localStorage.setItem("vanilla-agent-mode", String(settings.agentMode !== false));
  applyCompareVisibility();
  queueSettingsSave();
}

function applyCompareVisibility() {
  const comparePill = document.querySelector('[data-tool="compare"]');
  if (comparePill) comparePill.hidden = !state.settings.showCompare;
}

async function loadThemes() {
  let names = themeNames;
  try {
    const response = await fetch("/api/themes");
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.themes) && data.themes.length) {
        names = data.themes.map((theme) => theme.name);
      }
    }
  } catch {
    // Fall back to the built-in list if the catalog endpoint is unavailable.
  }
  const results = await Promise.all(names.map(async (name) => {
    try {
      const response = await fetch(`/themes/${encodeURIComponent(name)}.json`);
      if (!response.ok) throw new Error("Theme unavailable");
      return await response.json();
    } catch {
      return { name, displayName: titleCase(name), description: "Theme palette" };
    }
  }));
  state.themes = [{ name: "default", displayName: "Vanilla UI", description: "Neutral light interface" }, ...results];
  if (dropdowns.theme) {
    dropdowns.theme.setOptions(state.themes.map((theme) => ({ value: theme.name, label: theme.displayName || titleCase(theme.name) })));
    dropdowns.theme.setValue(state.settings.theme);
  }
  applySettings();
}

function openModal(modal) {
  modal.hidden = false;
  Sounds.open();
  requestAnimationFrame(() => modal.querySelector("input, select, button")?.focus());
}

function closeModals() {
  Sounds.close();
  els.searchModal.hidden = true;
  els.workspaceModal.hidden = true;
  els.settingsModal.hidden = true;
  els.installModal.hidden = true;
  els.ollamaModal.hidden = true;
  els.uninstallModal.hidden = true;
  if (els.exportModal) els.exportModal.hidden = true;
  if (els.compareModal) els.compareModal.hidden = true;
  if (els.promptModal) els.promptModal.hidden = true;
  if (els.deletedModal) els.deletedModal.hidden = true;
}

// Helper function to find and highlight fuzzy matches
function highlightFuzzyMatch(text, query) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // First try exact match
  const exactIdx = lowerText.indexOf(lowerQuery);
  if (exactIdx !== -1) {
    const before = escapeHtml(text.slice(0, exactIdx));
    const matched = escapeHtml(text.slice(exactIdx, exactIdx + query.length));
    const after = escapeHtml(text.slice(exactIdx + query.length));
    return `${before}<mark>${matched}</mark>${after}`;
  }
  
  // Try fuzzy match - find all characters in order
  const chars = lowerQuery.split('');
  let textIdx = 0;
  let matchStart = -1;
  let matchEnd = -1;
  let charIdx = 0;
  
  while (textIdx < lowerText.length && charIdx < chars.length) {
    if (lowerText[textIdx] === chars[charIdx]) {
      if (matchStart === -1) matchStart = textIdx;
      matchEnd = textIdx + 1;
      charIdx++;
    }
    textIdx++;
  }
  
  // If we found all characters and the span is reasonable
  if (charIdx === chars.length && matchEnd - matchStart < query.length * 4) {
    const before = escapeHtml(text.slice(0, matchStart));
    const matched = escapeHtml(text.slice(matchStart, matchEnd));
    const after = escapeHtml(text.slice(matchEnd));
    return `${before}<mark>${matched}</mark>${after}`;
  }
  
  // No good match found, return escaped text
  return escapeHtml(text);
}

async function runSearch() {
  const q = els.searchInput.value.trim();
  if (!q) {
    els.searchResults.innerHTML = "";
    return;
  }
  try {
    const results = await api(`/api/search?q=${encodeURIComponent(q)}&mode=${encodeURIComponent(state.mode || "chat")}`);
    els.searchResults.innerHTML = results.map((result) => {
      const snippet = result.matches?.find((match) => match.snippet)?.snippet || "Title match";
      const match = result.matches?.find((match) => match.snippet);
      
      // Highlight the query in title
      let highlightedTitle = escapeHtml(result.title);
      const titleMatch = result.matches?.find((m) => m.type === 'title');
      if (titleMatch) {
        highlightedTitle = highlightFuzzyMatch(result.title, q);
      }
      
      // Highlight the query in snippet
      let highlightedSnippet = escapeHtml(snippet);
      if (match && match.query) {
        highlightedSnippet = highlightFuzzyMatch(snippet, match.query);
      }
      
      return `<button class="search-result" type="button" data-conversation-id="${escapeHtml(result.id)}"><strong>${highlightedTitle}</strong><span>${highlightedSnippet}</span></button>`;
    }).join("") || '<p class="muted-note">No matches.</p>';
    els.searchResults.querySelectorAll("[data-conversation-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        closeModals();
        await loadConversation(button.dataset.conversationId);
      });
    });
  } catch (error) {
    els.searchResults.innerHTML = `<p class="muted-note">Search failed. Try again.</p>`;
  }
}

function openWorkspace() {
  openModal(els.workspaceModal);
  refreshWorkspace();
}

async function refreshWorkspace() {
  try {
    const data = await api("/api/workspace");
    if (data.dir && els.workspacePathLabel) els.workspacePathLabel.textContent = data.dir;
    renderWorkspaceFiles(data.files || []);
  } catch (error) {
    els.workspaceFileList.innerHTML = `<p class="muted-note">Couldn't load the workspace. ${escapeHtml(error.message || "")}</p>`;
  }
}

async function openWorkspaceFolder() {
  try {
    await api("/api/workspace/open", { method: "POST" });
    showNotification("Workspace folder opened", "success");
  } catch (error) {
    showNotification(error.action || error.message || "Couldn't open the workspace folder", "error");
  }
}

function renderWorkspaceFiles(files) {
  if (!files.length) {
    els.workspaceFileList.innerHTML = `<div class="workspace-empty"><p>No files yet.</p><span>Create one here, or ask the assistant to create one.</span></div>`;
    return;
  }
  els.workspaceFileList.innerHTML = files.map((file) => `
    <div class="workspace-file-row">
      <button class="workspace-file" type="button" data-path="${escapeHtml(file.path)}">
        ${icon("file", "", 15)}
        <span class="workspace-file-path">${escapeHtml(file.path)}</span>
        <span class="workspace-file-meta">${formatFileSize(file.size)}</span>
      </button>
      <button class="workspace-file-delete" type="button" data-delete-path="${escapeHtml(file.path)}" aria-label="Delete ${escapeHtml(file.path)}" title="Delete ${escapeHtml(file.path)}">
        ${icon("trash-2", "", 15)}
      </button>
    </div>
  `).join("");
  els.workspaceFileList.querySelectorAll(".workspace-file").forEach((button) => {
    button.addEventListener("click", () => viewWorkspaceFile(button.dataset.path));
  });
  els.workspaceFileList.querySelectorAll(".workspace-file-delete").forEach((button) => {
    button.addEventListener("click", () => deleteWorkspaceFile(button.dataset.deletePath));
  });
}

function getAgentRoot() {
  return state.settings.agentDir || "";
}

function setAgentDir(dir) {
  state.settings.agentDir = dir || "";
  applySettings();
  setMode("agent");
}

async function pickAgentDir() {
  if (window.electronAPI?.pickFolder) {
    let picked = null;
    try {
      picked = await window.electronAPI.pickFolder();
    } catch {
      picked = null;
    }
    if (picked && picked !== state.settings.agentDir) {
      setAgentDir(picked);
      showNotification("Agent working directory set", "success");
    }
    return;
  }
  openAgentFolderPicker();
}

function dirParent(dir) {
  const clean = String(dir || "").replace(/[\\/]+$/, "");
  if (!clean) return null;
  const sep = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
  if (sep <= 0) return "/";
  return clean.slice(0, sep);
}

async function openAgentFolderPicker() {
  state.agentPickDir = getAgentRoot();
  if (els.agentFolderPath) els.agentFolderPath.value = state.agentPickDir;
  if (els.agentFolderNative) els.agentFolderNative.hidden = !window.electronAPI?.pickFolder;
  if (els.agentFolderHint) els.agentFolderHint.textContent = "";
  els.agentFolderModal.hidden = false;
  await listAgentFolders(state.agentPickDir);
}

async function listAgentFolders(dir) {
  if (!els.agentFolderList) return;
  els.agentFolderList.innerHTML = `<p class="muted-note">Loading folders…</p>`;
  try {
    const data = await api(`/api/agent/files?dir=${encodeURIComponent(dir || "")}`);
    state.agentPickDir = data.dir || dir;
    if (els.agentFolderPath) els.agentFolderPath.value = state.agentPickDir;
    const parent = dirParent(state.agentPickDir);
    els.agentFolderUp.hidden = !parent;
    if (els.agentFolderHint) els.agentFolderHint.textContent = "";
    renderAgentFolders(data.entries || []);
  } catch (error) {
    els.agentFolderList.innerHTML = `<p class="muted-note">${escapeHtml(error.message || "Couldn't read that folder.")}</p>`;
  }
}

function renderAgentFolders(entries) {
  const dirs = Array.isArray(entries) ? entries.filter((e) => e.type === "dir") : [];
  if (!dirs.length) {
    els.agentFolderList.innerHTML = `<p class="muted-note">No subfolders here.</p>`;
    return;
  }
  els.agentFolderList.innerHTML = dirs.map((entry) => `
    <button class="agent-folder-row" type="button" data-folder-name="${escapeHtml(entry.name)}" title="${escapeHtml(entry.name)}">
      ${icon("folder-closed", "", 15)}
      <span class="agent-folder-row-name">${escapeHtml(entry.name)}</span>
      ${icon("chevron-right", "", 13)}
    </button>
  `).join("");
  els.agentFolderList.querySelectorAll("[data-folder-name]").forEach((row) => {
    row.addEventListener("click", () => {
      const name = row.dataset.folderName;
      listAgentFolders(state.agentPickDir ? `${state.agentPickDir.replace(/\/+$/, "")}/${name}` : name);
    });
  });
}

async function refreshAgentSidebar() {
  renderAgentSessions(state.conversations);
  loadProjects();
  updateAgentData();
  await loadAgentFiles(getAgentRoot());
}

function renderAgentSessions(sessions) {
  if (!els.agentSessionList) return;
  const list = Array.isArray(sessions) ? sessions : [];
  if (!list.length) {
    els.agentSessionList.innerHTML = `<p class="muted-note project-empty">No agent sessions yet. Start one below.</p>`;
    return;
  }
  els.agentSessionList.innerHTML = list.map((conv) => `
    <button class="agent-session-row ${state.activeConversation?.id === conv.id ? "is-active" : ""}" type="button" data-session-id="${conv.id}" title="${escapeHtml(conv.title || "Untitled")}">
      <span class="agent-session-title">${escapeHtml(conv.title || "Untitled")}</span>
      <span class="agent-session-dir">${escapeHtml(conv.workdir || "default workspace")}</span>
    </button>
  `).join("");
  els.agentSessionList.querySelectorAll("[data-session-id]").forEach((row) => {
    row.addEventListener("click", () => loadConversation(row.dataset.sessionId));
  });
}

async function loadProjects() {
  if (!els.projectList) return;
  try {
    const data = await api("/api/agent/projects");
    renderProjects(data.projects || []);
  } catch (error) {
    els.projectList.innerHTML = `<p class="muted-note project-empty">Couldn't load projects. ${escapeHtml(error.message || "")}</p>`;
  }
}

function renderProjects(projects) {
  if (!els.projectList) return;
  const current = getAgentRoot();
  if (!Array.isArray(projects) || !projects.length) {
    els.projectList.innerHTML = `<p class="muted-note project-empty">No projects yet. Save your working directory to pin it here.</p>`;
    return;
  }
  els.projectList.innerHTML = projects.map((project) => `
    <button class="project-row ${project.dir === current ? "is-current" : ""}" type="button" data-project-index="${project.index}" title="${escapeHtml(project.dir)}">
      ${icon(project.dir === current ? "folder-open" : "folder-closed", "", 15)}
      <span class="project-name">${escapeHtml(project.name)}</span>
      <span class="project-dir">${escapeHtml(project.dir)}</span>
      <span class="project-remove" role="button" data-project-remove="${project.index}" title="Remove project" aria-label="Remove ${escapeHtml(project.name)}">${icon("x", "", 13)}</span>
    </button>
  `).join("");
  els.projectList.querySelectorAll(".project-row").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("[data-project-remove]")) return;
      const index = Number(row.dataset.projectIndex);
      const project = projects.find((p) => p.index === index);
      if (project) setAgentDir(project.dir);
    });
  });
  els.projectList.querySelectorAll("[data-project-remove]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const index = Number(button.dataset.projectRemove);
      try {
        await api(`/api/agent/projects/${index}`, { method: "DELETE" });
        loadProjects();
      } catch (error) {
        showNotification(error.message || "Couldn't remove project", "error");
      }
    });
  });
}

async function saveCurrentProject() {
  const dir = getAgentRoot();
  if (!dir) {
    showNotification("Set a working directory first (top-center bar).", "info", 4000);
    return;
  }
  try {
    await api("/api/agent/projects", {
      method: "POST",
      body: JSON.stringify({ dir }),
    });
    loadProjects();
    updateAgentData();
    showNotification("Project saved", "success");
  } catch (error) {
    showNotification(error.message || "Couldn't save the project", "error");
  }
}

async function loadAgentFiles(dir) {
  if (!els.agentFileList) return;
  els.agentFileList.innerHTML = `<p class="muted-note project-empty">Loading files…</p>`;
  state.agentFileDir = dir;
  els.agentFilesUp.hidden = !state.agentFileStack.length;
  try {
    const data = await api(`/api/agent/files?dir=${encodeURIComponent(dir || "")}`);
    renderAgentFiles(data.entries || []);
  } catch (error) {
    els.agentFileList.innerHTML = `<p class="muted-note project-empty">${escapeHtml(error.message || "Couldn't list files.")}</p>`;
  }
}

function renderAgentFiles(entries) {
  if (!els.agentFileList) return;
  if (!Array.isArray(entries) || !entries.length) {
    els.agentFileList.innerHTML = `<p class="muted-note project-empty">Empty folder.</p>`;
    return;
  }
  const rows = entries.map((entry) => {
    const isDir = entry.type === "dir";
    const name = entry.name;
    return `
      <button class="agent-file-row ${isDir ? "is-dir" : ""}" type="button" data-file-name="${escapeHtml(name)}">
        ${icon(isDir ? "folder-closed" : "file", "", 14)}
        <span class="agent-file-name">${escapeHtml(name)}</span>
        <span class="agent-file-meta">${isDir ? "" : formatFileSize(entry.size)}</span>
      </button>`;
  }).join("");
  els.agentFileList.innerHTML = rows;

  els.agentFileList.querySelectorAll(".agent-file-row.is-dir").forEach((row) => {
    row.addEventListener("click", () => {
      const name = row.dataset.fileName;
      const next = state.agentFileDir ? `${state.agentFileDir.replace(/\/+$/, "")}/${name}` : name;
      state.agentFileStack.push(state.agentFileDir || "");
      loadAgentFiles(next);
    });
  });
}

function goUpAgentFiles() {
  if (!state.agentFileStack.length) return;
  const parent = state.agentFileStack.pop();
  loadAgentFiles(parent);
}

async function updateAgentData() {
  if (!els.agentDataSummary) return;
  els.agentDataSummary.innerHTML = `<span>Loading…</span>`;
  try {
    const [projects, files] = await Promise.all([
      api("/api/agent/projects"),
      api(`/api/agent/files?dir=${encodeURIComponent(getAgentRoot())}&flat=1`),
    ]);
    const projectCount = (projects.projects || []).length;
    const fileCount = (files.files || []).length;
    const totalSize = files.totalSize || 0;
    els.agentDataSummary.innerHTML = `
      <span class="agent-data-row"><span>Projects</span><b>${projectCount}</b></span>
      <span class="agent-data-row"><span>Files</span><b>${fileCount}</b></span>
      <span class="agent-data-row"><span>Size</span><b>${formatFileSize(totalSize)}</b></span>
    `;
  } catch {
    els.agentDataSummary.innerHTML = `<span>Agent data unavailable.</span>`;
  }
}

function newWorkspaceFile() {
  els.workspaceFileName.value = "";
  els.workspaceFileContent.value = "";
  els.workspaceEditor.hidden = false;
  els.workspaceSaveButton.textContent = "Save";
  els.workspaceFileName.focus();
}

async function viewWorkspaceFile(filePath) {
  try {
    const data = await api(`/api/workspace/file?path=${encodeURIComponent(filePath)}`);
    els.workspaceFileName.value = data.path || filePath;
    els.workspaceFileContent.value = data.truncated ? `${data.content}\n\n… (file truncated at 200 KB)` : data.content;
    els.workspaceEditor.hidden = false;
    els.workspaceSaveButton.textContent = "Save";
  } catch (error) {
    els.workspaceFileList.innerHTML = `<p class="muted-note">${escapeHtml(error.message || "Couldn't open the file.")}</p>`;
  }
}

async function saveWorkspaceFile() {
  const filePath = els.workspaceFileName.value.trim();
  const content = els.workspaceFileContent.value;
  if (!filePath) {
    els.workspaceFileName.focus();
    return;
  }
  try {
    await api("/api/workspace/write", {
      method: "POST",
      body: JSON.stringify({ path: filePath, content }),
    });
    els.workspaceEditor.hidden = true;
    refreshWorkspace();
  } catch (error) {
    els.workspaceFileList.innerHTML = `<p class="muted-note">${escapeHtml(error.message || "Couldn't save the file.")}</p>`;
  }
}

async function deleteWorkspaceFile(filePath) {
  if (!confirm(`Delete "${filePath}" from the workspace?`)) return;
  try {
    await api(`/api/workspace/file?path=${encodeURIComponent(filePath)}`, { method: "DELETE" });
    els.workspaceEditor.hidden = true;
    refreshWorkspace();
  } catch (error) {
    els.workspaceFileList.innerHTML = `<p class="muted-note">${escapeHtml(error.message || "Couldn't delete the file.")}</p>`;
  }
}

function closeWorkspaceEditor() {
  els.workspaceEditor.hidden = true;
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return "--";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = value;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n >= 100 ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
}

function formatCount(value) {
  if (!Number.isFinite(value) || value <= 0) return "--";
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1)}K`;
  }
  return `${value}`;
}

let hfSort = "downloads";
let hfSearchSeq = 0;

function sortHfResults(results) {
  const sorted = [...results];
  if (hfSort === "downloads") sorted.sort((a, b) => b.downloads - a.downloads);
  else if (hfSort === "likes") sorted.sort((a, b) => b.likes - a.likes);
  else if (hfSort === "name") sorted.sort((a, b) => a.id.localeCompare(b.id));
  return sorted;
}

async function searchHuggingFace(query) {
  const seq = ++hfSearchSeq;
  console.log('[Frontend] searchHuggingFace called with query:', JSON.stringify(query));
  els.hfResults.innerHTML = query.trim()
    ? '<p class="muted-note">Searching HuggingFace…</p>'
    : '<p class="muted-note">Loading popular models…</p>';
  try {
    const data = await api(`/api/hf/search?q=${encodeURIComponent(query)}`);
    console.log('[Frontend] Received response:', data);
    if (seq !== hfSearchSeq) return;
    state.lastHfResults = data.results || [];
    renderHfResults(sortHfResults(state.lastHfResults));
  } catch (error) {
    console.error('[Frontend] Search failed:', error);
    if (seq !== hfSearchSeq) return;
    els.hfResults.innerHTML = `<p class="muted-note">${escapeHtml(error.message)}</p>`;
  }
}

function renderHfResults(results) {
  if (!results.length) {
    els.hfResults.innerHTML = '<p class="muted-note">No GGUF models found. Try another search.</p>';
    return;
  }
  els.hfResults.innerHTML = results.map((repo) => {
    const slash = repo.id.indexOf("/");
    const org = slash > 0 ? repo.id.slice(0, slash) : "";
    const name = slash > 0 ? repo.id.slice(slash + 1) : repo.id;
    return `
    <button class="hf-repo" type="button" data-repo="${escapeHtml(repo.id)}" aria-label="Show files for ${escapeHtml(repo.id)}">
      <div class="hf-repo-info">
        <span class="hf-repo-id">${org ? `<span class="hf-repo-org">${escapeHtml(org)}</span>/<span class="hf-repo-name">${escapeHtml(name)}</span>` : escapeHtml(repo.id)}</span>
      </div>
      <span class="hf-repo-meta">${formatCount(repo.downloads)} downloads${repo.gated ? " · gated" : ""}</span>
    </button>
  `;
  }).join("");
  els.hfResults.querySelectorAll("[data-repo]").forEach((button) => {
    button.addEventListener("click", () => {
      const repo = button.dataset.repo;
      showHfDetail(repo);
    });
  });
}

function showHfDetail(repo) {
  // Hide list, show detail view
  els.hfResults.hidden = true;
  els.hfDetail.hidden = false;
  els.hfBackButton.hidden = false;
  els.hfSearchInput.parentElement.parentElement.hidden = true;
  
  // Load model details
  loadHfFiles(repo);
}

function showHfList() {
  // Show list, hide detail view
  els.hfResults.hidden = false;
  els.hfDetail.hidden = true;
  els.hfBackButton.hidden = true;
  els.hfSearchInput.parentElement.parentElement.hidden = false;
}

async function loadHfFiles(repo) {
  els.hfDetail.innerHTML = '<div class="install-detail-loading"><p>Loading model details...</p></div>';
  try {
    const data = await api(`/api/hf/repo?repo=${encodeURIComponent(repo)}`);
    renderHfFiles(repo, data.files || []);
  } catch (error) {
    els.hfDetail.innerHTML = `<div class="install-detail-error"><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function renderHfFiles(repo, files) {
  if (!files.length) {
    els.hfDetail.innerHTML = '<p class="muted-note" style="padding: 20px; text-align: center;">No GGUF files found in this repo.</p>';
    return;
  }
  
  // Find the model info from the results
  const modelInfo = state.lastHfResults?.find(m => m.id === repo);
  const downloads = modelInfo?.downloads || 0;
  const likes = modelInfo?.likes || 0;
  const gated = modelInfo?.gated || false;
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

  els.hfDetail.innerHTML = `
    <div class="hf-detail-header">
      <h3>${escapeHtml(repo)}</h3>
      <div class="hf-detail-stats">
        <span><strong>${formatCount(downloads)}</strong> downloads</span>
        <span>·</span>
        <span><strong>${formatCount(likes)}</strong> likes</span>
        ${gated ? '<span>·</span><span class="hf-gated-badge">Gated</span>' : ''}
      </div>
    </div>
    <div class="hf-detail-body">
      <p class="hf-detail-label">${files.length} quantization${files.length === 1 ? "" : "s"} · ${formatBytes(totalSize)} total</p>
      <div class="hf-files">
        ${files.map((file) => `
          <div class="hf-file" data-file="${escapeHtml(file.filename)}">
            <div class="hf-file-info">
              <span class="hf-file-quant">${escapeHtml(file.quant)}</span>
              <span class="hf-file-name">${escapeHtml(file.filename)}</span>
              <span class="hf-file-size">${formatBytes(file.size)}</span>
            </div>
            <button class="hf-install-btn" type="button">Install</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  
  els.hfDetail.querySelectorAll(".hf-install-btn").forEach((button) => {
    button.addEventListener("click", () => installHfModel(repo, button.closest(".hf-file").dataset.file, button));
  });
}

function resetHfInstallButtons() {
  els.hfDetail.querySelectorAll(".hf-install-btn").forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("is-installing");
    btn.textContent = "Install";
  });
}

function resetHfInstaller() {
  resetHfInstallButtons();
  els.hfProgress.classList.remove("is-error", "is-done");
  els.hfProgress.innerHTML = "";
  els.hfProgress.hidden = true;
}

function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function installHfModel(repo, file, button) {
  const row = button.closest(".hf-file");
  const quant = (row?.querySelector(".hf-file-quant")?.textContent || "").trim() || "default";
  const modelName = `${repo}:${quant}`;
  const hfCtx = { speed: 0, lastBytes: 0, lastAt: Date.now() };

  els.hfDetail.querySelectorAll(".hf-install-btn").forEach((btn) => { btn.disabled = true; });
  button.classList.add("is-installing");
  button.textContent = "Installing…";

  els.hfProgress.classList.remove("is-error", "is-done");
  els.hfProgress.hidden = false;
  els.hfProgress.innerHTML = `
    <div class="hf-progress-head">
      <span class="hf-progress-title">Installing <strong>${escapeHtml(modelName)}</strong></span>
      <span class="hf-progress-pct">0%</span>
    </div>
    <div class="hf-track"><div class="hf-bar"></div></div>
    <div class="hf-progress-status">Starting…</div>
  `;

  fetch("/api/hf/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo, file }),
  }).then(async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const raw of events) {
        const line = raw.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        let event;
        try {
          event = JSON.parse(line.slice(6));
        } catch {
          continue;
        }
        if (event.type === "progress") {
          const now = Date.now();
          const dt = Math.max(1, now - hfCtx.lastAt);
          const db = event.downloaded - hfCtx.lastBytes;
          if (db >= 0 && dt > 0) {
            const instant = (db / dt) * 1000;
            hfCtx.speed = hfCtx.speed ? hfCtx.speed * 0.6 + instant * 0.4 : instant;
          }
          hfCtx.lastBytes = event.downloaded;
          hfCtx.lastAt = now;
        }
        updateHfProgress(event, hfCtx);
      }
    }
  }).catch((error) => {
    updateHfProgress({ type: "error", error: error.message }, hfCtx);
  });
}

function updateHfProgress(event, ctx = {}) {
  const box = els.hfProgress;
  const statusEl = box.querySelector(".hf-progress-status");
  const barEl = box.querySelector(".hf-bar");
  const pctEl = box.querySelector(".hf-progress-pct");
  if (!statusEl || !barEl || !pctEl) return;

  if (event.type === "progress" && event.total > 0) {
    const p = Math.min(100, Math.round((event.downloaded / event.total) * 100));
    barEl.style.width = `${p}%`;
    pctEl.textContent = `${p}%`;
    let msg = `Downloading ${formatBytes(event.downloaded)} of ${formatBytes(event.total)}`;
    if (ctx.speed > 0) msg += ` · ${formatBytes(ctx.speed)}/s`;
    const remaining = Math.max(0, event.total - event.downloaded);
    const eta = ctx.speed > 0 ? remaining / ctx.speed : 0;
    if (eta > 0) msg += ` · ${formatEta(eta)} left`;
    statusEl.textContent = msg;
  } else if (event.type === "status") {
    statusEl.textContent = event.message;
  } else if (event.type === "error") {
    box.classList.add("is-error");
    barEl.style.width = "0%";
    pctEl.textContent = "Failed";
    statusEl.textContent = event.error;
    resetHfInstallButtons();
  } else if (event.type === "done") {
    box.classList.add("is-done");
    barEl.style.width = "100%";
    pctEl.textContent = "Done";
    statusEl.textContent = `Installed ${event.model}. You can now select it from the model picker.`;
    let doneBtn = box.querySelector(".hf-done-btn");
    if (!doneBtn) {
      doneBtn = document.createElement("button");
      doneBtn.className = "hf-done-btn";
      doneBtn.type = "button";
      doneBtn.textContent = "Done";
      doneBtn.addEventListener("click", () => {
        closeModals();
        resetHfInstaller();
      });
      box.appendChild(doneBtn);
    }
    resetHfInstallButtons();
    refreshModelsAfterInstall(event.model);
  }
}

async function refreshModelsAfterInstall(model) {
  await loadProvidersAndModels();
  state.currentProvider = "ollama";
  state.currentModel = model;
  syncSettingsSelects();
  updateModelLabel();
}

function bindHuggingFace() {
  els.hfInstallButton.addEventListener("click", () => {
    closeModals();
    showHfList();
    resetHfInstaller();
    els.hfSearchInput.value = "";
    openModal(els.installModal);
    searchHuggingFace("");
  });
  els.hfBackButton.addEventListener("click", () => {
    showHfList();
  });
  els.hfSearchInput.addEventListener("input", debounce(() => {
    searchHuggingFace(els.hfSearchInput.value.trim());
  }, 300));
  els.hfSortSelect.addEventListener("change", () => {
    hfSort = els.hfSortSelect.value;
    renderHfResults(sortHfResults(state.lastHfResults || []));
  });
}

// ─── Ollama model browser ─────────────────────────────────────────────────

const ollamaTagNames = {
  general: "General",
  reasoning: "Reasoning",
  coding: "Coding",
  vision: "Vision",
  "image-gen": "Image generation",
  embedding: "Embeddings",
  small: "Small",
  large: "Large",
  experimental: "Experimental",
};

let ollamaInstalled = new Set();

async function openOllamaBrowser() {
  closeModals();
  resetOllamaInstaller();
  els.ollamaSearchInput.value = "";
  openModal(els.ollamaModal);
  await loadOllamaCatalog("");
}

function resetOllamaInstaller() {
  els.ollamaProgress.classList.remove("is-error", "is-done");
  els.ollamaProgress.innerHTML = "";
  els.ollamaProgress.hidden = true;
  els.ollamaResults.querySelectorAll(".hf-install-btn").forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("is-installing");
    btn.textContent = "Download";
  });
}

async function loadOllamaCatalog(query) {
  els.ollamaResults.innerHTML = '<p class="muted-note">Loading models…</p>';
  try {
    const [lib, tags] = await Promise.all([
      api(`/api/ollama/library?q=${encodeURIComponent(query)}`),
      api("/api/ollama/tags"),
    ]);
    ollamaInstalled = new Set(tags.names || []);
    renderOllamaCatalog(lib.results || [], query);
  } catch (error) {
    els.ollamaResults.innerHTML = `<p class="muted-note">${escapeHtml(error.message)}</p>`;
  }
}

function ollamaTagsLabel(tags) {
  return (tags || [])
    .map((t) => ollamaTagNames[t] || t)
    .filter(Boolean)
    .join(" · ");
}

function renderOllamaCatalog(models, query) {
  const q = (query || "").trim();
  const matches = q && models.some((m) => m.id.toLowerCase() === q.toLowerCase());
  const custom = q && !matches ? q : null;

  if (!models.length && !custom) {
    els.ollamaResults.innerHTML =
      '<p class="muted-note">No models match. Type any model name (e.g. <code>qwen2.5-coder:32b</code>) and press Enter to pull it from the Ollama registry.</p>';
    return;
  }

  const rows = custom
    ? [...models, { id: custom, name: custom, tags: [], size: "", desc: `Pull "${custom}" directly from the Ollama library.`, custom: true }]
    : models;

  els.ollamaResults.innerHTML = rows.map((m) => {
    const installed = ollamaInstalled.has(m.id);
    const side = m.custom
      ? `<button class="hf-install-btn" type="button">Download</button>`
      : `
        <span class="hf-repo-meta">${escapeHtml(ollamaTagsLabel(m.tags))}${m.size ? ` · ${escapeHtml(m.size)}` : ""}</span>
        <button class="hf-install-btn ${installed ? "is-installed" : ""}" type="button" ${installed ? "disabled" : ""}>${installed ? "Installed" : "Download"}</button>`;
    return `
    <div class="ollama-repo" data-model="${escapeHtml(m.id)}">
      <div class="hf-repo-info">
        <span class="hf-repo-id"><span class="hf-repo-name">${escapeHtml(m.name)}</span> <span class="hf-repo-org">${escapeHtml(m.id)}</span></span>
        <span class="hf-repo-desc">${escapeHtml(m.desc || "")}</span>
      </div>
      <div class="ollama-repo-side">${side}</div>
    </div>`;
  }).join("");

  els.ollamaResults.querySelectorAll(".ollama-repo").forEach((row) => {
    const btn = row.querySelector(".hf-install-btn");
    if (!btn) return;
    btn.addEventListener("click", () => pullOllamaModel(row.dataset.model, btn));
  });
}

function pullOllamaModel(model, button) {
  els.ollamaResults.querySelectorAll(".hf-install-btn").forEach((b) => { if (!b.disabled) b.disabled = true; });
  button.classList.add("is-installing");
  button.textContent = "Downloading…";

  els.ollamaProgress.classList.remove("is-error", "is-done");
  els.ollamaProgress.hidden = false;
  els.ollamaProgress.innerHTML = `
    <div class="hf-progress-head">
      <span class="hf-progress-title">Downloading <strong>${escapeHtml(model)}</strong></span>
      <span class="hf-progress-pct">0%</span>
    </div>
    <div class="hf-track"><div class="hf-bar"></div></div>
    <div class="hf-progress-status">Starting…</div>
  `;

  fetch("/api/ollama/pull", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  }).then(async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const raw of events) {
        const line = raw.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        let event;
        try {
          event = JSON.parse(line.slice(6));
        } catch {
          continue;
        }
        updateOllamaProgress(event, model, button);
      }
    }
  }).catch((error) => {
    updateOllamaProgress({ type: "error", error: error.message }, model, button);
  });
}

function updateOllamaProgress(event, model, button) {
  const box = els.ollamaProgress;
  const statusEl = box.querySelector(".hf-progress-status");
  const barEl = box.querySelector(".hf-bar");
  const pctEl = box.querySelector(".hf-progress-pct");
  if (!statusEl || !barEl || !pctEl) return;

  if (event.type === "status" && event.total > 0 && event.completed > 0) {
    const p = Math.min(100, Math.round((event.completed / event.total) * 100));
    barEl.style.width = `${p}%`;
    pctEl.textContent = `${p}%`;
    statusEl.textContent = `${event.status}: ${formatBytes(event.completed)} of ${formatBytes(event.total)}`;
  } else if (event.type === "status") {
    statusEl.textContent = event.status;
  } else if (event.type === "error") {
    box.classList.add("is-error");
    barEl.style.width = "0%";
    pctEl.textContent = "Failed";
    statusEl.textContent = event.error;
    button.disabled = false;
    button.classList.remove("is-installing");
    button.textContent = "Retry";
  } else if (event.type === "done") {
    box.classList.add("is-done");
    barEl.style.width = "100%";
    pctEl.textContent = "Done";
    statusEl.textContent = `Installed ${event.model}. You can now select it from the model picker.`;
    let doneBtn = box.querySelector(".hf-done-btn");
    if (!doneBtn) {
      doneBtn = document.createElement("button");
      doneBtn.className = "hf-done-btn";
      doneBtn.type = "button";
      doneBtn.textContent = "Done";
      doneBtn.addEventListener("click", () => {
        closeModals();
        resetOllamaInstaller();
      });
      box.appendChild(doneBtn);
    }
    button.textContent = "Installed";
    button.classList.remove("is-installing");
    button.disabled = true;
    ollamaInstalled.add(event.model);
    refreshModelsAfterInstall(event.model);
  }
}

function bindOllamaBrowser() {
  els.downloadModelsButton.addEventListener("click", openOllamaBrowser);
  els.ollamaSearchInput.addEventListener("input", debounce(() => {
    loadOllamaCatalog(els.ollamaSearchInput.value.trim());
  }, 300));
  els.ollamaSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loadOllamaCatalog(els.ollamaSearchInput.value.trim());
    }
  });
}

async function uninstallApp() {
  openModal(els.uninstallModal);
}

async function doUninstall() {
  els.uninstallButton.disabled = true;
  els.uninstallButton.textContent = "Uninstalling…";
  try {
    const res = await fetch("/api/uninstall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Uninstall failed (${res.status})`);
    showNotification("Uninstalling… closing app", "info", 10000);
  } catch (error) {
    els.uninstallButton.disabled = false;
    els.uninstallButton.textContent = "Uninstall Vanilla…";
    showNotification(error.action || error.message || "Failed to uninstall", "error");
  }
}

// ─── App updates ────────────────────────────────────────────────────────────

const updateState = {
  status: null,
  checkedAt: 0,
  _dismissed: false,
  _pollTimer: null,
};

function formatUpdateVersion(status) {
  if (status && status.updateInfo && status.updateInfo.version) {
    return `v${status.updateInfo.version}`;
  }
  return "";
}

function refreshUpdateUI(status) {
  updateState.status = status;
  const line = els.updateStatusLine;
  const sub = els.updateStatusSub;
  const checkBtn = els.updateCheckButton;
  const installBtn = els.updateInstallButton;
  const banner = els.updateBanner;
  const bannerText = els.updateBannerText;
  const bannerAction = els.updateBannerAction;

  if (!status) return;

  if (els.updateStatusLine.parentElement.hidden === false) {
    const current = status.currentVersion ? `v${status.currentVersion}` : "";
    line.dataset.state = "";
    if (status.supported === false) {
      line.textContent = "Updates are not available in this build.";
      sub.textContent = status.reason || "";
      sub.hidden = false;
      checkBtn.disabled = true;
      installBtn.hidden = true;
    } else if (status.status === "checking") {
      line.textContent = "Checking for updates…";
      sub.hidden = true;
      checkBtn.disabled = true;
      installBtn.hidden = true;
    } else if (status.status === "available") {
      line.dataset.state = "available";
      line.textContent = `Update available: ${formatUpdateVersion(status)} (you're on ${current})`;
      sub.textContent = status.updateInfo?.releaseDate ? `Released ${new Date(status.updateInfo.releaseDate).toLocaleDateString()}` : "";
      sub.hidden = false;
      checkBtn.disabled = false;
      installBtn.hidden = false;
      installBtn.textContent = "Download & restart";
    } else if (status.status === "downloading") {
      const pct = status.progress && Number.isFinite(status.progress.percent) ? status.progress.percent : 0;
      line.textContent = `Downloading update ${formatUpdateVersion(status)}… ${Math.round(pct)}%`;
      sub.hidden = true;
      checkBtn.disabled = true;
      installBtn.hidden = true;
    } else if (status.status === "downloaded") {
      line.dataset.state = "downloaded";
      line.textContent = `Update ${formatUpdateVersion(status)} downloaded. Restart to apply.`;
      sub.hidden = true;
      checkBtn.disabled = true;
      installBtn.hidden = false;
      installBtn.textContent = "Restart now";
    } else if (status.status === "not-available") {
      line.textContent = `You're on the latest version${current ? ` (${current})` : ""}.`;
      sub.hidden = true;
      checkBtn.disabled = false;
      installBtn.hidden = true;
    } else if (status.status === "error") {
      line.dataset.state = "error";
      line.textContent = "Update check failed.";
      sub.textContent = status.error || "";
      sub.hidden = false;
      checkBtn.disabled = false;
      installBtn.hidden = true;
    } else {
      line.textContent = "Checking for updates…";
      sub.hidden = true;
      checkBtn.disabled = false;
      installBtn.hidden = true;
    }
  }

  // Banner (dismissible, once per session)
  if (!banner || updateState._dismissed) return;
  if (status.supported === false) {
    banner.hidden = true;
    return;
  }
  if (status.status === "available") {
    banner.hidden = false;
    bannerText.textContent = `A new version of Vanilla is available: ${formatUpdateVersion(status)}`;
    bannerAction.textContent = "Download";
    bannerAction.onclick = () => triggerUpdateDownload();
  } else if (status.status === "downloaded") {
    banner.hidden = false;
    bannerText.textContent = `Update ${formatUpdateVersion(status)} is ready. Restart to apply.`;
    bannerAction.textContent = "Restart now";
    bannerAction.onclick = () => triggerUpdateInstall();
  } else if (status.status === "downloading") {
    banner.hidden = false;
    const pct = status.progress && Number.isFinite(status.progress.percent) ? status.progress.percent : 0;
    bannerText.textContent = `Downloading update… ${Math.round(pct)}%`;
    bannerAction.textContent = "";
    bannerAction.disabled = true;
  } else {
    banner.hidden = true;
  }
}

async function loadUpdateStatus(forceCheck = false) {
  try {
    if (forceCheck) {
      const res = await api("/api/update/check", { method: "POST", timeoutMs: 45000 });
      if (res && res.status === "downloading") {
        startUpdatePolling();
      }
      updateState.checkedAt = Date.now();
      refreshUpdateUI(res || null);
      return;
    }
    const status = await api("/api/update/status");
    updateState.checkedAt = Date.now();
    refreshUpdateUI(status || null);
    if (status && status.status === "downloading") {
      startUpdatePolling();
    }
  } catch (error) {
    // Update checking is a nicety, never break the app over it.
    refreshUpdateUI({ supported: false, reason: error.message || "Could not reach the update service.", status: "error" });
  }
}

async function triggerUpdateCheck() {
  els.updateCheckButton.disabled = true;
  els.updateCheckButton.textContent = "Checking…";
  try {
    await loadUpdateStatus(true);
  } finally {
    els.updateCheckButton.disabled = false;
    els.updateCheckButton.textContent = "Check for updates";
  }
}

async function triggerUpdateDownload() {
  els.updateInstallButton.disabled = true;
  els.updateBannerAction.disabled = true;
  try {
    const res = await api("/api/update/download", { method: "POST", timeoutMs: 45000 });
    refreshUpdateUI(res || null);
    startUpdatePolling();
  } catch (error) {
    showNotification(error.message || "Failed to start update download", "error");
  } finally {
    els.updateInstallButton.disabled = false;
    els.updateBannerAction.disabled = false;
  }
}

async function triggerUpdateInstall() {
  try {
    const res = await api("/api/update/install", { method: "POST" });
    if (!res || !res.ok) {
      showNotification((res && res.error) || "Could not restart into the update.", "error");
    }
  } catch (error) {
    showNotification(error.message || "Could not restart into the update.", "error");
  }
}

function startUpdatePolling() {
  if (updateState._pollTimer) return;
  updateState._pollTimer = setInterval(async () => {
    try {
      const status = await api("/api/update/status");
      refreshUpdateUI(status || null);
      if (status && status.status !== "downloading") {
        clearInterval(updateState._pollTimer);
        updateState._pollTimer = null;
      }
    } catch (e) {
      clearInterval(updateState._pollTimer);
      updateState._pollTimer = null;
    }
  }, 2500);
}

function initUpdater() {
  if (!els.updateStatusLine && !els.updateBanner) return;
  setTimeout(() => loadUpdateStatus(), 3000);
  setInterval(() => {
    const now = Date.now();
    if (now - updateState.checkedAt > 15 * 60 * 1000) {
      loadUpdateStatus();
    }
  }, 60 * 1000);
}

function bindUpdateEvents() {
  if (els.updateCheckButton) {
    els.updateCheckButton.addEventListener("click", triggerUpdateCheck);
  }
  if (els.updateInstallButton) {
    els.updateInstallButton.addEventListener("click", () => {
      if (updateState.status && updateState.status.status === "downloaded") {
        triggerUpdateInstall();
      } else {
        triggerUpdateDownload();
      }
    });
  }
}

function bindEvents() {
  const toggleSidebar = () => {
    Sounds.toggle();
    const next = els.shell.dataset.sidebar === "open" ? "closed" : "open";
    state.settings.sidebar = next;
    applySettings();
    const label = next === "open" ? "Collapse sidebar" : "Expand sidebar";
    document.querySelectorAll(".sidebar-toggle, .main-sidebar-toggle").forEach((button) => button.setAttribute("aria-label", label));
  };
  document.querySelectorAll(".sidebar-toggle, .main-sidebar-toggle").forEach((button) => button.addEventListener("click", toggleSidebar));
  document.querySelectorAll('[data-action="toggle-agent-sidebar"]').forEach((button) => button.addEventListener("click", toggleSidebar));
  document.querySelectorAll('[data-action="settings"]').forEach((button) => {
    button.addEventListener("click", () => openModal(els.settingsModal));
  });
  document.querySelectorAll('[data-action="new-chat"]').forEach((button) => {
    button.addEventListener("click", newChat);
  });
  document.querySelectorAll('[data-action="search"]').forEach((button) => {
    button.addEventListener("click", () => openModal(els.searchModal));
  });
  document.querySelectorAll('[data-action="workspace"]').forEach((button) => {
    button.addEventListener("click", openWorkspace);
  });
  els.workspaceNewButton.addEventListener("click", newWorkspaceFile);
  els.workspaceRefreshButton.addEventListener("click", refreshWorkspace);
  els.workspaceOpenButton.addEventListener("click", openWorkspaceFolder);
  els.workspaceSaveButton.addEventListener("click", saveWorkspaceFile);
  els.workspaceEditorClose.addEventListener("click", closeWorkspaceEditor);
  document.querySelectorAll(".toggle-input").forEach((input) => {
    input.addEventListener("change", () => Sounds.toggle());
  });
  els.settingsButton.addEventListener("click", () => {
    openModal(els.settingsModal);
    loadUpdateStatus();
  });
  els.exportChatButton.addEventListener("click", openExportModal);
  els.exportDownloadButton.addEventListener("click", exportConversation);
  els.exportCopyButton.addEventListener("click", copyExport);
  document.querySelector('[data-tool="compare"]')?.addEventListener("click", openCompareModal);
  els.compareRunButton.addEventListener("click", runCompare);
  els.compareStopButton.addEventListener("click", stopCompare);
  document.querySelector('[data-tool="prompt"]')?.addEventListener("click", openPromptModal);
  document.querySelector('[data-tool="search"]')?.addEventListener("click", () => {
    state.settings.webSearch = !state.settings.webSearch;
    applySettings();
  });
  document.querySelector('[data-tool="tools"]')?.addEventListener("click", () => {
    state.settings.workspaceTools = !state.settings.workspaceTools;
    applySettings();
  });

  // Chat / Agent mode tabs
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      Sounds.tabSwitch();
      if (state.runningConversationId) stopStream();
      setMode(tab.dataset.mode);
    });
  });
  if (els.agentDirBrowse) {
    els.agentDirBrowse.addEventListener("click", pickAgentDir);
  }
  document.querySelectorAll("[data-browse-agent-dir]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      pickAgentDir();
    });
  });
  if (els.agentFolderGoButton) {
    els.agentFolderGoButton.addEventListener("click", () => listAgentFolders(els.agentFolderPath.value.trim()));
  }
  if (els.agentFolderPath) {
    els.agentFolderPath.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        listAgentFolders(els.agentFolderPath.value.trim());
      }
    });
  }
  if (els.agentFolderUp) {
    els.agentFolderUp.addEventListener("click", () => {
      const parent = dirParent(state.agentPickDir);
      if (parent) listAgentFolders(parent);
    });
  }
  if (els.agentFolderNative) els.agentFolderNative.addEventListener("click", pickAgentDir);
  if (els.agentFolderRefresh) {
    els.agentFolderRefresh.addEventListener("click", () => listAgentFolders(state.agentPickDir));
  }
  if (els.agentFolderSelect) {
    els.agentFolderSelect.addEventListener("click", () => {
      const dir = (els.agentFolderPath.value || "").trim();
      els.agentFolderModal.hidden = true;
      if (dir && dir !== state.settings.agentDir) {
        setAgentDir(dir);
        showNotification("Agent working directory set", "success");
      }
    });
  }
  if (els.agentDirInput) {
    els.agentDirInput.addEventListener("change", () => {
      state.settings.agentDir = els.agentDirInput.value.trim();
      applySettings();
    });
  }
  if (els.agentProjectAdd) els.agentProjectAdd.addEventListener("click", saveCurrentProject);
  if (els.agentNewSession) els.agentNewSession.addEventListener("click", newChat);
  if (els.agentFilesUp) els.agentFilesUp.addEventListener("click", goUpAgentFiles);
  if (els.agentFilesRefresh) {
    els.agentFilesRefresh.addEventListener("click", () => loadAgentFiles(state.agentFileDir || getAgentRoot()));
  }
  if (els.agentModeToggle) {
    els.agentModeToggle.addEventListener("change", () => {
      state.settings.agentMode = els.agentModeToggle.checked;
      applySettings();
      setMode(state.mode);
      if (els.agentModeToggle.checked) {
        refreshAgentSidebar();
        showNotification("Agent mode enabled", "success");
      } else {
        state.agentFileStack = [];
        showNotification("Agent mode disabled", "info");
      }
    });
  }
  els.conversationPromptSave.addEventListener("click", saveConversationPrompt);
  els.conversationPromptClear.addEventListener("click", clearConversationPrompt);
  els.uninstallButton.addEventListener("click", uninstallApp);
  els.uninstallConfirmButton.addEventListener("click", doUninstall);
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModals));
  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModals();
    });
  });

  els.modelButton.addEventListener("click", () => {
    const open = els.modelPicker.dataset.open !== "true";
    els.modelPicker.dataset.open = open ? "true" : "false";
    els.modelButton.setAttribute("aria-expanded", String(open));
    if (open) els.modelSearch.focus();
  });
  els.modelSearch.addEventListener("input", renderModelOptions);
  document.addEventListener("click", (event) => {
    if (!els.modelPicker.contains(event.target)) {
      els.modelPicker.dataset.open = "false";
      els.modelButton.setAttribute("aria-expanded", "false");
    }
  });

  bindSettingsDropdowns();

  els.promptInput.addEventListener("input", resizePrompt);
  els.promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && state.settings.enterToSend) {
      Sounds.keyReturn();
      event.preventDefault();
      submitPrompt(event);
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Backspace" || event.key === "Delete") Sounds.key();
    else if (event.key === " ") Sounds.keySpace();
    else if (event.key.length === 1) Sounds.key();
  });
  els.composer.addEventListener("submit", submitPrompt);
  els.searchInput.addEventListener("input", debounce(runSearch, 160));

  // Scroll lock behavior: unlock when user scrolls up, relock when scrolling to bottom
  els.messages.addEventListener("scroll", () => {
    const container = els.messages;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // If user is within 100px of the bottom, lock scrolling
    if (distanceFromBottom < 100) {
      state.scrollLocked = true;
    } else {
      // User has scrolled up, unlock auto-scroll
      state.scrollLocked = false;
    }
  });

  els.sidebarOpenToggle.addEventListener("change", () => {
    state.settings.sidebar = els.sidebarOpenToggle.checked ? "open" : "closed";
    applySettings();
  });
  els.reduceMotionToggle.addEventListener("change", () => {
    state.settings.reduceMotion = els.reduceMotionToggle.checked;
    applySettings();
  });
  els.enterToSendToggle.addEventListener("change", () => {
    state.settings.enterToSend = els.enterToSendToggle.checked;
    applySettings();
  });
  if (els.webSearchToggle) {
    els.webSearchToggle.addEventListener("change", () => {
      state.settings.webSearch = els.webSearchToggle.checked;
      applySettings();
    });
  }
  if (els.workspaceToolsToggle) {
    els.workspaceToolsToggle.addEventListener("change", () => {
      state.settings.workspaceTools = els.workspaceToolsToggle.checked;
      applySettings();
    });
  }
  if (els.braveApiKeyInput) {
    els.braveApiKeyInput.addEventListener("input", () => {
      state.settings.braveApiKey = els.braveApiKeyInput.value.trim();
      applySettings();
    });
  }
  els.showStatsToggle.addEventListener("change", () => {
    state.settings.showStats = els.showStatsToggle.checked;
    applySettings();
  });
  if (els.desktopNotificationsToggle) {
    els.desktopNotificationsToggle.addEventListener("change", async () => {
      state.settings.desktopNotifications = els.desktopNotificationsToggle.checked;
      if (state.settings.desktopNotifications && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission().catch(() => {});
      }
      applySettings();
    });
  }
  if (els.customIconInput) {
    els.customIconInput.addEventListener("change", () => {
      const file = els.customIconInput.files?.[0];
      if (!file) return;
      if (file.size > 2_000_000) {
        showNotification("Icon must be smaller than 2 MB", "warning");
        els.customIconInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        state.settings.customIcon = String(reader.result || "");
        applySettings();
        showNotification("App icon updated", "success");
      };
      reader.readAsDataURL(file);
    });
  }
  els.customIconReset?.addEventListener("click", () => {
    state.settings.customIcon = "";
    if (els.customIconInput) els.customIconInput.value = "";
    applySettings();
    showNotification("Default app icon restored", "success");
  });
  if (els.soundEffectsToggle) {
    els.soundEffectsToggle.addEventListener("change", () => {
      state.settings.soundEffects = els.soundEffectsToggle.checked;
      applySettings();
      Sounds.toggle();
    });
  }
  if (els.typingToggle) {
    els.typingToggle.addEventListener("change", () => {
      state.settings.typingSounds = els.typingToggle.checked;
      applySettings();
      if (state.settings.typingSounds) {
        Sounds.key(true);
        setTimeout(() => Sounds.key(), 120);
      }
    });
  }
  if (els.soundVolumeSlider) {
    els.soundVolumeSlider.addEventListener("input", () => {
      state.settings.soundVolume = Number(els.soundVolumeSlider.value) / 100;
      els.soundVolumeSlider.style.setProperty("--fill", `${Number(els.soundVolumeSlider.value)}%`);
      applySettings();
    });
    els.soundVolumeSlider.addEventListener("change", () => Sounds.click());
  }
  if (els.settingsModal) {
    els.settingsModal.addEventListener("change", (event) => {
      const input = event.target.closest?.(".toggle-input");
      if (!input) return;
      if (input.id === "soundEffectsToggle" || input.id === "typingToggle") return;
      Sounds.toggle();
    });
  }
  if (els.ambientToggle) {
    els.ambientToggle.addEventListener("change", () => {
      state.settings.ambientMusic = els.ambientToggle.checked;
      applySettings();
    });
  }
  if (els.compareToggle) {
    els.compareToggle.addEventListener("change", () => {
      state.settings.showCompare = els.compareToggle.checked;
      applySettings();
    });
  }
  if (els.lmStudioToggle) {
    els.lmStudioToggle.addEventListener("change", () => {
      state.settings.showLmStudio = els.lmStudioToggle.checked;
      applySettings();
      if (state.settings.showLmStudio) {
        showNotification("LM Studio enabled. Start the local server in LM Studio to connect.", "info", 5000);
      }
      loadProvidersAndModels();
    });
  }
  if (els.lmStudioCheckButton) {
    els.lmStudioCheckButton.addEventListener("click", checkLmStudio);
  }
  const bindCliToggle = (toggle, key, label) => {
    if (!toggle) return;
    toggle.addEventListener("change", () => {
      state.settings[key] = toggle.checked;
      applySettings();
      if (toggle.checked) {
        showNotification(`${label} enabled. Make sure it is installed and on your PATH.`, "info", 5000);
      }
      loadProvidersAndModels();
    });
  };
  bindCliToggle(els.aiderToggle, "showAider", "Aider CLI");
  bindCliToggle(els.gooseToggle, "showGoose", "Goose CLI");
  bindCliToggle(els.openCodeToggle, "showOpenCode", "OpenCode CLI");
  if (els.autoNameToggle) {
    els.autoNameToggle.addEventListener("change", () => {
      state.settings.autoName = els.autoNameToggle.checked;
      applySettings();
      if (state.settings.autoName) prewarmTitleModel();
    });
  }

  if (els.displayNameInput) {
    els.displayNameInput.addEventListener("input", () => {
      state.settings.userName = els.displayNameInput.value.trim();
      applySettings();
      chooseGreeting();
    });
  }

  if (els.customPromptInput) {
    els.customPromptInput.addEventListener("input", () => {
      state.settings.customPrompt = els.customPromptInput.value.trim();
      applySettings();
    });
  }

  const redoSetupBtn = document.querySelector("#redoSetupButton");
  if (redoSetupBtn) {
    redoSetupBtn.addEventListener("click", () => {
      closeModals();
      localStorage.removeItem("vanilla-setup-done");
      // Reset choice state in the modal so it's fresh
      const aiNext = els.setupModal?.querySelector("#setupAiNext");
      if (aiNext) { aiNext.disabled = true; delete aiNext.dataset.choice; }
      const namingNext = els.setupModal?.querySelector("#setupNamingNext");
      if (namingNext) { namingNext.disabled = true; delete namingNext.dataset.naming; }
      const dictationNext = els.setupModal?.querySelector("#setupDictationNext");
      if (dictationNext) { dictationNext.disabled = true; delete dictationNext.dataset.dictation; }
      els.setupModal?.querySelectorAll(".setup-choice").forEach((b) => b.setAttribute("aria-pressed", "false"));
      const importWrap = els.setupModal?.querySelector("#setupImportWrap");
      const importNext = els.setupModal?.querySelector("#setupImportNext");
      const importInput = els.setupModal?.querySelector("#setupImportInput");
      const importStatus = els.setupModal?.querySelector("#setupImportStatus");
      if (importWrap) importWrap.hidden = true;
      if (importNext) importNext.disabled = true;
      if (importInput) { importInput.disabled = false; importInput.value = ""; }
      if (importStatus) importStatus.textContent = "";
      const whisperStatus = els.setupModal?.querySelector("#setupWhisperStatus");
      if (whisperStatus) { whisperStatus.hidden = true; whisperStatus.textContent = ""; }
      showSetupStep("1");
      els.setupModal.hidden = false;
      requestAnimationFrame(() => els.setupModal.querySelector("#setupNameInput")?.focus());
    });
  }

  document.addEventListener("keydown", (event) => {
    const command = isMacLike() ? event.metaKey : event.ctrlKey;
    if (command && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openModal(els.searchModal);
    }
    if (command && event.shiftKey && event.key.toLowerCase() === "o") {
      event.preventDefault();
      newChat();
    }
    if (command && event.shiftKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      openWorkspace();
    }
    if (command && event.key === ",") {
      event.preventDefault();
      openModal(els.settingsModal);
    }
    if (command && !event.shiftKey && event.key.toLowerCase() === "b") {
      event.preventDefault();
      els.sidebarToggle.click();
    }
    if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
      event.preventDefault();
      els.promptInput.focus();
    }
    if (event.key === "Escape") {
      if (state.runningConversationId) stopStream();
      closeModals();
      els.modelPicker.dataset.open = "false";
    }
  });

  document.querySelector('[data-tool="attach"]').addEventListener("click", () => els.fileInput.click());
  
  // Dictation button
  if (els.dictationButton) {
    els.dictationButton.addEventListener("click", toggleDictation);
  }
  
  els.fileInput.addEventListener("change", uploadFile);
}

function runAppCommand(command) {
  const actions = {
    "new-chat": () => newChat(),
    search: () => openModal(els.searchModal),
    settings: () => { openModal(els.settingsModal); loadUpdateStatus(); },
    "toggle-sidebar": () => els.sidebarToggle.click(),
    "focus-message": () => els.promptInput.focus(),
    stop: () => state.runningConversationId ? stopStream() : closeModals(),
  };
  actions[command]?.();
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadFile(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file || state.uploading) return;

  const ext = file.name.split(".").pop()?.toLowerCase();
  const isImage = /^(jpg|jpeg|png|gif|webp|avif)$/.test(ext);

  // Show attachment preview with thumbnail
  state.pendingAttachment = {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    isImage,
  };

  if (isImage) {
    const reader = new FileReader();
    reader.onload = (e) => {
      state.pendingAttachment.dataUrl = e.target.result;
      renderAttachmentPreview();
    };
    reader.readAsDataURL(file);
  } else {
    renderAttachmentPreview();
  }
}

function renderAttachmentPreview() {
  if (!state.pendingAttachment) {
    els.attachmentPreview.hidden = true;
    return;
  }

  const { name, size, isImage, dataUrl } = state.pendingAttachment;
  const ext = name.split(".").pop()?.toLowerCase() || "FILE";

  els.attachmentPreview.hidden = false;
  els.attachmentPreview.innerHTML = `
    <div class="attachment-item">
      ${
        isImage && dataUrl
          ? `<div class="attachment-thumb"><img src="${dataUrl}" alt="${escapeHtml(name)}"></div>`
          : `<div class="attachment-thumb attachment-thumb-icon">${escapeHtml(ext.toUpperCase())}</div>`
      }
      <div class="attachment-info">
        <div class="attachment-name">${escapeHtml(name)}</div>
        <div class="attachment-size">${formatFileSize(size)}</div>
      </div>
      <button type="button" class="attachment-remove" aria-label="Remove attachment" title="Remove attachment">
        ${icon("x", "", 15)}
      </button>
    </div>
  `;

  els.attachmentPreview.querySelector(".attachment-remove").addEventListener("click", clearAttachment);
}

function clearAttachment() {
  Sounds.attachmentRemove();
  state.pendingAttachment = null;
  renderAttachmentPreview();
  resizePrompt();
}

function createUploadProgress() {
  const el = document.createElement("div");
  el.className = "upload-progress";
  el.innerHTML = '<div class="upload-track"><div class="upload-fill"></div></div><span class="upload-label">Preparing...</span>';
  els.messages.append(el);
  els.emptyState.hidden = true;
  scrollToBottom();
  return el;
}

function addUploadedMessage(content) {
  const wrap = document.createElement("article");
  wrap.className = "message user-message";
  wrap.dataset.messageId = crypto.randomUUID();
  wrap.innerHTML = `<div class="user-bubble"><div class="message-content">${content}</div></div>`;
  els.messages.append(wrap);
  els.emptyState.hidden = true;
  scrollToBottom();
}

function updatePromptPill() {
  if (!els.promptPillLabel) return;
  const hasPrompt = Boolean(state.activeConversation?.customPrompt?.trim());
  els.promptPillLabel.textContent = hasPrompt ? "prompt set" : "prompt";
  els.promptPillLabel.closest("[data-tool='prompt']")?.classList.toggle("is-custom", hasPrompt);
  els.promptPillLabel.closest("[data-tool='prompt']")?.setAttribute("aria-label", hasPrompt ? "Chat instructions set" : "Set chat instructions");
}

function openPromptModal() {
  if (!state.activeConversation?.id) {
    showNotification("Start a chat first to set its instructions", "warning");
    return;
  }
  if (els.conversationPromptInput) els.conversationPromptInput.value = state.activeConversation.customPrompt || "";
  openModal(els.promptModal);
}

async function saveConversationPrompt() {
  if (!state.activeConversation?.id) return;
  const prompt = els.conversationPromptInput.value.trim();
  try {
    const data = await api(`/api/conversations/${encodeURIComponent(state.activeConversation.id)}/prompt`, {
      method: "PATCH",
      body: JSON.stringify({ prompt }),
    });
    state.activeConversation.customPrompt = data.customPrompt;
    updatePromptPill();
    closeModals();
    showNotification(prompt ? "Chat instructions saved" : "Chat instructions cleared", "success");
  } catch (error) {
    showNotification(error.action || error.message || "Failed to save instructions", "error");
  }
}

function clearConversationPrompt() {
  Sounds.clear();
  if (els.conversationPromptInput) els.conversationPromptInput.value = "";
  saveConversationPrompt();
}

function openExportModal() {
  if (!state.activeConversation) {
    showNotification("Open a chat to export it", "warning");
    return;
  }
  els.exportConversationName.textContent = `Exporting: ${state.activeConversation.title}`;
  openModal(els.exportModal);
}

function buildExport(conv, format) {
  const title = conv.title || "Untitled";
  const messages = conv.messages || [];
  if (format === "json") {
    const data = {
      title,
      provider: conv.provider || "",
      model: conv.model || "",
      customPrompt: conv.customPrompt || "",
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        model: m.model || "",
        timestamp: m.timestamp,
      })),
    };
    return { content: JSON.stringify(data, null, 2), mime: "application/json", ext: "json" };
  }
  if (format === "html") {
    const body = messages.map((m) => {
      const cls = m.role === "user" ? "user" : "assistant";
      return `<div class="msg ${cls}"><div class="msg-label">${escapeHtml(m.role)}${m.model ? ` · ${escapeHtml(m.model)}` : ""}</div><div class="msg-body">${escapeHtml(m.content).replace(/\n/g, "<br>")}</div></div>`;
    }).join("\n");
    return { content: exportHtmlDoc(title, body), mime: "text/html", ext: "html" };
  }
  const lines = [`# ${title}`, ""];
  if (conv.provider) lines.push(`- **Provider:** ${conv.provider}`);
  lines.push(`- **Model:** ${conv.model || "unknown"}`, `- **Created:** ${conv.createdAt}`, "", "---", "");
  for (const m of messages) {
    lines.push(`## ${m.role}${m.model ? ` (${m.model})` : ""}`, "", m.content, "");
  }
  return { content: lines.join("\n"), mime: "text/markdown", ext: "md" };
}

function exportHtmlDoc(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { margin: 0; padding: 32px 16px; background: #fafaf9; color: #222; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  main { max-width: 720px; margin: 0 auto; }
  h1 { font-size: 26px; }
  .msg { border-radius: 12px; padding: 14px 16px; margin: 12px 0; }
  .msg.user { background: #eef2f7; }
  .msg.assistant { background: #fff; border: 1px solid #e5e5e4; }
  .msg-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #999; margin-bottom: 6px; }
  code { background: #f0f0ef; padding: 1px 5px; border-radius: 4px; }
  pre { background: #1e1e1e; color: #eee; padding: 12px; border-radius: 8px; overflow-x: auto; }
  pre code { background: transparent; }
</style>
</head>
<body><main>
<h1>${escapeHtml(title)}</h1>
${body}
</main></body>
</html>`;
}

function exportConversation() {
  const conv = state.activeConversation;
  if (!conv) return;
  Sounds.export();
  const format = document.querySelector('input[name="exportFormat"]:checked')?.value || "markdown";
  const { content, mime, ext } = buildExport(conv, format);
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const base = (conv.title || "conversation").toLowerCase().replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${base || "conversation"}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showNotification("Chat exported", "success");
  const row = els.conversationList.querySelector('[aria-current="true"]');
  if (row) {
    row.classList.remove("is-glowing");
    void row.offsetWidth;
    row.classList.add("is-glowing");
    setTimeout(() => row.classList.remove("is-glowing"), 1400);
  }
}

async function copyExport() {
  const conv = state.activeConversation;
  if (!conv) return;
  const format = document.querySelector('input[name="exportFormat"]:checked')?.value || "markdown";
  const { content } = buildExport(conv, format);
  const button = els.exportCopyButton;
  const original = button.textContent;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    button.textContent = "Copied!";
    Sounds.copy();
    setTimeout(() => {
      if (button.isConnected) button.textContent = original;
    }, 1600);
  } catch {
    showNotification("Could not copy to clipboard", "error");
  }
}

async function importMarkdownFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) =>
    /\.(md|markdown|json)$/i.test(f.name) || ["text/markdown", "application/json"].includes(f.type)
  );
  if (!files.length) return 0;
  const contents = [];
  for (const f of files) {
    contents.push({ name: f.name, content: await f.text() });
  }
  const data = await api("/api/conversations/import", {
    method: "POST",
    body: JSON.stringify({ files: contents }),
  });
  return data.imported || 0;
}

// ─── Multi-model comparison ─────────────────────────────────────────────────

const compareState = {
  id: null,
  running: false,
  abort: null,
  results: {},
  pump: null,
};

function openCompareModal() {
  const usable = state.modelOptions.filter((option) => !option.disabled);
  if (usable.length < 2) {
    showNotification("Need at least two available models to compare", "warning");
    return;
  }
  compareState.running = false;
  compareState.results = {};
  els.compareResults.hidden = true;
  els.compareResults.innerHTML = "";
  els.compareStopButton.hidden = true;
  els.compareRunButton.disabled = false;
  renderCompareModels();
  openModal(els.compareModal);
  if (els.comparePrompt) els.comparePrompt.focus();
}

function renderCompareModels() {
  els.compareModelList.innerHTML = "";
  let lastProvider = "";
  const options = state.modelOptions.filter((option) => !option.disabled);
  for (const option of options) {
    if (option.provider !== lastProvider) {
      const group = document.createElement("div");
      group.className = "compare-model-group";
      group.textContent = option.providerLabel;
      els.compareModelList.append(group);
      lastProvider = option.provider;
    }
    const label = document.createElement("label");
    label.className = "compare-model";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.provider = option.provider;
    input.dataset.model = option.model;
    input.dataset.label = option.providerLabel;
    input.addEventListener("change", updateCompareCount);
    const span = document.createElement("span");
    span.textContent = option.model;
    label.append(input, span);
    els.compareModelList.append(label);
  }
  updateCompareCount();
}

function updateCompareCount() {
  const checked = els.compareModelList.querySelectorAll("input:checked");
  if (els.compareCount) els.compareCount.textContent = `${checked.length} of 4 selected`;
  els.compareModelList.querySelectorAll("input:not(:checked)").forEach((input) => {
    input.disabled = checked.length >= 4;
  });
}

function pumpCompare() {
  if (!compareState.running) return;
  for (const key of Object.keys(compareState.results)) {
    const r = compareState.results[key];
    if (r.queue) {
      r.text += r.queue;
      r.queue = "";
      r.el.innerHTML = renderMarkdown(r.text, { streaming: true });
      attachCodeCopy(r.el);
    }
  }
  compareState.pump = requestAnimationFrame(pumpCompare);
}

function flushCompare(key) {
  const r = compareState.results[key];
  if (!r || r.error) return;
  if (r.queue) {
    r.text += r.queue;
    r.queue = "";
  }
  const loader = r.el.querySelector(".typing-loader");
  if (loader) loader.remove();
  if (r.text) {
    r.el.innerHTML = renderMarkdown(r.text);
    attachCodeCopy(r.el);
  } else if (!r.error) {
    r.el.innerHTML = '<p class="muted-note">No response</p>';
  }
}

function handleComparePart(part) {
  for (const line of part.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    let event;
    try {
      event = JSON.parse(trimmed.slice(5).trim());
    } catch {
      continue;
    }
    if (!event.id) continue;
    const r = compareState.results[event.id];
    if (!r) continue;
    if (event.type === "token") {
      r.queue += event.content || "";
    } else if (event.type === "done") {
      flushCompare(event.id);
    } else if (event.type === "error") {
      r.error = true;
      r.el.innerHTML = `<div class="error-message"><p><strong>${escapeHtml(event.error || "Stream failed")}</strong></p>${event.action ? `<p class="error-action">${escapeHtml(event.action)}</p>` : ""}</div>`;
    }
  }
}

async function runCompare() {
  const message = els.comparePrompt.value.trim();
  if (!message) {
    showNotification("Enter a prompt to compare", "warning");
    return;
  }
  const selected = [...els.compareModelList.querySelectorAll("input:checked")].map((input) => ({
    id: `${input.dataset.provider}::${input.dataset.model}`,
    provider: input.dataset.provider,
    model: input.dataset.model,
    providerLabel: input.dataset.label,
  }));
  if (selected.length < 2) {
    showNotification("Select at least 2 models", "warning");
    return;
  }

  compareState.id = crypto.randomUUID();
  compareState.running = true;
  compareState.results = {};
  els.compareResults.hidden = false;
  els.compareResults.innerHTML = "";

  selected.forEach((m) => {
    const key = m.id;
    const col = document.createElement("div");
    col.className = "compare-col";
    col.innerHTML = `<div class="compare-col-head"><span class="compare-col-provider">${escapeHtml(m.providerLabel || m.provider)}</span><span class="compare-col-model">${escapeHtml(m.model)}</span></div><div class="compare-col-body"><div class="typing-loader"><span></span><span></span><span></span><span class="loader-msg" data-cycle>Thinking...</span></div></div>`;
    els.compareResults.append(col);
    compareState.results[key] = { el: col.querySelector(".compare-col-body"), text: "", queue: "", error: false };
  });

  els.compareRunButton.disabled = true;
  els.compareStopButton.hidden = false;
  pumpCompare();

  const controller = new AbortController();
  compareState.abort = controller;

  try {
    const response = await fetch("/api/chat/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: compareState.id,
        message,
        customPrompt: state.settings.customPrompt || undefined,
        models: selected.map((m) => ({
          id: m.id,
          provider: m.provider,
          model: m.model,
          apiKey: getApiKey(m.provider) || undefined,
        })),
      }),
      signal: controller.signal,
    });
    if (!response.ok || !response.body) {
      let detail = `${response.status} ${response.statusText}`;
      try {
        detail = (await response.json()).error || detail;
      } catch {}
      throw new Error(detail);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;
    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !done });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) handleComparePart(part);
    }
    if (buffer.trim()) handleComparePart(buffer);
  } catch (error) {
    if (error.name !== "AbortError") {
      showNotification(error.message || "Comparison failed", "error");
    }
  } finally {
    compareState.running = false;
    if (compareState.pump) cancelAnimationFrame(compareState.pump);
    compareState.pump = null;
    Object.keys(compareState.results).forEach((key) => flushCompare(key));
    els.compareRunButton.disabled = false;
    els.compareStopButton.hidden = true;
  }
}

async function stopCompare() {
  if (!compareState.id) return;
  try {
    await api(`/api/chat/compare-stop/${encodeURIComponent(compareState.id)}`, { method: "POST" });
  } catch (error) {
    // Stream may have already completed
  }
  compareState.abort?.abort();
}

async function boot() {
  if (window.electronAPI) {
    document.body.dataset.desktopShell = "true";
    document.body.dataset.desktopPlatform = window.electronAPI.platform || "unknown";
  }
  setShortcuts();
  chooseGreeting();
  await loadPersistentSettings();
  applySettings(); // Apply settings immediately to prevent sidebar animation on load
  setMode(state.mode);
  if (window.matchMedia("(max-width: 840px)").matches) {
    els.shell.dataset.sidebar = "closed";
  }
  bindEvents();
  bindRecentlyDeleted();
  window.electronAPI?.onCommand?.(runAppCommand);
  bindUpdateEvents();
  bindSetupFlow();
  bindHuggingFace();
  bindOllamaBrowser();
  initDictation();
  updateDictationNote();
  startLoaderRotation();
  startPlaceholderRotation();
  await Promise.all([loadProvidersAndModels(), refreshConversations(), refreshDeletedConversations(), refreshStats(), loadThemes()]);
  renderApiKeys();
  setInterval(refreshStats, 3000);
  setInterval(refreshDeletedConversations, 300000);
  attachCodeCopy();
  initUpdater();
  if (localStorage.getItem("vanilla-setup-done") && state.settings.autoName) prewarmTitleModel();
  maybeShowSetup();
}

// ─── First-run setup flow ────────────────────────────────────────────────────

function maybeShowSetup() {
  const done = localStorage.getItem("vanilla-setup-done");
  if (!done) {
    els.setupModal.hidden = false;
    requestAnimationFrame(() => {
      const nameInput = els.setupModal.querySelector("#setupNameInput");
      if (nameInput) nameInput.focus();
    });
  }
}

function finishSetup() {
  localStorage.setItem("vanilla-setup-done", "1");
  els.setupModal.hidden = true;
  chooseGreeting();
  els.promptInput.focus();
  if (state.settings.autoName) prewarmTitleModel();
}

function updateSetupDots(stepAttr) {
  const stepNum =
    stepAttr === "1" ? 1 :
    stepAttr === "2" ? 2 :
    stepAttr === "3" ? 3 :
    stepAttr === "4" ? 4 :
    stepAttr === "6" ? 5 :
    stepAttr === "7a" ? 6 :
    stepAttr === "7b" ? 6 : 1;
  els.setupModal.querySelectorAll(".setup-dot").forEach((dot) => {
    const n = Number(dot.dataset.dot);
    dot.dataset.state = n < stepNum ? "done" : n === stepNum ? "active" : "idle";
  });
}

function showSetupStep(stepAttr) {
  els.setupModal.querySelectorAll(".setup-step").forEach((step) => {
    step.hidden = step.dataset.step !== stepAttr;
  });
  updateSetupDots(stepAttr);
  // Focus first focusable element in the revealed step
  requestAnimationFrame(() => {
    const step = els.setupModal.querySelector(`.setup-step[data-step="${stepAttr}"]`);
    step?.querySelector("input, select, button:not(.setup-back)")?.focus();
  });
}

function bindSetupFlow() {
  if (!els.setupModal) return;

  const nameInput = els.setupModal.querySelector("#setupNameInput");
  const nameNext = els.setupModal.querySelector("#setupNameNext");
  const choiceButtons = els.setupModal.querySelectorAll(".setup-choice[data-choice]");
  const aiNext = els.setupModal.querySelector("#setupAiNext");
  const namingButtons = els.setupModal.querySelectorAll(".setup-choice[data-naming]");
  const namingNext = els.setupModal.querySelector("#setupNamingNext");
  const ollamaHost = els.setupModal.querySelector("#setupOllamaHost");
  const localDone = els.setupModal.querySelector("#setupLocalDone");
  const providerSelect = els.setupModal.querySelector("#setupProviderSelect");
  const apiKeyInput = els.setupModal.querySelector("#setupApiKey");
  const cloudDone = els.setupModal.querySelector("#setupCloudDone");

  // Pre-fill name if already set
  if (state.settings.userName) nameInput.value = state.settings.userName;

  // Populate cloud provider select with providers that need an API key
  const keyedProviders = state.providers.filter((p) => p.requiresKey);
  if (keyedProviders.length) {
    providerSelect.innerHTML = keyedProviders.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.label)}</option>`).join("");
  }

  // Initialise progress dots
  updateSetupDots("1");

  // Show/hide API key toggle
  const keyToggle = els.setupModal.querySelector(".setup-key-toggle");
  if (keyToggle && apiKeyInput) {
    keyToggle.addEventListener("click", () => {
      const isPassword = apiKeyInput.type === "password";
      apiKeyInput.type = isPassword ? "text" : "password";
      keyToggle.innerHTML = icon(isPassword ? "eye-off" : "eye", "", 17);
      keyToggle.setAttribute("aria-label", isPassword ? "Hide key" : "Show key");
      keyToggle.setAttribute("title", isPassword ? "Hide key" : "Show key");
    });
  }

  // Step 1 → 2: name
  nameNext.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    state.settings.userName = name;
    applySettings();
    showSetupStep("2");
  });

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") nameNext.click();
  });

  // Step 2: AI type selection
  choiceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      choiceButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      aiNext.disabled = false;
      aiNext.dataset.choice = btn.dataset.choice;
    });
  });

  aiNext.addEventListener("click", () => {
    const choice = aiNext.dataset.choice;
    if (choice === "local" || choice === "cloud") {
      showSetupStep("3");
    }
  });

  // Step 3: auto-naming preference
  namingButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      namingButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      namingNext.disabled = false;
      namingNext.dataset.naming = btn.dataset.naming;
    });
  });

  namingNext.addEventListener("click", () => {
    const naming = namingNext.dataset.naming;
    if (naming !== "yes" && naming !== "no") return;
    state.settings.autoName = naming === "yes";
    applySettings();
    showSetupStep("4");
  });

  // Step 4: markdown import preference
  const importButtons = els.setupModal.querySelectorAll(".setup-choice[data-import]");
  const importInput = els.setupModal.querySelector("#setupImportInput");
  const importStatus = els.setupModal.querySelector("#setupImportStatus");
  const importWrap = els.setupModal.querySelector("#setupImportWrap");
  const importNext = els.setupModal.querySelector("#setupImportNext");

  importButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      importButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      if (btn.dataset.import === "yes") {
        importWrap.hidden = false;
        importNext.disabled = false;
        requestAnimationFrame(() => importInput?.focus());
      } else {
        importWrap.hidden = true;
        importNext.disabled = false;
      }
    });
  });

  if (importInput) {
    importInput.addEventListener("change", async () => {
      const files = Array.from(importInput.files || []);
      if (!files.length) return;
      importStatus.textContent = "Importing…";
      try {
        const imported = await importMarkdownFiles(files);
        if (imported > 0) {
          importStatus.textContent = `Imported ${imported} chat${imported === 1 ? "" : "s"}.`;
          importInput.disabled = true;
        } else {
          importStatus.textContent = "No readable chats found in those files.";
        }
      } catch (error) {
        importStatus.textContent = error.action || error.message || "Import failed.";
      }
    });
  }

  if (importNext) {
    importNext.addEventListener("click", () => {
      showSetupStep("6");
    });
  }

  // Step 6: Dictation preference
  const dictationButtons = els.setupModal.querySelectorAll(".setup-choice[data-dictation]");
  const dictationNext = els.setupModal.querySelector("#setupDictationNext");
  const whisperStatus = els.setupModal.querySelector("#setupWhisperStatus");

  dictationButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      dictationButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      dictationNext.disabled = false;
      dictationNext.dataset.dictation = btn.dataset.dictation;

      // If Whisper is selected, check/install it
      if (btn.dataset.dictation === "whisper") {
        if (whisperStatus) {
          whisperStatus.hidden = false;
          whisperStatus.textContent = "Checking Whisper installation...";
        }
        try {
          const status = await api("/api/whisper/status");
          if (status.installed) {
            if (whisperStatus) whisperStatus.textContent = "Whisper is installed and ready.";
          } else {
            if (whisperStatus) whisperStatus.textContent = "Whisper will be downloaded (~1.5GB) when you continue.";
          }
        } catch (error) {
          if (whisperStatus) whisperStatus.textContent = "Could not check Whisper status.";
        }
      } else {
        if (whisperStatus) whisperStatus.hidden = true;
      }
    });
  });

  dictationNext.addEventListener("click", async () => {
    const dictation = dictationNext.dataset.dictation;
    if (dictation === "vosk" || dictation === "none") {
      state.settings.dictationEngine = dictation;
      applySettings();
      const choice = aiNext.dataset.choice;
      if (choice === "local") showSetupStep("7a");
      else if (choice === "cloud") showSetupStep("7b");
    } else if (dictation === "whisper") {
      // Install Whisper
      dictationNext.disabled = true;
      whisperStatus.textContent = "Installing Whisper model (this may take a few minutes)...";
      try {
        const result = await api("/api/whisper/install", { method: "POST" });
        if (result.success) {
          state.settings.dictationEngine = "whisper";
          applySettings();
          whisperStatus.textContent = "Whisper installed successfully.";
          setTimeout(() => {
            const choice = aiNext.dataset.choice;
            if (choice === "local") showSetupStep("7a");
            else if (choice === "cloud") showSetupStep("7b");
          }, 1000);
        } else {
          whisperStatus.textContent = "Installation failed. You can try again later in Settings.";
          dictationNext.disabled = false;
        }
      } catch (error) {
        whisperStatus.textContent = error.action || error.message || "Installation failed.";
        dictationNext.disabled = false;
      }
    }
  });

  // Step 7a: local AI done
  localDone.addEventListener("click", () => {
    const host = ollamaHost.value.trim();
    if (host) localStorage.setItem("vanilla-ollama-host", host);
    state.currentProvider = "ollama";
    finishSetup();
  });

  // Step 7b: cloud provider done
  cloudDone.addEventListener("click", async () => {
    const provider = providerSelect.value;
    const key = apiKeyInput.value.trim();
    if (key) localStorage.setItem(`vanilla-api-key-${provider}`, key);
    state.currentProvider = provider;
    await loadProvidersAndModels();
    // Switch to the chosen cloud provider in the model picker too
    const firstModel = state.modelOptions.find((o) => o.provider === provider && !o.disabled);
    if (firstModel) {
      state.currentModel = firstModel.model;
      updateModelLabel();
    }
    finishSetup();
  });

  // Back buttons
  els.setupModal.querySelectorAll("[data-setup-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const currentStep = els.setupModal.querySelector(".setup-step:not([hidden])")?.dataset.step;
      if (currentStep === "2") showSetupStep("1");
      if (currentStep === "3") showSetupStep("2");
      if (currentStep === "4") showSetupStep("3");
      if (currentStep === "6") showSetupStep("4");
      if (currentStep === "7a" || currentStep === "7b") showSetupStep("6");
    });
  });
}

boot();
