# BigPanda Streams [![Build Status](https://travis-ci.org/bigpandaio/streams.svg?branch=master)](https://travis-ci.org/bigpandaio/streams)

Simple but useful streams for various use cases

## LineInputStream

Transform stream that splits text into lines

### Usage:
```javascript
var LineInputStream = require('bp-streams').LineInputStream;
var stream = new LineInputStream(options);
```

__options:__

| Name          | Description           | Default  |
| :------------ |:-------------| :-----:|
| delimiter     | the character to use to split the lines | \n |
| encoding      | how to encode the lines | UTF-8

## FilesystemPersistStream

Persists data that goes through the stream to a file and passes the raw data to the next stream

### Usage:
```javascript
var FilesystemPersistStream = require('bp-streams').FilesystemPersistStream;
var stream = new FilesystemPersistStream(options);
```

__options:__

| Name          | Description           | Default  |
| :------------ |:-------------| :-----:|
| filename     | the target filename path | - |

## S3PersistStream

Persists data that goes through the stream to a bucket in S3 and passes the raw data to the next stream

### Usage:
```javascript
var S3PersistStream = require('bp-streams').S3PersistStream;
var stream = new S3PersistStream(options);
```

__options:__

| Name          | Description           | Default  |
| :------------ |:-------------| :-----:|
| filename | file name | - |
| path | 'filename' will be saved in this path | - |
| bucket | bucket name to upload to | - |



