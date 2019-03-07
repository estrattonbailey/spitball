const path = require('path')
const clone = require('clone')
const webpack = require('webpack')
const match = require('matched')
const ExtractCSS = require('mini-css-extract-plugin')
const clientReloader = require('./clientReloader.js')

const cwd = process.cwd()

function hasGlob (input) {
  return [].concat(input).reduce((_, str) => {
    if (/\*+/g.test(str)) return true
    return _
  }, false)
}

const baseConfig = {
  output: {
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  mode: 'development',
  target: 'web',
  performance: { hints: false },
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              plugins: [
                require.resolve('@babel/plugin-syntax-object-rest-spread'),
                require.resolve('@babel/plugin-proposal-class-properties'),
                require.resolve('fast-async')
              ],
              presets: [
                require.resolve('@babel/preset-env'),
                require.resolve('@babel/preset-react')
              ]
            }
          }
        ]
      },
      {
        test: /\.(sa|sc|c)ss$/,
        exclude: /node_modules/,
        use: [
          ExtractCSS.loader,
          require.resolve('css-loader'),
          {
            loader: require.resolve('postcss-loader'),
            options: {
              plugins: [
                require('postcss-import'),
                require('postcss-nested'),
                require('postcss-cssnext')({
                  warnForDuplicates: false,
                  warnForDeprecations: false
                }),
                require('postcss-discard-comments'),
              ].filter(Boolean)
            }
          }
        ]
      },
    ]
  },
  resolve: {
    alias: {
      '@': process.cwd()
    }
  },
  plugins: [
    new ExtractCSS({ filename: '[name].css' })
    // new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ]
}

function createConfig (conf) {
  const wc = clone(baseConfig)

  wc.entry = conf.in
  wc.output = Object.assign(
    wc.output,
    typeof conf.out === 'object' ? conf.out : {
      path: path.resolve(cwd, conf.out)
    }
  )

  wc.output.path = path.resolve(cwd, wc.output.path)

  if (/\*+/g.test(wc.entry)) {
    const files = match.sync(path.join(cwd, wc.entry))

    wc.entry = files.reduce((obj, file) => {
      obj[path.basename(file, '.js')] = file
      return obj
    }, {})
  } else if (typeof wc.entry === 'string') {
    wc.entry = {
      [path.basename(wc.entry, '.js')]: path.resolve(cwd, wc.entry)
    }
  } else if (typeof wc.entry === 'object') {
    wc.entry = Object.keys(wc.entry).reduce((entry, name) => {
      entry[name] = path.resolve(cwd, wc.entry[name])
      return entry
    }, {})
  }

  wc.resolve.alias = Object.assign(wc.resolve.alias, conf.alias || {})
  wc.plugins = wc.plugins.concat([
    new webpack.DefinePlugin(conf.env || {}),
    new webpack.BannerPlugin({
      banner: conf.reload ? (
        conf.banner ? (
          clientReloader + conf.banner
        ) : clientReloader
      ) : conf.banner || '',
      raw: true,
      entryOnly: true,
      exclude: /\.(sa|sc|c)ss$/
    })
  ])

  return [
    conf,
    wc
  ]
}

module.exports = {
  baseConfig,
  createConfig
}
