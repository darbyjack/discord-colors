import { useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Bold, Check, Copy, Github, RotateCcw, Underline, X } from 'lucide-react'
import {
  affectedIndexes,
  BACKGROUND,
  colorHex,
  defaultGlyph,
  encodeDiscord,
  FOREGROUND,
  PRESETS,
  reconcileText,
  withPreset,
} from './ansi'
import type { Color, Glyph, Preset } from './ansi'

const MAX_MESSAGE_LENGTH = 2000
type CopyState = 'idle' | 'done' | 'error'

function ColorPicker({
  label,
  colors,
  selected,
  onChoose,
  onRemove,
  disabled,
}: {
  label: string
  colors: Color[]
  selected: number | null | undefined
  onChoose: (code: number) => void
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <div className="color-picker">
      <div className="control-label">
        <span>{label}</span>
        <button type="button" className="quiet-link" onClick={onRemove} disabled={disabled}>
          No color
        </button>
      </div>
      <div className="color-options" role="group" aria-label={label}>
        {colors.map((color) => (
          <button
            key={color.code}
            type="button"
            className={selected === color.code ? 'color-option is-selected' : 'color-option'}
            disabled={disabled}
            style={{ '--swatch': color.hex } as CSSProperties}
            onClick={() => onChoose(color.code)}
            title={color.label}
            aria-label={label + ': ' + color.label}
            aria-pressed={selected === color.code}
          >
            <span className="color-tile" />
          </button>
        ))}
      </div>
    </div>
  )
}

function PresetButton({
  preset,
  active,
  onClick,
}: {
  preset: Preset
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={active ? 'preset is-active' : 'preset'}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="preset-colors" aria-hidden="true">
        {preset.colors.slice(0, 4).map((code, index) => (
          <i key={index} style={{ backgroundColor: colorHex(code, FOREGROUND, '#fff') }} />
        ))}
      </span>
      {preset.name}
    </button>
  )
}

export default function App() {
  const [glyphs, setGlyphs] = useState<Glyph[]>(() => withPreset("Hello, Discord!", PRESETS[0]))
  const [activePreset, setActivePreset] = useState<string | null>('rainbow')
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const text = useMemo(() => glyphs.map((glyph) => glyph.char).join(''), [glyphs])
  const output = useMemo(() => encodeDiscord(glyphs), [glyphs])
  const readableOutput = useMemo(() => output.replaceAll('\u001b', '\\u001b'), [output])
  const selectedIndexes = useMemo(
    () => affectedIndexes(glyphs, selection.start, selection.end, activeIndex),
    [glyphs, selection.start, selection.end, activeIndex],
  )
  const selectionCount = selectedIndexes.length
  const hasSelection = selection.start !== selection.end
  const selectedGlyphs = selectedIndexes.map((index) => glyphs[index])
  const commonForeground =
    selectionCount > 0 && selectedGlyphs.every((glyph) => glyph.fg === selectedGlyphs[0].fg)
      ? selectedGlyphs[0].fg
      : undefined
  const commonBackground =
    selectionCount > 0 && selectedGlyphs.every((glyph) => glyph.bg === selectedGlyphs[0].bg)
      ? selectedGlyphs[0].bg
      : undefined
  const isBold = selectionCount > 0 && selectedGlyphs.every((glyph) => glyph.bold)
  const isUnderlined = selectionCount > 0 && selectedGlyphs.every((glyph) => glyph.underline)
  const exceedsLimit = output.length > MAX_MESSAGE_LENGTH
  const containsFence = text.includes('\x60\x60\x60')
  const canCopy = text.length > 0 && !exceedsLimit && !containsFence
  const targetLabel = activeIndex !== null
    ? 'Editing one character'
    : hasSelection
      ? 'Editing ' + selectionCount + ' selected characters'
      : 'Editing entire message'

  function changeText(nextText: string, start: number, end: number) {
    const preset = PRESETS.find((item) => item.id === activePreset)
    setGlyphs((previous) => preset ? withPreset(nextText, preset) : reconcileText(previous, nextText))
    setSelection({ start, end })
    setActiveIndex(null)
    setCopyState('idle')
  }

  function changeSelected(change: (glyph: Glyph) => Glyph) {
    const affected = new Set(selectedIndexes)
    setGlyphs((previous) => previous.map((glyph, index) => (
      affected.has(index) ? change(glyph) : glyph
    )))
    setActivePreset(null)
    setCopyState('idle')
  }

  function usePreset(preset: Preset) {
    setGlyphs(withPreset(text, preset))
    setActivePreset(preset.id)
    setActiveIndex(null)
    setSelection({ start: 0, end: 0 })
    setCopyState('idle')
  }

  function resetStyles() {
    setGlyphs(Array.from(text, defaultGlyph))
    setActivePreset(null)
    setActiveIndex(null)
    setSelection({ start: 0, end: 0 })
    setCopyState('idle')
  }

  function toggleStyle(style: 'bold' | 'underline', enabled: boolean) {
    changeSelected((glyph) => ({ ...glyph, [style]: !enabled }))
  }

  async function copyToClipboard() {
    if (!canCopy) return
    try {
      await navigator.clipboard.writeText(output)
      setCopyState('done')
    } catch {
      setCopyState('error')
    }
  }

  return (
    <div className="site">
      <header className="topbar">
        <div className="layout topbar-inner">
          <a href="/" className="wordmark" aria-label="Discord Colors home">
            <span className="brand-bars" aria-hidden="true"><i /><i /><i /><i /></span>
            Discord Colors
          </a>
          <a className="source-link" href="https://github.com/darbyjack/discord-colors" target="_blank" rel="noopener noreferrer">
            <Github size={17} aria-hidden="true" /> <span>GitHub</span>
          </a>
        </div>
      </header>

      <main className="layout">
        <div className="intro">
          <h1>Give your Discord text some color.</h1>
          <p>Write a message, choose your colors, and copy it into Discord.</p>
        </div>

        <div className="workspace">
          <section className="editor" aria-labelledby="editor-title">
            <div className="section-head">
              <h2 id="editor-title">Your message</h2>
              <button
                className="quiet-link reset-link"
                type="button"
                onClick={() => {
                  changeText('', 0, 0)
                  inputRef.current?.focus()
                }}
                disabled={text.length === 0}
              >
                <X size={15} aria-hidden="true" /> Clear text
              </button>
            </div>
            <textarea
              id="message"
              ref={inputRef}
              className="message-field"
              aria-label="Message to color"
              placeholder="Type your message here…"
              value={text}
              maxLength={1200}
              spellCheck={false}
              onChange={(event) => changeText(
                event.currentTarget.value,
                event.currentTarget.selectionStart,
                event.currentTarget.selectionEnd,
              )}
              onSelect={(event) => {
                const start = event.currentTarget.selectionStart
                const end = event.currentTarget.selectionEnd
                setSelection({ start, end })
                if (start !== end) setActiveIndex(null)
              }}
            />
            <p className="field-help">Select part of your message to color just that text.</p>

            <div className="rule" />
            <div className="control-label"><span>Quick colors</span></div>
            <div className="preset-list" role="group" aria-label="Color presets">
              {PRESETS.map((preset) => (
                <PresetButton
                  key={preset.id}
                  preset={preset}
                  active={activePreset === preset.id}
                  onClick={() => usePreset(preset)}
                />
              ))}
            </div>

            <div className="rule" />
            <div className="style-heading">
              <h3>Customize</h3>
              <button type="button" className="quiet-link reset-link" onClick={resetStyles} disabled={glyphs.length === 0}>
                <RotateCcw size={14} aria-hidden="true" /> Reset styles
              </button>
            </div>
            <p className="target-label" aria-live="polite">{targetLabel}</p>

            <div className="format-controls" role="group" aria-label="Text formatting">
              <button
                type="button"
                className={isBold ? 'format-option is-active' : 'format-option'}
                aria-pressed={isBold}
                onClick={() => toggleStyle('bold', isBold)}
                disabled={glyphs.length === 0}
              >
                <Bold size={16} aria-hidden="true" /> Bold
              </button>
              <button
                type="button"
                className={isUnderlined ? 'format-option is-active' : 'format-option'}
                aria-pressed={isUnderlined}
                onClick={() => toggleStyle('underline', isUnderlined)}
                disabled={glyphs.length === 0}
              >
                <Underline size={16} aria-hidden="true" /> Underline
              </button>
            </div>

            <div className="palette-stack">
              <ColorPicker
                label="Text color"
                colors={FOREGROUND}
                selected={commonForeground}
                onChoose={(code) => changeSelected((glyph) => ({ ...glyph, fg: code }))}
                onRemove={() => changeSelected((glyph) => ({ ...glyph, fg: null }))}
                disabled={glyphs.length === 0}
              />
              <ColorPicker
                label="Background color"
                colors={BACKGROUND}
                selected={commonBackground}
                onChoose={(code) => changeSelected((glyph) => ({ ...glyph, bg: code }))}
                onRemove={() => changeSelected((glyph) => ({ ...glyph, bg: null }))}
                disabled={glyphs.length === 0}
              />
            </div>
          </section>

          <section className="result" aria-labelledby="preview-title">
            <div className="section-head preview-head">
              <h2 id="preview-title">Preview</h2>
              <span className="preview-note">Discord desktop</span>
            </div>
            <div className="discord-frame">
              <div className="channel-name"><span aria-hidden="true">#</span> general</div>
              <div className="chat-message">
                <div className="avatar" aria-hidden="true">D</div>
                <div className="chat-main">
                  <div className="chat-name">You <span>Today</span></div>
                  <div className="ansi-preview" aria-label="Preview of formatted message">
                    {glyphs.length === 0
                      ? <span className="empty-preview">Your message will appear here.</span>
                      : glyphs.map((glyph, index) => glyph.char === '\n'
                        ? <br key={index} />
                        : <button
                            key={index}
                            type="button"
                            className={activeIndex === index ? 'preview-char is-targeted' : 'preview-char'}
                            aria-label={'Select character ' + (index + 1) + ': ' + (glyph.char === ' ' ? 'space' : glyph.char)}
                            aria-pressed={activeIndex === index}
                            title="Click to edit this character"
                            onClick={() => {
                              setActiveIndex(index)
                              setSelection({ start: 0, end: 0 })
                            }}
                            style={{
                              color: colorHex(glyph.fg, FOREGROUND, '#e6e8ed'),
                              backgroundColor: colorHex(glyph.bg, BACKGROUND, 'transparent'),
                              fontWeight: glyph.bold ? 700 : 400,
                              textDecoration: glyph.underline ? 'underline' : 'none',
                            }}
                          >{glyph.char === ' ' ? '\u00a0' : glyph.char}</button>,
                      )}
                  </div>
                </div>
              </div>
            </div>
            <p className="preview-tip">Click a character in the preview to style it on its own.</p>

            <div className="copy-area">
              <button type="button" className="copy-button" onClick={copyToClipboard} disabled={!canCopy}>
                {copyState === 'done'
                  ? <Check size={18} aria-hidden="true" />
                  : <Copy size={18} aria-hidden="true" />}
                {copyState === 'done' ? 'Copied!' : 'Copy for Discord'}
              </button>
              <span className={exceedsLimit ? 'character-count is-over' : 'character-count'}>
                {output.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
              </span>
            </div>
            <div className="feedback" role="status" aria-live="polite">
              {copyState === 'done' && 'Paste the copied text into Discord.'}
              {copyState === 'error' && 'Clipboard access was blocked. Allow access and try again.'}
              {exceedsLimit && ' The formatted message exceeds Discord’s 2,000-character limit.'}
              {containsFence && ' Remove triple backticks from your text before copying.'}
            </div>

            <details className="code-details">
              <summary>View ANSI code</summary>
              <pre><code>{readableOutput}</code></pre>
            </details>

            <p className="compatibility">
              ANSI colors work in supported Discord desktop clients. Mobile Discord may show plain text.
              {' '}<a href="https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06" target="_blank" rel="noopener noreferrer">ANSI guide</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="layout footer-inner">
          <span>Unofficial Discord tool</span>
          <a href="https://github.com/darbyjack/discord-colors" target="_blank" rel="noopener noreferrer">Source code</a>
        </div>
      </footer>
    </div>
  )
}
