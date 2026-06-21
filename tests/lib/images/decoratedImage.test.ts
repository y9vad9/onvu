import { describe, it, expect } from 'vitest'
import { parseDecoratedImage } from '@lib/images/decoratedImage'

describe('parseDecoratedImage', () => {
  it('passes through a clean URL', () => {
    expect(parseDecoratedImage('/images/logo.svg')).toEqual({
      src: '/images/logo.svg',
      className: '',
    })
  })

  it('strips `?dark-invert` and tags the image with the class', () => {
    expect(parseDecoratedImage('/logo.svg?dark-invert')).toEqual({
      src: '/logo.svg',
      className: 'image-dark-invert',
    })
  })

  it('strips `&dark-invert` mid-query without dropping siblings', () => {
    expect(parseDecoratedImage('/logo.svg?v=2&dark-invert')).toEqual({
      src: '/logo.svg?v=2',
      className: 'image-dark-invert',
    })
  })

  it('strips `?dark-invert&...` keeping the trailing params', () => {
    expect(parseDecoratedImage('/logo.svg?dark-invert&v=2')).toEqual({
      src: '/logo.svg?v=2',
      className: 'image-dark-invert',
    })
  })

  it('leaves `?dark-invertX` alone (not a full marker match)', () => {
    expect(parseDecoratedImage('/logo.svg?dark-invertX').className).toBe('')
  })

  it('works on absolute URLs', () => {
    expect(parseDecoratedImage('https://cdn.example.com/logo.svg?dark-invert')).toEqual({
      src: 'https://cdn.example.com/logo.svg',
      className: 'image-dark-invert',
    })
  })
})
