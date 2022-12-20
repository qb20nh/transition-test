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
`

  const style = document.createElement('style')
  style.innerHTML = cssContent
  document.body.append(style)
}

/**
 * @type Element
 */
let preparedWrapper = null

const wrapBody = () => {
  const body = document.body
  const wrapper = document.createElement('div')
  wrapper.classList.add('rotate', 'inline', 'start')
  body.insertBefore(wrapper, body.firstChild)
  wrapper.append(...Array.from(body.childNodes).slice(1))
  preparedWrapper = wrapper
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
  }
  /* eslint-enable indent */
}

/**
 *
 * @typedef {[number, number]} Position
 * @param {Position} pointerPosition
 * @param {number} transformedDeltaX
 * @param {number} transformedDeltaY
 */
const scrollInnermostElement = (pointerPosition, transformedDeltaX, transformedDeltaY) => {
  // TODO investigate if swipe navigation direction is transformable
  const hoveredElements = document.elementsFromPoint(...pointerPosition)
  for (const hoveredElement of hoveredElements) {
    console.log('🚀 ~ file: rib.mjs:91 ~ scrollInnermostElement ~ hoveredElement', hoveredElement)
    // for each element in chain of elements
    // check for scroll size and position
    break
    // and check if there is space left for scrolling for current event delta
    // if true, scroll that element and break
    // if false, continue to next element(parent or behind)
  }
}

/**
 *
 * @param {number} angle angle in degrees
 * @returns minimum equivalent positive angle in degrees
 */
const normalizeAngle = (angle) => {
  return (angle > 0 ? angle : (angle % 360 + 360)) % 360
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
  document.addEventListener('wheel', (e) => {
    const { deltaX, deltaY } = e
    const wrapper = preparedWrapper
    const { classList } = wrapper
    const [axis, direction] = [util.ab(classList, 'block', 'inline'), util.ab(classList, 'start', 'end')]
    const rotationAngle = normalizeAngle(rotationMap[[axis, direction]])
    const rotationMatrix = matrixMap[rotationAngle]
    const [transformedDeltaX, transformedDeltaY] = util.matMul(rotationMatrix, [deltaX, deltaY])
    const cursorPosition = getCursorPosition()
    scrollInnermostElement(cursorPosition, transformedDeltaX, transformedDeltaY)
  }, { passive: true })
}

/**
 * @typedef {<T>() => T} Getter<T>
 * @typedef {<T>(newValue: T) => void} Setter<T>
 * @param  {[T]} args default value
 * @returns {[Setter<T>, Getter<T>]} a getter and setter pair
 */
const createVariable = (...args) => {
  const _defaultValue = args[0]
  delete args[0]
  const _type = typeof _defaultValue
  let value = _defaultValue
  const setter = (newValue = _defaultValue) => {
    const newType = typeof newValue
    if (newType === _type) {
      value = newValue
    } else {
      throw new TypeError(`Expected new value with type '${_type}' but got '${newType}'`)
    }
  }
  const getter = () => {
    return value ?? _defaultValue
  }
  return [setter, getter]
}

document.addEventListener('DOMContentLoaded', (_) => {
  insertStyle()
  wrapBody()

  const [setter, getter] = createVariable([-1, -1])
  listenToPointer(setter)
  listenToScroll(getter)
}, { passive: true })
