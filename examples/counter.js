import { Hub, style, html } from '../index.js'

export let Counter = () =>
  ({ count: 0 })

export let hub = Hub()

export let styles = style`
  .counter {
    border: none;
    background: navy;
    color: #fff;
    font-size: 2rem;
    padding: 16px;
    border-radius: 3px;
  }
  .counter:focus {
    outline: none;
  }
`

export let CounterView = counter => html`
  <button class=${styles.counter} onclick=${e => hub.post('increment', counter)}>
    ${counter.count}
  </button>
`

hub.on('increment', counter => counter.count++)
