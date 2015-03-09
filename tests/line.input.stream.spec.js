var LineInputStream = require('..').LineInputStream
var streamBuffers = require("stream-buffers");
var randomstring = require("randomstring");

describe('Line input stream tests', function() {

  var buffer;

  function init(string, chunkSize, options) {
    buffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 1,                   // in milliseconds.
      chunkSize: chunkSize || 2048     // in bytes.
    });

    buffer.put(string)

    var stream = buffer.pipe(new LineInputStream(options));
    return stream;
  }

  function test(stream, expectFn, done) {
    var lines = []

    stream.on('data', function(line) {
      lines.push(line);
    })

    stream.on('end', function() {
      expectFn(lines);
      done()
    })

    buffer.destroySoon()
  }

  it('should split the streamed text to lines', function(done) {
    var stream = init("first\nsecond\nthird\n");
    test(stream, function(lines) {
      expect(lines).to.have.length(3);
      expect(lines).to.include.members(['first', 'second', 'third'])
    }, done)
  })

  it('should split into lines even if no newline at the end', function(done) {
    var stream = init("first\nsecond\nthird");
    test(stream, function(lines) {
      expect(lines).to.have.length(3);
      expect(lines).to.include.members(['first', 'second', 'third'])
    }, done)
  })

  it('should work well with multiple chunks', function(done) {
    var stream = init("first\nsecond\nthird", 1);
    test(stream, function(lines) {
      expect(lines).to.have.length(3);
      expect(lines).to.include.members(['first', 'second', 'third'])
    }, done)
  })

  it('should split by different delimiter', function(done) {
    var stream = init("first,second,third", 1, {delimiter: ","});
    test(stream, function(lines) {
      expect(lines).to.have.length(3);
      expect(lines).to.include.members(['first', 'second', 'third'])
    }, done)
  })
})

