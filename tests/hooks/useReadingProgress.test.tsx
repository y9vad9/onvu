import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReadingProgress } from '@hooks/useReadingProgress'

beforeEach(() => {
  document.body.innerHTML = '<div id="reading-progress" style="width:0%"></div>'
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: 2000,
    configurable: true,
  })
  Object.defineProperty(window, 'innerHeight', {
    value: 1000,
    configurable: true,
  })
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useReadingProgress', () => {
  it('initialises the bar to 0% width', () => {
    renderHook(() => useReadingProgress())
    expect((document.getElementById('reading-progress') as HTMLElement).style.width).toBe('0%')
  })

  it('updates the bar width on scroll', () => {
    renderHook(() => useReadingProgress())
    act(() => {
      ;(window as unknown as { scrollY: number }).scrollY = 500
      window.dispatchEvent(new Event('scroll'))
    })
    // (500 / (2000 - 1000)) * 100 = 50
    expect((document.getElementById('reading-progress') as HTMLElement).style.width).toBe('50%')
  })

  it('caps at 100% when scrolled past the bottom', () => {
    renderHook(() => useReadingProgress())
    act(() => {
      ;(window as unknown as { scrollY: number }).scrollY = 9000
      window.dispatchEvent(new Event('scroll'))
    })
    expect((document.getElementById('reading-progress') as HTMLElement).style.width).toBe('100%')
  })

  it('shows 0% when there is no scrollable content (docHeight = 0)', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 800,
      configurable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 1000,
      configurable: true,
    })
    renderHook(() => useReadingProgress())
    expect((document.getElementById('reading-progress') as HTMLElement).style.width).toBe('0%')
  })

  it('is a no-op when #reading-progress is absent', () => {
    document.body.innerHTML = ''
    expect(() => {
      renderHook(() => useReadingProgress())
      window.dispatchEvent(new Event('scroll'))
    }).not.toThrow()
  })
})
