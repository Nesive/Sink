// Copy helper with a robust fallback chain.
//
// The async Clipboard API is not always available (older browsers, embedded
// webviews, denied permission), and the previous implementation reported
// success even when its execCommand fallback silently failed, so users saw
// "copied" and pasted nothing. This helper tries each layer in order and
// reports which one actually worked, so the UI can fall back to a
// manual-copy prompt instead of showing a false success.

export type CopyOutcome = 'clipboard' | 'legacy' | 'failed'

export interface CopyAdapters {
  writeText?: (text: string) => Promise<void>
  execCopy?: (text: string) => boolean
}

function defaultExecCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  }
  catch {
    ok = false
  }
  textarea.remove()
  return ok
}

export async function copyText(text: string, adapters: CopyAdapters = {}): Promise<CopyOutcome> {
  const writeText = adapters.writeText ?? (async (value: string) => {
    await navigator.clipboard.writeText(value)
  })
  const execCopy = adapters.execCopy ?? defaultExecCopy
  try {
    await writeText(text)
    return 'clipboard'
  }
  catch {
    // Fall through to the legacy path.
  }
  try {
    if (execCopy(text))
      return 'legacy'
  }
  catch {
    // Fall through to failure.
  }
  return 'failed'
}
