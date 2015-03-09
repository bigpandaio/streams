# BigPanda Streams [![Build Status](https://travis-ci.org/bigpandaio/streams.svg?branch=develop)](https://travis-ci.org/bigpandaio/streams)

Simple but useful streams for various use cases

## LineInputStream

Transform stream that splits text into lines

### Usage:
```javascript
var LineInputStream = require('bp-streams).LineInputStream;
var stream = new LineInputStream(options);
```

options:

| Name          | Description           | Default  |
| :------------ |:-------------| :-----:|
| delimiter     | the character to use to split the lines | \n |
| encoding      | how to encode the lines | UTF-8

## FilesystemPersistStream

Persists data the goes through the stream to a file and passes the raw data to the next stream

### Usage:
```javascript
var FilesystemPersistStream = require('bp-streams).FilesystemPersistStream;
var stream = new FilesystemPersistStream(options);
```

options:

| Name          | Description           | Default  |
| :------------ |:-------------| :-----:|
| filename     | the target filename path | - |




