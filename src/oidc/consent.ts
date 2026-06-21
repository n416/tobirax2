// OIDC ユーザー同意(consent)のスコープ判定。DB アクセスを含まない純粋ロジック。
//
// 「記憶する」方式: 一度同意した (user, client) について、保存済みスコープが今回の
// 要求スコープを網羅していれば同意画面をスキップしてよい。新しいスコープが要求された
// 場合や prompt=consent のときは再同意が必要(再要求の判断は呼び出し側)。

/** 空白区切りの scope 文字列を集合へ。空要素は除く。 */
export function parseScopeSet(scope: string | null | undefined): Set<string> {
  return new Set((scope || '').split(/\s+/).filter(Boolean))
}

/**
 * 保存済み同意スコープ(stored)が、今回の要求スコープ(requested)をすべて含むか。
 * 含むなら既存同意で足り、同意画面をスキップしてよい。要求が空集合なら true。
 */
export function scopesCovered(
  storedScope: string | null | undefined,
  requestedScope: string | null | undefined
): boolean {
  const stored = parseScopeSet(storedScope)
  for (const s of parseScopeSet(requestedScope)) {
    if (!stored.has(s)) return false
  }
  return true
}
