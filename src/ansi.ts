/** Discord supports the basic eight ANSI foreground and background colors. */
export type Glyph = {
  char: string
  fg: number | null
  bg: number | null
  bold: boolean
  underline: boolean
}

export type Color = {
  code: number
  label: string
  hex: string
}

export const FOREGROUND: Color[] = [
  { code: 30, label: 'Gray', hex: '#4f545c' },
  { code: 31, label: 'Red', hex: '#dc322f' },
  { code: 32, label: 'Green', hex: '#859900' },
  { code: 33, label: 'Yellow', hex: '#b58900' },
  { code: 34, label: 'Blue', hex: '#268bd2' },
  { code: 35, label: 'Pink', hex: '#d33682' },
  { code: 36, label: 'Cyan', hex: '#2aa198' },
  { code: 37, label: 'White', hex: '#ffffff' },
]

export const BACKGROUND: Color[] = [
  { code: 40, label: 'Black', hex: '#002b36' },
  { code: 41, label: 'Red', hex: '#cb4b16' },
  { code: 42, label: 'Green', hex: '#586e75' },
  { code: 43, label: 'Yellow', hex: '#657b83' },
  { code: 44, label: 'Blue', hex: '#839496' },
  { code: 45, label: 'Pink', hex: '#6c71c4' },
  { code: 46, label: 'Cyan', hex: '#93a1a1' },
  { code: 47, label: 'White', hex: '#fdf6e3' },
]

export type Preset = {
  id: string
  name: string
  description: string
  colors: number[]
}

export const PRESETS: Preset[] = [
  { id: 'rainbow', name: 'Rainbow', description: 'The whole spectrum', colors: [31, 33, 32, 36, 34, 35] },
  { id: 'sunset', name: 'Sunset', description: 'Warm and vibrant', colors: [31, 33, 35, 33] },
  { id: 'ocean', name: 'Ocean', description: 'Cool blue tones', colors: [34, 36, 34, 37, 36] },
  { id: 'garden', name: 'Garden', description: 'Fresh greens', colors: [32, 36, 33, 32] },
  { id: 'candy', name: 'Candy', description: 'Pink and playful', colors: [35, 37, 35, 36] },
]

export const defaultGlyph = (char: string): Glyph => ({
  char,
  fg: null,
  bg: null,
  bold: false,
  underline: false,
})

/** Whitespace does not advance the preset, so consecutive letters cycle smoothly. */
export function withPreset(text: string, preset: Preset): Glyph[] {
  let colorIndex = 0
  return Array.from(text, (char) => ({
    ...defaultGlyph(char),
    fg: /\s/u.test(char) ? null : preset.colors[colorIndex++ % preset.colors.length],
    bold: true,
  }))
}

/** Keep character styling intact when changing the text near it. */
export function reconcileText(previous: Glyph[], nextText: string): Glyph[] {
  const incoming = Array.from(nextText)
  let prefix = 0
  while (prefix < previous.length && prefix < incoming.length && previous[prefix].char === incoming[prefix]) {
    prefix++
  }

  let suffix = 0
  while (
    suffix < previous.length - prefix &&
    suffix < incoming.length - prefix &&
    previous[previous.length - 1 - suffix].char === incoming[incoming.length - 1 - suffix]
  ) {
    suffix++
  }

  const inherited = previous[prefix - 1] ?? previous[prefix] ?? defaultGlyph('')
  const inserted = incoming.slice(prefix, incoming.length - suffix).map((char) => ({ ...inherited, char }))
  return [
    ...previous.slice(0, prefix),
    ...inserted,
    ...previous.slice(previous.length - suffix),
  ]
}

/** Convert textarea UTF-16 offsets into grapheme-safe codepoint positions. */
export function affectedIndexes(glyphs: Glyph[], start: number, end: number, activeIndex: number | null): number[] {
  if (start === end) {
    if (activeIndex !== null && activeIndex >= 0 && activeIndex < glyphs.length) return [activeIndex]
    return glyphs.map((_, index) => index)
  }

  const result: number[] = []
  let offset = 0
  glyphs.forEach((glyph, index) => {
    const next = offset + glyph.char.length
    if (offset < end && next > start) result.push(index)
    offset = next
  })
  return result
}

function styleKey(glyph: Glyph): string {
  return [glyph.fg ?? '', glyph.bg ?? '', glyph.bold ? '1' : '', glyph.underline ? '4' : ''].join(':')
}

/**
 * Produce a Discord-ready Markdown ANSI block.
 * Every style change starts with a reset to prevent formatting leaking between runs.
 */
export function encodeDiscord(glyphs: Glyph[]): string {
  const esc = '\u001b'
  let body = ''
  let lastKey = ''
  for (const glyph of glyphs) {
    const key = styleKey(glyph)
    if (key !== lastKey) {
      const parts = ['0']
      if (glyph.bold) parts.push('1')
      if (glyph.bg !== null) parts.push(String(glyph.bg))
      if (glyph.underline) parts.push('4')
      if (glyph.fg !== null) parts.push(String(glyph.fg))
      body += esc + '[' + parts.join(';') + 'm'
      lastKey = key
    }
    body += glyph.char
  }
  return '```ansi\n' + body + esc + '[0m\n```'
}

export function colorHex(code: number | null, palette: Color[], fallback: string): string {
  return palette.find((color) => color.code === code)?.hex ?? fallback
}
