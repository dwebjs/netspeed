var assert = require('assert')
var speedometer = require('speedometer')
var debug = require ('debug')('dweb-network')

module.exports = function (vault, opts) {
  assert.ok(vault, 'vault required')
  opts = opts || {}

  var speed = {}
  var downloadSpeed = speedometer()
  var uploadSpeed = speedometer()
  var timeout = opts.timeout || 1000 
  var upTimeout = null
  var downTimeout = null
  var totalTransfer = {
    up: 0,
    down: 0
  }

  if (debug.enabled) {
    setInterval(function() {
      if (totalTransfer.up) debug('Uploaded data:', totalTransfer.up)
      if (totalTransfer.down) debug('Downloaded data:', totalTransfer.down)
    }, 500)
  }

  vault.metadata.on('download', function (block, data) {
    totalTransfer.down += data.length
    ondownload(data.length)
  })

  vault.metadata.on('upload', function (block, data) {
    totalTransfer.up += data.length
    onupload(data.length)
  })

  if (vault.content) trackContent()
  else vault.on('content', trackContent)

  Object.defineProperty(speed, 'downloadSpeed', {
    enumerable: true,
    get: function () { return downloadSpeed() }
  })

  Object.defineProperty(speed, 'uploadSpeed', {
    enumerable: true,
    get: function () { return uploadSpeed() }
  })

  Object.defineProperty(speed, 'downloadTotal', {
    enumerable: true,
    get: function () { return totalTransfer.down }
  })

  Object.defineProperty(speed, 'uploadTotal', {
    enumerable: true,
    get: function () { return totalTransfer.up }
  })

  return speed

  function trackContent () {
    vault.content.on('download', function (block, data) {
      totalTransfer.down += data.length
      ondownload(data.length)
    })
     
    vault.content.on('upload', function (block, data) {
      totalTransfer.up += data.length
      onupload(data.length)
    })
  }

  function downZero () {
    downloadSpeed = speedometer()
    if (downTimeout) clearTimeout(downTimeout)
  }

  function upZero () {
    uploadSpeed = speedometer()
    if (upTimeout) clearTimeout(upTimeout)
  }

  function ondownload (bytes) {
    downloadSpeed(bytes)
    if (downTimeout) clearTimeout(downTimeout)
    downTimeout = setTimeout(downZero, timeout)
  }

  function onupload (bytes) {
    uploadSpeed(bytes)
    if (upTimeout) clearTimeout(upTimeout)
    upTimeout = setTimeout(upZero, timeout)
  }
}
