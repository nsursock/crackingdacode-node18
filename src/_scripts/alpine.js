import Alpine from 'alpinejs'
import intersect from '@alpinejs/intersect'
 
Alpine.plugin(intersect)

import global from './global.js'
import form from './form.js'
import testimonials from './testimonials.js'

Alpine.data('global', global)
Alpine.data('form', form)
Alpine.data('testimonials', testimonials)

Alpine.directive(
  'else',
  (el, { expression, modifiers }, { evaluateLater, cleanup }) => {
    const previous = el.previousElementSibling

    if (!previous || previous.tagName.toLowerCase() !== 'template' || !previous.hasAttribute('x-if')) {
      throw new Error('`x-else` encountered without a previous `x-if` sibling.')
    }

    el.setAttribute('x-if', `! (${previous.getAttribute('x-if')})`)
  }
)

window.Alpine = Alpine

// Start Alpine when the page is ready.
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.search.includes('InternalTraffic')) {
    // console.log(window.location.search)
    // setCookie('crdacode_InternalTraffic', 'true', 1000)
    localStorage.setItem('crdacode_InternalTraffic', 'true')
  }

  if ('crdacode_NewUser' in localStorage) {
    if (!('crdacode_ReturningUser' in localStorage))
      localStorage.setItem('crdacode_ReturningUser', '1')
    else {
      var numVisits = localStorage.getItem('crdacode_ReturningUser')
      if (numVisits === 'true') numVisits = 1
      else numVisits = parseInt(numVisits) + 1
      localStorage.setItem('crdacode_ReturningUser', numVisits)
    }
    // setCookie('crdacode_ReturningUser', 'true', 1000)
  } else localStorage.setItem('crdacode_NewUser', 'true')
  // setCookie('crdacode_NewUser', 'true', 1000) // first visit

  Alpine.start()
});

import { createClient } from '@supabase/supabase-js'

// Basic Store Example in Alpine.
window.addEventListener('alpine:initializing', () => {
  Alpine.store('db', {
    client: null,

    createClient(url, key) {
      this.client = createClient(url, key)
    }
  }),
  
  Alpine.store('auth', {
    user: null,
    setUser(user) {
      this.user = user
    },
    init() {
      const token = localStorage.getItem('crdacode_token')
      if (token) {
        fetch('/api/auth?mode=me', {
          method: 'POST',
          body: token,
        })
          .then((response) => response.json())
          .then((message) => {
            if (message.success) this.user = message.user
          })
      }
    },
  })
});
