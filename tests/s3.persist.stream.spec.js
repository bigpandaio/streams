var S3PersistStream = require('..').S3PersistStream;
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var streamBuffers = require("stream-buffers");
var crypto = require('crypto');

describe('S3 persist stream tests', function() {

  var buffer;
  var options = {filename: 'test_file_' + (new Date().getTime()),
                 maindir: 'bigpanda_test',
                 subdir: 'abcdefghijklmnop',
                 bucket: 'stage-bp-objects-cache'};

  // Let the upload process enough time to finish
  this.timeout(10000);

  function init(string, chunkSize, options) {
    buffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 1,                   // in milliseconds.
      chunkSize: chunkSize || 2048     // in bytes.
    });

    buffer.put(string)

    var stream = buffer.pipe(new S3PersistStream(options));
    return stream;
  }

  function test(stream, expectFn) {
    buffer.destroySoon();
    stream.on('persistdone', function(details) {
      s3.getObject({Bucket: details.Bucket, Key:details.Key}, function (err,data) {
        var md5sum = crypto.createHash('md5');

        md5sum.update(data.Body);
        s3.deleteObjects({Bucket: details.Bucket, Delete: { Objects: [{Key: details.Key}] } }, function (err, data) {
          expect(err).to.be.null;
          expectFn(md5sum.digest('hex'));
        });
      });
    });
  }

  function getHash(input) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(input);
    return md5sum.digest('hex');
  }

  it('should upload the data to s3 with the same md5 as the source', function(done) {
    var input = "Test Text";
    var stream = init(input, 2048, options);

    test(stream, function(downloadedHash) {
      expect(downloadedHash).to.be.eql(getHash(input));
      done();
    });
  });

})

