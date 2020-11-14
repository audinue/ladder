export let hub = Hub()

export function Hub () {
  return {
    events: {},
    on (type, listener) {
      this.events[type] = (this.events[type] || []).concat([listener])
    },
    off (type, listener) {
      let listeners = this.events[type]
      if (listeners) {
        this.events[type] = listeners.filter(l => l !== listener)
      }
    },
    once (type, listener) {
      let proxy = message => {
        this.off(type, proxy)
        listener(message)
      }
      this.on(type, proxy)
    },
    post (type, message) {
      let listeners = this.events[type]
      if (listeners) {
        listeners.forEach(listener => listener(message))
      }
      if (type !== 'any') {
        hub.post('any', { hub: this, type, message })
      }
    }
  }
}
