/**
 * Chat level: one session. Loads the history tail page on open, appends
 * pages upward (loadOlder), folds live mux frames in as they arrive, and
 * sends prompts through session.prompt.
 *
 * Rendering mirrors the desktop web UI's fold discipline on a small screen:
 * - reasoning text hides behind a collapsed "深度思考" disclosure,
 * - tool calls behind a collapsed tool disclosure (name + arguments),
 * - very long assistant text collapses with an explicit expand toggle,
 * - a toolbar above the composer carries the model (+ thinking effort) and
 *   permission pickers, both as bottom sheets.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MuxFrame } from '@deepseek-ai/dsh-host-apiproxy/api/events'
import type { SessionModels } from '@deepseek-ai/dsh-host-apiproxy/api/sessions'
import { loadHistory, prompt, type SessionView } from './App.tsx'
import { errorText, formatTime, staleHostHint } from './App.tsx'
import { fetchMobilePreferences, models, selectModel, sendCommand, cancelSession, fetchPending, respondApproval, respondQuestion } from '../api.ts'
import type { PendingApproval, PendingQuestionItem } from '../api.ts'
import { EventFolder, foldEvents, type RenderMessage, type ToolCallInfo, type WireEvent } from '../messages.ts'
import { renderMarkdown } from '../markdown.ts'
import { MuxClient } from '../mux.ts'
import { ThemeToggle } from '../theme-toggle.tsx'

/** Props for the chat view. */
export interface ChatViewProps {
  session: SessionView
  /** The page-lifetime mux client (undefined before the first effect tick). */
  mux?: MuxClient | undefined
  onBack(): void
}

/**
 * Hard cap on live events buffered while the initial history tail page is in
 * flight. Beyond this the oldest buffered event is dropped and a follow-up
 * history tail re-pull closes the seam.
 */
export const MAX_TAIL_BUFFER_EVENTS = 500

/** localStorage key for the tool-call display toggle (persisted on the /m origin). */
const SHOW_TOOL_CALLS_KEY = 'dsh.mobile.showToolCalls'
/** localStorage key for the injected-system-message display toggle. */
const SHOW_SYSTEM_MESSAGES_KEY = 'dsh.mobile.showSystemMessages'

/** Read a boolean from localStorage defensively; falls back to the default. */
function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return raw === '1' || raw.toLowerCase() === 'true'
  } catch {
    return fallback
  }
}

/** Persist a boolean toggle; storage failures are ignored (feature stays non-persistent). */
function writeStoredBoolean(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* quota / privacy mode: non-persistent is acceptable */
  }
}

/** Extract the raw event from one history entry (the fold consumes events only). */
function eventOf(entry: { event: WireEvent }): WireEvent {
  return entry.event
}

/** Defensive runtime guard for projection payloads. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** One switchable permission preset (the `permissions` projection shape). */
export interface PermissionOption {
  value: string
  name: string
  description?: string
}

/** The `permissions` projection value: options + the effective current value. */
export interface PermissionSelectValue {
  options: PermissionOption[]
  currentValue: string
}

/** Parse the wire `permissions` projection defensively; undefined when absent. */
function parsePermissionSelect(value: unknown): PermissionSelectValue | undefined {
  if (!isRecord(value)) return undefined
  const rawOptions = Array.isArray(value['options']) ? value['options'] : []
  const options: PermissionOption[] = []
  for (const raw of rawOptions) {
    if (!isRecord(raw)) continue
    const optionValue = typeof raw['value'] === 'string' ? raw['value'] : undefined
    const name = typeof raw['name'] === 'string' ? raw['name'] : undefined
    if (optionValue === undefined || name === undefined) continue
    options.push({
      value: optionValue,
      name,
      ...(typeof raw['description'] === 'string' ? { description: raw['description'] } : {}),
    })
  }
  const currentValue = typeof value['currentValue'] === 'string' ? value['currentValue'] : undefined
  if (currentValue === undefined || options.length === 0) return undefined
  return { options, currentValue }
}

/** One display-name transform for kebab-case machine names (web-UI parity). */
function displayName(name: string): string {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return name
  return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

/** Pick a string value out of an unknown JSON field. */
function pickString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/** Extract a human-readable subtitle from tool-call arguments JSON. */
function toolSubtitle(tool: ToolCallInfo): string | undefined {
  if (tool.arguments === undefined) return undefined
  try {
    const parsed = JSON.parse(tool.arguments) as unknown
    if (!isRecord(parsed)) return undefined
    const description = pickString(parsed['description'])
    if (description !== undefined && description.trim() !== '') return description
    const summary = pickString(parsed['summary'])
    if (summary !== undefined && summary.trim() !== '') return summary
    const command = pickString(parsed['command'] ?? parsed['cmd'])
    if (command !== undefined && command.trim() !== '') return command
    const path = pickString(parsed['path'])
    if (path !== undefined && path.trim() !== '') return path
    const url = pickString(parsed['url'])
    if (url !== undefined && url.trim() !== '') return url
  } catch {
    // ignore JSON parse errors
  }
  return undefined
}

/** First non-empty line of reasoning text (the collapsed summary). */
function firstMeaningfulLine(text: string): string {
  const trimmed = text.trim()
  if (trimmed === '') return ''
  const newline = trimmed.indexOf('\n')
  return newline === -1 ? trimmed : trimmed.slice(0, newline)
}

/**
 * Render one session's chat.
 * @param props - the session, the mux client, and the back action.
 * @returns the chat surface.
 */
export function ChatView({ session, mux, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<RenderMessage[]>([])
  const [hasOlder, setHasOlder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement | undefined>(undefined)
  const pendingRef = useRef(false)
  /**
   * True while the initial tail page is in flight. Live events arriving in
   * that window go to {@link liveBufferRef} instead of the message list: the
   * tail load replaces the list wholesale, so a directly folded event would
   * flash once, be discarded by the snapshot, and then be skipped forever by
   * the seq watermark.
   */
  const tailLoadingRef = useRef(true)
  /** Live session events buffered while the initial tail page loads. */
  const liveBufferRef = useRef<WireEvent[]>([])
  /** Incremental folder for this session's stream (indexes stay hot across events). */
  const folderRef = useRef<EventFolder | undefined>(undefined)
  /** True once the live buffer hit its cap (oldest events were dropped). */
  const liveBufferOverflowRef = useRef(false)

  /** The session's permission select (absent = capability not composed). */
  const [permissions, setPermissions] = useState<PermissionSelectValue | undefined>(undefined)
  /** The current model selection for the toolbar chip (best-effort label). */
  const [currentModel, setCurrentModel] = useState<{ provider: string; model: string; reasoningEffort?: string } | undefined>(undefined)
  /** Which bottom sheet is open. */
  const [sheet, setSheet] = useState<'model' | 'permission' | 'display' | null>(null)
  /** Show tool-call disclosures (default on, persisted on the /m origin). */
  const [showToolCalls, setShowToolCalls] = useState<boolean>(() => readStoredBoolean(SHOW_TOOL_CALLS_KEY, true))
  /** Show injected system messages (default off, persisted on the /m origin). */
  const [showSystemMessages, setShowSystemMessages] = useState<boolean>(() => readStoredBoolean(SHOW_SYSTEM_MESSAGES_KEY, false))
  /**
   * Composer preference from the plugin's host settings (default true keeps
   * the legacy Enter-to-send behavior until the preference loads).
   */
  const [mobileEnterToSend, setMobileEnterToSend] = useState(true)
  /** Whether the assistant is currently generating (turn/start..turn/end). */
  const [running, setRunning] = useState(false)
  /** Whether a stop request is in flight (guards the composer's stop button). */
  const [stopping, setStopping] = useState(false)
  /** Pending tool approvals awaiting user decision (#1025). */
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  /** Pending questions awaiting user answer (#1025). */
  const [pendingQuestions, setPendingQuestions] = useState<PendingQuestionItem[]>([])

  // Read-only mobile display preferences ride the plugin's local
  // `/m/api` method; a failure keeps the default (Enter sends).
  useEffect(() => {
    let cancelled = false
    void fetchMobilePreferences().then(
      (preferences) => {
        if (!cancelled) setMobileEnterToSend(preferences.mobileEnterToSend !== false)
      },
      () => { /* keep the default */ },
    )
    return () => { cancelled = true }
  }, [])

  // Tail page on open (content loads only when the session is opened).
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    // A stuck history load must not keep the chat empty (or the live buffer
    // growing) forever: abort it and surface the transport error.
    const timeout = setTimeout(() => {
      controller.abort(new DOMException('history load timed out', 'TimeoutError'))
    }, 15_000)
    tailLoadingRef.current = true
    liveBufferRef.current = []
    liveBufferOverflowRef.current = false
    folderRef.current = undefined
    setLoading(true)
    setError(undefined)
    setMessages([])
    void loadHistory(session.sessionId, undefined, controller.signal).then(
      (page) => {
        if (cancelled) return
        // Buffered live events re-fold on top of the snapshot; the watermark
        // drops any the snapshot already includes, so nothing is lost or doubled.
        const buffered = liveBufferRef.current
        liveBufferRef.current = []
        tailLoadingRef.current = false
        const folder = new EventFolder(foldEvents(page.events.map(eventOf)))
        folderRef.current = folder
        setMessages(folder.fold(buffered))
        setHasOlder(page.hasMore)
        setLoading(false)
        // The history-tail projection baseline seeds the permission picker.
        // The `permissions` key is declared by the deployment's permission
        // plugin (augmentation), so the base SDK map is indexed loosely.
        const projections = page.projections?.values as Record<string, unknown> | undefined
        setPermissions(parsePermissionSelect(projections?.['permissions']))
        // The buffer overflowed while waiting (oldest events were dropped), so
        // re-pull the freshest history page to close the gap on top of what is
        // already rendered. Best-effort: a failure here only logs, it must not
        // replace the loaded state with an error.
        if (liveBufferOverflowRef.current) {
          void loadHistory(session.sessionId, undefined, controller.signal).then(
            (fresh) => {
              if (cancelled) return
              const folder = folderRef.current
              const freshEvents = fresh.events.map(eventOf)
              setMessages(previous => folder === undefined ? foldEvents(freshEvents, previous) : folder.fold(freshEvents))
              liveBufferOverflowRef.current = false
            },
            (reason: unknown) => {
              if (cancelled) return
              console.warn('history tail re-pull after live buffer overflow failed', reason)
            },
          )
        }
      },
      (reason: unknown) => {
        if (cancelled) return
        // Load failed: flush the buffer so the live stream still renders.
        const buffered = liveBufferRef.current
        liveBufferRef.current = []
        tailLoadingRef.current = false
        if (buffered.length > 0) {
          const folder = folderRef.current
          setMessages(folder === undefined ? foldEvents(buffered) : folder.fold(buffered))
        }
        setError(errorText(reason))
        setLoading(false)
      },
    )
    // Best-effort current-model label for the toolbar chip; the sheet
    // always re-reads a fresh directory on open.
    void models(session.sessionId).then(
      (directory) => {
        if (!cancelled) setCurrentModel(directory.current)
      },
      () => { /* chip falls back to a plain label */ },
    )
    return () => {
      cancelled = true
      clearTimeout(timeout)
      controller.abort()
    }
  }, [session.sessionId])

  // Live frames: fold session events for this session in as they arrive.
  useEffect(() => {
    if (mux === undefined) return
    return mux.onFrame((frame: MuxFrame) => {
      if (frame.type === 'session/event') {
        if (frame.sessionId !== session.sessionId) return
        const event = frame.event as WireEvent
        // Track the turn running state for the "outputting" indicator (#1017).
        if (typeof event.type === 'string') {
          if (event.type === 'turn/start') setRunning(true)
          if (event.type === 'turn/end') setRunning(false)
        }
        if (tailLoadingRef.current) {
          if (liveBufferRef.current.length >= MAX_TAIL_BUFFER_EVENTS) {
            // Bound the tail-load window: drop the oldest buffered event and
            // remember that a follow-up history re-pull is needed. Warn once
            // per load, not for every subsequent overflow.
            liveBufferRef.current.shift()
            if (!liveBufferOverflowRef.current) {
              console.warn(
                `history tail is slow: live buffer reached ${MAX_TAIL_BUFFER_EVENTS} events; oldest buffered events will be re-fetched`,
              )
              liveBufferOverflowRef.current = true
            }
          }
          liveBufferRef.current.push(event)
          return
        }
        setMessages(previous => {
          const folder = folderRef.current
          return folder === undefined ? foldEvents([event], previous) : folder.fold([event])
        })
        return
      }
      // Live projection pushes keep the permission picker current.
      if (frame.type === 'session/projection'
        && frame.sessionId === session.sessionId
        && frame.key === 'permissions') {
        setPermissions(parsePermissionSelect(frame.value))
        return
      }
      // Approval/question frames for this session (#1025).
      if (!('sessionId' in frame) || frame.sessionId !== session.sessionId) return
      if (frame.type === 'approval/requested') {
        setPendingApprovals(previous => {
          if (previous.some(a => a.approvalId === frame.approvalId)) return previous
          return [...previous, {
            approvalId: frame.approvalId as string,
            toolName: frame.toolName,
            callId: frame.callId as string | undefined,
            reason: frame.reason,
          }]
        })
        return
      }
      if (frame.type === 'approval/resolved') {
        setPendingApprovals(previous => previous.filter(a => a.approvalId !== frame.approvalId))
        return
      }
      if (frame.type === 'question/requested') {
        const items = (frame.questions as Array<{
          id: string; question: string; detail?: string; header?: string
          options?: Array<{ label: string; description?: string }>; multiSelect?: boolean
        }>)
        setPendingQuestions(items)
        return
      }
      if (frame.type === 'question/resolved') {
        setPendingQuestions([])
        return
      }
    })
  }, [mux, session.sessionId])

  // Weak-network polling fallback: when the assistant is running, poll for
  // pending approvals/questions every 1.5 s so the phone can act even if the
  // SSE channel drops frames (#1025).
  useEffect(() => {
    if (!running) return
    let cancelled = false
    const tick = (): void => {
      void fetchPending(session.sessionId).then(
        (state) => {
          if (cancelled) return
          setPendingApprovals(state.approvals)
          setPendingQuestions(state.questions)
        },
        () => { /* transient; next tick retries */ },
      )
    }
    tick()
    const timer = setInterval(tick, 1500)
    return () => { cancelled = true; clearInterval(timer) }
  }, [running, session.sessionId])

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el === undefined) return
    el.scrollTop = el.scrollHeight
  }, [])

  // Track the last message's fold key so scrolling only fires when the
  // newest message actually changes (seq bump and/or pending flip). Runs
  // after React has committed the render, so scrollHeight reflects the
  // freshly appended content.
  const lastMessageKeyRef = useRef<string | undefined>(undefined)

  // Keep the newest content visible. This covers the initial tail page (the
  // effect runs after commit, fixing the stale scrollHeight from the old
  // open-time scrollToBottom), live streaming chunks on the pending message,
  // and finalized/appended messages. Prepending older pages via loadOlder
  // leaves the last message untouched, so it never disturbs the scroll position.
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last === undefined) return
    const key = last.seq + ':' + (last.pending === true ? 'p' : 'f')
    if (key === lastMessageKeyRef.current) return
    lastMessageKeyRef.current = key
    scrollToBottom()
  }, [messages, scrollToBottom])

  /** Load one older page and prepend it. The fold is directional (incremental
   *  tails only), so the older page folds standalone and concatenates ahead —
   *  host page boundaries never cut a message, so the seam is exact. */
  const loadOlder = useCallback(() => {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    const first = messages[0]
    if (first === undefined) {
      pendingRef.current = false
      setLoading(false)
      return
    }
    void loadHistory(session.sessionId, first.seq).then(
      (page) => {
        pendingRef.current = false
        setLoading(false)
        const older = foldEvents(page.events.map(eventOf))
        const folder = folderRef.current
        if (folder === undefined) {
          setMessages(previous => [...older, ...previous])
        } else {
          folder.prepend(older)
          setMessages(folder.snapshot())
        }
        setHasOlder(page.hasMore)
      },
      (reason: unknown) => {
        pendingRef.current = false
        setLoading(false)
        setError(errorText(reason))
      },
    )
  }, [session.sessionId, messages])

  /** Send the drafted prompt (the echoed user/message arrives over mux). */
  const send = useCallback(() => {
    const text = input.trim()
    if (text === '' || sending) return
    setSending(true)
    void prompt(session.sessionId, text).then(
      () => {
        setSending(false)
        setInput('')
      },
      (reason: unknown) => {
        setSending(false)
        setError(errorText(reason))
      },
    )
  }, [input, sending, session.sessionId])

  /**
   * Stop the active turn (desktop parity: the composer's primary button
   * becomes a stop button while running). The turn/end frame arriving over
   * mux flips the button back; a failed request surfaces through the chat
   * error line.
   */
  const stopTurn = useCallback(() => {
    if (stopping) return
    setStopping(true)
    void cancelSession(session.sessionId).then(
      () => { setStopping(false) },
      (reason: unknown) => {
        setStopping(false)
        setError(errorText(reason))
      },
    )
  }, [stopping, session.sessionId])

  const modelLabel = currentModel?.model ?? '模型'
  const permissionLabel = permissions === undefined
    ? undefined
    : permissions.options.find(option => option.value === permissions.currentValue)?.name
      ?? displayName(permissions.currentValue)

  // Context usage chip: the most recent assistant message carrying both usage and
  // a positive context window drives the percentage. Scanned from the end so a
  // newer answer (whose usage may be the last one reported) takes precedence.
  const contextUsage = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index]
      const usage = message.usage
      if (message.kind !== 'assistant' || usage === undefined) continue
      const window = message.contextWindow
      if (window === undefined || window <= 0) continue
      const tokens = usage.inputTokens + (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0)
      const pct = Math.round(tokens / window * 100)
      return { pct }
    }
    return undefined
  }, [messages])

  return (
    <div className="chat">
      <header className="mobile-header">
        <button type="button" className="mobile-back" aria-label="返回" onClick={onBack}>‹</button>
        <h1 className="mobile-title mobile-titleInline">{session.title}</h1>
        <ThemeToggle />
      </header>
      {error !== undefined && <p className="mobile-error mobile-pad">{error}</p>}
      <div className="chat-scroll" ref={ref => { scrollRef.current = ref ?? undefined }}>
        {hasOlder && (
          <button type="button" className="chat-load-older" disabled={loading} onClick={() => { void loadOlder() }}>
            {loading ? '加载中…' : '加载更早的消息'}
          </button>
        )}
        {messages.map((message, index) => (
          <MessageRow
            key={message.id}
            message={message}
            prevTime={index > 0 ? messages[index - 1].time : undefined}
            showToolCalls={showToolCalls}
            showSystemMessages={showSystemMessages}
          />
        ))}
        {loading && messages.length === 0 && <p className="chat-typing">加载中…</p>}
        {!loading && messages.length === 0 && <p className="chat-typing">还没有消息，发一句话开始吧</p>}
        {running && (
          <div className="chat-turn-status" role="status" aria-label="输出中">
            输出中<span className="chat-turn-dots" aria-hidden><span /><span /><span /></span>
          </div>
        )}
        {pendingApprovals.map(approval => (
          <ApprovalPanel
            key={approval.approvalId}
            approval={approval}
            sessionId={session.sessionId}
            onResolved={(id) => { setPendingApprovals(prev => prev.filter(a => a.approvalId !== id)) }}
          />
        ))}
        {pendingQuestions.length > 0 && (
          <QuestionPanel
            questions={pendingQuestions}
            sessionId={session.sessionId}
            onResolved={() => { setPendingQuestions([]) }}
          />
        )}
      </div>
      <div className="chat-tools">
        <button type="button" className="chat-chip" onClick={() => { setSheet('model') }} aria-haspopup="dialog">
          <span className="chat-chip-label">模型</span>
          <span className="chat-chip-value">{modelLabel}</span>
          <span className="chat-chip-chevron" aria-hidden>›</span>
        </button>
        <button type="button" className="chat-chip" onClick={() => { setSheet('display') }} aria-haspopup="dialog">
          <span className="chat-chip-label">显示</span>
          <span className="chat-chip-chevron" aria-hidden>›</span>
        </button>
        {permissionLabel !== undefined && (
          <button type="button" className="chat-chip" onClick={() => { setSheet('permission') }} aria-haspopup="dialog">
            <span className="chat-chip-label">权限</span>
            <span className="chat-chip-value">{permissionLabel}</span>
            <span className="chat-chip-chevron" aria-hidden>›</span>
          </button>
        )}
        {contextUsage !== undefined && (
          <div className={"chat-context" + (contextUsage.pct >= 80 ? " chat-context-warn" : "")}>
            上下文 {contextUsage.pct}%
          </div>
        )}
      </div>
      <div className="chat-inputbar">
        <textarea
          className="chat-input"
          rows={1}
          value={input}
          placeholder={mobileEnterToSend ? '输入消息，Enter 发送…' : '输入消息，Enter 换行，点按钮发送…'}
          enterKeyHint={mobileEnterToSend ? 'send' : 'enter'}
          onChange={(event) => { setInput(event.target.value) }}
          onKeyDown={(event) => {
            if (mobileEnterToSend && event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void send()
            }
          }}
        />
        <button
          type="button"
          className={running ? 'chat-send chat-send-stop' : 'chat-send'}
          {...(running ? { 'aria-label': stopping ? '停止中' : '停止' } : {})}
          disabled={running ? stopping : sending || input.trim() === ''}
          onClick={() => { if (running) void stopTurn(); else void send() }}
        >
          {running ? (
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
              <rect x="3" y="3" width="10" height="10" rx="3" fill="currentColor" />
            </svg>
          ) : sending ? '发送中…' : '发送'}
        </button>
      </div>
      {sheet === 'model' && (
        <ModelSheet
          sessionId={session.sessionId}
          current={currentModel}
          onCurrent={(selection) => { setCurrentModel(selection) }}
          onClose={() => { setSheet(null) }}
        />
      )}
      {sheet === 'permission' && permissions !== undefined && (
        <PermissionSheet
          sessionId={session.sessionId}
          value={permissions}
          onChanged={(value) => {
            setPermissions(previous => previous === undefined ? previous : { ...previous, currentValue: value })
          }}
          onClose={() => { setSheet(null) }}
        />
      )}
      {sheet === 'display' && (
        <DisplaySheet
          showToolCalls={showToolCalls}
          showSystemMessages={showSystemMessages}
          onToolCalls={(value) => { setShowToolCalls(value); writeStoredBoolean(SHOW_TOOL_CALLS_KEY, value) }}
          onSystemMessages={(value) => { setShowSystemMessages(value); writeStoredBoolean(SHOW_SYSTEM_MESSAGES_KEY, value) }}
          onClose={() => { setSheet(null) }}
        />
      )}
    </div>
  )
}

/* ── message rows ─────────────────────────────────────────────────────── */

/** Copy-to-clipboard button (used for both assistant and user messages). */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    void copyText(text).then((ok) => {
      setCopied(ok)
      setTimeout(() => { setCopied(false) }, 1500)
    })
  }, [text])
  return (
    <button
      type="button"
      className={copied ? 'chat-action-btn chat-action-btn-active' : 'chat-action-btn'}
      aria-label={copied ? '已复制' : '复制'}
      onClick={handleCopy}
    >
      {copied ? (
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M2.5 8.5 6 12l7.5-7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          <rect x="4" y="4" width="9" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 2H3c-.6 0-1 .4-1 1v8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

/**
 * One rendered message row (user bubble or assistant bubble with folds).
 * Memoized: live streaming updates exactly one message object per frame, so
 * unchanged rows skip re-rendering their markdown/sub-components.
 */
const MessageRow = memo(function MessageRow({ message, prevTime, showToolCalls, showSystemMessages }: {
  message: RenderMessage
  prevTime?: number
  showToolCalls: boolean
  showSystemMessages: boolean
}) {
  // Injected user messages (sourceKind defined and not 'user') hide behind
  // the system-message toggle.
  if (message.kind === 'user'
    && message.sourceKind !== undefined
    && message.sourceKind !== 'user'
    && !showSystemMessages) {
    return null
  }
  const isAssistant = message.kind === 'assistant'
  const hasReasoning = isAssistant && message.reasoning !== undefined && message.reasoning !== ''
  const hasTools = showToolCalls && isAssistant && message.tools !== undefined && message.tools.length > 0
  const hasText = message.text !== ''
  const hasFailTag = message.failed === true
  const duration = isAssistant && message.pending !== true && prevTime !== undefined && message.time > prevTime
    ? Math.max(1, Math.round((message.time - prevTime) / 1000))
    : undefined

  if (!hasReasoning && !hasTools && !hasText && !hasFailTag) {
    return null
  }
  return (
    <div className={`chat-msg chat-msg-${message.kind}${message.pending === true ? ' chat-msg-pending' : ''}${message.failed === true ? ' chat-msg-failed' : ''}`}>
      {isAssistant && message.reasoning !== undefined && message.reasoning !== '' && (
        <ReasoningTimeline text={message.reasoning} pending={message.pending === true} />
      )}
      {showToolCalls && isAssistant && message.tools !== undefined && message.tools.length > 0 && (
        <ToolTimeline tools={message.tools} failed={message.failed === true} />
      )}
      {isAssistant
        ? <MarkdownText text={message.text} pending={message.pending === true} />
        : <CollapsibleText text={message.text} />}
      {hasFailTag && <span className="chat-msg-failtag">请求失败，点此重试 ↻</span>}
      {isAssistant && !message.pending && hasText ? (
        <div className="chat-msg-footer">
          <CopyButton text={message.text} />
          <span className="chat-msg-time">
            {formatTime(message.time)}
            {duration !== undefined && ` · 用时 ${duration} 秒`}
          </span>
        </div>
      ) : (
        <div className="chat-msg-footer chat-msg-footer-user">
          <span className="chat-msg-time">
            {formatTime(message.time)}
          </span>
          {!message.pending && hasText && <CopyButton text={message.text} />}
        </div>
      )}
    </div>
  )
})

/** Expanded reasoning timeline row (official trace-style Think row). */
function ReasoningTimeline({ text, pending }: { text: string; pending: boolean }) {
  return (
    <div className="chat-timeline-row chat-timeline-reasoning">
      <span className="chat-timeline-icon" aria-hidden>
        <svg viewBox="0 0 14 14" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.06431 5.93342C7.68763 5.93342 8.19307 6.43904 8.19322 7.06233C8.19322 7.68573 7.68772 8.19123 7.06431 8.19123C6.44099 8.19113 5.9354 7.68567 5.9354 7.06233C5.93555 6.43911 6.44108 5.93353 7.06431 5.93342Z" fill="currentColor" />
          <path fillRule="evenodd" clipRule="evenodd" d="M8.6815 0.963693C10.1169 0.447019 11.6266 0.374829 12.5633 1.31135C13.5 2.24805 13.4277 3.75776 12.911 5.19319C12.7126 5.74431 12.4386 6.31796 12.0965 6.89729C12.4969 7.54638 12.8141 8.19018 13.036 8.80647C13.5527 10.2419 13.6251 11.7516 12.6883 12.6883C11.7516 13.625 10.242 13.5527 8.8065 13.036C8.19022 12.8141 7.54641 12.4969 6.89732 12.0965C6.31797 12.4386 5.74435 12.7125 5.19322 12.911C3.75777 13.4276 2.2481 13.5 1.31138 12.5633C0.374859 11.6266 0.447049 10.1168 0.963724 8.68147C1.17185 8.10338 1.46321 7.50063 1.82896 6.8924C1.52182 6.35711 1.27235 5.82825 1.08872 5.31819C0.572068 3.88278 0.499714 2.37306 1.43638 1.43635C2.37308 0.499655 3.8828 0.572044 5.31822 1.08869C5.82828 1.27232 6.35715 1.5218 6.89243 1.82893C7.50066 1.46318 8.10341 1.17181 8.6815 0.963693ZM11.3573 8.01154C10.9083 8.62253 10.3901 9.22873 9.80943 9.8094C9.22877 10.3901 8.62255 10.9083 8.01158 11.3572C8.4257 11.5841 8.8287 11.7688 9.21275 11.9071C10.5456 12.3868 11.4246 12.2547 11.8397 11.8397C12.2548 11.4246 12.3869 10.5456 11.9071 9.21272C11.7688 8.82866 11.5841 8.42568 11.3573 8.01154ZM2.56529 8.02912C2.37344 8.39322 2.21495 8.74796 2.09263 9.08772C1.61291 10.4204 1.74512 11.2995 2.16001 11.7147C2.57505 12.1297 3.45415 12.2618 4.78697 11.7821C5.11057 11.6656 5.44786 11.5164 5.7938 11.3367C5.249 10.9223 4.70922 10.4533 4.19029 9.9344C3.57578 9.31987 3.03169 8.67633 2.56529 8.02912ZM6.90708 3.2469C6.24065 3.70479 5.5646 4.26321 4.91392 4.91389C4.26325 5.56456 3.70482 6.24063 3.24693 6.90705C3.72674 7.63325 4.32777 8.37459 5.03892 9.08576C5.64943 9.69627 6.28183 10.2265 6.90806 10.6678C7.59368 10.2025 8.2908 9.63076 8.96079 8.96076C9.6308 8.29075 10.2025 7.59366 10.6678 6.90803C10.2265 6.2818 9.69631 5.6494 9.08579 5.03889C8.37462 4.32773 7.63328 3.72672 6.90708 3.2469ZM11.7147 2.15998C11.2996 1.74509 10.4204 1.61288 9.08775 2.0926C8.74835 2.21479 8.39382 2.37271 8.03013 2.56428C8.67728 3.03065 9.31995 3.5758 9.93443 4.19026C10.4534 4.7092 10.9223 5.24896 11.3368 5.79377C11.5164 5.44785 11.6656 5.11052 11.7821 4.78694C12.2618 3.45416 12.1297 2.57502 11.7147 2.15998ZM4.91197 2.2176C3.57922 1.73788 2.70004 1.86995 2.28501 2.28498C1.87001 2.70003 1.73791 3.5792 2.21763 4.91194C2.31709 5.18822 2.44112 5.47427 2.58677 5.7674C3.01931 5.1887 3.51474 4.6158 4.06529 4.06526C4.61584 3.5147 5.18872 3.01928 5.76743 2.58674C5.47431 2.4411 5.18824 2.31706 4.91197 2.2176Z" fill="currentColor" />
        </svg>
      </span>
      <div className="chat-timeline-body">
        <div className="chat-timeline-title">{pending ? '思考中…' : 'Think'}</div>
        <div className="chat-timeline-content">{text}</div>
      </div>
    </div>
  )
}

/** One expanded tool-call timeline row (official trace-style tool row). */
function ToolTimeline({ tools, failed }: { tools: ToolCallInfo[]; failed?: boolean }) {
  return (
    <div className="chat-timeline">
      {tools.map((tool, index) => {
        const subtitle = toolSubtitle(tool)
        return (
          <div className="chat-timeline-row" key={`${tool.callId}-${index}`}>
            <span className={`chat-timeline-dot${failed ? ' chat-timeline-dot-error' : ''}`} aria-hidden />
            <div className="chat-timeline-body">
              <div className="chat-timeline-title">
                <span className="chat-timeline-name">{displayName(tool.name)}</span>
                {subtitle !== undefined && (
                  <>
                    <span className="chat-timeline-separator">·</span>
                    <span className="chat-timeline-subtitle">{subtitle}</span>
                  </>
                )}
              </div>
              {tool.arguments !== undefined && (
                <div className="chat-timeline-content">
                  <ToolArguments tool={tool} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Render tool-call arguments as a compact code block when possible. */
function ToolArguments({ tool }: { tool: ToolCallInfo }) {
  const args = tool.arguments ?? ''
  let language = 'text'
  let body = args
  try {
    const parsed = JSON.parse(args) as unknown
    if (isRecord(parsed)) {
      if (typeof parsed['code'] === 'string') {
        body = parsed['code']
        language = typeof parsed['language'] === 'string' ? parsed['language'] : 'python'
      } else if (typeof parsed['command'] === 'string' || typeof parsed['cmd'] === 'string') {
        body = (parsed['command'] ?? parsed['cmd']) as string
        language = 'bash'
      }
    }
  } catch {
    // keep raw JSON string
  }
  return (
    <div className="chat-code">
      <div className="chat-code-head"><span className="chat-code-lang">{language}</span></div>
      <pre className={`language-${language}`}><code>{body}</code></pre>
    </div>
  )
}

/**
 * Minimum interval between full markdown re-parses of a live (pending)
 * assistant message. Every streamed chunk replaces the message object, and
 * re-parsing the whole accumulated text per chunk turns a long reply into
 * O(n^2) work on mobile. Pending text keeps the last parsed result visible
 * and re-parses at most once per interval; the moment the turn closes the
 * final text parses immediately, so terminal messages render exactly as
 * before.
 */
export const STREAM_RENDER_INTERVAL_MS = 120

/** Copy text to the clipboard, with an execCommand fallback for non-secure
  contexts (e.g. plain-http local dev). Resolves true on success. */
function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text))
  }
  return Promise.resolve(fallbackCopy(text))
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/**
 * Assistant text rendered as GFM markdown (escape-first, protocol
 * allow-list — see markdown.ts). Long replies collapse by clamping the
 * rendered block height instead of slicing the source, so half-cut code
 * fences or tables never leak malformed markup into the DOM. User
 * messages stay plain text (CollapsibleText).
 */
function MarkdownText({ text, pending }: { text: string; pending: boolean }) {
  const [open, setOpen] = useState(false)
  const [html, setHtml] = useState<string>(() => renderMarkdown(text))
  const bodyRef = useRef<HTMLDivElement | null>(null)
  /** Text of the last render actually applied to `html`. */
  const renderedTextRef = useRef(text)
  /** Newest streamed text, read by the trailing render at fire time. */
  const latestTextRef = useRef(text)
  /** Timestamp of the last applied parse (throttle window start). */
  const lastRenderAtRef = useRef(performance.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Throttled parse for a live stream: skip parses while the newest text is
  // already rendered, parse immediately once the throttle window elapsed,
  // otherwise schedule one trailing render that picks up the newest text.
  useEffect(() => {
    latestTextRef.current = text
    if (!pending) {
      // Turn closed: terminal messages are never throttled, so cancel any
      // scheduled stream render and parse the final text immediately.
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current)
        timerRef.current = undefined
      }
      if (text === renderedTextRef.current) return
      lastRenderAtRef.current = performance.now()
      renderedTextRef.current = text
      setHtml(renderMarkdown(text))
      return
    }
    if (text === renderedTextRef.current) return
    const elapsed = performance.now() - lastRenderAtRef.current
    if (elapsed >= STREAM_RENDER_INTERVAL_MS) {
      lastRenderAtRef.current = performance.now()
      renderedTextRef.current = text
      setHtml(renderMarkdown(text))
      return
    }
    if (timerRef.current === undefined) {
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined
        lastRenderAtRef.current = performance.now()
        renderedTextRef.current = latestTextRef.current
        setHtml(renderMarkdown(latestTextRef.current))
      }, STREAM_RENDER_INTERVAL_MS - elapsed)
    }
  }, [text, pending])

  // Cancel the trailing stream render if the row unmounts mid-stream.
  useEffect(() => {
    return () => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current)
    }
  }, [])

  // Wire copy buttons inside rendered markdown. The HTML is injected via
  // dangerouslySetInnerHTML, so the buttons are plain DOM nodes needing a
  // listener after each (re)render. The subtree is recreated only when `html`
  // changes, so depending on `[html]` avoids duplicate listeners.
  useEffect(() => {
    const root = bodyRef.current
    if (root === null) return
    root.querySelectorAll<HTMLButtonElement>('.chat-code-copy').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.closest('.chat-code')?.querySelector('code')
        const text = code ? code.innerText : ''
        void copyText(text).then((ok) => {
          const prev = btn.textContent
          btn.textContent = ok ? '已复制' : '复制失败'
          setTimeout(() => { btn.textContent = prev }, 1500)
        })
      })
    })
  }, [html])
  const long = !pending && text.length > LONG_TEXT_LIMIT
  const collapsed = long && !open
  return (
    <div className={'chat-msg-text chat-md' + (collapsed ? ' chat-md-collapsed' : '')}>
      <div className="chat-md-body" ref={bodyRef} dangerouslySetInnerHTML={{ __html: html }} />
      {long && (
        <button type="button" className="chat-msg-toggle" onClick={() => { setOpen(value => !value) }}>
          {open ? '收起' : '展开全文（' + text.length + ' 字）'}
        </button>
      )}
    </div>
  )
}

/** Long assistant text collapses behind an explicit expand toggle. */
function CollapsibleText({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  if (text.length <= LONG_TEXT_LIMIT) {
    return <span className="chat-msg-text">{text}</span>
  }
  const shown = open ? text : text.slice(0, LONG_TEXT_PREVIEW)
  return (
    <span className="chat-msg-text">
      {shown}{!open ? '…' : ''}
      <button type="button" className="chat-msg-toggle" onClick={() => { setOpen(value => !value) }}>
        {open ? '收起' : `展开全文（${text.length} 字）`}
      </button>
    </span>
  )
}

export const LONG_TEXT_LIMIT = 6000
const LONG_TEXT_PREVIEW = 800

/** Latest non-empty line of a streaming reasoning buffer. */
function lastLine(text: string): string {
  const trimmed = text.trimEnd()
  if (trimmed === '') return ''
  const newline = trimmed.lastIndexOf('\n')
  const line = newline === -1 ? trimmed : trimmed.slice(newline + 1)
  return line.trim() === '' ? '' : line
}

/* ── bottom sheets ───────────────────────────────────────────────────── */

/** Shared bottom-sheet chrome (backdrop + slide-up panel). */
function Sheet({ title, onClose, children }: { title: string; onClose(): void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => { event.stopPropagation() }}
      >
        <div className="sheet-handle" aria-hidden />
        <div className="sheet-title">{title}</div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

/** The model + thinking-effort picker (fresh advisory directory per open). */
function ModelSheet({ sessionId, current, onCurrent, onClose }: {
  sessionId: string
  current: { provider: string; model: string; reasoningEffort?: string } | undefined
  onCurrent(selection: { provider: string; model: string; reasoningEffort?: string }): void
  onClose(): void
}) {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: SessionModels }>({ status: 'loading' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const load = useCallback(() => {
    setState({ status: 'loading' })
    void models(sessionId).then(
      data => { setState({ status: 'ready', data }) },
      (reason: unknown) => { setState({ status: 'error', message: errorText(reason) }) },
    )
  }, [sessionId])

  useEffect(() => { load() }, [load])

  /** Select model/effort and close on success (one-shot action per sheet). */
  const apply = useCallback((selection: { provider: string; model: string; reasoningEffort?: string }) => {
    if (busy) return
    setBusy(true)
    setError(undefined)
    void selectModel(sessionId, selection).then(
      (result) => {
        setBusy(false)
        onCurrent(result.selected)
        onClose()
      },
      (reason: unknown) => {
        setBusy(false)
        setError(errorText(reason))
      },
    )
  }, [busy, sessionId, onCurrent, onClose])

  if (state.status === 'loading') {
    return (
      <Sheet title="模型与思考强度" onClose={onClose}>
        <div className="sheet-status">正在加载模型目录…</div>
      </Sheet>
    )
  }
  if (state.status === 'error') {
    return (
      <Sheet title="模型与思考强度" onClose={onClose}>
        <div className="sheet-status sheet-status-error">
          <span>{state.message}</span>
          {staleHostHint(state.message) !== undefined && <span className="sheet-hint">{staleHostHint(state.message)}</span>}
          <button type="button" className="chat-load-older" onClick={load}>重试</button>
        </div>
      </Sheet>
    )
  }

  const { data } = state
  const selected = current ?? data.current
  const choices = data.groups.flatMap(group => group.models.map(model => ({ group, model })))
  const currentChoice = choices.find(choice => choice.group.id === selected.provider && choice.model.id === selected.model)
  const reasoning = currentChoice?.model.reasoning
  const effectiveEffort = selected.reasoningEffort ?? reasoning?.defaultEffort
  const effortChoices = reasoning === undefined
    ? []
    : [
      ...(reasoning.defaultEffort === undefined
        ? [{ key: 'provider-default', effort: undefined as string | undefined, label: '跟随模型默认' }]
        : []),
      ...reasoning.efforts.map(effort => ({
        key: `effort:${effort.id}`,
        effort: effort.id as string | undefined,
        label: effort.name,
        description: effort.description,
      })),
    ]

  return (
    <Sheet title="模型与思考强度" onClose={onClose}>
      {error !== undefined && <p className="sheet-error">{error}</p>}
      {error !== undefined && staleHostHint(error) !== undefined && <p className="sheet-hint">{staleHostHint(error)}</p>}
      {data.failures.map(failure => (
        <p className="sheet-error" key={failure.id}>{failure.name}: {failure.message}</p>
      ))}
      {data.groups.length === 0 && choices.length === 0 && (
        <div className="sheet-status">没有可用的模型</div>
      )}
      {data.groups.map(group => (
        <div className="sheet-section" key={group.id}>
          <div className="sheet-section-title">{group.name}</div>
          {group.models.map(model => {
            const isSelected = selected.provider === group.id && selected.model === model.id
            return (
              <button
                type="button"
                key={model.id}
                className={`sheet-option${isSelected ? ' sheet-option-selected' : ''}`}
                disabled={busy}
                onClick={() => {
                  apply({
                    provider: group.id,
                    model: model.id,
                    ...(model.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: model.reasoning.defaultEffort }),
                  })
                }}
              >
                <span className="sheet-option-copy">
                  <span className="sheet-option-title">{model.name}</span>
                  {model.description !== undefined && <span className="sheet-option-desc">{model.description}</span>}
                </span>
                {isSelected && <span className="sheet-option-check" aria-hidden>√</span>}
              </button>
            )
          })}
        </div>
      ))}
      {effortChoices.length > 0 && (
        <div className="sheet-section">
          <div className="sheet-section-title">思考强度</div>
          {effortChoices.map(choice => {
            const isSelected = effectiveEffort === choice.effort
            return (
              <button
                type="button"
                key={choice.key}
                className={`sheet-option${isSelected ? ' sheet-option-selected' : ''}`}
                disabled={busy}
                onClick={() => { apply({ provider: selected.provider, model: selected.model, ...(choice.effort !== undefined ? { reasoningEffort: choice.effort } : {}) }) }}
              >
                <span className="sheet-option-copy">
                  <span className="sheet-option-title">{choice.label}</span>
                </span>
                {isSelected && <span className="sheet-option-check" aria-hidden>√</span>}
              </button>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}

/** The permission-preset picker; full access needs an explicit confirm. */
function PermissionSheet({ sessionId, value, onChanged, onClose }: {
  sessionId: string
  value: PermissionSelectValue
  onChanged(currentValue: string): void
  onClose(): void
}) {
  const [confirming, setConfirming] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  /** Submit `/permission <value>` as a slash command (mode-agnostic). */
  const submit = useCallback((next: string) => {
    if (busy) return
    setBusy(true)
    setError(undefined)
    void sendCommand(sessionId, `/permission ${next}`).then(
      () => {
        setBusy(false)
        setConfirming(null)
        onChanged(next)
        onClose()
      },
      (reason: unknown) => {
        setBusy(false)
        setConfirming(null)
        setError(errorText(reason))
      },
    )
  }, [busy, sessionId, onChanged, onClose])

  const choose = (next: string): void => {
    if (next === value.currentValue) {
      onClose()
      return
    }
    if (next === 'danger-full-access') {
      setConfirming(next)
      return
    }
    submit(next)
  }

  if (confirming !== null) {
    return (
      <Sheet title="确认完全权限" onClose={() => { setConfirming(null) }}>
        <p className="sheet-confirm-desc">
          开启完全权限后，远程会话可以在工作区内执行任意操作（包括运行命令、修改所有文件与访问凭证）。
          仅在您信任当前设备和网络时开启。
        </p>
        {error !== undefined && <p className="sheet-error">{error}</p>}
        <div className="sheet-confirm-actions">
          <button type="button" className="mobile-button" disabled={busy} onClick={() => { setConfirming(null) }}>取消</button>
          <button type="button" className="sheet-confirm-danger" disabled={busy} onClick={() => { submit(confirming) }}>
            {busy ? '提交中…' : '确认开启'}
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title="权限" onClose={onClose}>
      {error !== undefined && <p className="sheet-error">{error}</p>}
      {value.options.map(option => {
        const isSelected = option.value === value.currentValue
        return (
          <button
            type="button"
            key={option.value}
            className={`sheet-option${isSelected ? ' sheet-option-selected' : ''}`}
            disabled={busy}
            onClick={() => { choose(option.value) }}
          >
            <span className="sheet-option-copy">
              <span className="sheet-option-title">{option.name}</span>
              {option.description !== undefined && <span className="sheet-option-desc">{option.description}</span>}
            </span>
            {isSelected && <span className="sheet-option-check" aria-hidden>√</span>}
          </button>
        )
      })}
    </Sheet>
  )
}

/** The display-options sheet: tool calls and injected system messages toggles. */
function DisplaySheet({ showToolCalls, showSystemMessages, onToolCalls, onSystemMessages, onClose }: {
  showToolCalls: boolean
  showSystemMessages: boolean
  onToolCalls(value: boolean): void
  onSystemMessages(value: boolean): void
  onClose(): void
}) {
  return (
    <Sheet title="显示" onClose={onClose}>
      <div role="group" aria-label="显示选项">
        <div className="sheet-toggle-row">
          <div className="sheet-toggle-copy">
            <span className="sheet-toggle-title">工具调用</span>
            <span className="sheet-toggle-desc">显示助手使用的工具调用</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="工具调用"
            aria-checked={showToolCalls}
            className={`sheet-toggle-switch${showToolCalls ? ' sheet-toggle-switch-on' : ''}`}
            onClick={() => { onToolCalls(!showToolCalls) }}
          >
            <span className="sheet-toggle-switch-knob" aria-hidden />
          </button>
        </div>
        <div className="sheet-toggle-row">
          <div className="sheet-toggle-copy">
            <span className="sheet-toggle-title">系统提示词</span>
            <span className="sheet-toggle-desc">显示注入到对话中的系统消息</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="系统提示词"
            aria-checked={showSystemMessages}
            className={`sheet-toggle-switch${showSystemMessages ? ' sheet-toggle-switch-on' : ''}`}
            onClick={() => { onSystemMessages(!showSystemMessages) }}
          >
            <span className="sheet-toggle-switch-knob" aria-hidden />
          </button>
        </div>
      </div>
    </Sheet>
  )
}

/* ── approval / question panels (#1025) ──────────────────────────────── */

/** One pending tool approval card with allow/reject actions. */
function ApprovalPanel({ approval, sessionId, onResolved }: {
  approval: PendingApproval
  sessionId: string
  onResolved(approvalId: string): void
}) {
  const [busy, setBusy] = useState(false)
  const [panelError, setPanelError] = useState<string | undefined>(undefined)

  const act = (outcome: 'allowed-once' | 'rejected'): void => {
    if (busy) return
    setBusy(true)
    setPanelError(undefined)
    void respondApproval(sessionId, approval.approvalId, outcome).then(
      () => { onResolved(approval.approvalId) },
      (reason: unknown) => {
        setBusy(false)
        setPanelError(reason instanceof Error ? reason.message : String(reason))
      },
    )
  }

  return (
    <div className="chat-approval-panel" role="alert">
      <div className="chat-approval-header">
        <span className="chat-tool-pill">{approval.toolName}</span>
        {approval.reason !== undefined && (
          <span className="chat-approval-reason">{approval.reason}</span>
        )}
      </div>
      {panelError !== undefined && <p className="chat-approval-error">{panelError}</p>}
      <div className="chat-approval-actions">
        <button
          type="button"
          className="chat-approval-allow"
          disabled={busy}
          onClick={() => { act('allowed-once') }}
        >
          {busy ? '提交中…' : '允许一次'}
        </button>
        <button
          type="button"
          className="chat-approval-reject"
          disabled={busy}
          onClick={() => { act('rejected') }}
        >
          拒绝
        </button>
      </div>
    </div>
  )
}

/** Question panel: renders one or more questions with option pickers and a submit button. */
function QuestionPanel({ questions, sessionId, onResolved }: {
  questions: PendingQuestionItem[]
  sessionId: string
  onResolved(): void
}) {
  const [selections, setSelections] = useState<Map<string, { selected: string[]; custom: string }>>(
    () => new Map(questions.map(q => [q.id, { selected: [], custom: '' }])),
  )
  const [busy, setBusy] = useState(false)
  const [panelError, setPanelError] = useState<string | undefined>(undefined)

  const toggle = (questionId: string, label: string, multi: boolean): void => {
    setSelections(previous => {
      const next = new Map(previous)
      const entry = next.get(questionId) ?? { selected: [], custom: '' }
      if (multi) {
        const set = new Set(entry.selected)
        if (set.has(label)) set.delete(label); else set.add(label)
        next.set(questionId, { ...entry, selected: [...set] })
      } else {
        next.set(questionId, { ...entry, selected: [label] })
      }
      return next
    })
  }

  const setCustom = (questionId: string, value: string): void => {
    setSelections(previous => {
      const next = new Map(previous)
      const entry = next.get(questionId) ?? { selected: [], custom: '' }
      next.set(questionId, { ...entry, custom: value })
      return next
    })
  }

  const submit = (): void => {
    if (busy) return
    setBusy(true)
    setPanelError(undefined)
    const answers = questions.map(q => {
      const entry = selections.get(q.id) ?? { selected: [], custom: '' }
      return {
        id: q.id,
        selected: entry.selected,
        ...(entry.custom.trim() !== '' ? { custom: entry.custom.trim() } : {}),
      }
    })
    void respondQuestion(sessionId, answers).then(
      () => { onResolved() },
      (reason: unknown) => {
        setBusy(false)
        setPanelError(reason instanceof Error ? reason.message : String(reason))
      },
    )
  }

  return (
    <div className="chat-question-panel" role="form" aria-label="问题">
      {questions.map(q => {
        const entry = selections.get(q.id) ?? { selected: [], custom: '' }
        return (
          <div className="chat-question-group" key={q.id}>
            {q.header !== undefined && <div className="chat-question-header">{q.header}</div>}
            <div className="chat-question-text">{q.question}</div>
            {q.detail !== undefined && <div className="chat-question-detail">{q.detail}</div>}
            {q.options !== undefined && q.options.length > 0 && (
              <div className="chat-question-options" role="group" aria-label={q.question}>
                {q.options.map(option => {
                  const checked = entry.selected.includes(option.label)
                  return (
                    <label key={option.label} className={`chat-question-option${checked ? ' chat-question-option-selected' : ''}`}>
                      <input
                        type={q.multiSelect ? 'checkbox' : 'radio'}
                        name={`q-${q.id}`}
                        checked={checked}
                        onChange={() => { toggle(q.id, option.label, q.multiSelect === true) }}
                      />
                      <span className="chat-question-option-label">{option.label}</span>
                      {option.description !== undefined && (
                        <span className="chat-question-option-desc">{option.description}</span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
            <textarea
              className="chat-question-custom"
              placeholder="自定义回答（可选）"
              rows={2}
              value={entry.custom}
              onChange={(e) => { setCustom(q.id, e.target.value) }}
            />
          </div>
        )
      })}
      {panelError !== undefined && <p className="chat-approval-error">{panelError}</p>}
      <button
        type="button"
        className="chat-question-submit"
        disabled={busy}
        onClick={submit}
      >
        {busy ? '提交中…' : '提交回答'}
      </button>
    </div>
  )
}
