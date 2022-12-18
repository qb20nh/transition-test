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
   * @typedef {[[number, number], [number, number]]} matrix2x2
   * @typedef {[[number], [number]]} matrix1x2
   * @param {matrix2x2} m1 first matrix
   * @param {matrix1x2} m2 second matrix
   * @returns {matrix1x2}
   */
  /* eslint-disable indent */
  matMul ([[a1, b1],
           [c1, d1]],
          [[x],
           [y]]) {
    return [[a1 * x + b1 * y],
            [c1 * x + d1 * y]]
  }
  /* eslint-enable indent */
}

/**
 * Registers event listeners related to scroll handling
 * @param {(newHoveredElement: Element) => void} setHoveredElement setter
 * @param {() => Element} getHoveredElement getter
 */
const listenToScroll = (setHoveredElement, getHoveredElement) => {
  document.addEventListener('pointermove', ({ clientX, clientY }) => {
    const hoveredElement = document.elementFromPoint(clientX, clientY)
    setHoveredElement(hoveredElement)
  }, { passive: true })
  document.addEventListener('pointerleave', (_) => {
    setHoveredElement(null)
  }, { passive: true })
  document.addEventListener('wheel', (e) => {
    const { deltaX, deltaY } = e
    const wrapper = preparedWrapper
    const { classList } = wrapper
    const [axis, direction] = [util.ab(classList, 'block', 'inline'), util.ab(classList, 'start', 'end')]
    const matrixMap = {
      // [[c, s], [-s, c]]
      // cos 1 0 -1 0
      // sin 0 1 0 -1
      [['block', 'start']]: [[1, 0], [0, 1]],
      [['inline', 'end']]: [[0, 1], [-1, 0]],
      [['block', 'end']]: [[-1, 0], [0, -1]],
      [['inline', 'start']]: [[0, -1], [1, 0]]
    }
    const rotationMatrix = matrixMap[[axis, direction]]
    const hoveredElement = getHoveredElement()
    const { scrollWidth, scrollHeight } = hoveredElement

    (hoveredElement ?? wrapper).scrollBy(deltaX, deltaY)
  })
}

document.addEventListener('DOMContentLoaded', (_) => {
  insertStyle()
  wrapBody()

  let hoveredElement = null
  listenToScroll((newHoveredElement) => {
    hoveredElement = newHoveredElement
  }, () => hoveredElement)
}, { passive: true })
