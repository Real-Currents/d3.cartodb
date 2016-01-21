var d3 = require('d3')
var topojson = require('topojson')

function XYZProvider (options) {
  this.layer = options.layer
  this.format = options.format
  this.urlTemplate = options.urlTemplate
  this.tilejson = options.tilejson
  this._tileQueue = []
  if (!this.urlTemplate) {
    if (!this.tilejson) {
      this.ready = false
    } else {
      this.urlTemplate = this.tilejson.tiles[0]
    }
  }
}

XYZProvider.prototype = {

  getTile: function (tilePoint, callback) {
    if (this.ready) {
      var self = this
      this.getGeometry(tilePoint, function (err, geometry) {
        if (err) return
        if (geometry.type === 'Topology') {
          self.format = 'topojson'
          geometry = topojson.feature(geometry, geometry.objects.vectile)
        }
        callback(tilePoint, geometry)
      })
    } else {
      this._tileQueue.push([tilePoint, callback])
    }
  },

  getGeometry: function (tilePoint, callback) {
    var url = this.urlTemplate
      .replace('{x}', tilePoint.x)
      .replace('{y}', tilePoint.y)
      .replace('{z}', tilePoint.zoom)
      .replace('{s}', 'abcd'[(tilePoint.x * tilePoint.y) % 4])
      .replace('.png', '.geojson')

    d3.json(url, callback)
  },

  setReady: function () {
    this._processQueue()
  },

  setURL: function (url) {
    this.urlTemplate = url
    this.setReady()
  },

  _processQueue: function () {
    var self = this
    this._tileQueue.forEach(function (item) {
      self.getTile.apply(self, item)
    })
  }
}

module.exports = XYZProvider
