import { format, formatRelative, formatDistance } from 'date-fns'
import reportWebVitals from './reportWebVitals';
import { sendToVercelAnalytics } from './vitals';
import { inject } from '@vercel/analytics';

export default () => ({
  // isProduction: undefined,
  showCta: false,
  showTests: false,
  showPopup: false,
  showDonationPopup: true,
  landingPageOffset: 400,
  lastScrollTop: window.pageYOffset || document.documentElement.scrollTop,
  isScrollingUp: false,
  circumference: 30 * 2 * Math.PI,
  percent: 0,
  prevPercent: 0,
  currStep: '0',
  showCommentsPanel:
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
      ? true
      : false,
  showAuthLoginModal: false,
  showAuthSignupModal: false,
  email: '',
  name: '',
  password: '',
  paymentMade: false,
  currentStep: 1,
  coinFlip: Math.random(),
  discount: 50,

  vercelTrack() {
    reportWebVitals(sendToVercelAnalytics)
    inject()
  },

  registerEvent(label, type) {
    // if (process.env.NODE_ENV.startsWith('prod')) {
    if (typeof umami !== 'undefined') {
      umami.trackEvent(label, type);
      mixpanel.track(type[0].toUpperCase() + type.slice(1, type.length) + 'ed ' +
        label[0].toUpperCase() + label.slice(1, label.length))
      gtag('event', label + '_' + type)
      plausible(label[0].toUpperCase() + label.slice(1, label.length))
      // {
      //   'app_name': 'myAppName',
      //   'screen_name': 'Home'
      // });
    }
  },

  formatDate(date, dateFormat) {
    if (dateFormat === 'relative') return formatRelative(date, new Date())
    else if (dateFormat === 'distance') return formatDistance(date, new Date(), { addSuffix: true })
    else return format(date, dateFormat)
  },

  async checkPermission() {
    const res = await fetch('/api/payment?mode=check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: Alpine.store('auth').user.email,
        article: window.location.pathname,
      }),
    })
    const json = await res.json()
    return json.data.length !== 0
  },

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  },

  async init() {

    // this.isProduction = typeof umami !== 'undefined'
    // console.log(this.isProduction);

    // console.log(process.env.NODE_ENV);
    if (
      document.referrer === '' &&
      !('crdacode_ReturningUser' in localStorage)
    ) {
      // desktop
      document.addEventListener('mouseout', (event) => {
        if (!event.toElement && !event.relatedTarget) {
          setTimeout(() => {
            this.showPopup = true
          }, 1000)
        }
      })

      isQuicklyScrollingUp = () => {
        try {
          lastPosition = window.scrollY
          setTimeout(() => {
            newPosition = window.scrollY
          }, 100)
          currentSpeed = newPosition - lastPosition
          return currentSpeed > 100
        } catch (error) {
          return false
        }
      }

      // mobile
      window.addEventListener(
        'scroll',
        (event) => {
          if (!event.toElement && !event.relatedTarget) {
            if (this.isMobile() && isQuicklyScrollingUp()) {
              setTimeout(() => {
                this.showPopup = true
              }, 1000)
            }
          }
        },
        { passive: true }
      )
    }

    window.addEventListener(
      'scroll',
      () => {
        this.prevPercent = this.percent
        var st = window.pageYOffset || document.documentElement.scrollTop
        this.isScrollingUp = st <= this.lastScrollTop
        this.lastScrollTop = st <= 0 ? 0 : st // for mobile or negative scrolling

        const target = document.querySelector('#article')
        if (target) {
          const winTop =
            window.pageYOffset || document.documentElement.scrollTop
          const targetBottom = target.offsetTop + target.scrollHeight
          const windowBottom = winTop + window.outerHeight
          this.percent = Math.min(
            Math.round(
              100 -
              ((targetBottom - windowBottom + window.outerHeight / 3) /
                (targetBottom -
                  window.outerHeight +
                  window.outerHeight / 3)) *
              100
            ),
            100
          )
          if (
            this.percent >= 25 &&
            this.percent < 50 &&
            this.currStep === '0'
          ) {
            this.currStep = 'article-25'
            // if (typeof umami !== 'undefined') {
            //   umami.trackEvent('article-25', 'scroll')
            //   mixpanel.track('25% Viewed')
            // }
            this.registerEvent('25%', 'scroll')
          } else if (
            this.percent >= 50 &&
            this.percent < 75 &&
            this.currStep.includes('25')
          ) {
            this.currStep = 'article-50'
            // if (typeof umami !== 'undefined') {
            //   umami.trackEvent('article-50', 'scroll')
            //   mixpanel.track('50% Viewed')
            // }
            this.registerEvent('50%', 'scroll')
          } else if (
            this.percent >= 75 &&
            this.percent < 100 &&
            this.currStep.includes('50')
          ) {
            this.currStep = 'article-75'
            // if (typeof umami !== 'undefined') {
            //   umami.trackEvent('article-75', 'scroll')
            //   mixpanel.track('75% Viewed')
            // }
            this.registerEvent('75%', 'scroll')
          } else if (this.percent === 100 && this.currStep.includes('75')) {
            this.currStep = 'article-100'
            // if (typeof umami !== 'undefined') {
            //   umami.trackEvent('article-100', 'scroll')
            //   mixpanel.track('100% Viewed')
            // }
            this.registerEvent('100%', 'scroll')
            // this.showPopup = true
          }
        }
      },
      false
    )
  },
})
