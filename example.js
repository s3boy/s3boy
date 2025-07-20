const MongoResponseHandler = require('./index.js');
const { ObjectId, Timestamp, Binary, Long } = require('mongodb');

console.log('=== MongoDB Response Handler Example ===\n');

// Create a handler instance
const handler = new MongoResponseHandler();

// Example 1: The exact format from the problem statement
console.log('1. Processing the exact MongoDB response format from the issue:');
const exampleResponse = {
  lastErrorObject: { n: 1, updatedExisting: true },
  value: {
    _id: new ObjectId("687c5cd55863d59009f42c61"),
    ssoAccounts: new Map([['qiwei', 'dd']]),
    createdAt: new Date('2025-07-20T03:04:50.954Z'),
    nickname: 'dddd',
    roles: ['super'],
    updatedAt: new Date('2025-07-20T03:11:50.186Z')
  },
  ok: 1,
  '$clusterTime': {
    clusterTime: new Timestamp({ t: 1752981112, i: 2 }),
    signature: {
      hash: Binary.createFromBase64("Xrje94CvVJeHou2H70vyJS1WRYI=", 0),
      keyId: new Long("7521958027155472389")
    }
  },
  operationTime: new Timestamp({ t: 1752981112, i: 2 })
};

console.log('Original response validation:', handler.isValidMongoResponse(exampleResponse));

const processed = handler.processResponse(exampleResponse);
console.log('\nProcessed user data:');
console.log('- User ID:', processed.value._id.value);
console.log('- Nickname:', processed.value.nickname);
console.log('- Roles:', processed.value.roles);
console.log('- SSO Accounts:', processed.value.ssoAccounts.entries.map(e => `${e.key}: ${e.value}`).join(', '));
console.log('- Created:', processed.value.createdAt.value);
console.log('- Updated:', processed.value.updatedAt.value);

const metadata = handler.extractMetadata(exampleResponse);
console.log('\nOperation metadata:');
console.log('- Status:', metadata.operationStatus);
console.log('- Documents modified:', metadata.lastError.documentsModified);
console.log('- Was existing document:', metadata.lastError.updatedExisting);

console.log('\n' + '='.repeat(50) + '\n');

// Example 2: Working with different MongoDB response types
console.log('2. Processing different MongoDB data types:');

const complexResponse = {
  _id: new ObjectId(),
  userPreferences: new Map([
    ['theme', 'dark'],
    ['language', 'zh-CN'],
    ['notifications', 'enabled']
  ]),
  lastLogin: new Date(),
  sessionData: {
    token: Binary.createFromBase64("dGVzdCB0b2tlbiBkYXRh", 0),
    expires: new Timestamp({ t: Math.floor(Date.now() / 1000), i: 1 }),
    userId: new Long("123456789012345")
  },
  permissions: ['read', 'write', 'admin']
};

const complexProcessed = handler.processResponse(complexResponse);
console.log('User preferences:');
complexProcessed.userPreferences.entries.forEach(entry => {
  console.log(`- ${entry.key}: ${entry.value}`);
});

console.log('\nSession info:');
console.log('- Token (Base64):', complexProcessed.sessionData.token.base64);
console.log('- Expires:', new Date(complexProcessed.sessionData.expires.timestamp * 1000).toISOString());
console.log('- User ID:', complexProcessed.sessionData.userId.value);

console.log('\n' + '='.repeat(50) + '\n');

// Example 3: Error handling
console.log('3. Error handling examples:');

try {
  handler.processResponse(null);
} catch (error) {
  console.log('✓ Properly handles null input:', error.message);
}

try {
  handler.processResponse("invalid");
} catch (error) {
  console.log('✓ Properly handles invalid input:', error.message);
}

console.log('✓ Validates empty object:', !handler.isValidMongoResponse({}));
console.log('✓ Validates valid response:', handler.isValidMongoResponse({ ok: 1 }));

console.log('\n=== Summary ===');
console.log('The MongoDB Response Handler successfully:');
console.log('- Processes complex MongoDB data types (ObjectId, Map, Timestamp, Binary, Long)');
console.log('- Extracts meaningful metadata from responses');
console.log('- Provides proper error handling and validation');
console.log('- Formats data for easy consumption and debugging');
console.log('- Handles the exact response format described in the issue');