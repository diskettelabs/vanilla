const ASSET = {
  logo: "./assets/scoop-outline.svg",
  add: "./assets/add.svg",
  submit: "./assets/submit.svg",
  stop: "./assets/stop.svg",
  copy: "./assets/copy.svg",
  edit: "./assets/new%20chat.svg",
  trash: "./assets/trashcan.svg",
  pin: "./assets/pin.svg",
  keyShown: "./assets/key-shown.svg",
  keyHidden: "./assets/key-hidden.svg",
  local: "./assets/local.svg",
  cloud: "./assets/cloud.svg",
  autoname: "./assets/autoname.svg",
  close: "./assets/close.svg",
  download: "./assets/download.svg",
};

let themeMascot = null;
let themeGreeting = false;
let themePlaceholder = false;
let themeStylesEl = null;
let themeFaviconLink = null;
const originalBrandLogo = document.querySelector(".brand-logo")?.outerHTML || null;
const originalEmptyMascot = document.querySelector("#emptyState .empty-mascot")?.outerHTML || null;
const originalTitle = document.title;

function MASCOT_SVG(className = "mascot-svg") {
  if (themeMascot) {
    const svg = themeMascot.trim();
    return svg.startsWith("<svg") ? svg.replace(/^<svg/, `<svg class="${className}"`) : svg;
  }
  return `<svg class="${className}" viewBox="-5 -5 58 54" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g fill="currentColor">
    <path d="M42.361,18.136 C42.361,20.338 41.992,22.493 41.274,24.536 C43.102,26.216 44.187,28.561 44.187,31.091 C44.187,36.143 39.911,40.187 34.696,40.187 C32.046,40.187 29.594,39.136 27.848,37.384 C26.101,39.136 23.649,40.187 21,40.187 C18.351,40.187 15.899,39.136 14.152,37.384 C12.406,39.136 9.954,40.187 7.304,40.187 C2.089,40.187 -2.187,36.143 -2.187,31.091 C-2.187,28.561 -1.102,26.216 0.726,24.536 C0.008,22.493 -0.361,20.338 -0.361,18.136 C-0.361,6.884 9.229,-2.187 21,-2.187 C32.771,-2.187 42.361,6.884 42.361,18.136 Z M4.013,18.136 C4.013,20.308 4.474,22.415 5.359,24.369 C5.815,25.377 5.447,26.567 4.501,27.141 C3.059,28.015 2.187,29.491 2.187,31.091 C2.187,33.671 4.452,35.813 7.304,35.813 C9.49,35.813 11.393,34.539 12.116,32.7 C12.843,30.85 15.46,30.85 16.187,32.699 C16.911,34.539 18.814,35.813 21,35.813 C23.186,35.813 25.089,34.539 25.812,32.7 C26.538,30.85 29.156,30.85 29.883,32.699 C30.606,34.539 32.51,35.813 34.696,35.813 C37.548,35.813 39.813,33.671 39.813,31.091 C39.813,29.491 38.941,28.015 37.499,27.141 C36.553,26.567 36.185,25.377 36.641,24.369 C37.526,22.415 37.987,20.308 37.987,18.136 C37.987,9.356 30.408,2.187 21,2.187 C11.592,2.187 4.013,9.356 4.013,18.136 Z" fill-rule="nonzero"/>
  </g>
  <g class="mascot-gaze">
    <g transform="translate(16.98,17.93)"><rect class="mascot-eye" x="-2.09" y="-5.68" width="4.18" height="11.36" rx="2.09" fill="#000000"/></g>
    <g transform="translate(25.73,17.93)"><rect class="mascot-eye mascot-eye-r" x="-2.09" y="-5.68" width="4.18" height="11.36" rx="2.09" fill="#000000"/></g>
  </g>
</svg>`;
}

const TRASH_SVG = `
<svg class="trash-icon" width="14" height="14" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg">
  <g fill="currentColor" fill-rule="nonzero">
    <path class="trash-can-body" d="M13.835924,2.25549247 C14.2360012,2.47980698 14.5468206,2.83481964 14.7162917,3.26103356 C14.8938216,3.70751495 14.8835183,3.93998597 14.7542829,4.909251 L13.1795461,16.7197775 C13.0705711,17.5370899 13.0303632,17.7282592 12.8147041,18.0691841 C12.6082454,18.3955645 12.3117065,18.6551891 11.9609029,18.8167011 C11.5944663,18.9854105 11.39966,19 10.5751146,19 L4.42488544,19 C3.60034003,19 3.40553368,18.9854105 3.03909709,18.8167011 C2.68829345,18.6551891 2.39175457,18.3955645 2.18529591,18.0691841 C2.01424925,17.7987849 1.94049649,17.5377118 1.8763599,17.1208081 C1.86084676,17.0199689 1.84935958,16.9365698 1.82045394,16.7197775 L0.245717081,4.90925101 L0.222896008,4.73591598 C0.11592754,3.91009112 0.117274018,3.67960987 0.283708258,3.26103356 C0.453179366,2.83481964 0.763998769,2.47980698 1.16407597,2.25549247 C1.58317777,2.02051129 1.81497126,2 2.79281402,2 L12.207186,2 C13.1850287,2 13.4168222,2.02051129 13.835924,2.25549247 Z M2.79281402,4 C2.40971727,4 2.28021161,4.00219923 2.16859719,4.01207593 C2.16462813,4.01242715 2.1608085,4.01278049 2.15718565,4.01313503 C2.15731305,4.01677295 2.15746762,4.02060577 2.15764405,4.02458642 C2.16260537,4.13652709 2.17754138,4.26518737 2.22817288,4.64492356 L3.80290976,16.4554501 C3.82988231,16.6577443 3.84041904,16.734243 3.85310503,16.816705 C3.86492072,16.89351 3.87513569,16.9499378 3.88407827,16.9901992 C3.88853045,16.9905805 3.89327816,16.9909605 3.89829857,16.9913365 C3.99293895,16.9984243 4.10206199,17 4.42488544,17 L10.5751146,17 C10.897938,17 11.0070611,16.9984243 11.1017014,16.9913365 C11.1067152,16.990961 11.111457,16.9905815 11.1159041,16.9902007 C11.1168694,16.9858429 11.1178722,16.9811928 11.1189071,16.9762727 C11.1384408,16.8833992 11.1544247,16.7754417 11.1970903,16.4554501 L12.7718271,4.64492356 C12.8224586,4.26518737 12.8373946,4.13652709 12.8423559,4.02458642 C12.8425324,4.02060578 12.8426869,4.01677297 12.8428143,4.01313503 C12.8391915,4.01278049 12.8353719,4.01242715 12.8314028,4.01207593 C12.7197884,4.00219923 12.5902827,4 12.207186,4 L2.79281402,4 Z"/>
    <path class="trash-can-lid" d="M11,1 L11,2 L15,2 C15.5522847,2 16,2.44771525 16,3 C16,3.55228475 15.5522847,4 15,4 L10,4 C9.44771525,4 9,3.55228475 9,3 L9,1 L6,1 L6,3 C6,3.55228475 5.55228475,4 5,4 L0,4 C-0.55228475,4 -1,3.55228475 -1,3 C-1,2.44771525 -0.55228475,2 0,2 L4,2 L4,1 C4,-0.1045695 4.8954305,-1 6,-1 L9,-1 C10.1045695,-1 11,-0.1045695 11,1 Z"/>
    <g transform="translate(5.125, 7)">
      <path d="M1.37413307,-0.0416305447 L1.62413307,5.95836946 C1.64712499,6.51017541 1.2184365,6.97614116 0.666630545,6.99913307 C0.114824585,7.02212499 -0.351141158,6.5934365 -0.374133073,6.04163054 L-0.624133073,0.0416305447 C-0.647124988,-0.510175415 -0.218436504,-0.976141158 0.333369455,-0.999133073 C0.885175415,-1.02212499 1.35114116,-0.593436504 1.37413307,-0.0416305447 Z"/>
      <path d="M5.37413307,0.0416305447 L5.12413307,6.04163054 C5.10114116,6.5934365 4.63517541,7.02212499 4.08336946,6.99913307 C3.5315635,6.97614116 3.10287501,6.51017541 3.12586693,5.95836946 L3.37586693,-0.0416305447 C3.39885884,-0.593436504 3.86482459,-1.02212499 4.41663054,-0.999133073 C4.9684365,-0.976141158 5.39712499,-0.510175415 5.37413307,0.0416305447 Z"/>
    </g>
  </g>
</svg>`;

const NEW_CHAT_SVG = `
<svg class="new-chat-icon" width="14" height="14" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <g fill="currentColor" fill-rule="nonzero">
    <path class="chat-bubble" d="M17.6584169,3.5590025 L14.4019386,6.96743654 L12.7431088,6.96889346 C7.85372399,6.96889346 6.68429888,7.06443927 5.89828216,7.46493479 C5.04193572,7.90126509 4.34570434,8.59749647 3.90937404,9.45384291 C3.50887852,10.2398596 3.41333271,11.4092847 3.41333271,16.2986695 L3.41333271,19.2568912 C3.41333271,24.146276 3.50887852,25.3157011 3.90937404,26.1017178 C4.34570434,26.9580643 5.04193572,27.6542957 5.89828216,28.090626 C6.68429888,28.4911215 7.85372399,28.5866673 12.7431088,28.5866673 L15.7013305,28.5866673 C20.5907153,28.5866673 21.7601404,28.4911215 22.5461571,28.090626 C23.4025035,27.6542957 24.0987349,26.9580643 24.5350652,26.1017178 C24.9355607,25.3157011 25.0311065,24.146276 25.0311065,19.2568912 L25.0309196,18.3023949 L28.4427529,14.7298286 C28.4444393,15.2202587 28.4444393,15.7421025 28.4444393,16.2986695 L28.4444393,19.2568912 C28.4444393,23.7173975 28.4444393,25.9476506 27.5763669,27.6513385 C26.8127889,29.1499447 25.594384,30.3683496 24.0957777,31.1319277 C22.3920899,32 20.1618367,32 15.7013305,32 L12.7431088,32 C8.28260253,32 6.0523494,32 4.34866154,31.1319277 C2.85005528,30.3683496 1.63165035,29.1499447 0.868072324,27.6513385 C0,25.9476506 0,23.7173975 0,19.2568912 L0,16.2986695 C0,11.8381633 0,9.60791015 0.868072324,7.90422229 C1.63165035,6.40561603 2.85005528,5.1872111 4.34866154,4.42363307 C6.0523494,3.55556075 8.28260253,3.55556075 12.7431088,3.55556075 L15.7013305,3.55556075 C16.4073099,3.55556075 17.0574204,3.55556075 17.6584169,3.5590025 Z"/>
    <path class="pencil" d="M30.5120367,1.35354226 L30.8520247,1.7151806 C32.4422808,3.58872274 32.3864273,6.39944796 30.6464578,8.2090163 L22.5656511,16.6130552 L18.5252478,20.8150746 L16.5050462,22.9160843 C15.9220641,23.5223857 14.4769258,24.1185081 12.4012095,24.7879522 C11.5957257,25.0477306 10.8070719,25.2742355 10.1877672,25.4224582 C9.84313072,25.5049425 9.54955982,25.5638124 9.30626521,25.5964291 C9.13875455,25.6188859 8.98692964,25.6305435 8.83512804,25.6276659 C8.4266836,25.6199234 8.09082973,25.5478415 7.70265338,25.2177894 C7.26392781,24.8447571 7.14412793,24.4696724 7.10434306,24.0193708 C7.090051,23.8576074 7.09321636,23.6977471 7.10785267,23.5214293 C7.12843667,23.2734619 7.17463852,22.9752302 7.24358914,22.623641 C7.36579341,22.0005038 7.56218942,21.2017913 7.79383568,20.379362 C8.38327745,18.286627 8.93291933,16.8005523 9.51518467,16.1949964 L11.5354199,14.0939517 L15.5758904,9.89186243 L23.6565626,1.48796331 C25.5125302,-0.442242924 28.5818305,-0.502425283 30.5120367,1.35354226 Z M25.9865277,3.72831431 L17.9058554,12.1322134 L13.865385,16.3343027 L11.9120206,18.3658017 C11.8955547,18.3958176 11.8747463,18.4366922 11.8509569,18.4866988 C11.7706259,18.6555598 11.6738925,18.8910952 11.5678942,19.1776842 C11.3563058,19.7497589 11.121115,20.4887535 10.9051006,21.2556839 C10.8410241,21.4831792 10.7800696,21.7080931 10.7238793,21.924964 C10.9462369,21.8583959 11.1766093,21.7866322 11.4090678,21.7116615 C12.1678274,21.4669521 12.8930568,21.2062531 13.4522318,20.9755924 C13.7329577,20.8597924 13.9629445,20.7551796 14.1271732,20.6693305 C14.1748977,20.644383 14.2139212,20.6226458 14.2426125,20.6055008 L16.1952828,18.5747236 L20.2356861,14.3727042 L28.3164927,5.96866531 C28.9351486,5.32526323 28.9150878,4.30216313 28.2716857,3.6835073 L28.1467896,3.57499053 C27.501976,3.06979397 26.5665175,3.12512486 25.9865277,3.72831431 Z"/>
  </g>
</svg>`;

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
  soundEffectsToggle: document.querySelector("#soundEffectsToggle"),
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
  fileInput: document.querySelector("#fileInput"),
  attachmentPreview: document.querySelector("#attachmentPreview"),
  displayNameInput: document.querySelector("#displayNameInput"),
  apiKeysList: document.querySelector("#apiKeysList"),
  uninstallButton: document.querySelector("#uninstallButton"),
  uninstallModal: document.querySelector("#uninstallModal"),
  uninstallConfirmButton: document.querySelector("#uninstallConfirmButton"),
  setupModal: document.querySelector("#setupModal"),
  autoNameToggle: document.querySelector("#autoNameToggle"),
};

const dropdowns = {};

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
    soundEffects: localStorage.getItem("vanilla-sound-effects") !== "false",
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
    dictationEngine: localStorage.getItem("vanilla-dictation-engine") || "vosk",
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

// Trash icon now uses ASSET.trash instead of inline SVG

function renderConversationList() {
  els.conversationList.innerHTML = "";
  if (!state.conversations.length) {
    const empty = document.createElement("div");
    empty.className = "conversation-empty";
    empty.innerHTML = `${MASCOT_SVG("mascot mascot-svg")}
      <span class="mascot-zzz" aria-hidden="true">z&thinsp;Z</span>
      <p class="conversation-empty-text">No chats yet — start one, it's on the house.</p>`;
    els.conversationList.append(empty);
    armMascotNap(empty.querySelector(".mascot"));
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
    pinButton.innerHTML = `<img src="${ASSET.pin}" alt="">`;
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
    renameButton.innerHTML = NEW_CHAT_SVG;
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
    deleteButton.innerHTML = TRASH_SVG;
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
        deleteButton.innerHTML = TRASH_SVG;
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
    await api(`/api/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (state.activeConversation?.id === id) {
      state.activeConversation = null;
      els.messages.innerHTML = "";
      els.emptyState.hidden = false;
      chooseGreeting();
    }
    await refreshConversations();
    showNotification("Chat deleted");
    Sounds.delete();
  } catch (error) {
    showNotification(error.action || error.message || "Failed to delete chat", "error");
  }
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
    ${MASCOT_SVG("assistant-mark mascot-svg")}
    <div class="assistant-body">${done ? renderMarkdown(content) : loaderHtml()}</div>`;
  els.messages.append(wrap);
  els.emptyState.hidden = true;
  scrollToBottom();
  return wrap;
}

const LOADER_MESSAGES = [
  "Reticulating splines…",
  "Consulting the oracle…",
  "Stirring the vanilla…",
  "Gathering the good thoughts…",
  "Polishing the answer…",
];
let loaderMessageIndex = 0;

function loaderHtml() {
  return '<div class="typing-loader" aria-label="Waiting for response"><span></span><span></span><span></span><span class="loader-msg" data-cycle>Reticulating splines…</span></div>';
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
  "what's up?",
  "Or ask me something spicy 🌶️",
  "Ask anything…",
  "Give me the weird version.",
  "What needs building?",
];
let placeholderIndex = 0;

function startPlaceholderRotation() {
  setInterval(() => {
    if (themePlaceholder) return;
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
    state.conversations = await api("/api/conversations");
    renderConversationList();
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
    updateModelLabel();
    renderMessages(conv);
    renderConversationList();
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
    body: JSON.stringify({ title, model: state.currentModel, provider: state.currentProvider, autoTitle: state.settings.autoName }),
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
    await streamChat(conv.id, message);
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
          progress.querySelector(".upload-label").textContent = `Uploading ${name} — ${pct}%`;
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

async function streamChat(conversationId, message) {
  setRunning(conversationId, true);
  const assistant = addAssistantMessage("");
  state.activeAssistant = assistant.querySelector(".assistant-body");
  state.tokenQueue = "";
  state.tokenText = "";

  state.activeAssistant.textContent = state.settings.webSearch ? "Searching the web…" : "Loading model...";
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
        search: state.settings.webSearch,
        searchBackend: state.settings.searchBackend,
        searchApiKey: state.settings.searchBackend === "brave" ? (state.settings.braveApiKey || "") : undefined,
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
  els.submitIcon.src = running ? ASSET.stop : ASSET.submit;
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
  
  let html = `<div class="error-message"><p><strong>${escapeHtml(message)}</strong></p>`;
  
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
  "Chat pinned": ["Chat pinned", "Pinned. Classy.", "It's a keeper now.", "Pinned for later."],
  "Chat unpinned": ["Chat unpinned", "Unpinned. Free as a bird.", "Let it go."],
  "Chat renamed": ["Chat renamed", "Renamed. Fits better now.", "New name, who dis?"],
  "Chat exported": ["Chat exported", "Exported. Precious cargo.", "Saved. Feels good."],
  "Chat deleted": ["Chat deleted", "Gone. No witnesses.", "Deleted. Fresh air."],
};

function showNotification(message, type = "info", duration = 3000) {
  if (type === "success" && SUCCESS_VARIANTS[message]) {
    const variants = SUCCESS_VARIANTS[message];
    message = variants[Math.floor(Math.random() * variants.length)];
  }
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `app-notification app-notification-${type}`;
  
  // Use appropriate icon based on type
  let iconContent = '';
  if (type === "error") {
    iconContent = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM9.75 12.75H8.25V11.25H9.75V12.75ZM9.75 9.75H8.25V5.25H9.75V9.75Z" fill="currentColor"/></svg>';
  } else if (type === "success") {
    iconContent = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM7.5 12.75L3.75 9L4.8075 7.9425L7.5 10.6275L13.1925 4.935L14.25 6L7.5 12.75Z" fill="currentColor"/></svg>';
  } else if (type === "warning") {
    iconContent = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 15.75H16.5L9 2.25L1.5 15.75ZM9.75 13.5H8.25V12H9.75V13.5ZM9.75 10.5H8.25V7.5H9.75V10.5Z" fill="currentColor"/></svg>';
  } else {
    iconContent = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM9.75 12.75H8.25V8.25H9.75V12.75ZM9.75 6.75H8.25V5.25H9.75V6.75Z" fill="currentColor"/></svg>';
  }
  
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
      status.textContent = `Connected — ${models.length} model${models.length === 1 ? "" : "s"} available (${preview}${models.length > 3 ? "…" : ""}).`;
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
          <button class="api-key-toggle" type="button" aria-label="Show key" title="Show key">
            <img src="${ASSET.keyShown}" alt="">
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

    row.querySelector(".api-key-toggle").addEventListener("click", (e) => {
      const button = e.currentTarget;
      const img = button.querySelector("img");
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      img.src = isPassword ? ASSET.keyHidden : ASSET.keyShown;
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
}

function updateDictationNote() {
  const engine = state.settings.dictationEngine;
  if (engine === "vosk") {
    els.dictationEngineNote.textContent = "VOSK runs in your browser, downloads ~40MB on first use. Decent accuracy, works offline.";
    if (els.dictationButton) els.dictationButton.style.display = '';
  } else {
    els.dictationEngineNote.textContent = "Voice dictation is disabled. Enable it above to use hands-free input.";
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

function applyTheme(theme) {
  const root = document.documentElement;
  const colors = theme?.colors;

  if (colors) {
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
    ["--bg", "--text", "--bubble", "--line", "--panel", "--panel-strong", "--soft", "--surface"].forEach((property) => {
      root.style.removeProperty(property);
    });
  }

  if (theme?.accent) root.style.setProperty("--accent", theme.accent);
  else root.style.removeProperty("--accent");

  const brand = document.querySelector(".brand-logo");
  if (brand) {
    brand.outerHTML = theme?.logo ? injectClass(theme.logo, "brand-logo") : (originalBrandLogo || brand.outerHTML);
  }

  themeMascot = theme?.mascot || null;
  const emptyMascot = document.querySelector("#emptyState .empty-mascot");
  if (emptyMascot) {
    emptyMascot.outerHTML = theme?.mascot ? injectClass(theme.mascot, "empty-mascot mascot-svg") : (originalEmptyMascot || emptyMascot.outerHTML);
  }

  if (theme?.appName) document.title = theme.appName;
  else document.title = originalTitle;

  if (theme?.favicon) {
    if (!themeFaviconLink) {
      themeFaviconLink = document.createElement("link");
      themeFaviconLink.rel = "icon";
      document.head.appendChild(themeFaviconLink);
    }
    themeFaviconLink.href = theme.favicon;
  } else if (themeFaviconLink) {
    themeFaviconLink.remove();
    themeFaviconLink = null;
  }

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
  if (els.soundEffectsToggle) els.soundEffectsToggle.checked = settings.soundEffects;
  Sounds.setEnabled(settings.soundEffects);
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
  if (els.autoNameToggle) els.autoNameToggle.checked = settings.autoName;
  if (els.webSearchToggle) els.webSearchToggle.checked = settings.webSearch;
  const searchPill = document.querySelector('[data-tool="search"]');
  if (searchPill) {
    searchPill.dataset.active = String(settings.webSearch);
    searchPill.setAttribute("aria-pressed", String(settings.webSearch));
  }
  if (dropdowns.searchBackend) dropdowns.searchBackend.setValue(settings.searchBackend);
  if (dropdowns.dictationEngine) dropdowns.dictationEngine.setValue(settings.dictationEngine);
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
  localStorage.setItem("vanilla-theme", settings.theme);
  localStorage.setItem("vanilla-density", settings.density);
  localStorage.setItem("vanilla-text-size", settings.textSize);
  localStorage.setItem("vanilla-accent", settings.accent);
  localStorage.setItem("vanilla-sidebar", settings.sidebar);
  localStorage.setItem("vanilla-reduce-motion", String(settings.reduceMotion));
  localStorage.setItem("vanilla-enter-to-send", String(settings.enterToSend));
  localStorage.setItem("vanilla-show-stats", String(settings.showStats));
  localStorage.setItem("vanilla-sound-effects", String(settings.soundEffects));
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
  localStorage.setItem("vanilla-search-backend", settings.searchBackend);
  localStorage.setItem("vanilla-brave-key", settings.braveApiKey || "");
  localStorage.setItem("vanilla-dictation-engine", settings.dictationEngine || "vosk");
  applyCompareVisibility();
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
  els.settingsModal.hidden = true;
  els.installModal.hidden = true;
  els.uninstallModal.hidden = true;
  if (els.exportModal) els.exportModal.hidden = true;
  if (els.compareModal) els.compareModal.hidden = true;
  if (els.promptModal) els.promptModal.hidden = true;
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
    const results = await api(`/api/search?q=${encodeURIComponent(q)}`);
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

function formatCount(value) {
  if (!Number.isFinite(value) || value <= 0) return "—";
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
    els.uninstallButton.textContent = "Uninstall Vanilla Chat…";
    showNotification(error.action || error.message || "Failed to uninstall", "error");
  }
}

function bindEvents() {
  const toggleSidebar = () => {
    Sounds.toggle();
    const next = els.shell.dataset.sidebar === "open" ? "closed" : "open";
    state.settings.sidebar = next;
    applySettings();
    els.sidebarToggle.setAttribute("aria-label", next === "open" ? "Collapse sidebar" : "Expand sidebar");
  };
  els.sidebarToggle.addEventListener("click", toggleSidebar);
  els.mainSidebarToggle.addEventListener("click", toggleSidebar);
  document.querySelectorAll('[data-action="new-chat"]').forEach((button) => {
    button.addEventListener("click", newChat);
  });
  document.querySelectorAll('[data-action="search"]').forEach((button) => {
    button.addEventListener("click", () => openModal(els.searchModal));
  });
  els.settingsButton.addEventListener("click", () => openModal(els.settingsModal));
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
  });  els.conversationPromptSave.addEventListener("click", saveConversationPrompt);
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
  if (els.soundEffectsToggle) {
    els.soundEffectsToggle.addEventListener("change", () => {
      state.settings.soundEffects = els.soundEffectsToggle.checked;
      applySettings();
      if (state.settings.soundEffects) Sounds.toggle();
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
        showNotification("LM Studio enabled — start the local server in LM Studio to connect", "info", 5000);
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
        showNotification(`${label} enabled — make sure it is installed and on your PATH`, "info", 5000);
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
      const musicNext = els.setupModal?.querySelector("#setupMusicNext");
      if (musicNext) { musicNext.disabled = true; delete musicNext.dataset.music; }
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
        <img src="${ASSET.close}" alt="">
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

function updatePromptPill() {
  if (!els.promptPillLabel) return;
  const hasPrompt = Boolean(state.activeConversation?.customPrompt?.trim());
  els.promptPillLabel.textContent = hasPrompt ? "prompt ✓" : "prompt";
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
    col.innerHTML = `<div class="compare-col-head"><span class="compare-col-provider">${escapeHtml(m.providerLabel || m.provider)}</span><span class="compare-col-model">${escapeHtml(m.model)}</span></div><div class="compare-col-body"><div class="typing-loader"><span></span><span></span><span></span><span class="loader-msg" data-cycle>Reticulating splines…</span></div></div>`;
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
  setShortcuts();
  chooseGreeting();
  applySettings(); // Apply settings immediately to prevent sidebar animation on load
  bindEvents();
  bindSetupFlow();
  bindHuggingFace();
  initDictation();
  updateDictationNote();
  startLoaderRotation();
  startPlaceholderRotation();
  await Promise.all([loadProvidersAndModels(), refreshConversations(), refreshStats(), loadThemes()]);
  renderApiKeys();
  setInterval(refreshStats, 3000);
  attachCodeCopy();
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
    stepAttr === "5" ? 5 :
    stepAttr === "6" ? 6 :
    stepAttr === "7a" ? 7 :
    stepAttr === "7b" ? 7 : 1;
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
      const img = keyToggle.querySelector("img");
      const isPassword = apiKeyInput.type === "password";
      apiKeyInput.type = isPassword ? "text" : "password";
      img.src = isPassword ? ASSET.keyHidden : ASSET.keyShown;
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
      showSetupStep("5");
    });
  }

  // Step 5: background music preference
  const musicButtons = els.setupModal.querySelectorAll(".setup-choice[data-music]");
  const musicNext = els.setupModal.querySelector("#setupMusicNext");

  musicButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      musicButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      musicNext.disabled = false;
      musicNext.dataset.music = btn.dataset.music;
    });
  });

  musicNext.addEventListener("click", () => {
    const music = musicNext.dataset.music;
    if (music === "none") {
      state.settings.ambientMusic = false;
    } else if (music) {
      state.settings.ambientMusic = true;
      state.settings.musicTrack = music;
    }
    applySettings();
    showSetupStep("6");
  });

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
        whisperStatus.hidden = false;
        whisperStatus.textContent = "Checking Whisper installation...";
        try {
          const status = await api("/api/whisper/status");
          if (status.installed) {
            whisperStatus.textContent = "✓ Whisper is installed and ready.";
          } else {
            whisperStatus.textContent = "Whisper will be downloaded (~1.5GB) when you continue.";
          }
        } catch (error) {
          whisperStatus.textContent = "⚠ Could not check Whisper status.";
        }
      } else {
        whisperStatus.hidden = true;
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
          whisperStatus.textContent = "✓ Whisper installed successfully!";
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
      if (currentStep === "5") showSetupStep("4");
      if (currentStep === "6a" || currentStep === "6b") showSetupStep("5");
    });
  });
}

boot();
