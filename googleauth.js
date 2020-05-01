
   'use strict';

   const authCloudImplicit = async () => {
// Imports the Google Cloud client library.
const {Storage} = require('@google-cloud/storage');

// Instantiates a client. If you don't specify credentials when constructing
// the client, the client library will look for credentials in the
// environment.
const storage = new Storage();

try {
  // Makes an authenticated API request.
  //console.log('haha', storage);
  const results = await storage.getBuckets();

  const [buckets] = results;

  console.log('Buckets:');
  buckets.forEach(bucket => {
    console.log(bucket.name);
  });
} catch (err) {
  console.error('ERROR:', err);
}
   };

var http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('Hello World!');
  const a = authCloudImplicit();
}).listen(8080);

   