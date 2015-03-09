var Transform = require('stream').Transform,
    util = require('util');


function LineInputStream(options) {
  if (!(this instanceof LineInputStream)) {
    return new LineInputStream(options);
  }

  Transform.call(this);

  options = options || {};

  this.delimiter = options.delimiter || "\n";
  this.lines = [];
  this.data = "";

  this.setEncoding(options.encoding || 'utf-8');
}


util.inherits(LineInputStream, Transform);

LineInputStream.prototype._pushLines = function(callback) {
  var self = this;
  var keepGoing = true;
  while(keepGoing && this.lines.length > 0) {
    var line = this.lines.shift()
    keepGoing = this.push(line);
  }

  if (this.lines.length > 0) {
    setImmediate(function() {
      self._pushLines(callback)
    })
    return false;
  }

  callback();
  return true;
}

LineInputStream.prototype._transform = function(chunk, enc, done) {
  this.data += chunk;
  var lines = this.data.split(this.delimiter);
  // Last line might be incomplete, so we wait for the next chunk or flush
  this.data = lines.pop();
  this.lines = this.lines.concat(lines);

  return this._pushLines(done);
}

// Handle any remaining data
LineInputStream.prototype._flush = function(done) {
  if (this.data) {
    this.lines = [this.data]
    this._pushLines(done)
  } else {
    done();
  }
}

module.exports = LineInputStream;
