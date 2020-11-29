const AWS = require('aws-sdk');
const MM = require('../lib/moves_manager');

AWS.config.update({ region: process.env.AWS_REGION });


module.exports.domove = (gameid, name, turn, stay) => {

    let docClient = new AWS.DynamoDB.DocumentClient();
    let tableName = process.env.MOVES_TABLE;


    let mgr = new MM.MovesManager({tableName, docClient});




}