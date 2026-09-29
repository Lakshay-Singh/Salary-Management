import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// findBy* and waitFor give up after 1s by default. With every test file rendering in parallel, a first render
// alone can take that long, so give them 3s. Passing tests are no slower: the wait ends as soon as the UI appears.
configure({ asyncUtilTimeout: 3000 })

// jsdom lacks browser APIs the suggestion list uses: cmdk sizes it with a ResizeObserver, and the highlighted
// suggestion is scrolled into view. Every real browser has both, so inert stand-ins are enough for tests.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})
