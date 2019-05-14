'use strict';

var http = require('http');

var httpHelper = (function () {

    return {
        doGetRequest: function (options) {
          return new Promise ((resolve, reject) => {
            http.get(options, (res) => {
              const { statusCode } = res;
              const contentType = res.headers['content-type'];
            
              let error;
              if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                                  `Status Code: ${statusCode}`);
              } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                                  `Expected application/json but received ${contentType}`);
              }
              if (error) {
                console.error(error.message);
                // Consume response data to free up memory
                res.resume();
                reject(error);
                return;
              }
            
              res.setEncoding('utf8');
              let rawData = '';
              res.on('data', (chunk) => { rawData += chunk; });
              res.on('end', () => {
                try {
                  const parsedData = JSON.parse(rawData);
                  resolve(parsedData);
                } catch (e) {
                  console.error(e.message);
                  reject(e);
                }
              });
            }).on('error', (e) => {
              console.error(`Got error: ${e.message}`);
              reject(e);
            });
          }); 
        },
        doPostRequest: function (options,postData) {
         return new Promise((resolve, reject) => {

            let req = http.request(
              options,
              res => {
                let buffers = [];
                res.on('error', reject);
                res.on('data', buffer => buffers.push(buffer));
                res.on(
                  'end',
                  () =>
                    res.statusCode === 200||res.statusCode === 204
                      ? resolve(Buffer.concat(buffers))
                      : reject(Buffer.concat(buffers))
                );
              }
            );
            req.write(JSON.stringify(postData));
            req.end();
          });
        }
    };
})();
module.exports = httpHelper;
