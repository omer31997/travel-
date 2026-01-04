
const serverless = require('serverless-http');
const { app } = require('../../dist/index.cjs');

module.exports.handler = serverless(app);
