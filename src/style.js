let count = 0
let container = document.head.appendChild(document.createElement('style'))

export function style (strings, ...values) {
  let styles = {}
  let getId = name => {
    let id = styles[name]
    if (!id) {
      id = 's' + ++count
      styles[name] = id
    }
    return id
  }
  container.appendChild(
    document.createTextNode(
      strings.slice(1)
        .reduce(
          (array, string, index) => [...array, values[index], string],
          [strings[0]]
        )
        .join('')
        .replace(/(@keyframes\s+|animation(?:-name)?\s*:\s*)([a-z0-9_-]+)/gi, (_, prefix, name) => {
          return prefix + getId(name)
        })
        .replace(/\.([a-z0-9_-]+)/gi, (_, name) => {
          return '.' + getId(name)
        })
    )
  )
  return styles
}
