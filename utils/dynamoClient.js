const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { fromSSO } = require('@aws-sdk/credential-providers');

// Optional: pass profile name via env
const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: fromSSO({ profile: process.env.AWS_PROFILE })
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

module.exports = ddbDocClient;
