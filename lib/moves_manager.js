class MovesManager {

    constructor ({ tableName, docClient }) {
        console.log("MovesManager created");
        this.table = tableName;
        this.docClient = docClient;

        console.log("MovesManager Initialized")

    }


    async storeMove({gameID, turnID, playerID, stayNextMove}) {
        console.log(`Storing move: ${stayNextMove}`);
        const currTime = this.getCurrTime();


        let params = {
            TableName : this.table,
            Item: {
                gameID,
                turnPerson: `${turnID}:${playerID}`,
                stayNextMove,
                moveTime: currTime
            }
        };

        let success = true;

        try {
            console.log("About to call put on Move")
            const data = await this.docClient.put(params).promise();
            console.log(`Rcvd: ${data}`);

        } catch (error) {
            console.log(`Error: ${error}`)
            success = false;
        }

        return success;
    }

    async getTurnMoves({gameID, turnID}) {
        let params = {
            TableName: this.table,
            ProjectionExpression: 'turnPerson, stayNextMove',
            // KeyConditionExpression: 'gameMove = :ckey ',
            // KeyConditionExpression: 'gameMove BEGINS_WITH :ckey',
            KeyConditionExpression: 'gameID = :ckey and begins_with(turnPerson, :tkey)',
            // KeyConditions: {
            //     'gameMove': {
            //         ComparisonOperator: "BEGINS_WITH",
            //         AttributeValueList: [
            //             ":ckey"
            //         ]
            //     }
            // },

            ExpressionAttributeValues: {
                ':ckey': gameID,
                ':tkey': turnID.toString(10)
            }
        };

        try {
            let data = await this.docClient.query(params).promise();
            console.log(data);
            return data.Items.map(it => ({gameID, turnID, 'playerID': it.turnPerson.split(':')[1], stayNextMove: it.stayNextMove}));
        }  catch (error) {
            console.log(error);
            return null;
        }


    }


    // to do
    async getPlayersMoves({gameID, playerID}) {
        let params = {
            TableName: this.table,
            ProjectionExpression: 'turnPerson, stayNextMove',
            // KeyConditionExpression: 'gameMove = :ckey ',
            // KeyConditionExpression: 'gameMove BEGINS_WITH :ckey',
            KeyConditionExpression: 'gameID = :ckey and begins_with(turnPerson, :tkey)',
            // KeyConditions: {
            //     'gameMove': {
            //         ComparisonOperator: "BEGINS_WITH",
            //         AttributeValueList: [
            //             ":ckey"
            //         ]
            //     }
            // },

            ExpressionAttributeValues: {
                ':ckey': gameID,
                ':tkey': turnID.toString(10)
            }
        };

        try {
            let data = await this.docClient.query(params).promise();
            console.log(data);
            return data.Items.map(it => ({gameID, turnID, 'playerID': it.turnPerson.split(':')[1], stayNextMove: it.stayNextMove}));
        }  catch (error) {
            console.log(error);
            return null;
        }


    }




    async updateGame(gameID, turnID, gameMgr) {
        console.log(`Updating game: ${gameID} for turn: ${turnID}`);
        let moves = await this.getTurnMoves(gameID, turnID);

        console.log(`Updating ${gameID} with ${moves.length} moves`)
        await gameMgr.updateMoves(gameID, turnID, moves);



    }

    genID(gameID, turnID, playerID) {
        let id = `${gameID}:${turnID}`;
        if (playerID) {
            id = `${id}:playerID`
        }

        return id;
    }




    getCurrTime() {
        return Math.floor(Date.now() / 1000);
    }

}

module.exports = {
    MovesManager
}