// The static site ships these files; visitors do not need an npm runtime.
const { mkdirSync, copyFileSync } = require('node:fs')
const { resolve } = require('node:path')
const root = resolve(__dirname, '..')
const destination = resolve(root, 'assets/vendor')
mkdirSync(destination, { recursive: true })
for (const [source, target] of [
  ['hls.js/dist/hls.light.min.js', 'hls.light.min.js'],
  ['hls.js/LICENSE', 'hls-LICENSE.txt'],
  ['@vimeo/player/dist/player.min.js', 'vimeo-player.min.js'],
  ['@vimeo/player/LICENSE.md', 'vimeo-LICENSE.txt']
]) copyFileSync(resolve(root, 'node_modules', source), resolve(destination, target))
