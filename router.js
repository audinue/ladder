import { hub, html, update } from './index.js'

export let Router = options => ({
  uncached: false,
  index   : '#/',
  path    : null,
  params  : null,
  page    : null,
  ...options
})

let NotFound = () =>
  html`<h1>Not Found</h1><p>The page you are looking for was not found.</p>`

export let RouterView = (router, props) => {
  props = {
    notFound: NotFound,
    ...props
  }
  return router.path in (props.views ?? {})
    ? props.views[router.path](router.page, router)
    : props.notFound(router)
}

function parse (url) {
  let hash = new URL(url).hash
  if (hash.slice(0, 2) === '#/') {
    hash = new URL('http://localhost' + hash.slice(1))
    return {
      path: '#' + hash.pathname,
      params: Object.fromEntries(hash.searchParams)
    }
  }
}

export function RouterController (router) {
  hub.on('update', () => {
    if (!router.uncached) {
      history.replaceState(router.page, null)
    }
  })
  addEventListener('popstate', e => {
    let url = parse(location.href)
    if (!url) {
      location.replace(router.index)
    } else {
      Object.assign(router, url)
      if (e.state !== null && !router.uncached) {
        router.page = e.state
      } else {
        createModel()
      }
      update()
    }
  })
  let url = parse(location.href)
  if (!url) {
    location.replace(router.index)
  } else {
    Object.assign(router, url)
    createModel()
  }
  function createModel () {
    router.page = router.path in (router.models ?? {})
      ? router.models[router.path](router)
      : {}
  }
}
