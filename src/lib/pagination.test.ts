import { describe, expect, it } from 'vitest'
import { paginate, validPageSize } from './pagination'

describe('任务分页边界', () => {
  it('支持非整页尾部和全部模式', () => {
    expect(paginate(428, 9, 50)).toEqual({ page: 9, pages: 9, start: 400, end: 428 })
    expect(paginate(428, 9, 0)).toEqual({ page: 1, pages: 1, start: 0, end: 428 })
    expect(paginate(428, 6, 75)).toEqual({ page: 6, pages: 6, start: 375, end: 428 })
  })
  it('过滤或删除后限制页码，空列表保持一页', () => {
    expect(paginate(12, 9, 50)).toEqual({ page: 1, pages: 1, start: 0, end: 12 })
    expect(paginate(0, 9, 50)).toEqual({ page: 1, pages: 1, start: 0, end: 0 })
  })
  it('无效持久化数量回退默认值', () => {
    for (const value of [-1, 1.5, 10001, null, '50', NaN]) expect(validPageSize(value)).toBe(50)
    for (const value of [0, 1, 75, 10000]) expect(validPageSize(value)).toBe(value)
  })
})
