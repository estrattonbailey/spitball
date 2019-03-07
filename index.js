const path = require('path')
const exit = require('exit')
const onExit = require('exit-hook')
const webpack = require('webpack')

const { createConfig } = require('./lib/config.js')
const { formatStats } = require('./lib/stats.js')

const cwd = process.cwd()

function watch (confs, cb) {
  let port = 4000
  const servers = {}
  const sockets = {}

  const configs = confs
    .map(createConfig)
    .map(([ config, webpackConfig ]) => {
      const hash = Object.keys(webpackConfig.entry).join(':')

      if (config.node) {
        webpackConfig.target = 'node'
      }

      if (config.reload) {
        servers[hash] = require('http').createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' })
          res.write('socket running...')
          res.end()
        }).listen(port++)

        sockets[hash] = require('socket.io')(servers[hash], {
          serveClient: false
        })
      }

      return webpackConfig
    })

  onExit(() => {
    for (let hash in servers) {
      servers[hash].close()
      sockets[hash].close()
    }
  })

  return webpack(configs).watch({}, (err, stats) => {
    if (err) return cb && cb(err)

    const formatted = formatStats(stats)

    formatted.map(stats => {
      const hash = stats.assets
        .filter(asset => /\.js$/.test(asset.name))
        .map(asset => path.basename(asset.name, '.js'))
        .join(':')

      if (sockets[hash]) {
        sockets[hash].emit('refresh')
      }
    })

    cb && cb(null, formatted)
  })
}

function build (confs, cb) {
  const configs = confs
    .map(createConfig)
    .map(([ config, webpackConfig ]) => {
      webpackConfig.mode = 'production'
      webpackConfig.module.rules[1].use[2].options.plugins.push(require('cssnano'))

      if (config.node) {
        webpackConfig.target = 'node'
      }

      return webpackConfig
    })

  webpack(configs).run((err, stats) => {
    if (err) return cb && cb(err)
    cb && cb(null, formatStats(stats))
    exit()
  })
}

module.exports = confs => {
  confs = [].concat(confs)

  return {
    build (cb) {
      return build(confs, cb)
    },
    watch (cb) {
      return watch(confs, cb)
    }
  }
}
