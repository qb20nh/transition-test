const insertStyle = () => {
  const cssContent = `.rotate {
overflow: scroll;
position: absolute;
top: 50%;
left: 50%;
translate: -50% -50%;
}

.rotate.inline {
height: 100vw;
width: 100vh;
}

.rotate.block {
height: 100vh;
width: 100vw;
}

.rotate.inline.start {
rotate: -90deg;
}

.rotate.inline.end {
rotate: 90deg;
}

.rotate.block.end {
rotate: 180deg;
}

.cover {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.cover.scrolling {
  pointer-events: unset;
}
`

  const style = document.createElement('style')
  style.innerHTML = cssContent
  document.body.append(style)
}

/**
 * @typedef {<T>() => T} Getter<T>
 * @typedef {<T>(newValue: T) => void} Setter<T>
 * @param  {[T]} args default value
 * @returns {[Setter<T>, Getter<T>]} a getter and setter pair
 */
const createVariable = (...args) => {
  const lateValueKeySymbol = Symbol('lateValue')
  const _defaultValue = args[0] ?? { [lateValueKeySymbol]: null }
  const late = lateValueKeySymbol in _defaultValue
  delete args[0]
  const _type = typeof _defaultValue
  let value = late ? undefined : _defaultValue
  const setter = (newValue = late ? _defaultValue[lateValueKeySymbol] : _defaultValue) => {
    const newType = typeof newValue
    if (newType === _type) {
      value = newValue
      if (late && _defaultValue[lateValueKeySymbol] === null) {
        _defaultValue[lateValueKeySymbol] = value
      }
    } else {
      throw new TypeError(`Expected new value with type '${_type}' but got '${newType}'`)
    }
  }
  const getter = () => {
    return value ?? (late ? _defaultValue[lateValueKeySymbol] : _defaultValue)
  }
  return [setter, getter]
}

const [setWrapper, getWrapper] = createVariable()
const [setCover, getCover] = createVariable()

const wrapBody = () => {
  const body = document.body
  // create and insert wrapper for rotation transform
  const wrapper = document.createElement('div')
  wrapper.classList.add('rotate', 'inline', 'start')
  body.insertBefore(wrapper, body.firstChild)
  wrapper.append(...Array.from(body.childNodes).slice(1))
  setWrapper(wrapper)

  // create and insert cover to consume wheel event
  const cover = document.createElement('div')
  cover.classList.add('cover')
  body.append(cover)
  setCover(cover)
}

const util = {
  /**
   * Select from two options
   * @param {DOMTokenList} c classList
   * @param {string} a first option
   * @param {string} b second option
   */
  ab (c, a, b) {
    return c.contains(a) ? a : b
  },
  /**
   * Matrix multiplication operation
   * TODO matMul logic for any size
   * @typedef {[[number, number], [number, number]]} mat2x2
   * @typedef {[[number], [number]]} mat1x2
   * @param {mat2x2} m1 first matrix
   * @param {mat1x2} m2 second matrix
   * @returns {mat1x2}
   */
  /* eslint-disable indent */
  matMul ([[a1, b1],
           [c1, d1]],
          [x,
           y]) {
    return [a1 * x + b1 * y,
            c1 * x + d1 * y]
  },
  /* eslint-enable indent */
  // Courtesy of https://learnersbucket.com/examples/interview/debounce-function-with-immediate-flag-in-javascript/
  debounce (func, timeout, immediate = false) {
    let timer

    return function (...args) {
      const context = this
      const callNow = immediate && !timer

      clearTimeout(timer)
      timer = setTimeout(function () {
        timer = null
        if (!immediate) {
          func.apply(context, args)
        }
      }, timeout)

      if (callNow) func.apply(context, args)
    }
  }
}

const __eventBoundaryValue = 'scroll'
/**
 *
 * @param {Element} element
 * @param {number} deltaX
 * @param {number} deltaY
 */
const scrollElement = (element, deltaX, deltaY) => {
  element.__event_boundary = __eventBoundaryValue
  element.scrollBy(deltaX, deltaY)
}

/**
 *
 * @typedef {[number, number]} Position
 * @param {Position} pointerPosition
 * @param {number} transformedDeltaX
 * @param {number} transformedDeltaY
 */
// FIXME refactor to lower cognitive complexity
const scrollInnermostElement = (pointerPosition, transformedDeltaX, transformedDeltaY) => {
  // TODO investigate if swipe navigation direction is transformable
  const hoveredElements = document.elementsFromPoint(...pointerPosition).slice(1)
  // for each element under pointer position
  for (const hoveredElement of hoveredElements) {
    let [dx, dy] = [transformedDeltaX, transformedDeltaY]
    // check for scroll size and position
    const currentStyle = hoveredElement.computedStyleMap()
    const [ofx, ofy] = ['overflow-x', 'overflow-y'].map((keyword) => currentStyle.get(keyword).value)
    const scrollAllowedValues = ['scroll', 'auto']
    const [styleAllowScrollX, styleAllowScrollY] = [ofx, ofy].map((value) => scrollAllowedValues.includes(value))
    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = hoveredElement
    const [scrollSizeX, scrollSizeY] = [scrollWidth - clientWidth, scrollHeight - clientHeight]
    const [sizeAllowScrollX, sizeAllowScrollY] = [scrollSizeX > 0, scrollSizeY > 0]
    const [scrollPositionAllowScrollX, scrollPositionAllowScrollY] =
    [dx < 0 ? scrollLeft > 0 : scrollLeft < scrollSizeX, dy < 0 ? scrollTop > 0 : scrollTop < scrollSizeY]
    // and check if there is space left for scrolling for current event delta
    // if true, scroll that element and break
    if (!(styleAllowScrollX && sizeAllowScrollX && scrollPositionAllowScrollX)) {
      dx = 0
    }
    if (!(styleAllowScrollY && sizeAllowScrollY && scrollPositionAllowScrollY)) {
      dy = 0
    }
    // TODO do not change scroll direction while already scrolling
    if (dx !== 0 || dy !== 0) {
      scrollElement(hoveredElement, dx, dy)
      break
    }
    // if false, continue to next element(parent or behind)
  }
}

/**
 *
 * @param {number} angle angle in degrees
 * @returns minimum equivalent positive angle in degrees
 */
const normalizeAngle = (angle) => {
  const modulus = 360
  return ((angle % modulus) + modulus) % modulus
}

/**
 * Registers event listeners related to pointer
 * @param {(newCursorPosition: Position) => void} setCursorPosition setter
 */
const listenToPointer = (setCursorPosition) => {
  document.addEventListener('pointermove', ({ clientX, clientY }) => {
    setCursorPosition([clientX, clientY])
  }, { passive: true })

  document.addEventListener('pointerleave', (_) => {
    setCursorPosition(null)
  }, { passive: true })
}

/**
 * @type {['block' | 'inline', 'start' | 'end']} rotationKey
 * @type {{[_: rotationKey]: [angle: number]}}
 */
const rotationMap = {
  [['block', 'start']]: 0,
  [['inline', 'end']]: 90,
  [['block', 'end']]: 180,
  [['inline', 'start']]: 270
}
/**
 * @type {{[angle: number]: [matrix: mat2x2]}}
 */
const matrixMap = {
  // [[c, s], [-s, c]]
  // cos 1 0 -1 0
  // sin 0 1 0 -1
  0: [[1, 0], [0, 1]],
  90: [[0, 1], [-1, 0]],
  180: [[-1, 0], [0, -1]],
  270: [[0, -1], [1, 0]]
}

/**
 * Registers event listeners related to scroll handling
 * @param {() => Position} getCursorPosition getter
 */
const listenToScroll = (getCursorPosition) => {
  const scrollingFlag = 'scrolling'
  const debounceTimeout = 33
  const atStart = util.debounce((cover) => {
    cover.classList.add(scrollingFlag)
  }, debounceTimeout, true)
  const atEnd = util.debounce((cover) => {
    cover.classList.remove(scrollingFlag)
  }, debounceTimeout)

  document.addEventListener('wheel', (e) => {
    const { deltaX, deltaY } = e
    const wrapper = getWrapper()
    const { classList } = wrapper
    const [axis, direction] = [util.ab(classList, 'block', 'inline'), util.ab(classList, 'start', 'end')]
    const rotationAngle = normalizeAngle(rotationMap[[axis, direction]])
    const rotationMatrix = matrixMap[rotationAngle]
    const [transformedDeltaX, transformedDeltaY] = util.matMul(rotationMatrix, [deltaX, deltaY])
    const cursorPosition = getCursorPosition()

    scrollInnermostElement(cursorPosition, transformedDeltaX, transformedDeltaY)

    const cover = getCover()
    atStart(cover)
    atEnd(cover)
  }, { passive: true })
}

document.addEventListener('DOMContentLoaded', (_) => {
  insertStyle()
  wrapBody()

  const [setter, getter] = createVariable([-1, -1])
  listenToPointer(setter)
  listenToScroll(getter)
}, { passive: true })
