require('dotenv').config();
var AWS = require('aws-sdk');


AWS.config.update({
    region: process.env.DB_REGION,
    endpoint: process.env.DB_HOST,
    accessKeyId: process.env.DB_USER,
    secretAccessKey: process.env.DB_PASS
});

var dynamodb = new AWS.DynamoDB();

module.exports.createTable = (callback) => {
    let params = {
        TableName: process.env.DB_TABLE,
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };
    
    dynamodb.createTable(params, (err, data) => {
        if (err) {
            console.error('Unable to create table. Error JSON: ', JSON.stringify(err, null, 2));
            if (callback) callback({ success: false });
        } else {
            console.log('Created table. Table description JSON: ', JSON.stringify(data, null, 2));
            if (callback) callback({ success: true });
        }
    });
}

module.exports.deleteTable = (callback) => {
    let params = {
        TableName: process.env.DB_TABLE,
    };
    
    dynamodb.deleteTable(params, (err, data) => {
        if (err) {
            console.error('Unable to create table. Error JSON: ', JSON.stringify(err, null, 2));
            if (callback) callback({ success: false });
        } else {
            console.log('Created table. Table description JSON: ', JSON.stringify(data, null, 2));
            if (callback) callback({ success: true });
        }
    });
}