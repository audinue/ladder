import { ready } from './util.js'
import { patchChildNodes } from './patch.js'
import { hub } from './hub.js'

let views = new Set()
let frame

hub.on('any', event => {
  if (event.hub !== hub || event.type !== 'update') {
    update()
  }
})

export function mount (selector, render) {
  return ready()
    .then(() => {
      let view = {
        container: document.querySelector(selector),
        render
      }
      views.add(view)
      update()
      return () => views.delete(view)
    })
}

export function update () {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    for (let { container, render } of views) {
      patchChildNodes(container, render())
    }
    hub.post('update')
  })
}
