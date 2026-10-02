const test = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const vm = require('node:vm')
const code = readFileSync(require('node:path').join(__dirname, '../trailer-previews.js'), 'utf8')

function fixture({ reduced = false, saveData = false, finePointer = true } = {}) {
  class Node {
    constructor() { this.events = {}; this.children = []; this.attributes = {}; this.textContent = ''; this.classes = new Set() }
    addEventListener(name, handler) { (this.events[name] ||= []).push(handler) }
    emit(name, event = {}) { for (const handler of this.events[name] || []) handler(event) }
    setAttribute(name, value) { this.attributes[name] = value }
    removeAttribute(name) { delete this.attributes[name]; if (name === 'src') this.src = '' }
    append(node) { this.children.push(node) }
    replaceChildren() { this.children = [] }
    contains(node) { return Object.values(this.parts || {}).includes(node) }
    get classList() { return { add: (...names) => names.forEach(n => this.classes.add(n)), remove: (...names) => names.forEach(n => this.classes.delete(n)) } }
  }
  const videos = []
  const cards = ['One', 'Two'].map(title => {
    const card = new Node()
    card.dataset = { title, provider: 'video', source: `${title}.mp4` }
    card.parts = { '.project-preview__player': new Node(), '.project-preview__toggle': new Node(), '.project-preview__error': new Node() }
    card.querySelector = selector => card.parts[selector]
    return card
  })
  const document = new Node()
  document.head = new Node()
  document.querySelectorAll = () => cards
  document.createElement = tag => {
    const node = new Node()
    if (tag === 'video') {
      node.play = () => { node.emit('playing'); return Promise.resolve() }
      node.pause = () => { node.paused = true }
      node.load = () => { node.unloaded = true }
      node.canPlayType = () => 'probably'
      videos.push(node)
    }
    return node
  }
  const motion = new Node(); motion.matches = reduced
  const hover = new Node(); hover.matches = finePointer
  const window = new Node()
  window.matchMedia = query => query.includes('reduced') ? motion : hover
  let intersect
  class Observer { constructor(callback) { intersect = callback } observe() {} }
  window.IntersectionObserver = Observer
  const timers = new Map(); let timerId = 0
  const setTimeout = (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId }
  const clearTimeout = id => timers.delete(id)
  vm.runInNewContext(code, { document, window, navigator: { connection: { saveData } }, location: { origin: 'http://localhost' }, IntersectionObserver: Observer, setTimeout, clearTimeout })
  const button = i => cards[i].parts['.project-preview__toggle']
  const click = i => button(i).emit('click')
  const tick = ms => { for (const [id, timer] of [...timers]) if (timer.delay <= ms) { timers.delete(id); timer.callback() } }
  return { cards, videos, document, window, motion, button, click, tick, intersect }
}

test('no media is loaded initially; playback is muted and only one player stays active', () => {
  const f = fixture()
  assert.equal(f.videos.length, 0)
  assert.equal(f.document.head.children.length, 0)
  f.click(0)
  assert.equal(f.videos[0].muted, true)
  assert.equal(f.videos[0].playsInline, true)
  f.click(1)
  assert.equal(f.videos[0].paused, true)
  assert.equal(f.videos[0].src, '')
  assert.equal(f.button(0).attributes['aria-pressed'], 'false')
  assert.equal(f.button(1).attributes['aria-pressed'], 'true')
})

test('brief hovers are cancelled, deliberate hover starts playback, leaving unloads it', () => {
  const f = fixture()
  f.cards[0].emit('pointerenter', { pointerType: 'mouse' })
  f.cards[0].emit('pointerleave')
  f.tick(200)
  assert.equal(f.videos.length, 0)
  f.cards[0].emit('pointerenter', { pointerType: 'mouse' })
  f.tick(200)
  assert.equal(f.videos.length, 1)
  f.cards[0].emit('pointerleave')
  assert.equal(f.videos[0].unloaded, true)
})

test('reduced motion, Save-Data and touch disable hover but allow explicit playback', () => {
  for (const options of [{ reduced: true }, { saveData: true }, { finePointer: false }]) {
    const f = fixture(options)
    f.cards[0].emit('pointerenter', { pointerType: 'mouse' }); f.tick(200)
    assert.equal(f.videos.length, 0)
    f.click(0)
    assert.equal(f.videos.length, 1)
  }
})

test('touch playback stays active after pointerleave and can be paused explicitly', () => {
  const f = fixture({ finePointer: false })
  f.click(0); f.cards[0].emit('pointerleave')
  assert.equal(f.button(0).attributes['aria-pressed'], 'true')
  f.click(0)
  assert.equal(f.videos[0].paused, true)
})

test('Escape, leaving view, hiding the page and changing motion preference stop media', () => {
  const f = fixture()
  for (const stop of [
    () => f.cards[0].emit('keydown', { key: 'Escape' }),
    () => f.intersect([{ target: f.cards[0], isIntersecting: false }]),
    () => { f.document.hidden = true; f.document.emit('visibilitychange') },
    () => { f.motion.matches = true; f.motion.emit('change') }
  ]) {
    f.click(0); stop()
    assert.equal(f.button(0).attributes['aria-pressed'], 'false')
    assert.equal(f.videos.at(-1).unloaded, true)
  }
})

test('failures restore the poster and leave a useful fallback message', () => {
  const f = fixture()
  f.click(0); f.videos[0].emit('error')
  assert.equal(f.cards[0].classes.has('is-playing'), false)
  assert.match(f.cards[0].parts['.project-preview__error'].textContent, /Preview unavailable/)
})

test('late media events cannot restart a cancelled preview', () => {
  const f = fixture()
  f.click(0); f.click(0); f.videos[0].emit('playing')
  assert.equal(f.cards[0].classes.has('is-playing'), false)
  assert.equal(f.button(0).attributes['aria-pressed'], 'false')
})

test('leaving while an embed library loads cannot create a late player', async () => {
  const f = fixture()
  f.cards[0].dataset.provider = 'vimeo'
  let created = false
  f.window.Vimeo = { Player: class { constructor() { created = true } } }
  f.click(0)
  const script = f.document.head.children[0]
  f.cards[0].emit('pointerleave', { pointerType: 'mouse' })
  script.onload()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(created, false)
  assert.equal(f.button(0).attributes['aria-pressed'], 'false')
})
