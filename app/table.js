require('dotenv').config();
var AWS = require('aws-sdk');
const isDev = process.env.NODE_ENV !== 'production';

const localConfig = {
    region: process.env.DB_REGION,
    endpoint: `http://localhost:8000`,
    accessKeyId: process.env.DB_USER,
    secretAccessKey: process.env.DB_PASS
};

const remoteConfig = {
    region: process.env.DB_REGION,
    endpoint: process.env.DB_HOST,
    accessKeyId: process.env.DB_USER,
    secretAccessKey: process.env.DB_PASS
}

AWS.config.update(isDev ? localConfig : remoteConfig);

var dynamodb = new AWS.DynamoDB();

module.exports.createTable = () => {
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
    
    const createTablePromise = dynamodb.createTable(params).promise();

    return createTablePromise.then(data => {
        console.log('Created table. Table description JSON: ', data.TableDescription.TableName);
    }).catch(error => {
        console.error('Unable to create table. Error JSON: ', JSON.stringify(err, null, 2));
    });
}

module.exports.deleteTable = (callback) => {
    let params = {
        TableName: process.env.DB_TABLE,
    };
    
    const deleteTablePromise = dynamodb.deleteTable(params).promise();

    return deleteTablePromise.then(data => {
        console.log('Deleted table. Table description JSON: ', data.TableDescription.TableName);
    }).catch(error => {
        console.error('Unable to delete table. Error JSON: ', JSON.stringify(err, null, 2));
    });
}
