import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tree", "downloadForm", "jsonInput"]
  static values  = { json: String, filename: String }

  connect() {
    this.doc       = this.safeParse(this.jsonValue)
    this.collapsed = new Set()
    this.history   = []
    this.future    = []
    this.render()
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  safeParse(str) {
    try { return JSON.parse(str) } catch { return {} }
  }

  typeOf(val) {
    if (val === null)        return "null"
    if (Array.isArray(val)) return "array"
    return typeof val // string | number | boolean | object
  }

  getAt(path) {
    return path.reduce((o, k) => (o != null ? o[k] : undefined), this.doc)
  }

  setAt(path, val) {
    if (path.length === 0) { this.doc = val; return }
    const parent = this.getAt(path.slice(0, -1))
    parent[path.at(-1)] = val
  }

  deleteAt(path) {
    const parent = this.getAt(path.slice(0, -1))
    const key    = path.at(-1)
    Array.isArray(parent) ? parent.splice(key, 1) : delete parent[key]
  }

  // Unescaped JSON string used as a unique path identifier
  pid(path)  { return JSON.stringify(path) }

  // HTML-attribute-safe version of pid
  attr(path) { return this.esc(this.pid(path)) }

  esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
  }

  parsePath(el) { return JSON.parse(el.dataset.path) }

  // ─── Rendering ──────────────────────────────────────────────────────────────

  render() {
    this.treeTarget.innerHTML = this.node(this.doc, [])
  }

  node(val, path) {
    const t = this.typeOf(val)
    if (t === "object") return this.objectNode(val, path)
    if (t === "array")  return this.arrayNode(val, path)
    return this.primitiveRoot(val, t, path)
  }

  objectNode(obj, path) {
    const p         = this.attr(path)
    const pid       = this.pid(path)
    const collapsed = this.collapsed.has(pid)
    const entries   = Object.entries(obj)
    const isRoot    = path.length === 0

    return `
      <div class="jn jn--object">
        <div class="jn__head">
          <button class="jn__toggle" data-path="${p}" data-action="click->json-editor#toggleCollapse"
                  title="${collapsed ? "Expand" : "Collapse"}">${collapsed ? "▶" : "▼"}</button>
          <span class="jn__brace">{</span>
          <span class="jn__count">${entries.length} key${entries.length !== 1 ? "s" : ""}</span>
          ${collapsed ? '<span class="jn__brace jn__brace--close">}</span>' : ""}
          ${isRoot ? "" : `<span class="jn__type-badge jn__type-badge--object">object</span>`}
        </div>
        ${collapsed ? "" : `
          <div class="jn__body">
            ${entries.map(([k, v]) => this.entry(k, v, [...path, k], false)).join("")}
            <button class="jn__add-btn" data-path="${p}" data-action="click->json-editor#addKey">＋ Add key</button>
          </div>
          <span class="jn__brace jn__brace--close">}</span>
        `}
      </div>`
  }

  arrayNode(arr, path) {
    const p         = this.attr(path)
    const pid       = this.pid(path)
    const collapsed = this.collapsed.has(pid)
    const isRoot    = path.length === 0

    return `
      <div class="jn jn--array">
        <div class="jn__head">
          <button class="jn__toggle" data-path="${p}" data-action="click->json-editor#toggleCollapse"
                  title="${collapsed ? "Expand" : "Collapse"}">${collapsed ? "▶" : "▼"}</button>
          <span class="jn__brace">[</span>
          <span class="jn__count">${arr.length} item${arr.length !== 1 ? "s" : ""}</span>
          ${collapsed ? '<span class="jn__brace jn__brace--close">]</span>' : ""}
          ${isRoot ? "" : `<span class="jn__type-badge jn__type-badge--array">array</span>`}
        </div>
        ${collapsed ? "" : `
          <div class="jn__body">
            ${arr.map((v, i) => this.entry(i, v, [...path, i], true)).join("")}
            <button class="jn__add-btn" data-path="${p}" data-action="click->json-editor#addItem">＋ Add item</button>
          </div>
          <span class="jn__brace jn__brace--close">]</span>
        `}
      </div>`
  }

  entry(key, val, path, isArray) {
    const p    = this.attr(path)
    const t    = this.typeOf(val)
    const deep = t === "object" || t === "array"

    const keyEl = isArray
      ? `<span class="jn__index">${key}</span>`
      : `<input class="jn__key" type="text" value="${this.esc(String(key))}"
               spellcheck="false"
               data-path="${p}"
               data-action="focus->json-editor#captureHistory blur->json-editor#renameKey keydown->json-editor#keyInputKeydown" />`

    return `
      <div class="jn__entry" data-path="${p}">
        <div class="jn__entry-row">
          <button class="jn__del" data-path="${p}" data-action="click->json-editor#deleteNode" title="Delete">✕</button>
          ${keyEl}
          <span class="jn__colon">:</span>
          ${deep ? "" : this.valueWidget(val, t, path)}
        </div>
        ${deep ? `<div class="jn__entry-children">${this.node(val, path)}</div>` : ""}
      </div>`
  }

  primitiveRoot(val, type, path) {
    return `<div class="jn__root-primitive">${this.valueWidget(val, type, path)}</div>`
  }

  valueWidget(val, type, path) {
    const p = this.attr(path)

    const typeSelect = `
      <select class="jn__type-select jn__type-select--${type}"
              data-path="${p}"
              data-action="focus->json-editor#captureHistory change->json-editor#changeType">
        ${["string", "number", "boolean", "null", "object", "array"].map(t =>
          `<option value="${t}"${t === type ? " selected" : ""}>${t}</option>`
        ).join("")}
      </select>`

    let input
    switch (type) {
      case "string":
        input = `<input class="jn__val jn__val--string" type="text"
                        value="${this.esc(val)}"
                        spellcheck="false"
                        data-path="${p}"
                        data-action="focus->json-editor#captureHistory input->json-editor#updateVal" />`
        break
      case "number":
        input = `<input class="jn__val jn__val--number" type="number"
                        value="${val}"
                        data-path="${p}"
                        data-action="focus->json-editor#captureHistory input->json-editor#updateVal" />`
        break
      case "boolean":
        input = `<select class="jn__val jn__val--boolean"
                         data-path="${p}"
                         data-action="focus->json-editor#captureHistory change->json-editor#updateVal">
                   <option value="true"${val === true ? " selected" : ""}>true</option>
                   <option value="false"${val === false ? " selected" : ""}>false</option>
                 </select>`
        break
      case "null":
        input = `<span class="jn__val jn__val--null">null</span>`
        break
    }

    return `<span class="jn__val-group">${typeSelect}${input}</span>`
  }

  // ─── History (undo / redo) ───────────────────────────────────────────────────

  pushHistory() {
    const snap = JSON.stringify(this.doc)
    if (this.history.at(-1) === snap) return   // deduplicate consecutive identical states
    this.history.push(snap)
    this.future = []
  }

  undo() {
    if (!this.history.length) return
    this.future.push(JSON.stringify(this.doc))
    this.doc = JSON.parse(this.history.pop())
    this.render()
  }

  redo() {
    if (!this.future.length) return
    this.history.push(JSON.stringify(this.doc))
    this.doc = JSON.parse(this.future.pop())
    this.render()
  }

  // Called on focus of any editable element — captures state before the user changes it
  captureHistory() {
    this.pushHistory()
  }

  handleKeydown(event) {
    if (!(event.metaKey || event.ctrlKey) || event.key !== "z") return
    event.preventDefault()
    event.shiftKey ? this.redo() : this.undo()
  }

  // ─── Event Handlers ─────────────────────────────────────────────────────────

  updateVal(event) {
    const el   = event.target
    const path = this.parsePath(el)
    const type = this.typeOf(this.getAt(path))
    let val

    if (type === "boolean") val = el.value === "true"
    else if (type === "number") val = el.value === "" ? 0 : +el.value
    else val = el.value

    this.setAt(path, val)
  }

  keyInputKeydown(event) {
    if (event.key === "Enter") event.target.blur()
  }

  renameKey(event) {
    const el     = event.target
    const path   = this.parsePath(el)
    if (path.length === 0) return

    const newKey = el.value.trim()
    const oldKey = String(path.at(-1))

    if (!newKey)          { el.value = oldKey; return }
    if (newKey === oldKey) return

    const parentPath = path.slice(0, -1)
    const parent     = this.getAt(parentPath)

    if (newKey in parent) { el.value = oldKey; return }  // duplicate — revert

    // Rebuild parent object preserving insertion order
    const rebuilt = {}
    for (const [k, v] of Object.entries(parent)) {
      rebuilt[k === oldKey ? newKey : k] = v
    }
    this.setAt(parentPath, rebuilt)
    this.render()
  }

  changeType(event) {
    const el      = event.target
    const path    = this.parsePath(el)
    const current = this.getAt(path)
    const from    = this.typeOf(current)
    const to      = el.value
    if (from === to) return
    this.setAt(path, this.convert(current, from, to))
    this.render()
  }

  convert(val, _from, to) {
    switch (to) {
      case "string":  return val === null ? "" : String(val)
      case "number":  return isNaN(parseFloat(val)) ? 0 : parseFloat(val)
      case "boolean": return Boolean(val)
      case "null":    return null
      case "object":  return {}
      case "array":   return []
    }
  }

  deleteNode(event) {
    event.stopPropagation()
    this.pushHistory()
    const path = this.parsePath(event.target)
    this.deleteAt(path)
    this.render()
  }

  addKey(event) {
    this.pushHistory()
    const path = this.parsePath(event.target)
    const obj  = this.getAt(path)
    let key = "newKey"
    let i = 1
    while (key in obj) key = `newKey${i++}`
    obj[key] = ""
    this.render()

    // Focus the new key input
    setTimeout(() => {
      const targetPath = this.pid([...path, key])
      for (const input of this.treeTarget.querySelectorAll("input.jn__key")) {
        if (input.dataset.path === targetPath) {
          input.focus()
          input.select()
          break
        }
      }
    }, 0)
  }

  addItem(event) {
    this.pushHistory()
    const path = this.parsePath(event.target)
    this.getAt(path).push("")
    this.render()
  }

  toggleCollapse(event) {
    const pid = event.target.dataset.path   // unescaped by browser
    this.collapsed.has(pid) ? this.collapsed.delete(pid) : this.collapsed.add(pid)
    this.render()
  }

  download() {
    this.jsonInputTarget.value = JSON.stringify(this.doc, null, 2)
    this.downloadFormTarget.submit()
  }
}
