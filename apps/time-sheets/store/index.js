const storeType = (process.env.DATA_STORE || '').toLowerCase();

if (storeType === 'dynamodb') {
  module.exports = require('./dynamoStore');
} else if (!storeType || storeType === 'sqlite') {
  module.exports = require('./sqliteStore');
} else {
  throw new Error(`Unsupported DATA_STORE value: ${process.env.DATA_STORE}`);
}
