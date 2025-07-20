const { ObjectId, Timestamp, Binary, Long } = require('mongodb');
const MongoResponseHandler = require('./index.js');

/**
 * Simple test runner
 */
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  run() {
    console.log('Running tests...\n');
    
    this.tests.forEach((test, index) => {
      try {
        test.testFunction();
        console.log(`✓ Test ${index + 1}: ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ Test ${index + 1}: ${test.name}`);
        console.log(`  Error: ${error.message}`);
        this.failed++;
      }
    });

    console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }
}

// Create test runner instance
const runner = new TestRunner();

// Test MongoDB Response Handler
runner.test('Handler instantiation', () => {
  const handler = new MongoResponseHandler();
  runner.assert(handler instanceof MongoResponseHandler, 'Handler should be instance of MongoResponseHandler');
  runner.assert(Array.isArray(handler.supportedTypes), 'Should have supportedTypes array');
});

runner.test('Process ObjectId', () => {
  const handler = new MongoResponseHandler();
  const objectId = new ObjectId("687c5cd55863d59009f42c61");
  const processed = handler._processObject(objectId);
  
  runner.assertEqual(processed.type, 'ObjectId', 'Should identify as ObjectId type');
  runner.assertEqual(processed.value, objectId.toString(), 'Should convert to string correctly');
  runner.assert(processed.hexString, 'Should have hexString property');
});

runner.test('Process Timestamp', () => {
  const handler = new MongoResponseHandler();
  const timestamp = new Timestamp({ t: 1752981112, i: 2 });
  const processed = handler._processObject(timestamp);
  
  runner.assertEqual(processed.type, 'Timestamp', 'Should identify as Timestamp type');
  runner.assertEqual(processed.timestamp, 1752981112, 'Should preserve timestamp value');
  runner.assertEqual(processed.increment, 2, 'Should preserve increment value');
});

runner.test('Process Binary', () => {
  const handler = new MongoResponseHandler();
  const binary = Binary.createFromBase64("Xrje94CvVJeHou2H70vyJS1WRYI=", 0);
  const processed = handler._processObject(binary);
  
  runner.assertEqual(processed.type, 'Binary', 'Should identify as Binary type');
  runner.assert(processed.base64, 'Should have base64 representation');
  runner.assert(processed.subType !== undefined, 'Should have subType');
});

runner.test('Process Long', () => {
  const handler = new MongoResponseHandler();
  const longValue = new Long("7521958027155472389");
  const processed = handler._processObject(longValue);
  
  runner.assertEqual(processed.type, 'Long', 'Should identify as Long type');
  runner.assertEqual(processed.value, longValue.toString(), 'Should convert to string correctly');
  runner.assert(processed.high !== undefined, 'Should have high property');
  runner.assert(processed.low !== undefined, 'Should have low property');
});

runner.test('Process Map', () => {
  const handler = new MongoResponseHandler();
  const map = new Map([['qiwei', 'dd'], ['test', 'value']]);
  const processed = handler._processObject(map);
  
  runner.assertEqual(processed.type, 'Map', 'Should identify as Map type');
  runner.assertEqual(processed.size, 2, 'Should preserve map size');
  runner.assert(Array.isArray(processed.entries), 'Should have entries array');
  runner.assertEqual(processed.entries.length, 2, 'Should have correct number of entries');
});

runner.test('Process Date', () => {
  const handler = new MongoResponseHandler();
  const date = new Date('2025-07-20T03:04:50.954Z');
  const processed = handler._processObject(date);
  
  runner.assertEqual(processed.type, 'Date', 'Should identify as Date type');
  runner.assertEqual(processed.value, date.toISOString(), 'Should convert to ISO string');
  runner.assertEqual(processed.timestamp, date.getTime(), 'Should preserve timestamp');
});

runner.test('Process complete MongoDB response', () => {
  const handler = new MongoResponseHandler();
  const response = {
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

  const processed = handler.processResponse(response);
  
  runner.assertEqual(processed.ok, 1, 'Should preserve ok field');
  runner.assert(processed.value, 'Should have value field');
  runner.assertEqual(processed.value._id.type, 'ObjectId', 'Should process ObjectId in value');
  runner.assertEqual(processed.value.ssoAccounts.type, 'Map', 'Should process Map in value');
  runner.assert(processed['$clusterTime'], 'Should have cluster time');
  runner.assertEqual(processed['$clusterTime'].clusterTime.type, 'Timestamp', 'Should process cluster timestamp');
});

runner.test('Extract metadata', () => {
  const handler = new MongoResponseHandler();
  const response = {
    lastErrorObject: { n: 1, updatedExisting: true },
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

  const metadata = handler.extractMetadata(response);
  
  runner.assertEqual(metadata.operationStatus, 'success', 'Should extract operation status');
  runner.assertEqual(metadata.lastError.documentsModified, 1, 'Should extract documents modified count');
  runner.assert(metadata.clusterInfo, 'Should extract cluster info');
  runner.assert(metadata.operationTime, 'Should extract operation time');
});

runner.test('Validate MongoDB response', () => {
  const handler = new MongoResponseHandler();
  
  runner.assert(handler.isValidMongoResponse({ ok: 1 }), 'Should validate response with ok field');
  runner.assert(handler.isValidMongoResponse({ value: {} }), 'Should validate response with value field');
  runner.assert(handler.isValidMongoResponse({ '$clusterTime': {} }), 'Should validate response with cluster time');
  runner.assert(handler.isValidMongoResponse({ operationTime: {} }), 'Should validate response with operation time');
  
  runner.assert(!handler.isValidMongoResponse(null), 'Should reject null');
  runner.assert(!handler.isValidMongoResponse({}), 'Should reject empty object');
  runner.assert(!handler.isValidMongoResponse('string'), 'Should reject non-objects');
});

runner.test('Handle error cases', () => {
  const handler = new MongoResponseHandler();
  
  try {
    handler.processResponse(null);
    runner.assert(false, 'Should throw error for null input');
  } catch (error) {
    runner.assert(error.message.includes('Invalid response'), 'Should throw appropriate error message');
  }
});

runner.test('Format for console', () => {
  const handler = new MongoResponseHandler();
  const response = { test: 'value', number: 42 };
  const formatted = handler.formatForConsole(response);
  
  runner.assert(typeof formatted === 'string', 'Should return string');
  runner.assert(formatted.includes('test'), 'Should contain original data');
  runner.assert(formatted.includes('42'), 'Should contain number values');
});

// Run all tests
const success = runner.run();

if (success) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}