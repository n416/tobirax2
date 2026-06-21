import { html } from 'hono/html'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { Card } from './components/Card'
import { Button } from './components/Button'

interface Props {
  t: typeof dict.en
  appName: string
  userEmail: string
  scopes: string[]
  // 同意決定 POST(/authorize/decision)へそのまま引き継ぐ隠しパラメータ。
  params: Record<string, string>
  nonce?: string
}

export const Consent = (props: Props) => {
  const t = props.t

  const scopeLabel = (s: string): string => {
    switch (s) {
      case 'openid': return t.consent_scope_openid
      case 'profile': return t.consent_scope_profile
      case 'email': return t.consent_scope_email
      case 'offline_access': return t.consent_scope_offline_access
      default: return s
    }
  }

  const hidden = Object.entries(props.params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => html`<input type="hidden" name="${k}" value="${v}" />`)

  const scopeItems = props.scopes.map(
    (s) => html`<li style="display:flex; gap:0.6rem; align-items:flex-start; margin-bottom:0.6rem;">
      <span class="material-symbols-outlined" style="color: var(--accent, #0288d1); font-size:1.2rem;">check_circle</span>
      <span style="color: var(--text-main);">${scopeLabel(s)}</span>
    </li>`
  )

  return Layout({
    title: t.consent_title,
    lang: t.lang,
    nonce: props.nonce,
    children: Card({
      children: html`
        <div style="text-align:center; margin-bottom:1.5rem;">
          <h1 style="font-size:1.4rem; font-weight:800; color: var(--text-main); margin-bottom:0.4rem;">
            ${props.appName}
          </h1>
          <p style="color: var(--text-sub);">${t.consent_subtitle}</p>
        </div>

        <p style="text-align:center; color: var(--text-sub); font-size:0.9rem; margin-bottom:1.25rem;">
          ${t.consent_logged_in_as} <strong>${props.userEmail}</strong>
        </p>

        <p style="color: var(--text-main); font-weight:600; margin-bottom:0.75rem;">${t.consent_scopes_label}</p>
        <ul style="list-style:none; padding:0; margin:0 0 1.75rem 0;">
          ${scopeItems}
        </ul>

        <form method="POST" action="/authorize/decision">
          ${hidden}
          <div style="display:flex; gap:0.75rem;">
            ${Button({ type: 'submit', variant: 'ghost', children: t.consent_deny, attr: { name: 'decision', value: 'deny' } })}
            ${Button({ type: 'submit', variant: 'primary', children: t.consent_approve, attr: { name: 'decision', value: 'approve' } })}
          </div>
        </form>
      `
    })
  })
}
