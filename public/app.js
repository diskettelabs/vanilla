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
  plusButton: document.querySelector("#plusButton"),
  promptInput: document.querySelector("#promptInput"),
  submitButton: document.querySelector("#submitButton"),
  submitIcon: document.querySelector("#submitIcon"),
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
  sidebarSelect: document.querySelector("#sidebarSelect"),
  reduceMotionToggle: document.querySelector("#reduceMotionToggle"),
  enterToSendToggle: document.querySelector("#enterToSendToggle"),
  showStatsToggle: document.querySelector("#showStatsToggle"),
  cpuStat: document.querySelector("#cpuStat"),
  gpuStat: document.querySelector("#gpuStat"),
  ramStat: document.querySelector("#ramStat"),
  searchModal: document.querySelector("#searchModal"),
  settingsModal: document.querySelector("#settingsModal"),
  searchInput: document.querySelector("#searchInput"),
  searchResults: document.querySelector("#searchResults"),
  settingsButton: document.querySelector("#settingsButton"),
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
  tokenQueue: "",
  tokenText: "",
  tokenPump: null,
  themes: [],
  settings: {
    theme: localStorage.getItem("vanilla-theme") || "default",
    density: localStorage.getItem("vanilla-density") || "comfortable",
    textSize: localStorage.getItem("vanilla-text-size") || "regular",
    accent: localStorage.getItem("vanilla-accent") || "sky",
    sidebar: localStorage.getItem("vanilla-sidebar") || "open",
    reduceMotion: localStorage.getItem("vanilla-reduce-motion") === "true",
    enterToSend: localStorage.getItem("vanilla-enter-to-send") !== "false",
    showStats: localStorage.getItem("vanilla-show-stats") !== "false",
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
  "Ready to dive in, Owen?", "What's the move, Owen?", "Give me the weird version, Owen.",
  "Owen, I've got the page warmed up.", "Let's turn the idea into something real, Owen.",
  "What are we shipping today, Owen?", "Owen, your cursor has the floor.",
  "Ready for the next thread, Owen?", "I am listening, Owen.", "Start anywhere, Owen.",
  "I'm here for the 2AM grind.", "Light mode at 2AM is crazy, Owen.",
  "Quiet hours, loud ideas.", "Too late to be vague. What's the mission?",
  "The 2AM committee is now in session.", "Moonlit debugging has entered the chat.",
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

function setShortcuts() {
  document.querySelector('[data-shortcut="new-chat"]').textContent = isMacLike() ? "⌘+⇧+O" : "Ctrl+Shift+O";
  document.querySelector('[data-shortcut="search"]').textContent = isMacLike() ? "⌘+K" : "Ctrl+K";
}

function chooseGreeting() {
  const hour = new Date().getHours();
  const timeSpecific = [];
  if (hour >= 0 && hour < 4) {
    timeSpecific.push("I'm here for the 2AM grind.", "Light mode at 2AM is crazy, Owen.", "Quiet hours, loud ideas.");
  } else if (hour >= 5 && hour < 10) {
    timeSpecific.push("Morning, Owen. What's first?", "Fresh day, fresh thread.");
  } else if (hour >= 17 && hour < 22) {
    timeSpecific.push("Evening mode, Owen. What are we making?", "Let's close the loop on something.");
  }
  const pool = timeSpecific.length ? timeSpecific : greetings;
  els.greeting.textContent = pool[Math.floor(Math.random() * pool.length)];
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

function renderMarkdown(markdown, { streaming = false } = {}) {
  const { cleaned, blocks } = extractThinking(markdown);
  const chunks = [];
  const fenceParts = cleaned.split(/```/);
  for (let i = 0; i < fenceParts.length; i++) {
    const part = fenceParts[i];
    if (i % 2 === 1) {
      if (streaming && i === fenceParts.length - 1) {
        chunks.push(`<p>${inlineMarkdown(part, true)}</p>`);
      } else {
        const firstBreak = part.indexOf("\n");
        const lang = firstBreak > -1 ? part.slice(0, firstBreak).trim() : "";
        const code = firstBreak > -1 ? part.slice(firstBreak + 1) : part;
        chunks.push(`<div class="code-box"><div class="code-head"><span>${escapeHtml(lang || "code")}</span><button type="button" data-copy-code>Copy</button></div><pre><code>${escapeHtml(code.trimEnd())}</code></pre></div>`);
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
  requestAnimationFrame(scrollToBottom);
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
}

function scrollToBottom() {
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
  resizePrompt({ forceExpanded: true });
  els.promptInput.focus();
  els.composer.dataset.editingMessageId = id;
}

function setOmnibarState(shouldExpand) {
  els.omnibar.dataset.expanded = shouldExpand ? "true" : "false";
  els.omnibar.querySelector(".expanded-tools").setAttribute("aria-hidden", shouldExpand ? "false" : "true");
}

function expandOmnibar(force = true) {
  resizePrompt({ forceExpanded: force });
}

function resizePrompt({ forceExpanded = false } = {}) {
  const compactHeight = 36;
  const shouldExpand = forceExpanded || els.promptInput.value.includes("\n") || els.promptInput.scrollHeight > compactHeight + 3;
  
  if (shouldExpand !== (els.omnibar.dataset.expanded === "true")) {
    setOmnibarState(shouldExpand);
  }
  
  if (shouldExpand) {
    els.promptInput.style.height = "auto";
    const naturalHeight = Math.min(els.promptInput.scrollHeight, 164);
    els.promptInput.style.height = `${naturalHeight}px`;
  } else {
    els.promptInput.style.height = `${compactHeight}px`;
  }
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
  if (!message) return;
  const editingId = els.composer.dataset.editingMessageId;
  els.promptInput.value = "";
  delete els.composer.dataset.editingMessageId;
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

async function streamChat(conversationId, message) {
  setRunning(conversationId, true);
  const assistant = addAssistantMessage("");
  state.activeAssistant = assistant.querySelector(".assistant-body");
  state.tokenQueue = "";
  state.tokenText = "";
  
  // Show loading message for first model load
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
          // Clear loading message on first token
          state.activeAssistant.textContent = "";
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
  if (state.tokenPump) cancelAnimationFrame(state.tokenPump);
  if (state.activeAssistant) {
    state.activeAssistant.innerHTML = state.tokenText ? renderMarkdown(state.tokenText) : loaderHtml();
    attachCodeCopy(state.activeAssistant);
  }
  state.activeAssistant = null;
  state.tokenPump = null;
  state.tokenQueue = "";
  state.tokenText = "";
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
    state.providers = [{ id: "ollama", label: "Ollama (Local)" }];
  }

  els.activeModel.textContent = "Finding models";
  const optionGroups = await Promise.all(state.providers.map(async (provider) => {
    try {
      const models = await api(`/api/models?provider=${encodeURIComponent(provider.id)}`, { timeoutMs: 10000 });
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
  els.providerSelect.innerHTML = state.providers.map((provider) => `<option value="${escapeHtml(provider.id)}">${escapeHtml(provider.label)}</option>`).join("");
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
    // The backend documents GPU usage as null on macOS unless privileged metrics are available.
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
  els.sidebarSelect.value = settings.sidebar;
  els.reduceMotionToggle.checked = settings.reduceMotion;
  els.enterToSendToggle.checked = settings.enterToSend;
  els.showStatsToggle.checked = settings.showStats;
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

  els.plusButton.addEventListener("click", () => expandOmnibar(true));
  els.promptInput.addEventListener("input", resizePrompt);
  els.promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && state.settings.enterToSend) {
      event.preventDefault();
      submitPrompt(event);
    }
  });
  els.composer.addEventListener("submit", submitPrompt);
  els.searchInput.addEventListener("input", debounce(runSearch, 160));

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
  els.sidebarSelect.addEventListener("change", () => {
    state.settings.sidebar = els.sidebarSelect.value;
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
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

async function boot() {
  setShortcuts();
  chooseGreeting();
  bindEvents();
  await Promise.all([loadProvidersAndModels(), refreshConversations(), refreshStats(), loadThemes()]);
  setInterval(refreshStats, 3000);
  attachCodeCopy();
  els.promptInput.focus();
}

boot();
