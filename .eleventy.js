const { devMode, statPwd } = require('./src/_data/env')

const execSync = require('child_process').execSync;

// const { strictEqual } = require('assert')
const yaml = require('js-yaml')
const format = require('date-fns/format')

const https = require('https')
const { log } = require('console')
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

// const pluginGitCommitDate = require("eleventy-plugin-git-commit-date");

module.exports = (config) => {

  config.on('eleventy.after', () => {
    execSync(`npx pagefind --site dist --glob \"**/*.html\"`, { encoding: 'utf-8' })
  })

  // Add a custom Nunjucks filter to stringify objects
  config.addNunjucksFilter("json", function (value) {
    return JSON.stringify(value);
  });


  // config.addPlugin(pluginGitCommitDate)

  // // Universal Shortcodes (Adds to Liquid, Nunjucks, JavaScript, Handlebars)
  // config.addShortcode("lastmod", function(page) {
  //   return page.lastModified || page.date
  // });


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

  // config.addCollection('featured', collection => {
  //   return collection.getFilteredByGlob('./src/blog/*.md')
  //     .filter(
  //       post => post.data.featured_post
  //     )
  //     .sort((a,b) => {
  //       return a.data.post_weight - b.data.post_weight;
  //     });
  //  });

  function filterTagList(tags) {
    return (tags || []).filter((tag) => ['all', 'blog', 'featured', 'formal', 'processed'].indexOf(tag) === -1)
  }
  config.addFilter('filterTagList', filterTagList)
  config.addCollection('tagList', function (collection) {
    let tagSet = new Set()
    collection.getAll().forEach((item) => {
      ; (item.data.tags || []).forEach((tag) => tagSet.add(tag))
    })

    return filterTagList([...tagSet]).sort()
  })

  config.addFilter('isPaginated', (url) => new RegExp('^/[0-9]+/$').test(url))

  config.addFilter('split', function (str, sep) {
    return (str + '').split(sep)
  })

  config.addCollection('stats', async function (collection) {
    let token = (await (await fetch(
      'https://statumami.vercel.app/api/auth/login',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: statPwd,
        }),
        // agent: httpsAgent,
      }
    )).json()).token

    // const today = new Date(new Date().setHours(0, 0, 0, 0))
    const today = new Date()
    let endAt = today.getTime()
    let startAt = today.getTime() - 7 * 24 * 60 * 60 * 1000

    let data = await fetch(
      `https://statumami.vercel.app/api/websites/ca5ab971-2008-4b4e-b29b-291db540c3af/stats?startAt=${startAt}&endAt=${endAt}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        agent: httpsAgent,
      }
    )
    let json = await data.json()

    let stats = []
    stats.push({
      name: 'Views',
      value: json.pageviews.value,
      prev: json.pageviews.value - json.pageviews.change,
      change: (
        (json.pageviews.change /
          (json.pageviews.value - json.pageviews.change)) *
        100
      ).toFixed(),
    })
    stats.push({
      name: 'Visitors',
      value: json.uniques.value,
      prev: json.uniques.value - json.uniques.change,
      change: (
        (json.uniques.change / (json.uniques.value - json.uniques.change)) *
        100
      ).toFixed(),
    })
    stats.push({
      name: 'Average Time (s)',
      value: (json.totaltime.value / json.uniques.value).toFixed(),
      prev: (
        (json.totaltime.value - json.totaltime.change) /
        (json.uniques.value - json.uniques.change)
      ).toFixed(),
      change: (
        ((json.totaltime.value / json.uniques.value -
          (json.totaltime.value - json.totaltime.change) /
          (json.uniques.value - json.uniques.change)) /
          ((json.totaltime.value - json.totaltime.change) /
            (json.uniques.value - json.uniques.change))) *
        100
      ).toFixed(),
    })
    stats.push({
      name: 'Bounce Rate (%)',
      value: ((json.bounces.value / json.uniques.value) * 100).toFixed(),
      prev: (
        ((json.bounces.value - json.bounces.change) /
          (json.uniques.value - json.uniques.change)) *
        100
      ).toFixed(),
      change: (
        ((json.bounces.value / json.uniques.value -
          (json.bounces.value - json.bounces.change) /
          (json.uniques.value - json.uniques.change)) /
          ((json.bounces.value - json.bounces.change) /
            (json.uniques.value - json.uniques.change))) *
        100
      ).toFixed(),
    })

    const curr = (json.pageviews.value / json.uniques.value).toFixed(1)
    const prev = (
      (json.pageviews.value - json.pageviews.change) /
      (json.uniques.value - json.uniques.change)
    ).toFixed(1)
    stats.push({
      name: 'Views Per Visitor',
      value: curr,
      prev: prev,
      change: (((curr - prev) / prev) * 100).toFixed(),
    })

    // const p = await fetch('/api/stats-ip-log', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     startDate: startAt,
    //     endDate: endAt,
    //     mode: 'percent'
    //   }),
    // })
    // const d = (await p.json()).data
    // stats.push({
    //   name: 'Returning Users (%)',
    //   value: (d.filter(r => r.status === 'Returning').length / d.length * 100).toFixed(2),
    //   prev: 0,
    //   change: 0
    // })

    return stats
  })

  config.addNunjucksAsyncFilter('top', async function (posts, callback) {
    let token = (await (await fetch(
      'https://statumami.vercel.app/api/auth/login',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: statPwd,
        }),
        // agent: httpsAgent,
      }
    )).json()).token

    let endAt = new Date().getTime()
    startAt = new Date().getTime() - 30 * 24 * 60 * 60 * 1000

    let data = await fetch(
      `https://statumami.vercel.app/api/websites/ca5ab971-2008-4b4e-b29b-291db540c3af/metrics?startAt=${startAt}&endAt=${endAt}&type=url`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // agent: httpsAgent,
      }
    )
    let json = await data.json()
    let tops = json?.filter((item) => item.x.includes('/blog/') || item.x.includes('/featured/'))
      .filter((item) => !item.x.includes('just-solution'))

    tops = tops.map((top) => {
      const index = posts.findIndex((post) => post.url === top.x)
      if (index !== -1) return posts[index]
    }).filter((top) => top !== undefined)

    callback(
      null,
      tops?.slice(0, Math.min(tops.length, 3))
    )
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
    // markdownTemplateEngine: 'html',
    htmlTemplateEngine: 'njk',
  }
}