const { devMode, statPwd } = require('./src/_data/env')

const { strictEqual } = require('assert')
const yaml = require('js-yaml')
const format = require('date-fns/format')

const https = require('https')
const { log } = require('console')
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

module.exports = (config) => {

  config.addCollection('postsByYear', (collection) => {
    const posts = collection.getFilteredByTag('blog').reverse()
    const years = posts.map((post) => post.date.getFullYear())
    const uniqueYears = [...new Set(years)]

    const postsByYear = uniqueYears.reduce((prev, year) => {
      const filteredPosts = posts.filter(
        (post) => post.date.getFullYear() === year
      )

      return [...prev, [year, filteredPosts]]
    }, [])

    return postsByYear
  })

  config.addFilter('latest', function (items) {
    return items.slice(0, 9)
  })

  config.addFilter('shuffle', function (array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
    return array
  })

  config.addFilter('getCode', function (items) {
    const index = items.findIndex((post) => post.url.includes('just-solution'))
    if (index !== -1) return items[index]
  })

  config.addFilter('getRandom', function (items) {
    let selected = items[Math.floor(Math.random() * items.length)]
    return selected
  })

  config.addFilter('date', function (date, dateFormat) {
    return format(date, dateFormat)
  })

  function filterTagList(tags) {
    return (tags || []).filter((tag) => ['all', 'blog'].indexOf(tag) === -1)
  }
  config.addFilter('filterTagList', filterTagList)
  config.addCollection('tagList', function (collection) {
    let tagSet = new Set()
    collection.getAll().forEach((item) => {
      ;(item.data.tags || []).forEach((tag) => tagSet.add(tag))
    })

    return filterTagList([...tagSet]).sort()
  })

  config.addFilter('isPaginated', (url) => new RegExp('^/[0-9]+/$').test(url))

  config.addFilter('split', function (str, sep) {
    return (str + '').split(sep)
  })

  // config.addPassthroughCopy({ 'public': './' })
  config.addDataExtension('yaml', (contents) => yaml.load(contents))
  config.addPassthroughCopy('./src/static')

  // config.addPlugin(twig, twigOptions)
  config.setBrowserSyncConfig({
    files: ['dist/**/*'],
    open: true,
  })
  return {
    dir: {
      input: 'src',
      output: 'dist',
    },
    markdownTemplateEngine: 'html',
    htmlTemplateEngine: 'njk',
  }
}