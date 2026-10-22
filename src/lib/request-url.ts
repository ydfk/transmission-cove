export function requestUrl(input: string, pageUrl = globalThis.location?.href): string {
  if (!pageUrl) return input
  // URL Basic 登录后，相对 fetch 可能继承文档中的凭据并被浏览器拒绝。
  // 只清理基地址；认证由同源请求沿用浏览器缓存，不读取或另存密码。
  const base = new URL(pageUrl)
  base.username = ''; base.password = ''
  return new URL(input, base).href
}
