var AWS = require('aws-sdk');
var _ = require('underscore');

var stream = require('stream');
var util = require('util');

var PassThrough = stream.PassThrough;

function S3PersistStream(options) {
  var awsCredentials = new AWS.Credentials({accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey});
  var s3 = new AWS.S3();
  s3.config.credentials = awsCredentials;
  this.s3Stream = require('s3-upload-stream')(s3);

  if (!(this instanceof S3PersistStream)) {
    return new S3PersistStream(options);
  }
  PassThrough.call(this, options);

  if (!options.filename) {
    throw new Error('filename must be specified for S3 persist stream');
  }

  if (!options.path) {
    throw new Error('path must be specified for S3 persist stream');
  }

  if (!options.bucket) {
    throw new Error('bucket must be specified for S3 persist stream');
  }

  this._filename = options.filename;
  this._path = options.path;
  this._bucket = options.bucket;
  this._maxPartSize = options.maxPartSize;
  this._metadata = options.metadata;
  this._storage_class = options.storage_class || 'REDUCED_REDUNDANCY';

  this._uploadParams = {
    "Bucket": this._bucket,
    "Key": util.format('%s/%s', this._path, this._filename),
    "StorageClass": this._storage_class
  };

  if (this._metadata && _.isObject(this._metadata)) {
    this._uploadParams["Metadata"] = this._metadata;
  }

  this._listObjectParams = {Bucket: this._bucket,
                            Prefix: util.format('%s/', this._path)};

  this._uploadStream = null;
  this._writeError = null;
}

util.inherits(S3PersistStream, PassThrough);

S3PersistStream.prototype._write = function (chunk, enc, done) {
  var self = this;

  if (!this._writeError && this._uploadStream == null) {
    try {
      this._uploadStream = self.s3Stream.upload(this._uploadParams);
      if (this._maxPartSize) {
        this._uploadStream.maxPartSize(this._maxPartSize);
      }

      this._uploadStream.on('error', function(e) {
        self._writeError = e;
        self.emit('error', self._writeError);
      });

      this._uploadStream.on('uploaded', function(details) {
        self.emit('persistdone', details);
      });

    } catch (e) {
      this._writeError = e;
      this.emit('error', this._writeError);
    }
  }

  if (!this._writeError) {
    this._uploadStream.write(chunk, enc);
  }

  done();
  return self.push(chunk);
};

S3PersistStream.prototype._flush = function (done) {
  if (this._uploadStream && !this._writeError) {
    try {
      this._uploadStream.end();
    } catch (e) {
      this.emit('error', new Error('Error while trying to close file stream: ' + e.message));
    }
  }

  return done();
}

module.exports = S3PersistStream;
