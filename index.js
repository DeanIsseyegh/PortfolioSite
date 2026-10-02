// ---
const hamMenuBtn = document.querySelector('.header__main-ham-menu-cont')
const smallMenu = document.querySelector('.header__sm-menu')
const headerHamMenuBtn = document.querySelector('.header__main-ham-menu')
const headerHamMenuCloseBtn = document.querySelector(
  '.header__main-ham-menu-close'
)
const headerSmallMenuLinks = document.querySelectorAll('.header__sm-menu-link')

hamMenuBtn.addEventListener('click', () => {
  if (smallMenu.classList.contains('header__sm-menu--active')) {
    smallMenu.classList.remove('header__sm-menu--active')
  } else {
    smallMenu.classList.add('header__sm-menu--active')
  }
  hamMenuBtn.setAttribute('aria-expanded', String(smallMenu.classList.contains('header__sm-menu--active')))
  if (headerHamMenuBtn.classList.contains('d-none')) {
    headerHamMenuBtn.classList.remove('d-none')
    headerHamMenuCloseBtn.classList.add('d-none')
  } else {
    headerHamMenuBtn.classList.add('d-none')
    headerHamMenuCloseBtn.classList.remove('d-none')
  }
})

for (let i = 0; i < headerSmallMenuLinks.length; i++) {
  headerSmallMenuLinks[i].addEventListener('click', () => {
    smallMenu.classList.remove('header__sm-menu--active')
    hamMenuBtn.setAttribute('aria-expanded', 'false')
    headerHamMenuBtn.classList.remove('d-none')
    headerHamMenuCloseBtn.classList.add('d-none')
  })
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && smallMenu.classList.contains('header__sm-menu--active')) {
    smallMenu.classList.remove('header__sm-menu--active')
    hamMenuBtn.setAttribute('aria-expanded', 'false')
    headerHamMenuBtn.classList.remove('d-none')
    headerHamMenuCloseBtn.classList.add('d-none')
    hamMenuBtn.focus()
  }
})

// ---
const headerLogoConatiner = document.querySelector('.header__logo-container')

headerLogoConatiner.addEventListener('click', () => {
  location.href = 'index.html'
})

// Animate each section just once. Content stays visible without JS or observer support.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
if ('IntersectionObserver' in window && 'animate' in Element.prototype) {
  const activeAnimations = new Set()
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      revealObserver.unobserve(entry.target)
      if (motionPreference.matches) continue

      const isProjectCard = entry.target.matches('.projects__row, .projects__card')
      const animation = entry.target.animate(
        [
          { opacity: isProjectCard ? 0.15 : 0.65, transform: isProjectCard ? 'translateY(28px)' : 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        { duration: isProjectCard ? 700 : 420, easing: 'cubic-bezier(0.2, 0.65, 0.3, 1)' }
      )
      activeAnimations.add(animation)
      animation.finished.then(
        () => activeAnimations.delete(animation),
        () => activeAnimations.delete(animation)
      )
    }
  }, { threshold: 0.08 })

  document.querySelectorAll('.projects__row, .projects__card, .about__content-main, .about__content-skills, .contact .heading-sec')
    .forEach((element) => revealObserver.observe(element))

  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      activeAnimations.forEach((animation) => animation.cancel())
      activeAnimations.clear()
    }
  })
}

// Case study clips loop like GIFs, but reduced motion pauses them and hands control to the visitor.
const loopingClips = document.querySelectorAll('video[autoplay][loop]')
function applyClipMotionPreference() {
  for (const clip of loopingClips) {
    clip.controls = motionPreference.matches
    if (motionPreference.matches) clip.pause()
    else clip.play().catch(() => {})
  }
}
if (loopingClips.length) {
  applyClipMotionPreference()
  motionPreference.addEventListener('change', applyClipMotionPreference)
}

// "Copy email" is only offered where the Clipboard API exists; the mailto link always works.
const copyEmailButton = document.querySelector('[data-copy-email]')
const copyEmailStatus = document.querySelector('.contact__copy-status')
if (copyEmailButton && navigator.clipboard) {
  const idleLabel = copyEmailButton.textContent
  let resetTimer
  copyEmailButton.hidden = false
  copyEmailButton.addEventListener('click', async () => {
    clearTimeout(resetTimer)
    try {
      await navigator.clipboard.writeText(copyEmailButton.dataset.copyEmail)
      copyEmailButton.textContent = 'Copied!'
      copyEmailStatus.textContent = 'Email address copied'
    } catch {
      copyEmailButton.textContent = "Couldn't copy"
      copyEmailStatus.textContent = `Couldn't copy. The address is ${copyEmailButton.dataset.copyEmail}`
    }
    resetTimer = setTimeout(() => {
      copyEmailButton.textContent = idleLabel
      copyEmailStatus.textContent = ''
    }, 2500)
  })
}

// Keep the footer copyright year current without editing every page each January.
document.querySelectorAll('[data-current-year]').forEach((element) => {
  element.textContent = new Date().getFullYear()
})
