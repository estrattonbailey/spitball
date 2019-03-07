// @see https://webpack.js.org/api/node/#error-handling
//
function formatStats (stats) {
  return [].concat(stats.stats || stats).map(stat => {
    const { startTime, endTime } = stat
    const json = stat.toJson({
      children: false,
      modules: false
    })

    return {
      duration: (endTime - startTime) / 1000,
      assets: json.assets.map(({ name, size }) => {
        return {
          name,
          size: size / 1000
        }
      })
    }
  })
}

module.exports = {
  formatStats
}
