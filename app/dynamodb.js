require('dotenv').config();
const AWS = require('aws-sdk');
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

const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = docClient;