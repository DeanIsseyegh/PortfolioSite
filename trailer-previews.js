// Optional, muted previews. No player or video is fetched until interaction.
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)')
  const scripts = new Map()
  const previews = []
  let active = null
  let youtubeReady

  function loadScript(src) {
    if (!scripts.has(src)) {
      scripts.set(src, new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = () => { scripts.delete(src); script.remove(); reject(new Error('Player unavailable')) }
        document.head.append(script)
      }))
    }
    return scripts.get(src)
  }

  function loadYouTube() {
    if (window.YT?.Player) return Promise.resolve()
    if (!youtubeReady) youtubeReady = new Promise((resolve, reject) => {
      window.onYouTubeIframeAPIReady = resolve
      loadScript('https://www.youtube.com/iframe_api').catch((error) => {
        youtubeReady = null
        reject(error)
      })
    })
    return youtubeReady
  }

  for (const card of document.querySelectorAll('.project-preview')) {
    const slot = card.querySelector('.project-preview__player')
    const button = card.querySelector('.project-preview__toggle')
    const status = card.querySelector('.project-preview__error')
    const title = card.dataset.title
    let generation = 0
    let requested = false
    let cleanup = () => {}
    let hoverTimer
    let timeout
    let mode

    const idleText = () => hover.matches && !motion.matches && !navigator.connection?.saveData
      ? 'Hover or play · muted' : 'Play preview · muted'

    function stop(message = '') {
      generation++
      requested = false
      clearTimeout(hoverTimer)
      clearTimeout(timeout)
      try { cleanup() } catch { /* Restore the poster even if a provider fails to dispose. */ }
      cleanup = () => {}
      slot.replaceChildren()
      card.classList.remove('is-playing', 'is-loading')
      button.textContent = idleText()
      button.setAttribute('aria-pressed', 'false')
      button.setAttribute('aria-label', `Play muted preview for ${title}`)
      status.textContent = message
      if (active === stop) active = null
    }

    async function start(reason) {
      if (requested) return
      if (active) active()
      stop()
      active = stop
      requested = true
      mode = reason
      const session = generation
      const current = () => requested && generation === session
      const failed = () => {
        if (current()) stop('Preview unavailable. Use the link above to watch or explore the game.')
      }
      const playing = () => {
        if (!current()) return
        clearTimeout(timeout)
        card.classList.remove('is-loading')
        card.classList.add('is-playing')
        button.textContent = 'Pause preview · muted'
      }
      card.classList.add('is-loading')
      button.textContent = 'Cancel loading…'
      button.setAttribute('aria-pressed', 'true')
      button.setAttribute('aria-label', `Pause muted preview for ${title}`)
      timeout = setTimeout(failed, 15000)

      try {
        const { provider, source } = card.dataset
        if (provider === 'video' || provider === 'hls') {
          const video = document.createElement('video')
          video.muted = true
          video.defaultMuted = true
          video.playsInline = true
          video.loop = true
          video.preload = 'none'
          video.setAttribute('aria-hidden', 'true')
          slot.append(video)
          let hls
          cleanup = () => {
            video.pause()
            if (hls) hls.destroy()
            video.removeAttribute('src')
            video.load()
          }
          video.addEventListener('playing', playing)
          video.addEventListener('error', failed)
          const play = () => { if (current()) video.play().catch(failed) }
          if (provider === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')) {
            await loadScript('./assets/vendor/hls.light.min.js')
            if (!current()) return
            if (!window.Hls.isSupported()) { failed(); return }
            hls = new window.Hls({ capLevelToPlayerSize: true, maxBufferLength: 10, maxMaxBufferLength: 20 })
            hls.on(window.Hls.Events.MANIFEST_PARSED, play)
            hls.on(window.Hls.Events.ERROR, (_, data) => { if (data.fatal) failed() })
            hls.loadSource(source)
            hls.attachMedia(video)
          } else {
            video.src = source
            play()
          }
        } else if (provider === 'vimeo') {
          await loadScript('./assets/vendor/vimeo-player.min.js')
          if (!current()) return
          const mount = document.createElement('div')
          slot.append(mount)
          const player = new window.Vimeo.Player(mount, {
            id: Number(source), muted: true, autoplay: false, controls: false,
            loop: true, playsinline: true, dnt: true, title: false, byline: false, portrait: false
          })
          cleanup = () => { player.destroy().catch(() => {}) }
          player.on('playing', playing)
          player.on('error', failed)
          await player.ready()
          if (!current()) return
          mount.querySelector('iframe')?.setAttribute('tabindex', '-1')
          await player.setMuted(true)
          if (current()) await player.play()
        } else if (provider === 'youtube') {
          await loadYouTube()
          if (!current()) return
          const mount = document.createElement('div')
          slot.append(mount)
          const player = new window.YT.Player(mount, {
            host: 'https://www.youtube-nocookie.com', videoId: source,
            playerVars: { autoplay: 0, controls: 0, playsinline: 1, rel: 0, start: Number(card.dataset.start) || 0, origin: location.origin },
            events: {
              onReady: () => {
                if (!current()) return
                player.getIframe().setAttribute('tabindex', '-1')
                player.mute()
                player.playVideo()
              },
              onStateChange: (event) => {
                if (!current()) return
                if (event.data === 1) playing()
                if (event.data === 0) stop()
              },
              onError: failed,
              onAutoplayBlocked: failed
            }
          })
          cleanup = () => player.destroy()
        }
      } catch { failed() }
    }

    button.hidden = false
    button.textContent = idleText()
    button.addEventListener('click', () => requested ? stop() : start('manual'))
    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' || !hover.matches || motion.matches || navigator.connection?.saveData) return
      hoverTimer = setTimeout(() => start('hover'), 200)
    })
    card.addEventListener('pointerleave', (event) => { if (mode !== 'manual' || event.pointerType === 'mouse') stop() })
    card.addEventListener('focusout', (event) => {
      if (!card.contains(event.relatedTarget)) stop()
    })
    card.addEventListener('keydown', (event) => { if (event.key === 'Escape') stop() })
    previews.push({ card, stop })
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) previews.find((preview) => preview.card === entry.target)?.stop()
      }
    })
    previews.forEach(({ card }) => observer.observe(card))
  }
  const stopAll = () => previews.forEach(({ stop }) => stop())
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll() })
  window.addEventListener('pagehide', stopAll)
  motion.addEventListener('change', stopAll)
  hover.addEventListener('change', stopAll)
})()
