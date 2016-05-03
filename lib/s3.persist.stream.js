var AWS = require('aws-sdk');
var _ = require('underscore');

var stream = require('stream');
var util = require('util');

var rotateHistoryCount = 3;
var PassThrough = stream.PassThrough;

function S3PersistStream(options) {
  var s3 = new AWS.S3({accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey});
  this.s3Stream = require('s3-upload-stream')(s3);

  if (!(this instanceof S3PersistStream)) {
    return new S3PersistStream(options);
  }
  PassThrough.call(this, options);

  if (!options.metadata_version) {
    throw new Error('Metadata Version must be specified for S3 persist stream');
  }

  if (!options.organization) {
    throw new Error('Organization must be specified for S3 persist stream');
  }

  if (!options.stream_id) {
    throw new Error('Stream ID must be specified for S3 persist stream');
  }

  if (!options.bucket) {
    throw new Error('Bucket must be specified for S3 persist stream');
  }

  this._metadata_version = options.metadata_version;
  this._organization = options.organization;
  this._stream_id = options.stream_id;
  this._bucket = options.bucket;

  this._uploadParams = {
    "Bucket": this._bucket,
    "Key": util.format('%s/%s/%s', this._organization, this._stream_id, this._metadata_version),
    "StorageClass": "REDUCED_REDUNDANCY"
  }
  this._listObjectParams = {Bucket: this._bucket,
                            Prefix: util.format('%s/%s/', this._organization, this._stream_id)};

  this._uploadStream = null;
  this._writeError = null;
}

util.inherits(S3PersistStream, PassThrough);

S3PersistStream.prototype._write = function (chunk, enc, done) {
  var self = this;

  if (!this._writeError && this._uploadStream == null) {
    try {
      this._uploadStream = self.s3Stream.upload(this._uploadParams);
      this._uploadStream.maxPartSize(10485760);

      this._uploadStream.on('error', function(e) {
        self._writeError = e;
        self.emit('error', self._writeError);
      });

      this._uploadStream.on('uploaded', function(details) {
        self.rotate();
        self.emit('persistdone', details);
      });

    } catch (e) {
      this._writeError = e;
      this.emit('error', this._writeError);
    }

  }

  self.push(chunk);

  if (!this._writeError) {
    return this._uploadStream.write(chunk, enc, done);
  }

  return done();
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

S3PersistStream.prototype.rotate = function () {
  var self = this;
  s3.listObjects(this._listObjectParams, function (err,data) {
    if (!err) {
      var contents = data.Contents;
      contents.map(function (item) { _.forEach(item, function(i,j) {if (j !== "Key") delete item[j]; });});
      var toDelete = contents.filter(function(item) { return parseInt(item.Key.split('/')[2]) <= self._metadata_version - rotateHistoryCount; });

      if (toDelete.length > 0) {
        var params = {Bucket: self._bucket, Delete: { Objects: toDelete } };

        s3.deleteObjects(params, function (err, data) {
          if (err) {
            self.emit('rotate_error', err);
          } else if (data) {
            self.emit('rotate_finished', data);
          }
        });
      }
    } else {
      self.emit('rotate_error', err);
    }
  });
}

module.exports = S3PersistStream;
