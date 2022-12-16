export function randomNumberBetween (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function sleep (duration) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

export function memoize (cb) {
  const cache = new Map()
  return (...args) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)

    const result = cb(...args)
    cache.set(key, result)
    return result
  }
}

export function addGlobalEventListener ({
  type,
  callback = () => {},
  options = {},
  selector = '*',
  parent = document
}) {
  parent.addEventListener(
    type,
    e => {
      if (e.target.parentNode === null || e.target.matches(selector)) callback(e)
    },
    options
  )
}

export function qs (selector, parent = document) {
  return parent.querySelector(selector)
}

export function qsa (selector, parent = document) {
  return [...parent.querySelectorAll(selector)]
}

export function createElement (type, options = {}) {
  const element = document.createElement(type)
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'class') {
      element.classList.add(value)
      return
    }

    if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue
      })
      return
    }

    if (key === 'text') {
      element.textContent = value
      return
    }

    element.setAttribute(key, value)
  })
  return element
}
