const AWS = require('aws-sdk');
const GM = require("../lib/game_manager");

//const DDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});
//const DDBDOC = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS_REGION });



//const GM = new GameList(process.env.GAMES_TABLE);
const GL = new GM.GameManager({tableName:process.env.GAMES_TABLE, docClient:new AWS.DynamoDB.DocumentClient()})



function gameRecToDDB(rec) {

    let dbRec = {
        TableName: process.env.GAMES_TABLE,
        Item: {
            "gameName": {
                S: rec.name
            },
            "createTime": {
                N: (Math.floor(Date.now() / 1000)).toString()
            },
            "numPlayers": {
                N: rec.numPlayers.toString()
            }
        }
    }

    return dbRec;
}

async function doGetWork() {
    let retValue;

    try {
        let data = await GL.getGameListBrief();
        console.log((data!==undefined) ? data.length : "No results");
        retValue = {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.log("Games Get had an error")

        retValue = {
            statusCode: 400,
            body: JSON.stringify(error)
        }

    }

    console.log("Game Get work function about to return");
    console.log(retValue);
    return retValue

}

exports.get = async (event, context) => {

    //console.log("Games Get called");
    //console.log(event);
    let retValue;

    try {
        let data = await GL.getGameListBrief();
        console.log((data!==undefined) ? data.length : "No Data");
        retValue = {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.log("Games Get had an error")

        retValue = {
            statusCode: 400,
            body: JSON.stringify(error)
        }

    }
    console.log('games get about to return');
    console.log(retValue);
    return retValue;

};




