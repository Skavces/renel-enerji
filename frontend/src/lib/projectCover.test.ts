import { describe, expect, it } from 'vitest'
import { projectCover } from './projectCover'
import type { ProjectMedia } from '../types'

const m = (id: string, type: ProjectMedia['type'], sortOrder = 0): ProjectMedia => ({
  id,
  type,
  src: `https://cdn.example.com/${id}`,
  sortOrder,
})

describe('projectCover', () => {
  it('seçili görsel kapak olur', () => {
    const c = projectCover({ coverMediaId: 'i2', media: [m('i1', 'image', 0), m('i2', 'image', 1)] })
    expect(c).toEqual({ image: 'https://cdn.example.com/i2', video: null })
  })

  it('seçili video: video + thumbnail posteri', () => {
    const c = projectCover({ coverMediaId: 'v1', media: [m('i1', 'image', 0), m('v1', 'video', 1), m('t1', 'thumbnail', 9)] })
    expect(c).toEqual({ image: 'https://cdn.example.com/t1', video: 'https://cdn.example.com/v1' })
  })

  it('thumbnail yoksa poster en düşük sortOrder’lı görsel', () => {
    const c = projectCover({ coverMediaId: 'v1', media: [m('v1', 'video', 0), m('i2', 'image', 2), m('i1', 'image', 1)] })
    expect(c.image).toBe('https://cdn.example.com/i1')
    expect(c.video).toBe('https://cdn.example.com/v1')
  })

  it('görsel yoksa yalnızca video', () => {
    expect(projectCover({ coverMediaId: 'v1', media: [m('v1', 'video')] })).toEqual({
      image: null,
      video: 'https://cdn.example.com/v1',
    })
  })

  it('geçersiz seçim otomatik kapağa döner', () => {
    const c = projectCover({ coverMediaId: 'gone', media: [m('i1', 'image', 0), m('t1', 'thumbnail', 9)] })
    expect(c).toEqual({ image: 'https://cdn.example.com/t1', video: null })
  })

  it('seçim yoksa thumbnail > ilk görsel, video asla kapak olmaz', () => {
    const c = projectCover({ coverMediaId: null, media: [m('v1', 'video', 0), m('i1', 'image', 1)] })
    expect(c).toEqual({ image: 'https://cdn.example.com/i1', video: null })
  })
})
