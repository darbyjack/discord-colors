import { useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Bold,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Github,
  Info,
  MousePointer2,
  Palette,
  RotateCcw,
  Sparkles,
  Underline,
  WandSparkles,
  X,
} from 'lucide-react'
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

const STARTER_TEXT = "You're next."
const MAX_MESSAGE_LENGTH = 2000

type CopyStatus = 'idle' | 'copied' | 'error'

function Swatch({
  color,
  chosen,
  onClick,
  category,
}: {
  color: Color
  chosen: boolean
  onClick: () => void
  category: string
}) {
  return (
    <button
      type="button"
      className={`swatch ${chosen ? 'swatch-selected' : ''}`}
      onClick={onClick}
      aria-label={`${category}: ${color.label}`}
      aria-pressed={chosen}
      title={`${color.label} (ANSI ${color.code})`}
    >
      <span className="swatch-color" style={{ backgroundColor: color.hex }} />
      <span className="swatch-name">{color.label}</span>
    </button>
  )
}

function PresetCard({
  preset,
  selected,
  onClick,
}: {
  preset: Preset
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`preset-card ${selected ? 'preset-selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="preset-gradient" aria-hidden="true">
        {preset.colors.map((code, index) => (
          <span key={index} style={{ backgroundColor: colorHex(code, FOREGROUND, '#fff') }} />
        ))}
      </span>
      <span className="preset-title-row">
        <span className="preset-title">{preset.name}</span>
        {selected ? <Check size={15} aria-hidden="true" /> : <ArrowUpRight size={15} aria-hidden="true" />}
      </span>
      <span className="preset-subtitle">{preset.description}</span>
    </button>
  )
}

export default function App() {
  const [glyphs, setGlyphs] = useState<Glyph[]>(() => withPreset(STARTER_TEXT, PRESETS[0]))
  const [selectedPreset, setSelectedPreset] = useState<string | null>('rainbow')
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const text = useMemo(() => glyphs.map((glyph) => glyph.char).join(''), [glyphs])
  const output = useMemo(() => encodeDiscord(glyphs), [glyphs])
  const readableOutput = useMemo(() => output.replaceAll('\u001b', '\\u001b'), [output])
  const selectedIndexes = useMemo(
    () => affectedIndexes(glyphs, selection.start, selection.end, activeIndex),
    [glyphs, selection.start, selection.end, activeIndex],
  )

  const messageLength = output.length
  const overLimit = messageLength > MAX_MESSAGE_LENGTH
  const containsFence = text.includes('```')
  const canCopy = text.length > 0 && !overLimit && !containsFence
  const scope = selection.start !== selection.end
    ? `${selectedIndexes.length} selected characters`
    : activeIndex !== null
      ? '1 preview character'
      : 'Entire message'

  function updateText(nextText: string, nextStart: number, nextEnd: number) {
    const preset = PRESETS.find((item) => item.id === selectedPreset)
    setGlyphs((previous) =>
      preset ? withPreset(nextText, preset) : reconcileText(previous, nextText),
    )
    setSelection({ start: nextStart, end: nextEnd })
    setActiveIndex(null)
    setCopyStatus('idle')
  }

  function applyToSelection(change: (glyph: Glyph) => Glyph) {
    const target = new Set(selectedIndexes)
    setGlyphs((previous) =>
      previous.map((glyph, index) => (target.has(index) ? change(glyph) : glyph)),
    )
    setSelectedPreset(null)
    setCopyStatus('idle')
  }

  function applyPreset(preset: Preset) {
    setGlyphs(withPreset(text, preset))
    setSelectedPreset(preset.id)
    setActiveIndex(null)
    setSelection({ start: 0, end: 0 })
    setCopyStatus('idle')
  }

  function resetFormatting() {
    setGlyphs(Array.from(text, defaultGlyph))
    setSelectedPreset(null)
    setActiveIndex(null)
    setSelection({ start: 0, end: 0 })
    setCopyStatus('idle')
  }

  function clearText() {
    updateText('', 0, 0)
    textareaRef.current?.focus()
  }

  function toggleStyle(property: 'bold' | 'underline') {
    const shouldEnable = !selectedIndexes.every((index) => glyphs[index][property])
    applyToSelection((glyph) => ({ ...glyph, [property]: shouldEnable }))
  }

  async function copyOutput() {
    if (!canCopy) return
    try {
      await navigator.clipboard.writeText(output)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <div className="app-shell">
      <div className="page-glow page-glow-one" aria-hidden="true" />
      <div className="page-glow page-glow-two" aria-hidden="true" />

      <header className="site-header">
        <div className="site-container header-inner">
          <a className="brand" href="/" aria-label="Discord Colors home">
            <span className="brand-symbol" aria-hidden="true">
              <span>{'{'}</span><span className="brand-dot">●</span><span>{'}'}</span>
            </span>
            <span className="brand-word">discord<span>.colors</span></span>
          </a>
          <nav className="header-links" aria-label="External links">
            <a href="https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06" target="_blank" rel="noopener noreferrer" className="header-guide">
              ANSI guide <ArrowUpRight size={15} />
            </a>
            <a href="https://github.com/darbyjack/discord-colors" target="_blank" rel="noopener noreferrer" className="github-link" aria-label="View the source code on GitHub">
              <Github size={19} /> <span>GitHub</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="site-container">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-tag"><span className="tag-light" /> THE DISCORD ANSI TEXT GENERATOR</div>
          <h1 id="hero-heading">Make your messages <span className="rainbow-heading">stand out.</span></h1>
          <p className="hero-description">
            Give your Discord messages a little color. Pick a style, fine-tune every character,
            and copy a message that's ready to paste.
          </p>
          <div className="hero-benefits" aria-label="Features">
            <span><Check size={14} /> Free forever</span>
            <span><Check size={14} /> No account needed</span>
            <span><Check size={14} /> Works in your browser</span>
          </div>
        </section>

        <section className="preset-section" aria-labelledby="preset-heading">
          <div className="section-heading-row">
            <div>
              <div className="eyebrow">01 / QUICK START</div>
              <h2 id="preset-heading">Pick a vibe <span className="subtle">or make your own</span></h2>
            </div>
            <span className="section-hint"><Sparkles size={15} /> One-click presets</span>
          </div>
          <div className="preset-grid">
            {PRESETS.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                selected={selectedPreset === preset.id}
                onClick={() => applyPreset(preset)}
              />
            ))}
          </div>
        </section>

        <section className="workspace" aria-label="ANSI message generator">
          <div className="workspace-left">
            <div className="editor-panel">
              <div className="panel-header">
                <div className="panel-header-title">
                  <span className="panel-icon"><Palette size={17} /></span>
                  <div><div className="eyebrow">02 / CREATE</div><h2>Your message</h2></div>
                </div>
                <button type="button" className="text-action" onClick={resetFormatting} disabled={glyphs.length === 0}>
                  <RotateCcw size={14} /> Reset styles
                </button>
              </div>

              <label className="input-label" htmlFor="message-input">Type your message</label>
              <div className="editor-input-wrap">
                <textarea
                  id="message-input"
                  ref={textareaRef}
                  className="message-input"
                  value={text}
                  maxLength={1200}
                  spellCheck={false}
                  placeholder="Type something colorful..."
                  onChange={(event) => updateText(
                    event.currentTarget.value,
                    event.currentTarget.selectionStart,
                    event.currentTarget.selectionEnd,
                  )}
                  onSelect={(event) => {
                    const { selectionStart, selectionEnd } = event.currentTarget
                    setSelection({ start: selectionStart, end: selectionEnd })
                    if (selectionStart !== selectionEnd) setActiveIndex(null)
                  }}
                />
                <div className="input-footer">
                  <span><MousePointer2 size={13} /> Select text here, or click a preview character to style it.</span>
                  <button type="button" className="clear-button" onClick={clearText} disabled={text.length === 0}><X size={13} /> Clear</button>
                </div>
              </div>

              <div className="format-topline">
                <div className="input-label">Text formatting</div>
                <div className="scope-pill"><span className="scope-dot" /> {scope}</div>
              </div>
              <div className="format-actions">
                <button
                  type="button"
                  className={`format-button ${selectedIndexes.length > 0 && selectedIndexes.every((index) => glyphs[index].bold) ? 'format-active' : ''}`}
                  onClick={() => toggleStyle('bold')}
                  disabled={glyphs.length === 0}
                  aria-pressed={selectedIndexes.length > 0 && selectedIndexes.every((index) => glyphs[index].bold)}
                ><Bold size={16} /> Bold</button>
                <button
                  type="button"
                  className={`format-button ${selectedIndexes.length > 0 && selectedIndexes.every((index) => glyphs[index].underline) ? 'format-active' : ''}`}
                  onClick={() => toggleStyle('underline')}
                  disabled={glyphs.length === 0}
                  aria-pressed={selectedIndexes.length > 0 && selectedIndexes.every((index) => glyphs[index].underline)}
                ><Underline size={16} /> Underline</button>
                <button
                  type="button"
                  className="format-button format-clear"
                  onClick={() => applyToSelection((glyph) => defaultGlyph(glyph.char))}
                  disabled={glyphs.length === 0}
                ><RotateCcw size={15} /> Clear formatting</button>
              </div>

              <div className="palette-divider" />
              <div className="palette-section">
                <div className="palette-title">
                  <div><span className="palette-number">A</span><h3>Text color</h3></div>
                  <button type="button" className="none-link" onClick={() => applyToSelection((glyph) => ({ ...glyph, fg: null }))} disabled={glyphs.length === 0}>Remove color</button>
                </div>
                <div className="swatch-grid">
                  {FOREGROUND.map((color) => (
                    <Swatch
                      key={color.code}
                      color={color}
                      category="Text color"
                      chosen={selectedIndexes.length > 0 && selectedIndexes.every((index) => glyphs[index].fg === color.code)}
                      onClick={() => applyToSelection((glyph) => ({ ...glyph, fg: color.code }))}
                    />
                  ))}
                </div>
              </div>
              <div className="palette-section background-palette">
                <div className="palette-title">
                  <div><span className="palette-number palette-number-b">B</span><h3>Background color</h3></div>
                  <button type="button" className="none-link" onClick={() => applyToSelection((glyph) => ({ ...glyph, bg: null }))} disabled={glyphs.length === 0}>Remove color</button>
                </div>
                <div className="swatch-grid">
                  {BACKGROUND.map((color) => (
                    <Swatch
                      key={color.code}
                      color={color}
                      category="Background color"
                      chosen={selectedIndexes.length > 0 && selectedIndexes.every((index) => glyphs[index].bg === color.code)}
                      onClick={() => applyToSelection((glyph) => ({ ...glyph, bg: color.code }))}
                    />
                  ))}
                </div>
              </div>
              <div className="editor-tip"><Info size={16} /><p><strong>Pro tip:</strong> Highlight a word in the text box to style just that word. With nothing selected, changes apply to the whole message.</p></div>
            </div>
          </div>

          <div className="workspace-right">
            <div className="preview-panel">
              <div className="panel-header">
                <div className="panel-header-title">
                  <span className="panel-icon panel-icon-violet"><WandSparkles size={17} /></span>
                  <div><div className="eyebrow">03 / PREVIEW</div><h2>See the magic</h2></div>
                </div>
                <span className="live-label"><span /> LIVE PREVIEW</span>
              </div>
              <p className="preview-intro">Here's approximately how your message will look in Discord on desktop.</p>
              <div className="discord-window">
                <div className="discord-topbar">
                  <div className="discord-hash">#</div>
                  <span>general</span>
                  <span className="discord-channel-desc">Share something colorful</span>
                  <span className="discord-dots" aria-hidden="true">•••</span>
                </div>
                <div className="discord-message">
                  <div className="discord-avatar" aria-hidden="true">D</div>
                  <div className="discord-content">
                    <div className="discord-author"><span>you</span><span className="discord-timestamp">Today at 12:00 PM</span></div>
                    <div className="discord-code" aria-label="Discord ANSI message preview">
                      {glyphs.length === 0 ? (
                        <span className="empty-preview">Your colorful message will appear here...</span>
                      ) : glyphs.map((glyph, index) => (
                        glyph.char === '\n'
                          ? <br key={index} />
                          : <button
                              type="button"
                              key={index}
                              className={`preview-char ${activeIndex === index ? 'preview-char-active' : ''}`}
                              onClick={() => {
                                setActiveIndex(index)
                                setSelection({ start: 0, end: 0 })
                              }}
                              aria-label={`Style character ${index + 1}: ${glyph.char === ' ' ? 'space' : glyph.char}`}
                              aria-pressed={activeIndex === index}
                              title="Click to style this character"
                              style={{
                                color: colorHex(glyph.fg, FOREGROUND, '#e8eaf0'),
                                backgroundColor: colorHex(glyph.bg, BACKGROUND, 'transparent'),
                                fontWeight: glyph.bold ? 750 : 400,
                                textDecoration: glyph.underline ? 'underline' : 'none',
                              }}
                            >{glyph.char === ' ' ? '\u00a0' : glyph.char}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="discord-bottom"><span>+</span> Message #general <span className="discord-emoji" aria-hidden="true">☺</span></div>
              </div>
              <p className="preview-hint"><MousePointer2 size={14} /> Click any character above to customize it individually.</p>
            </div>

            <div className="export-panel">
              <div className="panel-header">
                <div className="panel-header-title">
                  <span className="panel-icon panel-icon-blue"><Code2 size={17} /></span>
                  <div><div className="eyebrow">04 / EXPORT</div><h2>Copy & paste</h2></div>
                </div>
                <span className="code-badge">ANSI</span>
              </div>
              <p className="export-description">This is the generated ANSI markup. Copy it with the button below, then paste it into a Discord message.</p>
              <div className="code-output">
                <div className="code-output-header"><span className="code-dot red-dot" /><span className="code-dot yellow-dot" /><span className="code-dot green-dot" /><span className="code-filename">message.ansi</span></div>
                <pre aria-label="Readable ANSI markup"><code>{readableOutput}</code></pre>
              </div>
              <div className="limit-row">
                <span>Discord message length</span>
                <span className={overLimit ? 'limit-error' : 'limit-count'}>{messageLength.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}</span>
              </div>
              <div className="limit-track"><div style={{ width: `${Math.min((messageLength / MAX_MESSAGE_LENGTH) * 100, 100)}%` }} className={overLimit ? 'limit-fill limit-fill-error' : 'limit-fill'} /></div>
              {overLimit && <p className="validation-message">Your message exceeds Discord's 2,000-character limit. Try shorter text or fewer color changes.</p>}
              {containsFence && <p className="validation-message">Messages containing triple backticks would end the ANSI code block early. Remove them before copying.</p>}
              <button type="button" className={`copy-button ${copyStatus === 'copied' ? 'copy-button-done' : ''}`} disabled={!canCopy} onClick={copyOutput}>
                {copyStatus === 'copied' ? <Check size={19} /> : <Copy size={19} />}
                {copyStatus === 'copied' ? 'Copied to clipboard!' : 'Copy for Discord'}
                <ArrowRight size={19} className="copy-arrow" />
              </button>
              {copyStatus === 'error' && <p className="validation-message">Clipboard access was blocked. Allow clipboard permissions and try again.</p>}
              <p className="copy-footnote">Includes the code fence and real ANSI escape characters. Ready to paste.</p>
            </div>

            <div className="compat-card">
              <div className="compat-icon"><Info size={19} /></div>
              <div>
                <h3>A quick compatibility note</h3>
                <p>Discord ANSI colors display on supported desktop clients. Mobile clients generally show plain text instead. This tool is unofficial and isn't affiliated with Discord.</p>
                <a href="https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06" target="_blank" rel="noopener noreferrer">Read the original ANSI guide <ExternalLink size={13} /></a>
              </div>
            </div>
          </div>
        </section>

        <section className="how-section" aria-labelledby="how-heading">
          <div className="eyebrow">SIMPLE BY DESIGN</div>
          <h2 id="how-heading">Colorful messages in three steps.</h2>
          <div className="how-grid">
            <div><span className="how-number">01</span><h3>Write your text</h3><p>Start with a message, or edit the example we've filled in.</p></div>
            <div><span className="how-number">02</span><h3>Make it yours</h3><p>Choose a preset, select words, or color individual characters.</p></div>
            <div><span className="how-number">03</span><h3>Paste into Discord</h3><p>Copy the ANSI block and send it in a desktop Discord chat.</p></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-container footer-inner">
          <div className="footer-brand"><span className="footer-rainbow">● ● ●</span> discord.colors <span className="footer-muted">/ An unofficial community tool</span></div>
          <div className="footer-links">
            <a href="https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06" target="_blank" rel="noopener noreferrer">Original ANSI guide <ArrowUpRight size={13} /></a>
            <a href="https://github.com/darbyjack/discord-colors" target="_blank" rel="noopener noreferrer">Source code <Github size={14} /></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
