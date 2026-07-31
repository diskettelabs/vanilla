const ASSET = {
  logo: "./assets/vanilla%20logomark.svg",
  add: "./assets/add.svg",
  submit: "./assets/submit.svg",
  stop: "./assets/stop.svg",
  copy: "./assets/copy.svg",
  edit: "./assets/new%20chat.svg",
};

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
  providerSelect: document.querySelector("#providerSelect"),
  modelSelect: document.querySelector("#modelSelect"),
  themeSelect: document.querySelector("#themeSelect"),
  densitySelect: document.querySelector("#densitySelect"),
  textSizeSelect: document.querySelector("#textSizeSelect"),
  accentSelect: document.querySelector("#accentSelect"),
  sidebarOpenToggle: document.querySelector("#sidebarOpenToggle"),
  reduceMotionToggle: document.querySelector("#reduceMotionToggle"),
  enterToSendToggle: document.querySelector("#enterToSendToggle"),
  showStatsToggle: document.querySelector("#showStatsToggle"),
  customPromptInput: document.querySelector("#customPromptInput"),
  customPromptBadge: document.querySelector("#customPromptBadge"),
  cpuStat: document.querySelector("#cpuStat"),
  gpuStat: document.querySelector("#gpuStat"),
  ramStat: document.querySelector("#ramStat"),
  searchModal: document.querySelector("#searchModal"),
  settingsModal: document.querySelector("#settingsModal"),
  searchInput: document.querySelector("#searchInput"),
  searchResults: document.querySelector("#searchResults"),
  settingsButton: document.querySelector("#settingsButton"),
  installModal: document.querySelector("#installModal"),
  hfInstallButton: document.querySelector("#hfInstallButton"),
  hfSearchInput: document.querySelector("#hfSearchInput"),
  hfResults: document.querySelector("#hfResults"),
  hfFiles: document.querySelector("#hfFiles"),
  hfProgress: document.querySelector("#hfProgress"),
  fileInput: document.querySelector("#fileInput"),
  attachmentPreview: document.querySelector("#attachmentPreview"),
  displayNameInput: document.querySelector("#displayNameInput"),
  apiKeysList: document.querySelector("#apiKeysList"),
  setupModal: document.querySelector("#setupModal"),
};

const state = {
  conversations: [],
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
    userName: localStorage.getItem("vanilla-user-name") || "",
    customPrompt: localStorage.getItem("vanilla-custom-prompt") || "",
  },
};

const themeNames = [
  "blue-moon", "chocolate", "dragonfruit", "dreamsicle", "lavender", "lemon", "lime",
  "mint", "monochrome", "peach", "plum", "raspberry", "strawberry", "vanilla",
];

const greetings = [
  "What's up?", "Let's get started.", "Ready when you are.", "What are we making today?",
  "Bring me a problem.", "I saved you a clean slate.", "What needs untangling?",
  "Let's make it useful.", "What are we thinking through?", "Tell me where to aim.",
  "Ready to dive in, {name}?", "What's the move, {name}?", "Give me the weird version, {name}.",
  "{name}, let's do this.", "Let's turn the idea into something real, {name}.",
  "What are we shipping today, {name}?", "{name}, your cursor has the floor.",
  "Ready for the next thread, {name}?", "I am listening, {name}.", "Start anywhere, {name}.",
  "Quiet hours, loud ideas.", "Too late to be vague. What's the mission?",
  "Ready or not, here I come!", "Let's do the satisfying version.",
  "Give me the messy draft.", "We can make that sharper.", "What deserves attention?",
  "Let's find the cleanest path.", "Drop the thought here.", "What should Vanilla chew on?",
  "I'm warmed up.", "Blank page, low pressure.", "Start with the rough edge.",
  "What are we curious about?", "Let's make a dent.", "One prompt at a time.",
  "What are we improving?", "I can work with fragments.", "Give me the high level.",
  "Let's chase the useful answer.", "What's bothering the build?", "What's the question behind the question?",
  "Ready for a fresh pass.", "Let's put the pieces on the table.", "What needs a second brain?",
  "Let's make it less annoying.", "What would you like solved?", "I'm here for the hard part.",
  "Let's turn fog into steps.", "What's worth doing next?", "Make a wish, but practical.",
  "What are we testing?", "What needs explaining?", "What needs building?",
  "Let's draft, then polish.", "You bring the spark. I'll bring the structure.",
  "What is the next tiny win?", "Let's get something working.", "What should be easier?",
  "Tell me the constraint.", "What are the vibes and the requirements?",
  "Ready to reason out loud.", "What's the shape of the thing?", "Let's inspect the problem.",
  "Give me the real context.", "What are we comparing?", "What needs a decision?",
  "Let's make the computer behave.", "What should this become?", "What needs naming?",
  "Let's make the first version.", "What are we simplifying?", "What needs a plan?",
  "I have room for the whole rant.", "Let's do the careful version.",
  "What should we not miss?", "What's the fastest honest path?", "What are we fixing first?",
  "Let's make it feel inevitable.", "What deserves a better answer?",
  "Ready for the scratchpad.", "What would success look like?", "Let's pressure-test it.",
  "What are we learning today?", "Give me the puzzle.", "Let's make a useful mess.",
  "I am ready for the oddly specific thing.", "What's the tiny monster hiding in this one?",
  "Bring the context. I'll bring the patience.", "Let's get unstuck.",
  "What can I help you finish?", "Ready for the next good question.",
  "Let's make the vague thing concrete.", "What are we doing with this fine rectangle?"
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
      let message = `${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        message = data.error || message;
      } catch {}
      throw new Error(message);
    }
    return res.json();
  }).catch((error) => {
    if (error.name === "AbortError" && timeoutMs) {
      throw new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  }).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function isMacLike() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

function getApiKey(provider) {
  return localStorage.getItem(`vanilla-api-key-${provider}`) || "";
}

function setApiKey(provider, key) {
  const stored = key.trim();
  if (stored) localStorage.setItem(`vanilla-api-key-${provider}`, stored);
  else localStorage.removeItem(`vanilla-api-key-${provider}`);
}

function isProviderUsable(provider) {
  if (!provider.requiresKey) return true;
  return Boolean(provider.hasKey || getApiKey(provider.id));
}

function usableProviders() {
  return (state.providers || []).filter(isProviderUsable);
}

function setShortcuts() {
  document.querySelector('[data-shortcut="new-chat"]').textContent = isMacLike() ? "⌘+⇧+O" : "Ctrl+Shift+O";
  document.querySelector('[data-shortcut="search"]').textContent = isMacLike() ? "⌘+K" : "Ctrl+K";
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
        chunks.push(`<div class="code-box"><div class="code-head"><span>${escapeHtml(langDisplay)}</span><button type="button" data-copy-code><img src="${ASSET.copy}" alt="">Copy</button></div><pre class="line-numbers"><code class="${langClass}">${escapeHtml(code.trimEnd())}</code></pre></div>`);
      } else {
        const detectedLang = detectLanguage(lang, code);
        const langClass = detectedLang ? `language-${detectedLang}` : "";
        const langDisplay = detectedLang || lang || "code";
        chunks.push(`<div class="code-box"><div class="code-head"><span>${escapeHtml(langDisplay)}</span><button type="button" data-copy-code><img src="${ASSET.copy}" alt="">Copy</button></div><pre class="line-numbers"><code class="${langClass}">${escapeHtml(code.trimEnd())}</code></pre></div>`);
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
    const empty = document.createElement("p");
    empty.className = "date-heading";
    empty.textContent = "no chats yet";
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
    const row = document.createElement("button");
    row.type = "button";
    row.className = "conversation-row";
    row.textContent = conv.title || "Untitled";
    row.title = conv.title || "Untitled";
    row.setAttribute("role", "listitem");
    row.setAttribute("aria-current", state.activeConversation?.id === conv.id ? "true" : "false");
    row.addEventListener("click", () => loadConversation(conv.id));
    els.conversationList.append(row);
  }
}

function renderMessages(conv) {
  els.messages.innerHTML = "";
  const messages = conv?.messages || [];
  els.emptyState.hidden = messages.length > 0;
  for (const msg of messages) {
    if (msg.role === "user") {
      addUserMessage(msg.content, { animate: false, id: msg.id });
    } else {
      addAssistantMessage(msg.content, { animate: false, id: msg.id, done: true });
    }
  }
  requestAnimationFrame(() => {
    scrollToBottom();
    // Apply syntax highlighting to all loaded messages
    attachCodeCopy(els.messages);
  });
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
      <button class="message-action" type="button" data-edit-message aria-label="Edit prompt" title="Edit prompt"><img src="${ASSET.edit}" alt=""></button>
      <button class="message-action" type="button" data-copy-message aria-label="Copy prompt" title="Copy prompt"><img src="${ASSET.copy}" alt=""></button>
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
    <img class="assistant-mark" src="${ASSET.logo}" alt="">
    <div class="assistant-body">${done ? renderMarkdown(content) : loaderHtml()}</div>`;
  els.messages.append(wrap);
  els.emptyState.hidden = true;
  scrollToBottom();
  return wrap;
}

function loaderHtml() {
  return '<div class="typing-loader" aria-label="Waiting for response"><span></span><span></span><span></span></div>';
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
}

async function editPrompt(content, id) {
  els.promptInput.value = content;
  resizePrompt();
  els.promptInput.focus();
  els.composer.dataset.editingMessageId = id;
}

function resizePrompt() {
  els.promptInput.style.height = "auto";
  const naturalHeight = Math.min(els.promptInput.scrollHeight, 164);
  els.promptInput.style.height = `${naturalHeight}px`;
}

// Speech Recognition / Dictation using Vosk (offline)
async function initDictation() {
  if (!window.Vosk) {
    console.warn('Vosk library not loaded, hiding dictation button');
    if (els.dictationButton) {
      els.dictationButton.style.display = 'none';
    }
    return;
  }

  try {
    console.log('Initializing Vosk speech recognition...');
    
    // Load Vosk model (small English model)
    // We'll download it on first use
    const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
    
    console.log('Vosk initialized. Model will be loaded on first use.');
    console.log('Note: First use will download ~40MB model file.');
    
  } catch (error) {
    console.error('Failed to initialize Vosk:', error);
    if (els.dictationButton) {
      els.dictationButton.style.display = 'none';
    }
  }
}

async function toggleDictation() {
  if (!window.Vosk) {
    alert('Speech recognition is not available.');
    return;
  }

  if (state.isRecording) {
    stopDictation();
  } else {
    await startDictation();
  }
}

async function startDictation() {
  try {
    console.log('Starting Vosk dictation...');
    state.isRecording = true;
    
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

    // Create audio context
    state.audioContext = new AudioContext({ sampleRate: 16000 });
    const source = state.audioContext.createMediaStreamSource(state.mediaStream);

    // Load model if not loaded
    if (!state.voskModel) {
      console.log('Loading Vosk model (first time, ~40MB download)...');
      els.dictationLabel.textContent = 'downloading model...';
      
      // Use our server as proxy to bypass CORS
      const model = await Vosk.createModel('/api/vosk-model');
      state.voskModel = model;
      console.log('Model loaded successfully');
    }

    // Create recognizer with sample rate (must match AudioContext)
    state.voskRecognizer = new state.voskModel.KaldiRecognizer(16000);
    
    // Set up event handlers for results
    state.voskRecognizer.on("result", (message) => {
      if (message.result && message.result.text && message.result.text.trim()) {
        console.log('Result:', message.result.text);
        els.promptInput.value += message.result.text + ' ';
        resizePrompt();
      }
    });
    
    state.voskRecognizer.on("partialresult", (message) => {
      if (message.result && message.result.partial) {
        console.log('Partial:', message.result.partial);
      }
    });
    
    els.dictationLabel.textContent = 'listening...';
    console.log('Vosk recognizer ready');

    // Create audio processor
    const recognizerNode = state.audioContext.createScriptProcessor(4096, 1, 1);
    
    recognizerNode.onaudioprocess = (event) => {
      if (!state.isRecording) return;
      
      try {
        // Pass the AudioBuffer directly to Vosk
        state.voskRecognizer.acceptWaveform(event.inputBuffer);
      } catch (error) {
        console.error('acceptWaveform failed:', error);
      }
    };

    source.connect(recognizerNode);
    recognizerNode.connect(state.audioContext.destination);
    
    state.audioProcessor = recognizerNode;

  } catch (error) {
    console.error('Failed to start dictation:', error);
    state.isRecording = false;
    els.dictationButton.dataset.active = 'false';
    els.dictationLabel.textContent = 'dictate';
    
    if (error.name === 'NotAllowedError') {
      alert('Microphone access denied. Please allow microphone access in your browser settings.');
    } else {
      alert('Failed to start speech recognition: ' + error.message);
    }
  }
}

function stopDictation() {
  console.log('Stopping Vosk dictation');
  state.isRecording = false;
  
  // Remove the recognizer
  if (state.voskRecognizer) {
    try {
      // Remove event listeners
      state.voskRecognizer.remove();
    } catch (e) {
      console.log('Could not remove recognizer:', e);
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
    state.conversations = await api("/api/conversations");
    renderConversationList();
  } catch (error) {
    console.warn("Unable to load conversations", error);
  }
}

async function loadConversation(id) {
  try {
    const conv = await api(`/api/conversations/${encodeURIComponent(id)}`);
    state.activeConversation = conv;
    state.currentProvider = conv.provider || state.currentProvider;
    state.currentModel = conv.model || state.currentModel;
    updateModelLabel();
    renderMessages(conv);
    renderConversationList();
  } catch (error) {
    showAssistantError(error.message);
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
    body: JSON.stringify({ title, model: state.currentModel, provider: state.currentProvider }),
  });
  state.activeConversation = conv;
  await refreshConversations();
  renderConversationList();
  return conv;
}

async function newChat() {
  state.activeConversation = null;
  els.messages.innerHTML = "";
  els.emptyState.hidden = false;
  chooseGreeting();
  renderConversationList();
  els.promptInput.value = "";
  resizePrompt();
  els.promptInput.focus();
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

  // Handle file upload if pending
  if (state.pendingAttachment) {
    await handleAttachmentUpload(message);
    return;
  }

  resizePrompt();

  try {
    let conv = await ensureConversation(message);
    if (editingId && conv.messages?.at(-1)?.role === "assistant") {
      await api(`/api/conversations/${encodeURIComponent(conv.id)}/regenerate`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      conv = await api(`/api/conversations/${encodeURIComponent(conv.id)}`);
      state.activeConversation = conv;
      renderMessages(conv);
    } else {
      addUserMessage(message);
    }
    await streamChat(conv.id, message);
  } catch (error) {
    showAssistantError(error.message);
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
          progress.querySelector(".upload-label").textContent = `Uploading ${name} — ${pct}%`;
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201) return resolve(JSON.parse(xhr.responseText));
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));
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
      visualContent = `<a href="${result.url}" target="_blank" class="file-attachment"><span class="file-icon">${ext.toUpperCase()}</span><span class="file-info"><span class="file-name">${escapeHtml(result.name)}</span><span class="file-meta">${escapeHtml(result.type)} — ${formatFileSize(result.size)}</span></span></a>`;
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
    setTimeout(() => progress.remove(), 2500);
    showAssistantError(error.message);
  } finally {
    state.uploading = false;
  }
}

async function streamChat(conversationId, message) {
  setRunning(conversationId, true);
  const assistant = addAssistantMessage("");
  state.activeAssistant = assistant.querySelector(".assistant-body");
  state.tokenQueue = "";
  state.tokenText = "";
  
  state.activeAssistant.textContent = "Loading model...";
  pumpTokens();

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
        customPrompt: state.settings.customPrompt || undefined,
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
      } else if (event.type === "error") {
        showAssistantError(event.error || "Stream failed", state.activeAssistant?.closest(".assistant-message"));
      }
    } catch (error) {
      console.warn("Bad SSE event", error);
    }
  }
}

function pumpTokens() {
  if (!state.activeAssistant) return;
  const draw = () => {
    if (state.tokenQueue) {
      const take = Math.max(1, Math.min(10, Math.ceil(state.tokenQueue.length / 8)));
      state.tokenText += state.tokenQueue.slice(0, take);
      state.tokenQueue = state.tokenQueue.slice(take);
      state.activeAssistant.innerHTML = renderMarkdown(state.tokenText, { streaming: true });
      attachCodeCopy(state.activeAssistant);
      scrollToBottom();
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
      state.activeAssistant.innerHTML = renderMarkdown(state.tokenText);
      attachCodeCopy(state.activeAssistant);
      scrollToBottom();
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
  try {
    await api(`/api/chat/stop/${encodeURIComponent(id)}`, { method: "POST" });
  } catch (error) {
    console.warn("Stop endpoint unavailable or already complete", error);
  }
  state.streamAbort?.abort();
  setRunning(null, false);
}

function setRunning(conversationId, running) {
  state.runningConversationId = running ? conversationId : null;
  els.submitButton.dataset.mode = running ? "stop" : "submit";
  els.submitIcon.src = running ? ASSET.stop : ASSET.submit;
  els.submitButton.title = running ? "Stop" : "Submit";
  els.submitButton.setAttribute("aria-label", running ? "Stop response" : "Submit message");
}

function showAssistantError(message, existingMessage) {
  const wrap = existingMessage || addAssistantMessage("", { done: true });
  const body = wrap.classList?.contains("assistant-message") ? wrap.querySelector(".assistant-body") : wrap;
  if (body) body.innerHTML = `<p><strong>Something went sideways:</strong> ${escapeHtml(message)}</p>`;
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
      return [{
        provider: provider.id,
        providerLabel: provider.label,
        model: "Unavailable",
        disabled: true,
        reason: error.message,
      }];
    }
  }));
  const options = optionGroups.flat();
  state.modelOptions = options;
  const firstUsable = options.find((option) => !option.disabled);
  if (firstUsable) {
    state.currentProvider = firstUsable.provider;
    state.currentModel = firstUsable.model;
  }
  renderModelOptions();
  updateModelLabel();
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
          <button class="api-key-toggle" type="button" aria-label="Show/hide key" title="Show/hide">
            <svg class="api-eye-show" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
            <svg class="api-eye-hide" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" hidden><path d="M2 2l12 12M6.5 6.5A2 2 0 0 0 9.5 9.5M4 4.3C2.4 5.4 1 8 1 8s2.5 5 7 5c1.4 0 2.6-.4 3.7-1M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.4-1.9 2.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
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

    row.querySelector(".api-key-toggle").addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      row.querySelector(".api-eye-show").hidden = !isPassword;
      row.querySelector(".api-eye-hide").hidden = isPassword;
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
  let lastProvider = "";
  for (const option of filtered) {
    if (option.provider !== lastProvider) {
      const group = document.createElement("div");
      group.className = "model-group";
      group.textContent = option.providerLabel;
      els.modelOptions.append(group);
      lastProvider = option.provider;
    }
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
    els.modelOptions.append(button);
  }
  syncSettingsSelects();
}

function syncSettingsSelects() {
  const usable = usableProviders();
  els.providerSelect.innerHTML = usable.map((provider) => `<option value="${escapeHtml(provider.id)}">${escapeHtml(provider.label)}</option>`).join("");
  els.providerSelect.value = state.currentProvider;
  const models = state.modelOptions.filter((option) => option.provider === state.currentProvider && !option.disabled);
  els.modelSelect.innerHTML = models.map((option) => `<option value="${escapeHtml(option.model)}">${escapeHtml(option.model)}</option>`).join("");
  els.modelSelect.value = state.currentModel;
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

function applySettings() {
  const { settings } = state;
  document.body.dataset.density = settings.density;
  document.body.dataset.textSize = settings.textSize;
  document.body.dataset.accent = settings.accent;
  document.body.dataset.showStats = String(settings.showStats);
  document.body.dataset.reduceMotion = String(settings.reduceMotion);
  els.shell.dataset.sidebar = settings.sidebar;
  els.densitySelect.value = settings.density;
  els.textSizeSelect.value = settings.textSize;
  els.accentSelect.value = settings.accent;
  els.sidebarOpenToggle.checked = settings.sidebar === "open";
  els.reduceMotionToggle.checked = settings.reduceMotion;
  els.enterToSendToggle.checked = settings.enterToSend;
  els.showStatsToggle.checked = settings.showStats;
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
  if (theme?.colors) {
    const colors = theme.colors;
    document.documentElement.style.setProperty("--bg", colors.background);
    document.documentElement.style.setProperty("--text", colors.text);
    document.documentElement.style.setProperty("--bubble", colors.userMessage);
    document.documentElement.style.setProperty("--line", colors.border);
    document.documentElement.style.setProperty("--panel", colors.assistantMessage);
    document.documentElement.style.setProperty("--panel-strong", colors.secondary);
    document.documentElement.style.setProperty("--soft", colors.assistantMessage);
  } else {
    ["--bg", "--text", "--bubble", "--line", "--panel", "--panel-strong", "--soft"].forEach((property) => {
      document.documentElement.style.removeProperty(property);
    });
  }
  localStorage.setItem("vanilla-theme", settings.theme);
  localStorage.setItem("vanilla-density", settings.density);
  localStorage.setItem("vanilla-text-size", settings.textSize);
  localStorage.setItem("vanilla-accent", settings.accent);
  localStorage.setItem("vanilla-sidebar", settings.sidebar);
  localStorage.setItem("vanilla-reduce-motion", String(settings.reduceMotion));
  localStorage.setItem("vanilla-enter-to-send", String(settings.enterToSend));
  localStorage.setItem("vanilla-show-stats", String(settings.showStats));
  localStorage.setItem("vanilla-user-name", settings.userName || "");
  localStorage.setItem("vanilla-custom-prompt", settings.customPrompt || "");
}

async function loadThemes() {
  const results = await Promise.all(themeNames.map(async (name) => {
    try {
      const response = await fetch(`/themes/${name}.json`);
      if (!response.ok) throw new Error("Theme unavailable");
      return await response.json();
    } catch {
      return { name, displayName: titleCase(name), description: "Theme palette" };
    }
  }));
  state.themes = [{ name: "default", displayName: "Vanilla UI", description: "Neutral light interface" }, ...results];
  els.themeSelect.innerHTML = state.themes.map((theme) => `<option value="${escapeHtml(theme.name)}">${escapeHtml(theme.displayName || titleCase(theme.name))}</option>`).join("");
  els.themeSelect.value = state.settings.theme;
  applySettings();
}

function openModal(modal) {
  modal.hidden = false;
  requestAnimationFrame(() => modal.querySelector("input, select, button")?.focus());
}

function closeModals() {
  els.searchModal.hidden = true;
  els.settingsModal.hidden = true;
  els.installModal.hidden = true;
}

async function runSearch() {
  const q = els.searchInput.value.trim();
  if (!q) {
    els.searchResults.innerHTML = "";
    return;
  }
  try {
    const results = await api(`/api/search?q=${encodeURIComponent(q)}`);
    els.searchResults.innerHTML = results.map((result) => {
      const snippet = result.matches?.find((match) => match.snippet)?.snippet || "Title match";
      return `<button class="search-result" type="button" data-conversation-id="${escapeHtml(result.id)}"><strong>${escapeHtml(result.title)}</strong><span>${escapeHtml(snippet)}</span></button>`;
    }).join("") || '<p class="muted-note">No matches.</p>';
    els.searchResults.querySelectorAll("[data-conversation-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        closeModals();
        await loadConversation(button.dataset.conversationId);
      });
    });
  } catch (error) {
    els.searchResults.innerHTML = `<p class="muted-note">${escapeHtml(error.message)}</p>`;
  }
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = value;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n >= 100 ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
}

async function searchHuggingFace(query) {
  if (!query) {
    els.hfResults.innerHTML = "";
    return;
  }
  els.hfResults.innerHTML = '<p class="muted-note">Searching HuggingFace…</p>';
  try {
    const data = await api(`/api/hf/search?q=${encodeURIComponent(query)}`);
    renderHfResults(data.results || []);
  } catch (error) {
    els.hfResults.innerHTML = `<p class="muted-note">${escapeHtml(error.message)}</p>`;
  }
}

function renderHfResults(results) {
  els.hfFiles.innerHTML = "";
  if (!results.length) {
    els.hfResults.innerHTML = '<p class="muted-note">No GGUF models found. Try another search.</p>';
    return;
  }
  els.hfResults.innerHTML = results.map((repo) => `
    <button class="hf-repo" type="button" data-repo="${escapeHtml(repo.id)}">
      <span class="hf-repo-id">${escapeHtml(repo.id)}</span>
      <span class="hf-repo-meta">${formatBytes(repo.downloads)} downloads${repo.gated ? " · gated" : ""}</span>
    </button>
  `).join("");
  els.hfResults.querySelectorAll("[data-repo]").forEach((button) => {
    button.addEventListener("click", () => loadHfFiles(button.dataset.repo));
  });
}

async function loadHfFiles(repo) {
  els.hfFiles.innerHTML = `<p class="muted-note">Loading files for ${escapeHtml(repo)}…</p>`;
  try {
    const data = await api(`/api/hf/repo?repo=${encodeURIComponent(repo)}`);
    renderHfFiles(repo, data.files || []);
  } catch (error) {
    els.hfFiles.innerHTML = `<p class="muted-note">${escapeHtml(error.message)}</p>`;
  }
}

function renderHfFiles(repo, files) {
  if (!files.length) {
    els.hfFiles.innerHTML = '<p class="muted-note">No GGUF files found in this repo.</p>';
    return;
  }
  els.hfFiles.innerHTML = `<div class="hf-files-head"><span>${escapeHtml(repo)}</span></div>` +
    files.map((file) => `
      <div class="hf-file" data-file="${escapeHtml(file.filename)}">
        <div class="hf-file-info">
          <span class="hf-file-quant">${escapeHtml(file.quant)}</span>
          <span class="hf-file-name">${escapeHtml(file.filename)}</span>
          <span class="hf-file-size">${formatBytes(file.size)}</span>
        </div>
        <button class="hf-install-btn" type="button">Install</button>
      </div>
    `).join("");
  els.hfFiles.querySelectorAll(".hf-install-btn").forEach((button) => {
    button.addEventListener("click", () => installHfModel(repo, button.closest(".hf-file").dataset.file, button));
  });
}

function installHfModel(repo, file, button) {
  els.hfFiles.querySelectorAll(".hf-install-btn").forEach((btn) => { btn.disabled = true; });
  button.textContent = "Installing…";
  els.hfProgress.hidden = false;
  els.hfProgress.innerHTML = `
    <div class="hf-progress-status">Starting…</div>
    <div class="hf-track"><div class="hf-bar" style="width:0%"></div></div>
    <div class="hf-progress-pct">0%</div>
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
        updateHfProgress(event);
      }
    }
  }).catch((error) => {
    updateHfProgress({ type: "error", error: error.message });
  });
}

function updateHfProgress(event) {
  const status = els.hfProgress.querySelector(".hf-progress-status");
  const bar = els.hfProgress.querySelector(".hf-bar");
  const pct = els.hfProgress.querySelector(".hf-progress-pct");
  if (!status) return;
  if (event.type === "progress" && event.total > 0) {
    const p = Math.min(100, Math.round((event.downloaded / event.total) * 100));
    bar.style.width = `${p}%`;
    pct.textContent = `${p}%`;
    status.textContent = `Downloading ${formatBytes(event.downloaded)} of ${formatBytes(event.total)}`;
  } else if (event.type === "status") {
    status.textContent = event.message;
  } else if (event.type === "error") {
    bar.style.width = "0%";
    status.textContent = event.error;
    pct.textContent = "Failed";
    els.hfFiles.querySelectorAll(".hf-install-btn").forEach((btn) => {
      btn.disabled = false;
      btn.textContent = "Install";
    });
  } else if (event.type === "done") {
    bar.style.width = "100%";
    pct.textContent = "Done";
    status.textContent = `Installed ${event.model}. Refreshing models…`;
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
    els.hfResults.innerHTML = "";
    els.hfFiles.innerHTML = "";
    els.hfProgress.hidden = true;
    openModal(els.installModal);
  });
  els.hfSearchInput.addEventListener("input", debounce(() => {
    searchHuggingFace(els.hfSearchInput.value.trim());
  }, 300));
}

function bindEvents() {
  const toggleSidebar = () => {
    const next = els.shell.dataset.sidebar === "open" ? "closed" : "open";
    state.settings.sidebar = next;
    applySettings();
    els.sidebarToggle.setAttribute("aria-label", next === "open" ? "Collapse sidebar" : "Expand sidebar");
  };
  els.sidebarToggle.addEventListener("click", toggleSidebar);
  els.mainSidebarToggle.addEventListener("click", toggleSidebar);
  document.querySelector('[data-action="new-chat"]').addEventListener("click", newChat);
  document.querySelector('[data-action="search"]').addEventListener("click", () => openModal(els.searchModal));
  els.settingsButton.addEventListener("click", () => openModal(els.settingsModal));
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

  els.promptInput.addEventListener("input", resizePrompt);
  els.promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && state.settings.enterToSend) {
      event.preventDefault();
      submitPrompt(event);
    }
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

  els.providerSelect.addEventListener("change", () => {
    state.currentProvider = els.providerSelect.value;
    const firstModel = state.modelOptions.find((option) => option.provider === state.currentProvider && !option.disabled);
    if (firstModel) state.currentModel = firstModel.model;
    updateModelLabel();
    renderModelOptions();
  });
  els.modelSelect.addEventListener("change", () => {
    state.currentModel = els.modelSelect.value;
    updateModelLabel();
    renderModelOptions();
  });

  els.themeSelect.addEventListener("change", () => {
    state.settings.theme = els.themeSelect.value;
    applySettings();
  });
  els.densitySelect.addEventListener("change", () => {
    state.settings.density = els.densitySelect.value;
    applySettings();
  });
  els.textSizeSelect.addEventListener("change", () => {
    state.settings.textSize = els.textSizeSelect.value;
    applySettings();
  });
  els.accentSelect.addEventListener("change", () => {
    state.settings.accent = els.accentSelect.value;
    applySettings();
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
  els.showStatsToggle.addEventListener("change", () => {
    state.settings.showStats = els.showStatsToggle.checked;
    applySettings();
  });

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
      els.setupModal?.querySelectorAll(".setup-choice").forEach((b) => b.setAttribute("aria-pressed", "false"));
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
    if (event.key === "Escape") {
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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `;

  els.attachmentPreview.querySelector(".attachment-remove").addEventListener("click", clearAttachment);
}

function clearAttachment() {
  state.pendingAttachment = null;
  renderAttachmentPreview();
  resizePrompt();
}

function createUploadProgress() {
  const el = document.createElement("div");
  el.className = "upload-progress";
  el.innerHTML = '<div class="upload-track"><div class="upload-fill"></div></div><span class="upload-label">Preparing…</span>';
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

async function boot() {
  setShortcuts();
  chooseGreeting();
  bindEvents();
  bindSetupFlow();
  bindHuggingFace();
  initDictation();
  await Promise.all([loadProvidersAndModels(), refreshConversations(), refreshStats(), loadThemes()]);
  renderApiKeys();
  setInterval(refreshStats, 3000);
  attachCodeCopy();
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
}

function updateSetupDots(stepAttr) {
  const stepNum = stepAttr === "1" ? 1 : stepAttr === "2" ? 2 : 3;
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
  const choiceButtons = els.setupModal.querySelectorAll(".setup-choice");
  const aiNext = els.setupModal.querySelector("#setupAiNext");
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
      keyToggle.querySelector(".eye-show").hidden = isPassword;
      keyToggle.querySelector(".eye-hide").hidden = !isPassword;
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
    if (choice === "local") {
      showSetupStep("3a");
    } else if (choice === "cloud") {
      showSetupStep("3b");
    }
  });

  // Step 3a: local AI done
  localDone.addEventListener("click", () => {
    const host = ollamaHost.value.trim();
    if (host) localStorage.setItem("vanilla-ollama-host", host);
    state.currentProvider = "ollama";
    finishSetup();
  });

  // Step 3b: cloud provider done
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
      if (currentStep === "3a" || currentStep === "3b") showSetupStep("2");
    });
  });
}

boot();
