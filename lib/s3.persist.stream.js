var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var s3Stream = require('s3-upload-stream')(s3);

var stream = require('stream');
var util = require('util');

var PassThrough = stream.PassThrough;

function S3PersistStream(options) {
  if (!(this instanceof S3PersistStream)) {
    return new S3PersistStream(options);
  }
  PassThrough.call(this, options);

  if (!options.filename) {
    throw new Error('Filename must be specified for S3 persist stream');
  }

  if (!options.organization) {
    throw new Error('Organization must be specified for S3 persist stream');
  }

  if (!options.stream_id) {
    throw new Error('Stream ID must be specified for S3 persist stream');
  }

  this._filename = util.format('%s/%s/%s', options.organization, options.stream_id, options.filename);
  this._metadata_version = options.filename;
  this._organization = options.organization;
  this._stream_id = options.stream_id;


  this.uploaded = null;
  this._file = null;
  this._writeError = null;
}

util.inherits(S3PersistStream, PassThrough);

S3PersistStream.prototype._write = function (chunk, enc, done) {
  var self = this;

  if (!this._writeError && this._file == null) {
    try {
      this._file = s3Stream.upload({
        "Bucket": "bp-objects-cache",
        "Key": this._filename
      });

      this._file.on('error', function(e) {
        self._writeError = e;
      })

      /*
      this._file.on('part', function(details) {
      });
      */

      this._file.on('uploaded', function(details) {
        this.rotate();
      })

    } catch (e) {
      this._writeError = e;
    }

  }

  self.push(chunk)
  if (!this._writeError) {
    return this._file.write(chunk, enc, done);
  }

  return done();
};

S3PersistStream.prototype._flush = function (done) {
  if (this._writeError) {
    this.emit('error', new Error('Error while writing to file: ' + this._writeError.message))
  } else if (this._file) {
    try {
      this._file.end();
    } catch (e) {
      this.emit('error', new Error('Error while trying to close file stream: ' + e.message));
    }
  }
  return done();
}

S3PersistStream.prototype.rotate = function () {
  s3.listObjects({Bucket: 'bp-objects-cache', Prefix: `${this._organization}/${this._stream_id}/`}, function (err,data) {
    if (!err) {
      log.info(data);
    }
  });
}

module.exports = S3PersistStream;
