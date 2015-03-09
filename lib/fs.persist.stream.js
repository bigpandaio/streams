var fs = require('fs');
var stream = require('stream');
var util = require('util');

var PassThrough = stream.PassThrough;

function FilesystemPersistStream(options) {
  if (!(this instanceof FilesystemPersistStream)) {
    return new FilesystemPersistStream(options);
  }
  PassThrough.call(this, options);

  if (!options.filename) {
    throw new Error('Filename must be specified for persist stream');
  }

  this._filename = options.filename;
  this._file = null;
  this._writeError = null;
}

util.inherits(FilesystemPersistStream, PassThrough);

FilesystemPersistStream.prototype._write = function (chunk, enc, done) {
  var self = this;

  if (!this._writeError && this._file == null) {
    try {
      this._file = fs.createWriteStream(this._filename);

      this._file.on('error', function(e) {
        self._writeError = e;
      })

    } catch (e) {
      this._writeError = e;
    }

  }

  !this._writeError && this._file.write(chunk, enc, function() {})

  done()

  return self.push(chunk)
};

FilesystemPersistStream.prototype._flush = function (done) {
  if (this._writeError) {
    this.emit('error', new Error('Error while writing to file: ' + this._writeError.message))
  } else if (this._file) {
    try {
      this._file.end();
    } catch (e) {
      this.emit('error', new Error('Error while trying to close file stream: ' + e.message));
    }
  }
  done();
}

module.exports = FilesystemPersistStream;