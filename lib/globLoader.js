/**
 * unused
 */
const fs = require('fs-extra')
const path = require('path')
const { getOptions } = require('loader-utils')
const match = require('matched')

module.exports = function (source, map, meta) {
  const opts = getOptions(this)
  const files = match.sync(opts.in)

  const config = this._compiler.options

  files.map(file => this.addDependency(path.resolve(process.cwd(), file)))

  files.map(file => {
    const name = path.basename(file, '.js')

    if (!!config.entry[name]) return

    console.log('adding', name)

    this.loadModule(file, (err, source, map) => {
      if (err) return console.error(err)
      fs.outputFile(path.join(opts.out, `${name}.js`), source)
      fs.outputFile(path.join(opts.out, `${name}.js.map`), map)
    })
  })

  return source
}
