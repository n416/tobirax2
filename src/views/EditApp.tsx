import { Layout } from './Layout'
import { App } from '../types'
import { dict } from '../i18n'

interface Props {
  t: typeof dict.en
  app: App
}

export const EditApp = (props: Props) => {
  return (
    <Layout title={props.t.edit} lang={props.t.lang || 'ja'}>
      <nav><ul><li><a href="/admin">{props.t.cancel}</a></li></ul></nav>
      <article>
        <header>{props.t.edit}: {props.app.name}</header>
        <form method="post">
          <label>App ID (Cannot change)<input value={props.app.id} disabled /></label>
          <label>Name<input name="name" value={props.app.name} required /></label>
          <label>Base URL<input name="base_url" value={props.app.base_url} required /></label>
          <div class="grid">
            <button type="submit">{props.t.save}</button>
            <a href="/admin" role="button" class="secondary">{props.t.cancel}</a>
          </div>
        </form>
      </article>
    </Layout>
  )
}