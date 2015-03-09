var fs = require('fs');
var stream = require('stream');
var util = require('util');

var PassThrough = stream.PassThrough;

function PersistStream(options) {
  if (!(this instanceof PersistStream)) {
    return new PersistStream(options);
  }
  PassThrough.call(this, options);

  if (!options.filename) {
    throw new Error('Filename must be specified for persist stream');
  }

  this._filename = options.filename;
  this._file = null;
  this._writeError = null;

  var self = this;

  this.on('finish', function() {
    if (self._file) {
      try {
        self._file.end();
      } catch (e) {
        self.emit('error', new Error('Error while trying to close file stream'));
      }
    }
  })

}
util.inherits(PersistStream, PassThrough);

PersistStream.prototype._write = function (chunk, enc, done) {
  var self = this;

  if (this._file == null) {
    this._file = fs.createWriteStream(this._filename);
  }

  !this._writeError && this._file.write(chunk, enc, function(err) {
    if (err) {
      self._writeError = true;
      self.emit('error', new Error('Error while writing to file. Future writes to file will be skipped.'));
    }
  })

  done()

  return self.push(chunk)
};

module.exports = PersistStream;