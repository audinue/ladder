let count = 0;
let container = document.head.appendChild(document.createElement('style'));

function style (strings, ...values) {
  let styles = {};
  let getId = name => {
    let id = styles[name];
    if (!id) {
      id = 's' + ++count;
      styles[name] = id;
    }
    return id
  };
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
  );
  return styles
}

let hub = Hub();

function Hub () {
  return {
    events: {},
    on (type, listener) {
      this.events[type] = (this.events[type] || []).concat([listener]);
    },
    off (type, listener) {
      let listeners = this.events[type];
      if (listeners) {
        this.events[type] = listeners.filter(l => l !== listener);
      }
    },
    once (type, listener) {
      let proxy = message => {
        this.off(type, proxy);
        listener(message);
      };
      this.on(type, proxy);
    },
    post (type, message) {
      let listeners = this.events[type];
      if (listeners) {
        listeners.forEach(listener => listener(message));
      }
      if (type !== 'any') {
        hub.post('any', { hub: this, type, message });
      }
    }
  }
}

let count$1 = 0;

let booleans = {
  checked : 1,
  selected: 1,
  disabled: 1,
  readonly: 1,
  multiple: 1
};

function parse (html) {
  let fragment = document.createDocumentFragment();
  let div = document.createElement('div');
  div.innerHTML = html;
  while (div.firstChild) {
    fragment.appendChild(div.firstChild);
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
  node.parentNode.insertBefore(before, node);
}

function replace (node, values) {
  switch (node.nodeType) {
    case 1:
      for (let { name, value } of [...node.attributes]) {
        if (name in booleans && isPlaceholder(value)) {
          if (!values.shift()) {
            node.removeAttribute(name);
          } else {
            node.setAttribute(name, '');
          }
        } else if (name.slice(0, 2) === 'on' && isPlaceholder(value)) {
          node.setAttribute(name, '//=>' + ++count$1);
          let listener = values.shift();
          node[name] = function (event) {
            listener.call(this, event);
            hub.post('html-event', event);
          };
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
          );
        }
      }
      break
    case 3:
      for (let text of split(node.textContent)) {
        if (isPlaceholder(text)) {
          let value = values.shift();
          if (Array.isArray(value)) {
            for (let childNode of value) {
              node.parentNode.insertBefore(childNode, node);
            }
          } else if (value instanceof Node) {
            insertBefore(node, value);
          } else {
            insertBefore(node, document.createTextNode(format(value)));
          }
        } else {
          insertBefore(node, document.createTextNode(text));
        }
      }
      node.parentNode.removeChild(node);
  }
  for (let childNode of [...node.childNodes]) {
    replace(childNode, values);
  }
}

function html (strings, ...values) {
  let fragment = parse(strings.join('{{}}'));
  replace(fragment, values);
  return fragment
}

function ready () {
  return new Promise(resolve => {
    if (document.readyState !== 'loading') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', resolve);
    }
  })
}

function patchChildNodes (previous, next) {
  let previousChildNodes = [...previous.childNodes];
  let nextChildNodes = [...next.childNodes];
  let previousCount = previousChildNodes.length;
  let nextCount = nextChildNodes.length;
  if (previousCount < nextCount) {
    for (let i = previousCount; i < nextCount; i++) {
      previous.appendChild(nextChildNodes[i]);
    }
  } else if (previousCount > nextCount) {
    for (let i = nextCount; i < previousCount; i++) {
      previous.removeChild(previousChildNodes[i]);
    }
  }
  let count = Math.min(previousCount, nextCount);
  for (let i = 0; i < count; i++) {
    patch(previousChildNodes[i], nextChildNodes[i]);
  }
}

function patch (previous, next) {
  if (!previous.isEqualNode(next)) {
    if (previous.nodeName !== next.nodeName) {
      previous.parentNode.replaceChild(next, previous);
    } else {
      switch (previous.nodeType) {
        case 1:
          for (let { name, value } of next.attributes) {
            if (previous.getAttribute(name) !== value) {
              previous.setAttribute(name, value);
              if (name.slice(0, 2) === 'on' && value.slice(0, 4) === '//=>') {
                previous[name] = next[name];
              }
            }
          }
          for (let { name } of [...previous.attributes]) {
            if (!next.hasAttribute(name)) {
              previous.removeAttribute(name);
            }
          }
          patchChildNodes(previous, next);
          break
        case 3:
          if (previous.textContent !== next.textContent) {
            previous.textContent = next.textContent;
          }
          break
      }
    }
  }
}

let views = new Set();
let frame;

hub.on('any', event => {
  if (event.hub !== hub || event.type !== 'update') {
    update();
  }
});

function mount (selector, render) {
  return ready()
    .then(() => {
      let view = {
        container: document.querySelector(selector),
        render
      };
      views.add(view);
      update();
      return () => views.delete(view)
    })
}

function update () {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    for (let { container, render } of views) {
      patchChildNodes(container, render());
    }
    hub.post('update');
  });
}

export { Hub, html, hub, mount, style, update };
