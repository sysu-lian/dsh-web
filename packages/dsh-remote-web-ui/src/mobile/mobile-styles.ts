/**
 * Mobile surface stylesheet, shipped as a string and injected at boot (the
 * standalone page has no CSS-module pipeline).
 */
export const mobileCss = `/* Mobile surface chrome: standalone stylesheet (no main-UI design tokens —
   this page boots without the shell). Light-first palette; the dark palette
   applies only when the header toggle sets [data-theme='dark']. */

:root {
  --m-bg: #f3f5f9;
  --m-bg-raised: #ffffff;
  --m-bg-input: #ffffff;
  --m-border: #dfe4ec;
  --m-text: #1c2333;
  --m-text-secondary: #4d5768;
  --m-text-tertiary: #8b95a7;
  --m-accent: #2f6fed;
  --m-accent-soft: rgba(47, 111, 237, 0.12);
  --m-danger: #d64545;
  --m-success: #1e9e6a;
  --m-radius: 12px;
  --m-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
  --m-shadow-raise: 0 6px 20px rgba(16, 24, 40, 0.1);
  --m-backdrop: rgba(15, 23, 42, 0.4);

  /* ── Official DeepSeek Harness design tokens (conversation-area parity) ──
     Mirrors the desktop web UI's dsw token system so the chat surface renders
     the exact same palette/typography as https://dsh.chuanxi.fun/. */
  --dsw-font-family-code: "SF Mono", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, "PingFang SC", "Microsoft YaHei";
  --dsw-font-base-16: 16px/24px var(--dsw-font-family);
  --dsw-font-markdown-base: 16px/28px var(--dsw-font-family);
  --dsw-font-s-strong-14: 500 14px/24px var(--dsw-font-family);
  --dsw-font-xs-13: 13px/20px var(--dsw-font-family);
  --dsw-font-markdown-code-block-small: 400 11px/16px var(--dsw-font-family-code);
  --dsw-shadow-lv2: 0 4px 12px 0 rgba(0, 0, 0, .02), 0 2px 8px 0 rgba(0, 0, 0, .04);
  --dsw-alias-label-primary: rgb(15, 17, 21);
  --dsw-alias-label-secondary: rgb(207, 211, 214);
  --dsw-alias-label-tertiary: rgb(173, 178, 184);
  --dsw-alias-label-caption: rgb(173, 178, 184);
  --dsw-alias-label-primary-dimmed: rgb(235, 238, 242);
  --dsw-alias-bubble: rgb(237, 243, 254);
  --dsw-alias-markdown-code-block: rgb(249, 250, 251);
  --dsw-alias-interactive-bg-hover: rgba(38, 49, 72, .06);
  --dsw-alias-interactive-bg-hover-solid: rgb(241, 243, 245);
  --dsw-alias-border-l2: rgba(0, 0, 0, .1);
  --dsw-alias-button-floating-fill: rgb(255, 255, 255);
  --dsw-alias-button-floating-hover: rgb(241, 243, 245);
  --dsw-alias-state-error-primary: rgb(236, 19, 19);
}

:root[data-theme='dark'] {
  --m-bg: #111418;
  --m-bg-raised: #1a1f26;
  --m-bg-input: #20262e;
  --m-border: #2b333d;
  --m-text: #e8eaed;
  --m-text-secondary: #9aa3ad;
  --m-text-tertiary: #6b747f;
  --m-accent: #4f8cff;
  --m-accent-soft: rgba(79, 140, 255, 0.14);
  --m-danger: #e5534b;
  --m-success: #3fb68b;
  --m-radius: 12px;
  --m-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  --m-shadow-raise: 0 6px 20px rgba(0, 0, 0, 0.4);
  --m-backdrop: rgba(0, 0, 0, 0.55);

  /* Official dsw tokens — dark palette (see light :root for the rationale). */
  --dsw-alias-label-primary: rgb(249, 250, 251);
  --dsw-alias-label-secondary: rgb(97, 102, 107);
  --dsw-alias-label-tertiary: rgb(129, 133, 140);
  --dsw-alias-label-caption: rgb(129, 133, 140);
  --dsw-alias-label-primary-dimmed: rgb(15, 17, 21);
  --dsw-alias-bubble: rgb(44, 44, 46);
  --dsw-alias-markdown-code-block: rgb(27, 27, 28);
  --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, .08);
  --dsw-alias-interactive-bg-hover-solid: rgb(53, 54, 56);
  --dsw-alias-border-l2: rgba(255, 255, 255, .12);
  --dsw-alias-button-floating-fill: rgb(44, 44, 46);
  --dsw-alias-button-floating-hover: rgb(53, 54, 56);
  --dsw-alias-state-error-primary: rgb(242, 90, 90);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: var(--m-bg);
  color: var(--m-text);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', 'Segoe UI', sans-serif;
  font-size: 15px;
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
}

/* The app fills exactly one viewport: the page itself never scrolls, each
   view owns its scroll region (chat history, session lists) and the chat
   composer stays pinned to the bottom of the screen. */
#root {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── header ─────────────────────────────────────────────────────────── */

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px 10px;
  background: color-mix(in srgb, var(--m-bg) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--m-border);
}

.mobile-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.mobile-titleInline {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-back {
  flex: none;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--m-text);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}

.mobile-back:active {
  background: var(--m-bg-raised);
}

.mobile-back:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--m-bg), 0 0 0 4px var(--m-accent);
}

.mobile-theme-toggle {
  flex: none;
  margin-left: auto;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--m-text-secondary);
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease, box-shadow 0.12s ease;
}

.mobile-theme-toggle:active {
  background: var(--m-bg-raised);
}

.mobile-theme-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--m-bg), 0 0 0 4px var(--m-accent);
}

.mobile-theme-toggle svg {
  width: 18px;
  height: 18px;
}

/* ── lists ───────────────────────────────────────────────────────────── */

.mobile-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 8px 0 calc(env(safe-area-inset-bottom, 0px) + 16px);
}

.mobile-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: calc(100% - 24px);
  margin: 0 12px 8px;
  padding: 13px 14px;
  border: 1px solid var(--m-border);
  border-radius: 14px;
  background: var(--m-bg-raised);
  box-shadow: var(--m-shadow);
  color: var(--m-text);
  text-align: left;
  cursor: pointer;
}

.mobile-row:active {
  background: color-mix(in srgb, var(--m-text) 5%, var(--m-bg-raised));
}

.mobile-rowMain {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.mobile-rowTitle {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}

.mobile-rowMeta {
  flex: none;
  color: var(--m-text-tertiary);
  font-size: 12px;
}

.mobile-chevron {
  flex: none;
  color: var(--m-text-tertiary);
  font-size: 18px;
}

.mobile-live {
  margin-left: 6px;
  color: var(--m-success);
  font-size: 10px;
  vertical-align: middle;
}

/* ── empty / error states ────────────────────────────────────────────── */

.mobile-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
}

.mobile-muted {
  margin: 0;
  color: var(--m-text-tertiary);
}

.mobile-error {
  margin: 0;
  color: var(--m-danger);
}

.mobile-pad {
  padding: 8px 16px;
}

.mobile-create {
  display: grid;
  gap: 8px;
}

.mobile-preset {
  display: grid;
  gap: 4px;
}

.mobile-presetLabel {
  color: var(--m-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.mobile-presetSelect {
  width: 100%;
  height: 40px;
  padding: 0 36px 0 12px;
  border: 1px solid var(--m-border);
  border-radius: 10px;
  background: var(--m-bg-input);
  color: var(--m-text);
  font: inherit;
}

.mobile-presetSelect:disabled {
  opacity: 0.6;
}

.mobile-presetDescription {
  margin: 0;
  color: var(--m-text-tertiary);
  font-size: 12px;
}

/* ── buttons ─────────────────────────────────────────────────────────── */

.mobile-button {
  min-height: 40px;
  padding: 0 18px;
  border: 1px solid var(--m-border);
  border-radius: 10px;
  background: var(--m-bg-raised);
  color: var(--m-text);
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mobile-button:disabled {
  opacity: 0.5;
}

.mobile-block {
  display: block;
  width: calc(100% - 32px);
  margin: 4px 16px;
}

/* Primary action (create session): accent fill, readable on both themes. */
.mobile-new {
  display: block;
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--m-accent) 0%, #4c8dff 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(47, 111, 237, 0.3);
}

.mobile-new:active {
  opacity: 0.88;
}

.mobile-new:disabled {
  opacity: 0.6;
}

.mobile-hint {
  display: block;
  margin-top: 2px;
  color: var(--m-text-tertiary);
  font-size: 12px;
}

/* ── chat ────────────────────────────────────────────────────────────── */

.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Message rows mirror the official desktop web UI: assistant messages are
   full-width markdown with no bubble; user messages are right-aligned bubbles. */
.chat-msg {
  max-width: 100%;
  overflow-wrap: break-word;
}

.chat-msg-user {
  align-self: flex-end;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  /* The official .gdEzaW_userStack already caps width at min(525px, 82%).
     Do NOT add a second max-width here, or the bubble becomes ~67% of the
     viewport and wraps too early on narrow screens. */
  max-width: 100%;
}

.chat-msg-user .chat-msg-text {
  display: inline-block;
  max-width: 100%;
  overflow-wrap: break-word;
  background: var(--dsw-alias-bubble);
  color: var(--dsw-alias-label-primary);
  border-radius: 22px;
  padding: 10px 16px;
  font-size: 16px;
  line-height: 24px;
  white-space: pre-wrap;
}

.chat-msg-assistant {
  align-self: stretch;
  background: transparent;
  padding: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 16px;
  line-height: 28px;
}

.chat-msg-pending .chat-msg-text::after {
  content: '▍';
  animation: chat-blink 1s steps(2) infinite;
}

@keyframes chat-blink {
  50% {
    opacity: 0;
  }
}

.chat-msg-failed {
  border-color: var(--m-danger);
}

.chat-msg-failtag {
  display: inline-block;
  margin-top: 6px;
  padding: 1px 8px;
  border: 1px solid var(--m-danger);
  border-radius: 999px;
  color: var(--m-danger);
  font-size: 11px;
}

.chat-msg-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}

.chat-msg-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.chat-msg-footer .chat-msg-time {
  margin-top: 0;
  margin-left: auto;
  white-space: nowrap;
}

.chat-msg-footer-user {
  justify-content: flex-end;
}

.chat-msg-footer-user .chat-msg-time {
  margin-left: 0;
}

.chat-msg-toggle {
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
  padding: 6px 2px;
  min-height: 34px;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  cursor: pointer;
}

/* ── assistant message action toolbar (copy / thumbs up / thumbs down) ──
   Round 28px icon buttons, label-tertiary, hover = interactive-bg-hover —
   matching the official MessageIconActions row. */

.chat-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  height: 28px;
}

.chat-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 6px;
  border: none;
  border-radius: 28px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.chat-action-btn:active,
.chat-action-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}

.chat-action-btn-active,
.chat-action-btn-active:active,
.chat-action-btn-active:hover {
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover);
}

/* Wrapper around the official .p-xYUq_actions row plus any extra mobile
   affordances (e.g. the stats toggle). Keeps everything on one 28px-high line. */
.chat-msg-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.chat-msg-actions .p-xYUq_actions {
  margin-top: 0;
  flex: 1;
}

/* Token / performance stats line shown below the assistant message actions.
   Uses label-tertiary, wraps on small screens, and is not interactive. */
.chat-stats-line {
  margin-top: 6px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 20px;
  white-space: normal;
  word-break: break-all;
}

/* Assistant markdown content (GFM subset; renderer in markdown.ts). */
.chat-md {
  white-space: normal;
}
.chat-md-collapsed {
  max-height: 45vh;
  overflow: hidden;
  position: relative;
}
.chat-md-collapsed::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 28px;
  background: linear-gradient(transparent, var(--m-bg-raised));
  pointer-events: none;
}
.chat-md-body {
  color: var(--dsw-alias-label-primary);
  font-size: 16px;
  line-height: 28px;
  flex-direction: column;
  display: flex;
  gap: 16px;
}
.chat-md-body > *:first-child { margin-top: 0; }
.chat-md-body > *:last-child { margin-bottom: 0; }
.chat-md-body p { margin: 0; }
.chat-md-body h1, .chat-md-body h2, .chat-md-body h3,
.chat-md-body h4, .chat-md-body h5, .chat-md-body h6 {
  margin: 0;
  font-weight: 650;
  line-height: 1.3;
}
.chat-md-body h1 { font-size: 1.35em; }
.chat-md-body h2 { font-size: 1.25em; }
.chat-md-body h3 { font-size: 1.15em; }
.chat-md-body h4, .chat-md-body h5, .chat-md-body h6 { font-size: 1.05em; }
.chat-md-body code {
  font-family: var(--dsw-font-family-code);
  font-size: 0.9em;
  background: var(--dsw-alias-markdown-code-block);
  padding: 1px 5px;
  border-radius: 4px;
}
.chat-md-body pre {
  margin: 0;
  padding: 10px;
  background: var(--dsw-alias-markdown-code-block);
  color: var(--dsw-alias-label-primary);
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.5;
}
.chat-md-body pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-family: var(--dsw-font-family-code);
}

/* Code block (wired in ChatView after the markdown is injected). Mirrors the
   official CodeBlock: a banner with the language label + a copy button, over a
   surface using the official markdown-code-block token. */
.chat-code {
  position: relative;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--dsw-alias-markdown-code-block);
  border: 1px solid var(--dsw-alias-border-l2);
}
.chat-code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 4px 12px;
}
.chat-code-lang {
  color: var(--dsw-alias-label-tertiary);
  font: var(--dsw-font-markdown-code-block-small);
  text-transform: lowercase;
}
.chat-code-copy {
  flex: none;
  padding: 3px 9px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 1.4;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.chat-code-copy:active,
.chat-code-copy:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.chat-code-copy:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--dsw-alias-markdown-code-block), 0 0 0 4px var(--m-accent);
}
.chat-code pre {
  margin: 0;
  padding: 0 12px 12px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.5;
}
.chat-code pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-family: var(--dsw-font-family-code);
}
.chat-md-body ul, .chat-md-body ol { margin: 0; padding-left: 22px; }
.chat-md-body li { margin: 2px 0; }
.chat-md-body blockquote {
  margin: 0;
  padding: 4px 10px;
  border-left: 3px solid var(--m-accent);
  background: var(--dsw-alias-interactive-bg-hover);
  border-radius: 0 6px 6px 0;
  color: var(--dsw-alias-label-secondary);
}
.chat-md-body table {
  margin: 0;
  border-collapse: collapse;
  display: block;
  overflow-x: auto;
  font-size: 13px;
}
.chat-md-body th, .chat-md-body td {
  border: 1px solid var(--dsw-alias-border-l2);
  padding: 4px 8px;
}
.chat-md-body th { background: var(--dsw-alias-interactive-bg-hover-solid); }
.chat-md-body a { color: var(--m-accent); }
.chat-md-body hr { border: none; border-top: 1px solid var(--dsw-alias-border-l2); margin: 0; }
.chat-md-body img { max-width: 100%; border-radius: 8px; }

/* ── message disclosures (reasoning / tools) ─────────────────────────── */

.chat-disclosure {
  margin-bottom: 8px;
  border: 1px solid var(--m-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--m-bg) 55%, transparent);
  overflow: hidden;
}

.chat-disclosure-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  color: var(--m-text);
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}

.chat-disclosure-caret {
  flex: none;
  display: inline-flex;
  align-items: center;
  color: var(--m-text-tertiary);
  font-size: 14px;
  line-height: 1;
  transition: transform 0.15s ease;
}

.chat-disclosure-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  color: var(--m-accent);
}

.chat-disclosure-open .chat-disclosure-caret {
  transform: rotate(90deg);
}

.chat-disclosure-label {
  flex: none;
  color: var(--m-text-secondary);
}

.chat-reasoning[data-pending] .chat-disclosure-label {
  color: var(--m-accent);
}

.chat-reasoning {
  display: inline-block;
  max-width: 100%;
  margin-bottom: 4px;
  border: none;
  border-radius: 0;
  background: transparent;
  overflow: visible;
}

.chat-reasoning .chat-disclosure-head {
  display: inline-flex;
  gap: 5px;
  padding: 5px 11px;
  min-height: 30px;
  border: none;
  border-radius: 0;
  background: transparent;
}

.chat-reasoning .chat-disclosure-label {
  font-weight: 500;
  color: var(--dsw-alias-label-secondary);
}

.chat-reasoning .chat-disclosure-summary {
  margin-left: 2px;
}

.chat-reasoning .chat-disclosure-body {
  margin-top: 2px;
  padding: 4px 2px 4px 22px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 22px;
}

.chat-disclosure-summary {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--m-text-tertiary);
  font-size: 12px;
}

.chat-disclosure-count {
  flex: none;
  color: var(--m-text-tertiary);
  font-size: 11px;
}

.chat-disclosure-body {
  padding: 8px 10px 10px;
  border-top: 1px dashed var(--m-border);
  color: var(--m-text-secondary);
  font-size: 12.5px;
  line-height: 1.6;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-height: 40vh;
  overflow-y: auto;
}

.chat-tools-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-tool-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--m-border);
  border-radius: 8px;
  background: var(--m-bg-raised);
}

.chat-tool-pills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
}

.chat-tool-pill {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--m-accent-soft);
  color: var(--m-accent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.chat-tool-args {
  margin: 0;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--m-bg-input);
  color: var(--m-text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

/* ── turn status indicator (#1017) ───────────────────────────────────── */

.chat-turn-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  color: var(--m-accent);
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(
    90deg,
    var(--m-accent) 0%,
    color-mix(in srgb, var(--m-accent) 60%, #ffffff) 50%,
    var(--m-accent) 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: dsh-shimmer 1.8s linear infinite;
}

.chat-turn-dots {
  display: inline-flex;
  gap: 3px;
}

.chat-turn-dots span {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--m-accent);
  animation: dsh-dot-bounce 1.2s ease-in-out infinite;
}

.chat-turn-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.chat-turn-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes dsh-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@keyframes dsh-dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-4px); opacity: 1; }
}

/* ── approval panel (#1025) ──────────────────────────────────────────── */

.chat-approval-panel {
  margin: 8px 12px;
  padding: 10px 12px;
  border: 1px solid var(--m-accent);
  border-radius: var(--m-radius);
  background: var(--m-bg-raised);
  box-shadow: var(--m-shadow);
}

.chat-approval-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.chat-approval-reason {
  color: var(--m-text-secondary);
  font-size: 12.5px;
}

.chat-approval-error {
  margin: 4px 0;
  color: var(--m-danger);
  font-size: 12px;
}

.chat-approval-actions {
  display: flex;
  gap: 8px;
}

.chat-approval-allow {
  flex: 1;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: var(--m-accent);
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.chat-approval-allow:disabled {
  opacity: 0.6;
}

.chat-approval-reject {
  flex: 1;
  height: 34px;
  border: 1px solid var(--m-border);
  border-radius: 8px;
  background: var(--m-bg-raised);
  color: var(--m-text);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.chat-approval-reject:disabled {
  opacity: 0.6;
}

/* ── question panel (#1025) ──────────────────────────────────────────── */

.chat-question-panel {
  margin: 8px 12px;
  padding: 10px 12px;
  border: 1px solid var(--m-accent);
  border-radius: var(--m-radius);
  background: var(--m-bg-raised);
  box-shadow: var(--m-shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-question-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-question-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--m-text);
}

.chat-question-text {
  font-size: 13px;
  color: var(--m-text);
  line-height: 1.5;
}

.chat-question-detail {
  font-size: 12px;
  color: var(--m-text-secondary);
  line-height: 1.5;
}

.chat-question-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-question-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--m-border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: border-color 0.12s, background 0.12s;
}

.chat-question-option input {
  margin: 2px 0 0;
  flex: none;
}

.chat-question-option-selected {
  border-color: var(--m-accent);
  background: var(--m-accent-soft);
}

.chat-question-option-label {
  color: var(--m-text);
  font-weight: 500;
}

.chat-question-option-desc {
  display: block;
  color: var(--m-text-tertiary);
  font-size: 12px;
}

.chat-question-custom {
  width: 100%;
  min-height: 40px;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--m-border);
  border-radius: 8px;
  background: var(--m-bg-input);
  color: var(--m-text);
  font: inherit;
  font-size: 13px;
  resize: vertical;
  outline: none;
}

.chat-question-custom:focus-visible {
  border-color: var(--m-accent);
}

.chat-question-submit {
  height: 36px;
  border: none;
  border-radius: 8px;
  background: var(--m-accent);
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.chat-question-submit:disabled {
  opacity: 0.6;
}


/* ── composer toolbar (model / permission chips) ─────────────────────── */

.chat-tools {
  display: flex;
  gap: 8px;
  padding: 6px 12px 0;
}

.chat-chip {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--m-border);
  border-radius: 999px;
  background: var(--m-bg-raised);
  box-shadow: var(--m-shadow);
  color: var(--m-text);
  font-size: 12px;
  cursor: pointer;
}

.chat-chip:active {
  border-color: var(--m-accent);
  background: var(--m-accent-soft);
}

.chat-chip-label {
  flex: none;
  color: var(--m-text-tertiary);
}

.chat-chip-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-chip-chevron {
  flex: none;
  color: var(--m-text-tertiary);
  font-size: 14px;
}

/* ── bottom sheets ───────────────────────────────────────────────────── */

.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: var(--m-backdrop);
  animation: sheet-fade 0.18s ease;
}

@keyframes sheet-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.sheet {
  max-height: 74dvh;
  display: flex;
  flex-direction: column;
  background: var(--m-bg-raised);
  border: 1px solid var(--m-border);
  border-bottom: none;
  border-radius: 16px 16px 0 0;
  box-shadow: var(--m-shadow-raise);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
  animation: sheet-up 0.22s ease;
}

@keyframes sheet-up {
  from {
    transform: translateY(40px);
    opacity: 0.6;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.sheet-handle {
  flex: none;
  align-self: center;
  width: 36px;
  height: 4px;
  margin: 8px 0 4px;
  border-radius: 999px;
  background: var(--m-border);
}

.sheet-title {
  flex: none;
  padding: 6px 16px 10px;
  font-size: 15px;
  font-weight: 600;
}

.sheet-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 12px 8px;
}

.sheet-status {
  padding: 18px 8px;
  color: var(--m-text-tertiary);
  font-size: 13px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sheet-status-error {
  color: var(--m-danger);
}

.sheet-hint {
  margin: 0;
  color: var(--m-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  max-width: 32em;
}

.sheet-error {
  margin: 0 0 8px;
  color: var(--m-danger);
  font-size: 12.5px;
}

.sheet-section {
  margin-bottom: 14px;
}

.sheet-section-title {
  padding: 4px 8px 6px;
  color: var(--m-text-tertiary);
  font-size: 12px;
  font-weight: 600;
}

.sheet-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--m-text);
  text-align: left;
  cursor: pointer;
}

.sheet-option:active {
  background: var(--m-bg-input);
}

.sheet-option-selected {
  border-color: var(--m-accent);
  background: color-mix(in srgb, var(--m-accent) 12%, transparent);
}

.sheet-option:disabled {
  opacity: 0.5;
}

.sheet-option-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sheet-option-title {
  font-size: 14px;
}

.sheet-option-desc {
  color: var(--m-text-tertiary);
  font-size: 12px;
  line-height: 1.4;
}

.sheet-option-check {
  flex: none;
  color: var(--m-accent);
  font-size: 15px;
  font-weight: 700;
}

.sheet-confirm-desc {
  margin: 0 4px 14px;
  color: var(--m-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.sheet-confirm-actions {
  display: flex;
  gap: 10px;
  padding: 4px;
}

.sheet-confirm-actions .mobile-button {
  flex: 1;
}

.sheet-confirm-danger {
  flex: 1;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: var(--m-danger);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.sheet-confirm-danger:disabled {
  opacity: 0.5;
}

.chat-meta {
  margin-top: 4px;
  color: var(--m-text-tertiary);
  font-size: 11px;
}

.chat-typing {
  color: var(--m-text-tertiary);
  font-size: 13px;
  padding: 4px 2px;
}

.chat-inputbar {
  display: flex;
  gap: 8px;
  padding: 10px 12px calc(env(safe-area-inset-bottom, 0px) + 10px);
  border-top: 1px solid var(--m-border);
  background: var(--m-bg);
}

.chat-input {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  max-height: 120px;
  /* Grow with the content (still bounded by min/max-height); browsers
     without field-sizing support ignore this line and keep the old size. */
  field-sizing: content;
  padding: 9px 12px;
  border: 1px solid var(--m-border);
  border-radius: 10px;
  background: var(--m-bg-input);
  color: var(--m-text);
  font: inherit;
  font-size: 14.5px;
  resize: none;
  outline: none;
}

.chat-input:focus {
  border-color: var(--m-accent);
}

.chat-send {
  flex: none;
  align-self: flex-end;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: var(--m-accent);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.chat-send:disabled {
  opacity: 0.5;
}

/* Running state: the primary button carries only the square stop icon, so
   it centers the glyph instead of sizing to text. */
.chat-send-stop {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 0 12px;
}

.chat-load-older {
  align-self: center;
  margin: 4px 0;
  border: none;
  background: transparent;
  color: var(--m-text-secondary);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 10px;
}

/* Touch surfaces have no hover, so keyboard focus must be fully visible.
   One shared ring keeps every interactive control consistent and readable
   on both palettes. */
.mobile-row:focus-visible,
.mobile-button:focus-visible,
.mobile-new:focus-visible,
.mobile-presetSelect:focus-visible,
.chat-send:focus-visible,
.chat-chip:focus-visible,
.chat-msg-toggle:focus-visible,
.chat-load-older:focus-visible,
.chat-disclosure-head:focus-visible,
.sheet-option:focus-visible,
.sheet-confirm-danger:focus-visible,
.sheet-toggle-switch:focus-visible,
.chat-input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--m-bg), 0 0 0 4px var(--m-accent);
}

/* ── chat context usage chip (chat-tools row) ───────────────────────── */

.chat-context {
  flex: none;
  align-self: center;
  padding: 2px 10px;
  border: 1px solid var(--m-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--m-text-tertiary) 10%, transparent);
  color: var(--m-text-tertiary);
  font-size: 11px;
  line-height: 1.6;
  white-space: nowrap;
}

.chat-context-warn {
  border-color: var(--m-danger);
  background: color-mix(in srgb, var(--m-danger) 14%, transparent);
  color: var(--m-danger);
}

/* ── display sheet toggle rows ──────────────────────────────────────── */

.sheet-toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid var(--m-border);
}

.sheet-toggle-row:last-child {
  border-bottom: none;
}

.sheet-toggle-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sheet-toggle-title {
  font-size: 14px;
}

.sheet-toggle-desc {
  color: var(--m-text-tertiary);
  font-size: 12px;
  line-height: 1.4;
}

.sheet-toggle-switch {
  position: relative;
  flex: none;
  width: 44px;
  height: 26px;
  border: none;
  border-radius: 999px;
  background: var(--m-border);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.sheet-toggle-switch-on {
  background: var(--m-accent);
}

.sheet-toggle-switch-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.2);
  transition: transform 0.15s ease;
}

.sheet-toggle-switch-on .sheet-toggle-switch-knob {
  transform: translateX(18px);
}

/* Accessibility: collapse every interaction/enter animation for
   reduced-motion users; surface layout itself stays static. */
@media (prefers-reduced-motion: reduce) {
  .mobile-theme-toggle,
  .mobile-back,
  .mobile-row,
  .mobile-button,
  .mobile-new,
  .chat-send,
  .chat-chip,
  .chat-msg-toggle,
  .chat-load-older,
  .chat-disclosure-head,
  .chat-disclosure-caret,
  .chat-msg-pending .chat-msg-text::after,
  .sheet-backdrop,
  .sheet,
  .sheet-option,
  .sheet-confirm-danger,
  .sheet-toggle-switch,
  .sheet-toggle-switch-knob,
  .chat-input,
  .chat-turn-status,
  .chat-turn-dots span {
    animation: none;
    transition: none;
  }
  .chat-turn-status {
    background: none;
    -webkit-text-fill-color: var(--m-accent);
  }
}

/* ── installed-app pairing ───────────────────────────────────────────── */

.mobile-pair {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.mobile-pairCard {
  display: grid;
  width: min(100%, 420px);
  gap: 12px;
  padding: 24px;
  border: 1px solid var(--m-border);
  border-radius: 12px;
  background: var(--m-bg-raised);
  box-shadow: var(--m-shadow-raise);
}

.mobile-pairLabel {
  color: var(--m-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.mobile-pairInput {
  width: 100%;
  min-height: 42px;
  box-sizing: border-box;
  padding: 9px 12px;
  border: 1px solid var(--m-border);
  border-radius: 8px;
  background: var(--m-bg-input);
  color: var(--m-text);
  font: inherit;
  outline: none;
}

.mobile-pairInput:focus-visible {
  border-color: var(--m-accent);
  box-shadow: 0 0 0 2px var(--m-bg), 0 0 0 4px var(--m-accent);
}

.mobile-pairSubmit {
  width: 100%;
}

/* ── directory browser ─────────────────────────────────────────────── */

.dir-browser {
  display: flex;
  flex-direction: column;
}

.dir-crumbs {
  display: flex;
  align-items: center;
  overflow-x: auto;
  padding: 12px 16px;
  background: var(--m-bg-raised);
  border-bottom: 1px solid var(--m-border);
  white-space: nowrap;
}

.dir-crumbs::-webkit-scrollbar {
  display: none;
}

.dir-crumb {
  border: none;
  background: transparent;
  padding: 4px 6px;
  color: var(--m-text);
  font-size: 14px;
  cursor: pointer;
}

.dir-crumb:active {
  background: var(--m-bg-input);
  border-radius: 4px;
}

.dir-crumb-separator {
  color: var(--m-text-tertiary);
  margin: 0 4px;
  font-size: 14px;
}

.dir-entry {
  padding-left: 16px;
}

.dir-entry-hidden {
  opacity: 0.5;
}

.dir-select {
  padding: 16px;
  background: var(--m-bg);
  border-top: 1px solid var(--m-border);
}

.dir-empty {
  padding: 40px 0;
}

/* ── tool-call leading dot (official StateDot stand-in) ─────────────── */

.chat-tool-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary);
}
.chat-tool-dot[data-error] {
  background: var(--dsw-alias-state-error-primary);
}

/* ── Official conversation-area tokens (light, verbatim from dsw) ──────
   Overrides layer: defines every dsw/dsh variable the official conversation
   CSS below consumes, with the desktop web UI's real light values. */
:root {
  --ds-font-family-code: "SF Mono", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, "PingFang SC", "Microsoft YaHei";
  --dsh-chat-content-width: 768px;
  --dsh-composer-side-clearance: 0px;
  --dsw-specific-bubble: rgb(237, 243, 254);
  --dsw-specific-input-major: rgb(255, 255, 255);
  --dsw-specific-menu: rgb(255, 255, 255);
  --dsw-specific-selector: rgb(249, 250, 251);
  --dsw-specific-tip: rgb(249, 250, 251);
  --dsw-static-deepseek-500: rgb(65, 118, 230);
  --dsw-static-deepseek-400: rgb(103, 158, 254);
  --dsw-static-deepseek-200: rgb(211, 226, 255);
  --dsw-static-blue-450: rgb(77, 147, 248);
  --dsw-static-neutral-bluish-00: rgb(255, 255, 255);
  --dsw-static-neutral-bluish-50: rgb(249, 250, 251);
  --dsw-static-neutral-bluish-400: rgb(173, 178, 184);
  --dsw-alias-bg-base: rgb(255, 255, 255);
  --dsw-alias-bg-module-platform: rgb(249, 250, 251);
  --dsw-alias-border-l1: rgba(0, 0, 0, .04);
  --dsw-alias-border-l2: rgba(0, 0, 0, .1);
  --dsw-alias-border-l3: rgba(0, 0, 0, .2);
  --dsw-alias-border-l4: rgba(0, 0, 0, .3);
  --dsw-alias-label-primary-bluish: rgb(14, 48, 116);
  --dsw-alias-label-dimmed: rgb(225, 229, 238);
  --dsw-alias-markdown-code-block: rgb(249, 250, 251);
  --dsw-alias-state-error-primary: rgb(236, 19, 19);
  --dsw-alias-state-success-primary: rgb(34, 197, 94);
  --dsw-alias-state-warn-primary: rgb(245, 158, 11);
  --dsw-alias-state-warn-secondary: rgb(253, 230, 138);
  --dsw-alias-state-warn-tertiary: rgb(254, 249, 195);
  --dsw-alias-state-warn-label: rgb(133, 77, 14);
  --dsw-alias-state-business-primary: rgb(77, 147, 248);
  --dsw-alias-button-info-fill: rgb(65, 118, 230);
  --dsw-alias-button-info-hover: rgb(103, 158, 254);
  --dsw-alias-button-floating-fill: rgb(255, 255, 255);
  --dsw-alias-button-floating-hover: rgb(249, 250, 251);
  --dsw-alias-interactive-bg-hover: rgba(0, 0, 0, .04);
  --dsw-alias-interactive-bg-hover-solid: rgba(0, 0, 0, .05);
  --dsw-alias-interactive-bg-hover-danger: rgba(236, 19, 19, .08);
  --dsw-alias-line-secondary: rgba(0, 0, 0, .08);
  --dsw-alias-separator-primary: rgba(0, 0, 0, .1);
  --dsw-alias-scrollbar-bg-l2: rgba(0, 0, 0, .08);
  --dsw-alias-scrollbar-hover-l2: rgba(0, 0, 0, .2);
  --dsw-shadow-lv3: 0 0 1px 0 rgba(0, 0, 0, .2), 0 0 4px 0 rgba(0, 0, 0, .02), 0 12px 32px 0 rgba(0, 0, 0, .08);
  --dsw-font-markdown-code-block-small: 400 11px/16px var(--ds-font-family-code);
  --dsw-font-s-strong-14: 500 14px/24px var(--dsw-font-family);
  --dsw-font-xs-13: 13px/20px var(--dsw-font-family);
}

/* ── Official conversation CSS (verbatim rules from dsh-client-ui-conversation). */
/* css$15 */
.gdEzaW_userRow{flex-direction:column;align-items:flex-end;gap:6px;display:flex}.gdEzaW_userStack{flex-direction:column;align-items:flex-end;gap:8px;min-width:0;max-width:min(525px,82%);display:flex}.gdEzaW_bubble{background:var(--dsw-specific-bubble);max-width:100%;color:var(--dsw-alias-label-primary);border-radius:22px;padding:10px 16px;font-size:16px;line-height:24px}.gdEzaW_contextRow,.gdEzaW_compactionRow{padding:2px 0}.gdEzaW_compactionButton{width:100%;min-width:0;height:24px;color:inherit;font:inherit;text-align:left;background:0 0;border:none;border-radius:6px;align-items:center;padding:0;display:flex}.gdEzaW_compactionButton:not(:disabled){cursor:pointer}.gdEzaW_compactionButton:not(:disabled):hover{background:var(--dsw-alias-interactive-bg-hover)}.gdEzaW_compactionLeading{width:16px;height:16px;color:var(--dsw-alias-label-secondary);flex:none;place-items:center;margin-right:6px;display:inline-grid}.gdEzaW_compactionContextIcon,.gdEzaW_compactionDisclosureIcon{grid-area:1/1;justify-content:center;align-items:center;display:inline-flex}.gdEzaW_compactionDisclosureIcon,.gdEzaW_compactionButton:not(:disabled):hover .gdEzaW_compactionContextIcon,.gdEzaW_compactionButton:not(:disabled):focus-visible .gdEzaW_compactionContextIcon{opacity:0}.gdEzaW_compactionButton:not(:disabled):hover .gdEzaW_compactionDisclosureIcon,.gdEzaW_compactionButton:not(:disabled):focus-visible .gdEzaW_compactionDisclosureIcon{opacity:1}.gdEzaW_compactionTitle{color:var(--dsw-alias-label-primary-dimmed);flex:none;font-size:14px;line-height:24px}.gdEzaW_compactionSep{background:var(--dsw-alias-label-caption);border-radius:1px;flex:none;width:2px;height:2px;margin:0 8px}.gdEzaW_compactionSummary{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;flex:auto;font-size:14px;line-height:24px;overflow:hidden}.gdEzaW_compactionBody{color:var(--dsw-alias-label-tertiary);padding:4px 0 4px 22px;font-size:14px;line-height:24px}.gdEzaW_retryRow{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}.gdEzaW_retrySummary{width:fit-content;color:inherit;cursor:pointer;user-select:none;border-radius:3px;align-items:center;gap:7px;padding:2px 0;list-style:none;display:inline-flex}.gdEzaW_retrySummary::-webkit-details-marker{display:none}.gdEzaW_retrySummary:after{content:"";opacity:.8;border-bottom:1.5px solid;border-right:1.5px solid;width:6px;height:6px;transition:transform .12s;transform:rotate(-45deg)}.gdEzaW_retrySummary:hover{color:var(--dsw-alias-label-secondary)}.gdEzaW_retrySummary:focus-visible{outline:1.5px solid var(--dsw-alias-button-info-fill);outline-offset:2px}.gdEzaW_retryText{color:inherit}.gdEzaW_retryRow[data-active] .gdEzaW_retryText{background:linear-gradient(90deg, var(--dsw-alias-label-tertiary) 0%, var(--dsw-alias-label-tertiary) 40%, var(--dsw-alias-label-secondary) 50%, var(--dsw-alias-label-tertiary) 60%, var(--dsw-alias-label-tertiary) 100%);color:#0000;background-position:100%;background-size:200% 100%;background-clip:text;animation:1.6s ease-in-out infinite gdEzaW_retry-shimmer}.gdEzaW_retryRow[open] .gdEzaW_retrySummary:after{transform:rotate(45deg)}.gdEzaW_retryDetails{overflow-wrap:anywhere;gap:2px;margin-top:3px;padding-left:14px;font-size:12px;line-height:18px;display:grid}.gdEzaW_retryDetailLabel{color:var(--dsw-alias-label-secondary)}.gdEzaW_turnErrorRow{grid-template-columns:10px minmax(0,1fr) auto;align-items:start;gap:8px;padding:2px 0;font-size:13px;line-height:20px;display:grid}.gdEzaW_turnErrorDot{margin-top:5px}.gdEzaW_turnErrorCopy{overflow-wrap:anywhere;min-width:0}.gdEzaW_turnErrorTitle{color:var(--dsw-alias-state-error-primary);margin-right:6px;font-weight:600}.gdEzaW_turnErrorMessage{color:var(--dsw-alias-label-secondary)}.gdEzaW_turnErrorCode{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-markdown-code-block-small)}.gdEzaW_maxTokensTitle{color:var(--dsw-alias-state-warn-primary);margin-right:6px;font-weight:600}@keyframes gdEzaW_retry-shimmer{0%{background-position:100%}to{background-position:0}}@media (prefers-reduced-motion:reduce){.gdEzaW_retryRow[data-active] .gdEzaW_retryText{color:inherit;background:0 0;animation:none}}.gdEzaW_refChip{color:var(--dsw-alias-label-primary);white-space:nowrap;vertical-align:baseline;background:#6187d838;border-radius:6px;margin:0 2px;padding:0 8px;font-size:.85em;line-height:1.6;display:inline-block}
/* css$12 */
.p-xYUq_actions{align-items:center;gap:10px;height:28px;display:flex}.p-xYUq_timeStart{color:var(--dsw-alias-label-tertiary);white-space:nowrap;padding-right:12px;font-size:14px;line-height:24px}.p-xYUq_timeEnd{color:var(--dsw-alias-label-tertiary);white-space:nowrap;padding-left:12px;font-size:14px;line-height:24px}.p-xYUq_runTimeDot{margin:0 10px}@media (hover:hover){[data-time-hover-root] :is(.p-xYUq_timeStart,.p-xYUq_timeEnd){opacity:0;transition:opacity 80ms}[data-time-hover-root]:hover :is(.p-xYUq_timeStart,.p-xYUq_timeEnd),[data-time-hover-root]:focus-within :is(.p-xYUq_timeStart,.p-xYUq_timeEnd){opacity:1}}.p-xYUq_action{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:28px;justify-content:center;align-items:center;padding:6px;display:inline-flex}.p-xYUq_action:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}.p-xYUq_action[data-unavailable]{cursor:default;opacity:.4}.p-xYUq_action[data-unavailable]:hover{color:var(--dsw-alias-label-tertiary);background:0 0}.p-xYUq_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}
/* css$4 */
.hXDBwq_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}
/* css$3 */
.QWLzlG_root{flex-direction:column;display:flex}.QWLzlG_row{position:relative;overflow:hidden}.QWLzlG_root[data-state=running] .QWLzlG_row:after{content:"";inset-block:0;background:linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--dsw-alias-bg-base) 60%, transparent) 55%, transparent 100%);pointer-events:none;width:300px;animation:2.6s ease-out infinite QWLzlG_dsh-reasoning-row-sweep;position:absolute;left:0}@keyframes QWLzlG_dsh-reasoning-row-sweep{0%{left:-300px}90%,to{left:100%}}.QWLzlG_leading{flex-shrink:0}.QWLzlG_chevron{color:var(--dsw-alias-label-secondary)}.QWLzlG_title{font-weight:400}.QWLzlG_separator{background:var(--dsw-alias-label-caption);border-radius:1px;flex:none;width:2px;height:2px;margin:0 8px}.QWLzlG_summary{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;flex:auto;font-size:14px;line-height:24px;overflow:hidden}.QWLzlG_summary[data-follow-end]{text-overflow:clip}.QWLzlG_thinkBody{color:var(--dsw-alias-label-tertiary);white-space:pre-wrap;word-break:break-word;padding:4px 0 4px 22px;font-size:14px;line-height:24px}@media (prefers-reduced-motion:reduce){.QWLzlG_root[data-state=running] .QWLzlG_row:after{animation:none}}
/* css$2 */
.Sxvs8a_root{color:var(--dsw-alias-label-primary);flex-direction:column;font-size:16px;line-height:28px;display:flex}.Sxvs8a_body{flex-direction:column;gap:16px;display:flex}.Sxvs8a_stopped{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-tertiary);border-radius:6px;align-self:flex-start;padding:0 6px;font-size:11px;line-height:18px}.Sxvs8a_actions{margin-top:16px;margin-left:-6px}
/* css$1 */
._Xvjua_root{flex-direction:column;display:flex}._Xvjua_row{position:relative;overflow:hidden}._Xvjua_root[data-state=running] ._Xvjua_row:after{content:"";inset-block:0;background:linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--dsw-alias-bg-base) 60%, transparent) 55%, transparent 100%);pointer-events:none;width:300px;animation:2.6s ease-out infinite _Xvjua_dsh-command-row-sweep;position:absolute;left:0}@keyframes _Xvjua_dsh-command-row-sweep{0%{left:-300px}90%,to{left:100%}}._Xvjua_leading{flex-shrink:0}._Xvjua_chevron{color:var(--dsw-alias-label-secondary)}._Xvjua_title{font-weight:400}._Xvjua_separator{background:var(--dsw-alias-label-caption);border-radius:1px;flex:none;width:2px;height:2px;margin:0 8px}._Xvjua_summary{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;flex:auto;font-size:14px;line-height:24px;overflow:hidden}._Xvjua_summary[data-error],._Xvjua_body[data-error]{color:var(--dsw-alias-state-error-primary)}._Xvjua_body{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-markdown-code-block);max-height:260px;color:var(--dsw-alias-label-primary);font:var(--dsw-font-markdown-code-block-small);white-space:pre-wrap;border-radius:12px;margin:4px 0 4px 4px;padding:12px 16px;overflow:auto}@media (prefers-reduced-motion:reduce){._Xvjua_root[data-state=running] ._Xvjua_row:after{animation:none}}

/* ── Mobile parity overrides for the thinking-chain rows ─────────────────
   The official CSS above is desktop-first; on the small screen we tighten the
   timeline so Think/Bash rows read as one continuous block rather than spaced
   cards. Numeric values mirror the extracted official rules exactly. */
.Sxvs8a_body { gap: 4px; }

/* User bubble width: the desktop official rule caps the stack at
   min(525px, 82%). On narrow mobile viewports the 82% fraction is too tight
   and causes short prompts to wrap prematurely (e.g. "帮我看下 Python 代码").
   Drop the percentage cap on small screens so the bubble can use the full
   available width up to the 525px absolute maximum. */
.gdEzaW_userStack {
  max-width: 525px;
}
.QWLzlG_row,
._Xvjua_row {
  display: flex;
  align-items: center;
  min-height: 24px;
  gap: 4px;
  cursor: pointer;
  background: transparent;
  border: none;
}
.QWLzlG_leading,
._Xvjua_leading {
  width: 14px;
  height: 14px;
  color: var(--dsw-alias-label-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.QWLzlG_title,
._Xvjua_title {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 24px;
  flex: none;
}
.QWLzlG_chevron,
._Xvjua_chevron {
  width: 14px;
  height: 14px;
  color: var(--dsw-alias-label-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.QWLzlG_thinkBody {
  color: var(--dsw-alias-label-tertiary);
}
._Xvjua_body {
  margin: 4px 0 4px 4px;
  padding: 12px 16px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px;
  background: var(--dsw-alias-markdown-code-block);
  font: var(--dsw-font-markdown-code-block-small);
  max-height: 260px;
  color: var(--dsw-alias-label-primary);
}
`

