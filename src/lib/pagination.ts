export const pageSizes = [25, 50, 100, 200, 500]
export function validPageSize(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10000 ? value : 50
}
export function paginate(total: number, requestedPage: number, size: number) {
  const pageSize = validPageSize(size)
  const pages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize))
  const page = Math.max(1, Math.min(requestedPage, pages))
  const start = pageSize === 0 ? 0 : (page - 1) * pageSize
  const end = pageSize === 0 ? total : Math.min(total, start + pageSize)
  return { page, pages, start, end }
}
