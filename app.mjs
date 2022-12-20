import { addGlobalEventListener, qs } from './common.mjs'

const zoomPropertyKey = '--zoom'

const getZoom = () => {
  const zoomLevelCssValue = document.body.style.getPropertyValue(zoomPropertyKey) || '1'
  return Number(zoomLevelCssValue)
}

const minZoomLevel = 1
const maxZoomLevel = 3

const setZoom = (newZoomLevel = 1) => {
  newZoomLevel = Math.max(minZoomLevel, Math.min(maxZoomLevel, newZoomLevel))
  document.body.style.setProperty(zoomPropertyKey, newZoomLevel)
}

const zoomExponent = 1.2

const zoomOut = () => {
  setZoom(getZoom() / zoomExponent)
}

const zoomIn = () => {
  setZoom(getZoom() * zoomExponent)
}

addGlobalEventListener({
  type: 'DOMContentLoaded',
  callback: () => {
    console.log('hallo')

    const inpu = qs('#inpu')
    const spa = qs('#spa')
    const form = qs('#form')
    const bbox = qs('#bbox')
    const bbox2 = qs('#bbox2')
    const out = qs('#out')

    const zoomInButton = qs('#zoom_in')
    const zoomOutButton = qs('#zoom_out')

    zoomInButton?.addEventListener('click', () => {
      zoomIn()
    })
    zoomOutButton?.addEventListener('click', () => {
      zoomOut()
    })

    const slow = qs('#slowdown')
    const slowModeFlagName = '--slow-mode'
    const slowModeAnimationDurationMillis = 2000
    const normalModeAnimationDurationMillis = 250
    const slowModeToNormalModeModifier = slowModeAnimationDurationMillis / normalModeAnimationDurationMillis
    const normalModeToSlowModeModifier = 1 / slowModeToNormalModeModifier

    slow.addEventListener('change', () => {
      const isSlow = slow.checked
      const playbackRateModifier = isSlow ? normalModeToSlowModeModifier : slowModeToNormalModeModifier
      document.body.style.setProperty(slowModeFlagName, isSlow ? 1 : 0)
      document.getAnimations().forEach((animation) => {
        animation.updatePlaybackRate(animation.playbackRate * playbackRateModifier)
      })
    })

    const darkModeMediaMatch = window.matchMedia('(prefers-color-scheme: dark)')

    const initStyle = () => {
      inpu.style.color = ''
      const propertiesToCopy = ['color', 'font', 'padding', 'border', 'margin', 'background']
      Object.assign(spa.style, Object.fromEntries(Object.entries(window.getComputedStyle(inpu)).filter(([k, v]) => propertiesToCopy.includes(k))))
      inpu.style.color = 'transparent'
      inpu.style.caretColor = spa.style.color
      const inputRect = inpu.getBoundingClientRect()
      spa.style.left = inputRect.left + 'px'
      spa.style.top = inputRect.top + 'px'
    }

    initStyle()

    darkModeMediaMatch.addEventListener('change', (e) => {
      console.info('change', e)
      initStyle()
    })

    spa.style.width = '100vw'

    const syncContent = () => {
      const currentContent = spa.textContent
      const newContent = inpu.value
      const shorterLength = Math.min(currentContent.length, newContent.length)
      const longerLength = Math.min(currentContent.length, newContent.length)
      for (let i = 0; i < shorterLength; i++) {
        
      }
    }

    inpu.addEventListener('input', syncContent)

    inpu.addEventListener('scroll', () => {
      spa.scrollLeft = inpu.scrollLeft
    })

    function displayBBox (node, bboxElem) {
      const textNode = node.firstChild
      if (!textNode) return
      const range = document.createRange()
      // const scroll = node.scrollLeft
      range.selectNodeContents(textNode)
      // node.scrollLeft = scroll
      const rect = range.getBoundingClientRect()
      bboxElem.style.left = rect.left + 'px'
      bboxElem.style.top = rect.top + 'px'
      bboxElem.style.width = rect.width + 'px'
      bboxElem.style.height = rect.height + 'px'
      return {
        l: rect.left,
        t: rect.top,
        w: rect.width,
        h: rect.height
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const invisibleClass = 'invisible'

      const currentText = spa.textContent
      const previousText = out.textContent

      bbox.textContent = currentText
      bbox2.textContent = currentText
      inpu.value = inpu.getAttribute('value')

      bbox.style.font = spa.style.font
      bbox2.style.font = window.getComputedStyle(out).font

      bbox.classList.remove(invisibleClass)
      bbox2.classList.remove(invisibleClass)

      const { l: l1, t: t1, w: w1, h: h1 } = displayBBox(spa, bbox)
      out.classList.add(invisibleClass)
      out.textContent = currentText
      const { l: l2, t: t2, w: w2, h: h2 } = displayBBox(out, bbox2)
      out.textContent = previousText
      out.classList.remove(invisibleClass)
      const [trX, trY] = [l2 - l1, t2 - t1]
      const [ItrX, ItrY] = [-trX, -trY]
      const [scX, scY] = [w2 / w1, h2 / h1]
      const [IscX, IscY] = [1 / scX, 1 / scY]
      const isSlowMode = Boolean(Number(document.body.style.getPropertyValue(slowModeFlagName)))
      const animationDurationMillis = isSlowMode ? slowModeAnimationDurationMillis : normalModeAnimationDurationMillis
      const animationOption = {
        duration: animationDurationMillis,
        iterations: 1,
        fill: 'forwards',
        easing: 'ease'
      }
      const outAnimation = out.animate([
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.667)' }
      ], { duration: animationDurationMillis })
      outAnimation.addEventListener('finish', () => {
        out.textContent = currentText
      })
      bbox.animate(
        [{ transform: 'translate(0) scale(1)', opacity: 1 },
          { transform: `translate(${trX}px, ${trY}px) scale(${scX}, ${scY})`, opacity: 0 }],
        animationOption)
      const animation = bbox2.animate([
        { transform: `translate(${ItrX}px, ${ItrY}px) scale(${IscX}, ${IscY})`, opacity: 0 },
        { transform: 'translate(0) scale(1)', opacity: 1 }], animationOption)

      animation.addEventListener('finish', () => {
        bbox.classList.add(invisibleClass)
        bbox2.classList.add(invisibleClass)
        out.classList.remove(invisibleClass)
      })

      syncContent()
    })
  }
})
