import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { RobulaPlus } from "./index"

describe("RobulaPlus", () => {
  let container: HTMLElement

  beforeEach(() => {
    // Create a fresh container for each test
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(() => {
    // Clean up after each test
    document.body.removeChild(container)
  })

  describe("Attribute prioritization", () => {
    it("should prioritize data-testid over other attributes", () => {
      container.innerHTML = `
        <div>
          <button data-testid="submit-btn" class="btn-primary" name="submit">Submit</button>
          <button data-testid="cancel-btn" class="btn-secondary" name="cancel">Cancel</button>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()
      const xpath = robula.getRobustXPath(buttons[0], document)

      // Should use data-testid in the XPath because there are multiple buttons
      expect(xpath).toContain("data-testid")
      expect(xpath).toContain("submit-btn")
    })

    it("should prioritize data-test-id over other attributes", () => {
      container.innerHTML = `
        <div>
          <button data-test-id="login-btn" class="btn-secondary" name="login">Login</button>
          <button data-test-id="logout-btn" class="btn-secondary" name="logout">Logout</button>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()
      const xpath = robula.getRobustXPath(buttons[0], document)

      // Should use data-test-id in the XPath
      expect(xpath).toContain("data-test-id")
      expect(xpath).toContain("login-btn")
    })

    it("should prioritize data-test over other attributes", () => {
      container.innerHTML = `
        <div>
          <button data-test="cancel-btn" class="btn-cancel" name="cancel">Cancel</button>
          <button data-test="ok-btn" class="btn-ok" name="ok">OK</button>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()
      const xpath = robula.getRobustXPath(buttons[0], document)

      // Should use data-test in the XPath
      expect(xpath).toContain("data-test")
      expect(xpath).toContain("cancel-btn")
    })

    it("should use data-testid even when name and class are present", () => {
      container.innerHTML = `
        <div>
          <input data-testid="username-input" name="username" class="form-input" type="text" />
          <input data-testid="password-input" name="password" class="form-input" type="text" />
        </div>
      `
      const inputs = container.querySelectorAll("input")
      const robula = new RobulaPlus()
      const xpath = robula.getRobustXPath(inputs[0], document)

      // Should prefer data-testid over name and class (and type which both have)
      expect(xpath).toContain("data-testid")
      expect(xpath).toContain("username-input")
    })
  })

  describe("aria-label exclusion", () => {
    it("should not use aria-label in XPath selectors", () => {
      container.innerHTML = `
        <div>
          <button aria-label="Submit form" class="btn-submit">送信</button>
        </div>
      `
      const button = container.querySelector("button")!
      const robula = new RobulaPlus()
      const xpath = robula.getRobustXPath(button, document)

      // Should NOT use aria-label in the XPath
      expect(xpath).not.toContain("aria-label")
      expect(xpath).not.toContain("Submit form")
    })

    it("should not use aria-label even when it's the only distinctive attribute", () => {
      container.innerHTML = `
        <div>
          <div aria-label="Navigation menu">
            <button>Click me</button>
          </div>
          <div aria-label="Footer menu">
            <button>Click me</button>
          </div>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()
      
      const xpath1 = robula.getRobustXPath(buttons[0], document)
      const xpath2 = robula.getRobustXPath(buttons[1], document)

      // Should NOT use aria-label anywhere in the XPath
      expect(xpath1).not.toContain("aria-label")
      expect(xpath2).not.toContain("aria-label")
      
      // The XPaths should still uniquely identify each button (using position or other attributes)
      expect(robula.uniquelyLocate(xpath1, buttons[0], document)).toBe(true)
      expect(robula.uniquelyLocate(xpath2, buttons[1], document)).toBe(true)
    })

    it("should prefer other attributes over aria-label", () => {
      container.innerHTML = `
        <div>
          <button aria-label="Submit the form" name="submit-btn">Submit</button>
          <button aria-label="Cancel the form" name="cancel-btn">Cancel</button>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()
      const xpath = robula.getRobustXPath(buttons[0], document)

      // Should use name instead of aria-label
      expect(xpath).not.toContain("aria-label")
      expect(xpath).toContain("name")
      expect(xpath).toContain("submit-btn")
    })
  })

  describe("Combined scenarios", () => {
    it("should prioritize data-testid over name, class, and aria-label", () => {
      container.innerHTML = `
        <div>
          <button 
            data-testid="primary-action"
            aria-label="Primary action button"
            name="action"
            class="btn-primary"
          >
            Click
          </button>
          <button 
            data-testid="secondary-action"
            aria-label="Secondary action button"
            name="action"
            class="btn-secondary"
          >
            Click
          </button>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()
      const xpath = robula.getRobustXPath(buttons[0], document)

      // Should use data-testid and not aria-label
      expect(xpath).toContain("data-testid")
      expect(xpath).toContain("primary-action")
      expect(xpath).not.toContain("aria-label")
    })

    it("should work with multiple elements with data-testid", () => {
      container.innerHTML = `
        <div>
          <button data-testid="btn-1">Button</button>
          <button data-testid="btn-2">Button</button>
          <button data-testid="btn-3">Button</button>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()

      const xpath1 = robula.getRobustXPath(buttons[0], document)
      const xpath2 = robula.getRobustXPath(buttons[1], document)
      const xpath3 = robula.getRobustXPath(buttons[2], document)

      // Each should use its unique data-testid
      expect(xpath1).toContain("btn-1")
      expect(xpath2).toContain("btn-2")
      expect(xpath3).toContain("btn-3")

      // Each should uniquely identify its element
      expect(robula.uniquelyLocate(xpath1, buttons[0], document)).toBe(true)
      expect(robula.uniquelyLocate(xpath2, buttons[1], document)).toBe(true)
      expect(robula.uniquelyLocate(xpath3, buttons[2], document)).toBe(true)
    })
  })

  describe("XPath quote escaping", () => {
    it("should handle single quotes in data-testid values", () => {
      container.innerHTML = `
        <div>
          <button data-testid="user's-button">Button 1</button>
          <button data-testid="admin-button">Button 2</button>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()

      const xpath1 = robula.getRobustXPath(buttons[0], document)
      
      // Should use data-testid and properly escape the single quote
      expect(xpath1).toContain("data-testid")
      // XPath should use double quotes when value contains single quote
      expect(xpath1).toMatch(/data-testid="user's-button"/)
      
      // XPath should uniquely identify the element
      expect(robula.uniquelyLocate(xpath1, buttons[0], document)).toBe(true)
    })

    it("should handle double quotes in data-testid values", () => {
      container.innerHTML = `
        <div>
          <button data-testid='say-"hello"'>Button 1</button>
          <button data-testid="other-button">Button 2</button>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()

      const xpath1 = robula.getRobustXPath(buttons[0], document)
      
      // Should use data-testid and properly escape the double quotes
      expect(xpath1).toContain("data-testid")
      // XPath should use single quotes when value contains double quote
      expect(xpath1).toMatch(/data-testid='say-"hello"'/)
      
      // XPath should uniquely identify the element
      expect(robula.uniquelyLocate(xpath1, buttons[0], document)).toBe(true)
    })

    it("should handle both single and double quotes in data-testid values", () => {
      container.innerHTML = `
        <div>
          <button data-testid='it&apos;s-a-"test"'>Button 1</button>
          <button data-testid="other-button">Button 2</button>
        </div>
      `
      const buttons = container.querySelectorAll("button")
      const robula = new RobulaPlus()

      const xpath1 = robula.getRobustXPath(buttons[0], document)
      
      // Should use data-testid and use concat() for mixed quotes
      expect(xpath1).toContain("data-testid")
      expect(xpath1).toContain("concat(")
      
      // XPath should uniquely identify the element
      expect(robula.uniquelyLocate(xpath1, buttons[0], document)).toBe(true)
    })

    it("should handle single quotes in text content", () => {
      container.innerHTML = `
        <div>
          <span>It's a test</span>
          <span>Another test</span>
        </div>
      `
      const spans = container.querySelectorAll("span")
      const robula = new RobulaPlus()

      const xpath1 = robula.getRobustXPath(spans[0], document)
      
      // XPath should use contains() with properly escaped text
      expect(xpath1).toContain("contains(text(),")
      
      // XPath should uniquely identify the element
      expect(robula.uniquelyLocate(xpath1, spans[0], document)).toBe(true)
    })
  })
})
