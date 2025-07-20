const { ObjectId, Timestamp, Binary, Long } = require('mongodb');

/**
 * MongoDB Response Handler
 * Handles complex MongoDB response formats with various data types
 */
class MongoResponseHandler {
  constructor() {
    this.supportedTypes = ['ObjectId', 'Timestamp', 'Binary', 'Long', 'Map'];
  }

  /**
   * Process a MongoDB response and convert special types to readable format
   * @param {Object} response - The MongoDB response object
   * @returns {Object} Processed response with converted data types
   */
  processResponse(response) {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response: must be an object');
    }

    return this._processObject(response);
  }

  /**
   * Recursively process objects to handle MongoDB data types
   * @param {*} obj - Object to process
   * @returns {*} Processed object
   */
  _processObject(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle ObjectId
    if (obj instanceof ObjectId) {
      return {
        type: 'ObjectId',
        value: obj.toString(),
        hexString: obj.toHexString()
      };
    }

    // Handle Timestamp
    if (obj instanceof Timestamp) {
      return {
        type: 'Timestamp',
        timestamp: obj.t,
        increment: obj.i,
        toNumber: obj.toNumber(),
        toString: obj.toString()
      };
    }

    // Handle Binary
    if (obj instanceof Binary) {
      return {
        type: 'Binary',
        subType: obj.sub_type,
        base64: obj.toString('base64'),
        buffer: obj.buffer
      };
    }

    // Handle Long
    if (obj instanceof Long) {
      return {
        type: 'Long',
        value: obj.toString(),
        toNumber: obj.toNumber(),
        high: obj.high,
        low: obj.low
      };
    }

    // Handle Map
    if (obj instanceof Map) {
      const mapObj = {
        type: 'Map',
        size: obj.size,
        entries: []
      };
      
      for (const [key, value] of obj.entries()) {
        mapObj.entries.push({
          key: this._processObject(key),
          value: this._processObject(value)
        });
      }
      
      return mapObj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
      return {
        type: 'Date',
        value: obj.toISOString(),
        timestamp: obj.getTime()
      };
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this._processObject(item));
    }

    // Handle regular objects
    if (typeof obj === 'object') {
      const processed = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = this._processObject(value);
      }
      return processed;
    }

    // Return primitive values as-is
    return obj;
  }

  /**
   * Extract metadata from MongoDB response
   * @param {Object} response - MongoDB response
   * @returns {Object} Extracted metadata
   */
  extractMetadata(response) {
    const metadata = {};

    if (response.ok !== undefined) {
      metadata.operationStatus = response.ok === 1 ? 'success' : 'failed';
    }

    if (response.lastErrorObject) {
      metadata.lastError = {
        documentsModified: response.lastErrorObject.n || 0,
        updatedExisting: response.lastErrorObject.updatedExisting || false
      };
    }

    if (response.$clusterTime) {
      metadata.clusterInfo = {
        clusterTime: this._processObject(response.$clusterTime.clusterTime),
        signature: this._processObject(response.$clusterTime.signature)
      };
    }

    if (response.operationTime) {
      metadata.operationTime = this._processObject(response.operationTime);
    }

    return metadata;
  }

  /**
   * Validate if an object is a valid MongoDB response
   * @param {Object} response - Object to validate
   * @returns {boolean} True if valid MongoDB response
   */
  isValidMongoResponse(response) {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Check for common MongoDB response fields
    const hasOkField = 'ok' in response;
    const hasValue = 'value' in response;
    const hasClusterTime = '$clusterTime' in response;
    const hasOperationTime = 'operationTime' in response;

    return hasOkField || hasValue || hasClusterTime || hasOperationTime;
  }

  /**
   * Format response for console output
   * @param {Object} response - Processed response
   * @returns {string} Formatted string representation
   */
  formatForConsole(response) {
    return JSON.stringify(response, null, 2);
  }
}

// Example usage and demonstration
function demonstrateUsage() {
  const handler = new MongoResponseHandler();

  // Create example response similar to the one in the problem statement
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

  console.log('=== Original MongoDB Response ===');
  console.log('Response contains complex MongoDB data types that need processing');
  
  console.log('\n=== Processed Response ===');
  const processed = handler.processResponse(exampleResponse);
  console.log(handler.formatForConsole(processed));
  
  console.log('\n=== Extracted Metadata ===');
  const metadata = handler.extractMetadata(exampleResponse);
  console.log(handler.formatForConsole(metadata));
  
  console.log('\n=== Validation ===');
  console.log('Is valid MongoDB response:', handler.isValidMongoResponse(exampleResponse));
}

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateUsage();
}

module.exports = MongoResponseHandler;