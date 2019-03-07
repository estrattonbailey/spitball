 module.exports = `
  (function (global) {
    try {
      const socketio = document.createElement('script')
      socketio.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.slim.js'
      socketio.onload = function init () {
        var disconnected = false
        var socket = io('https://localhost:3001', {
          reconnectionAttempts: 3
        })
        socket.on('connect', () => console.log('@thecouch/spaghetti connected'))
        socket.on('refresh', () => {
          global.location.reload()
        })
        socket.on('disconnect', () => {
          disconnected = true
        })
        socket.on('reconnect_failed', e => {
          if (disconnected) return
          console.error("@thecouch/spaghetti - connection to the update server failed")
        })
      }
      document.head.appendChild(socketio)
    } catch (e) {}
  })(this);
`
