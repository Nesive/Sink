import { describe, expect, it, vi } from 'vitest'
import { copyText } from '../../app/utils/copy-text'

describe('copyText', () => {
  it('uses the async clipboard API when it succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(copyText('https://link.nesive.cn/abc', { writeText })).resolves.toBe('clipboard')
    expect(writeText).toHaveBeenCalledWith('https://link.nesive.cn/abc')
  })

  it('falls back to the legacy path when the clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    const execCopy = vi.fn().mockReturnValue(true)
    await expect(copyText('https://link.nesive.cn/abc', { writeText, execCopy })).resolves.toBe('legacy')
    expect(execCopy).toHaveBeenCalledWith('https://link.nesive.cn/abc')
  })

  it('reports failure when every layer fails, so the UI can show the manual-copy prompt', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    const execCopy = vi.fn().mockReturnValue(false)
    await expect(copyText('https://link.nesive.cn/abc', { writeText, execCopy })).resolves.toBe('failed')
  })

  it('reports failure when the clipboard API is missing and the legacy path throws', async () => {
    const writeText = vi.fn().mockRejectedValue(new TypeError('clipboard unavailable'))
    const execCopy = vi.fn().mockImplementation(() => {
      throw new Error('no document')
    })
    await expect(copyText('https://link.nesive.cn/abc', { writeText, execCopy })).resolves.toBe('failed')
  })
})
