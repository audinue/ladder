import { hub } from './hub.js'

let count = 0

let booleans = {
  checked : 1,
  selected: 1,
  disabled: 1,
  readonly: 1,
  multiple: 1
}

function parse (html) {
  let fragment = document.createDocumentFragment()
  let div = document.createElement('div')
  div.innerHTML = html
  while (div.firstChild) {
    fragment.appendChild(div.firstChild)
  }
  return fragment
}

function split (text) {
  return text.split(/({{}})/)
}

function isPlaceholder (text) {
  return text === '{{}}'
}

function format (value) {
  return value ?? ''
}

function insertBefore (node, before) {
  node.parentNode.insertBefore(before, node)
}

function replace (node, values) {
  switch (node.nodeType) {
    case 1:
      for (let { name, value } of [...node.attributes]) {
        if (name in booleans && isPlaceholder(value)) {
          if (!values.shift()) {
            node.removeAttribute(name)
          } else {
            node.setAttribute(name, '')
          }
        } else if (name.slice(0, 2) === 'on' && isPlaceholder(value)) {
          node.setAttribute(name, '//=>' + ++count)
          let listener = values.shift()
          node[name] = function (event) {
            listener.call(this, event)
            hub.post('html-event', event)
          }
        } else {
          node.setAttribute(
            name,
            split(value)
              .map(
                text =>
                  isPlaceholder(text)
                    ? format(values.shift())
                    : text
              )
              .join('')
          )
        }
      }
      break
    case 3:
      for (let text of split(node.textContent)) {
        if (isPlaceholder(text)) {
          let value = values.shift()
          if (Array.isArray(value)) {
            for (let childNode of value) {
              node.parentNode.insertBefore(childNode, node)
            }
          } else if (value instanceof Node) {
            insertBefore(node, value)
          } else {
            insertBefore(node, document.createTextNode(format(value)))
          }
        } else {
          insertBefore(node, document.createTextNode(text))
        }
      }
      node.parentNode.removeChild(node)
  }
  for (let childNode of [...node.childNodes]) {
    replace(childNode, values)
  }
}

export function html (strings, ...values) {
  let fragment = parse(strings.join('{{}}'))
  replace(fragment, values)
  return fragment
}
