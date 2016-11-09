var sass = require('node-sass');
var util = require('util');
var AWS = require('aws-sdk');

// get reference to S3 client
var s3 = new AWS.S3();

exports.handler = function(event, context) {
  // Read options from the event.
  console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
  var srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  // Set destination key with .css extension
  var dstKey    = srcKey.slice(0, -4) + '.css';

  s3.getObject({
    Bucket: srcBucket,
    Key: srcKey
  },function(err, response){
    if (err) {
      context.done(err);
      return;
    }
    var sassData, file;
    file = new Buffer(response.Body);
    sassData = file.toString('utf8');
    var result = sass.renderSync({
      data: sassData
    });
    console.log("result:\n", util.inspect(result, {depth: 5}));
    // Stream the transformed css to S3 bucket.
    s3.putObject({
        Bucket: srcBucket,
        Key: dstKey,
        Body: result.css,
        ContentType: 'text/css',
        StorageClass: 'REDUCED_REDUNDANCY'
    }, function(error, response){ context.done(error) });
  });
};
