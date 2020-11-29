const AWS = require('aws-sdk');
const MM = require("../lib/moves_manager");

//const DDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});
//const DDBDOC = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS_REGION });

exports.post = async (event, context) =>{

    console.log("Move Post Called");
    let gameID = event.pathParameters.gameid;
    let turnID = event.pathParameters.turnid;
    let playerID = event.pathParameters.playerid;

    console.log(`Posting Move game: ${gameID} turn: ${turnID} player: ${playerID} `);

    let body = JSON.parse(event.body);
    if (!body.stayNextMove || body.stayNextMove == "") {
        return {
            statusCode: 400,
            error: `No Data`
        };
    }

    let stayNextMove = body.stayNextMove;

    console.log(`Posting Move game: ${gameID} turn: ${turnID} player: ${playerID} stay: ${stayNextMove}`);


    const MoveMgr = new MM.MovesManager({tableName:process.env.MOVES_TABLE, docClient:new AWS.DynamoDB.DocumentClient()})

    let retValue = await MoveMgr.storeMove({gameID, turnID, playerID, stayNextMove});

    retValue = JSON.stringify(retValue);
    console.log(`Will return ${retValue}`);

    return  {
        statusCode: 200,
        body: retValue
    };

}

exports.movelist = async(event, context) => {
    console.log("Get Move List Called");
    let gameID = event.pathParameters.gameid;
    let turnID = event.pathParameters.turnid;
    console.log(`Getting Moves for game: ${gameID} turn: ${turnID}`);

    const MoveMgr = new MM.MovesManager({tableName:process.env.MOVES_TABLE, docClient:new AWS.DynamoDB.DocumentClient()})

    let retValue = await MoveMgr.getTurnMoves({gameID, turnID});
    retValue = JSON.stringify(retValue);
    console.log(`Will return ${retValue}`);

    return  {
        statusCode: 200,
        body: retValue
    };



}

exports.turnupdate = async (event, context) => {



}



