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

      const isProjectCard = entry.target.classList.contains('projects__row')
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

  document.querySelectorAll('.projects__row, .about__content-main, .about__content-skills, .contact .heading-sec')
    .forEach((element) => revealObserver.observe(element))

  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      activeAnimations.forEach((animation) => animation.cancel())
      activeAnimations.clear()
    }
  })
}
