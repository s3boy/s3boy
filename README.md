# S3Boy MongoDB Response Handler

This project provides utilities to handle complex MongoDB response formats, particularly those containing advanced data types like ObjectId, Map, Timestamps, Binary data, and cluster information.

## Example MongoDB Response Format

The following is an example of a complex MongoDB response that this utility can handle:

```javascript
{                                                                             
  lastErrorObject: { n: 1, updatedExisting: true },                           
  value: {                          
    _id: new ObjectId("687c5cd55863d59009f42c61"),                            
    ssoAccounts: Map(1) { 'qiwei' => 'dd' },                                  
    createdAt: 2025-07-20T03:04:50.954Z,                                      
    nickname: 'dddd',
    roles: [ 'super' ],                                                       
    updatedAt: 2025-07-20T03:11:50.186Z
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
}
```

## Features

- Handle MongoDB ObjectId conversion and validation
- Process Map data structures from MongoDB responses
- Parse and work with MongoDB Timestamps
- Handle Binary data from Base64 encoding
- Process Long number types
- Validate cluster time information
- Extract and format response metadata

## Usage

```javascript
const MongoResponseHandler = require('./index.js');

const handler = new MongoResponseHandler();
const processedResponse = handler.processResponse(mongoDbResponse);
```

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

## Testing

```bash
npm test
```