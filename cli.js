#! /usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const exit = require('exit')
const match = require('matched')
const write = require('log-update')

const cwd = process.cwd()
const pkg = require('./package.json')
const spitball = require('./index.js')

const prog = require('commander')
  .version(pkg.version)
  .option('--out <output>', '')
  .option('--reload', 'enable live-reloading after changes: --reload (default: false)')

let config = {}

try {
  config = require(path.join(cwd, 'spitball.config.js'))
} catch (e) {}

function mergeConfig (inputs) {
  const cli = inputs.length ? {
    in: inputs.reduce((entry, file) => {
      if (/\*+/g.test(file)) {
        const files = match.sync(path.join(cwd, file))

        files.map(file => {
          entry[path.basename(file, '.js')] = file
        })
      } else {
        entry[path.basename(file, '.js')] = file
      }

      return entry
    }, {}),
    out: prog.out || cwd,
    reload: prog.reload || false
  } : {}

  const conf = Object.assign(cli, config)

  /**
   * assertions
   */
  if (!conf.in) {
    console.error(`config error: missing 'in' prop`)
  }
  if (!conf.out) {
    console.error(`config error: missing 'out' prop`)
  }

  /**
   * fail
   */
  if (!conf.in || !conf.out) {
    exit()
  }

  return conf
}

function buildCallback (err, [ stats ]) {
  write(`\n  compiled in ${stats.duration}s\n
${stats.assets.map(asset => {
  return `  > ${asset.name} - ${asset.size}kb`
}).join('\n')}
`)
}

prog
  .command('watch [inputs...]')
  .action(inputs => {
    const conf = mergeConfig(inputs)

    spitball(conf)
      .watch(buildCallback)
  })

prog
  .command('build [inputs...]')
  .action(inputs => {
    const conf = mergeConfig(inputs)

    spitball(conf)
      .build(buildCallback)
  })

if (!process.argv.slice(2).length) {
  prog.outputHelp(txt => {
    console.log(txt)
    exit()
  })
} else {
  prog.parse(process.argv)
}
