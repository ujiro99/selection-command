import "@testing-library/jest-dom"
import { vi } from "vitest"

// Next.js Mock
vi.mock("next/image", () => ({
  default: (props: any) => props,
}))

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => ({ children, ...props }),
}))

// LocalStorage Mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// matchMedia Mock
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ResizeObserver Mock
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// requestAnimationFrame Mock
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0)) as any
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))
