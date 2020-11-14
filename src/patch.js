export function patchChildNodes (previous, next) {
  let previousChildNodes = [...previous.childNodes]
  let nextChildNodes = [...next.childNodes]
  let previousCount = previousChildNodes.length
  let nextCount = nextChildNodes.length
  if (previousCount < nextCount) {
    for (let i = previousCount; i < nextCount; i++) {
      previous.appendChild(nextChildNodes[i])
    }
  } else if (previousCount > nextCount) {
    for (let i = nextCount; i < previousCount; i++) {
      previous.removeChild(previousChildNodes[i])
    }
  }
  let count = Math.min(previousCount, nextCount)
  for (let i = 0; i < count; i++) {
    patch(previousChildNodes[i], nextChildNodes[i])
  }
}

function patch (previous, next) {
  if (!previous.isEqualNode(next)) {
    if (previous.nodeName !== next.nodeName) {
      previous.parentNode.replaceChild(next, previous)
    } else {
      switch (previous.nodeType) {
        case 1:
          for (let { name, value } of next.attributes) {
            if (previous.getAttribute(name) !== value) {
              previous.setAttribute(name, value)
              if (name.slice(0, 2) === 'on' && value.slice(0, 4) === '//=>') {
                previous[name] = next[name]
              }
            }
          }
          for (let { name } of [...previous.attributes]) {
            if (!next.hasAttribute(name)) {
              previous.removeAttribute(name)
            }
          }
          patchChildNodes(previous, next)
          break
        case 3:
          if (previous.textContent !== next.textContent) {
            previous.textContent = next.textContent
          }
          break
      }
    }
  }
}