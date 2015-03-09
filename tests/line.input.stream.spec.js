var LineInputStream = require('..').LineInputStream
var streamBuffers = require("stream-buffers");
var randomstring = require("randomstring").generate;

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

  it('should split to lines - random size text', function(done) {

    function randomInt (low, high) {
      return Math.floor(Math.random() * (high - low) + low);
    }

    var numberOfLines = randomInt(1000, 9999);
    var i = numberOfLines;
    var string = randomstring() + '\n';
    while (--i > 0) {
      string += randomstring() + '\n';
    }

    var stream = init(string);
    test(stream, function(lines) {
      expect(lines).to.have.length(numberOfLines);
    }, done)
  })

  it('should use provided encoding', function(done) {

    function randomUTF8 () {
      var nonAsciiWord = "";
      for (var i = 0; i < 10; i++) {
        nonAsciiWord += String.fromCharCode(Math.floor(Math.random() * (256 - 128) + 128));
      }
      return nonAsciiWord;
    }

    var string = randomUTF8();
    var stream = init(string, null, { encoding: 'ascii'});
    test(stream, function(lines) {
      expect(lines).to.have.length(1);
      expect(lines[0]).to.not.equal(string);
    }, function() {
      // Let's make sure we're not lying to ourselves
      var string = randomUTF8();
      var stream = init(string, null, { encoding: 'utf-8'});
      test(stream, function(lines) {
        expect(lines).to.have.length(1);
        expect(lines[0]).to.equal(string);
      }, done)
    })

  })
})

