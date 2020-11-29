const GAMEINST = require("./game_instance");



class GameManager {

    constructor({tableName, docClient}) {
        console.log("GameManager creating....");
        this.table = tableName;

        console.log(`GameManager Table assigned: ${this.table}`);

        this.docClient = docClient;

        console.log("GameManager Initialized")

    }

    async createGame(cfg) {

        let game = new GAMEINST.GameInstance(cfg);
        let ids = this.genIDs();



        let statusTime = await this.saveGameInstance({...ids, game, newStatus: "CREATED"});
        return (statusTime>0) ? ids : null;
    }


    async getGameListBrief(){

        let params = {
            TableName: this.table,
            ProjectionExpression: 'gameID, statusTime, gameStatus',
        };
        let params2 = {
            TableName: this.table,
            ProjectionExpression: 'gameID',
            KeyConditionExpression: 'gameID NE :ckey ',
            ExpressionAttributeValues: {
                ':ckey': null

            }
        };

        try {
            console.log(`About to Scan: ${this.table}`);
            let data = await this.docClient.scan(params).promise();
            console.log(data);
            return ({games: data.Items});
        }  catch (error) {
            console.log(error);
            return error;
        }

    }
    async getGameListBriefNotWork(){
        let params = {
            TableName: this.table,
            ProjectionExpression: 'gameID',
            KeyConditionExpression: 'gameID NE :ckey ',
            ExpressionAttributeValues: {
                ':ckey': null

            }
        };

        try {
            let data = await this.docClient.query(params).promise();
            console.log(data);
            return data;
        }  catch (error) {
            console.log(error);
            return error;
        }

    }

    async getGameInstance(gameID){
        let params = {
            TableName: this.table,
            ProjectionExpression: 'statusTime, gameStatus, gameConfig, gameState',
            KeyConditionExpression: 'gameID = :ckey ',
            ExpressionAttributeValues: {
                ':ckey': gameID

            }
        };

        console.log(`Attempting to get details for ${gameID}`);

        try {
            let data = await this.docClient.query(params).promise();
            console.log(data);
            if (data.Items.length != 1) {
                console.log(`No game maches ${gameID}`);
                return null;
            }
            let game = new GAMEINST.GameInstance(data.Items[0].gameConfig, data.Items[0].gameState);
            return game;
        }  catch (error) {
            console.log(error);
            return null;
        }
    }

    async saveGameInstance({fullID, game, newStatus, shortID}) {
        let params = {
            TableName : this.table,
            Item: {
                gameID: fullID,
                gameState: game.state,
                gameConfig: game.config,
                statusTime: this.getCurrTime()
            }
        };
        if (newStatus) {
            params.Item.gameStatus = newStatus;
        }
        if (shortID) {
            params.Item.shortID = shortID;
        }

        let retStatus = params.Item.statusTime;
        try {
            console.log("About to call put");
            console.log(params);
            const data = await this.docClient.put(params).promise();
            console.log(`Rcvd: ${data}`);

        } catch (error) {
            console.log(`Error: ${error}`)
            retStatus = -1;
        }

        return retStatus;
    }


    async updateGame(gameID, gameFunc) {
        let gameInst = await this.getGameInstance(gameID);

        if (!gameInst) {
            console.log(`No game found for ${gameID}`);
            return null;
        }

        gameFunc(gameInst);

        await this.saveGameInstance({fullID: gameID, game:gameInst});

        return true;


    }

    async registerPlayerInGame(gameID, player) {
        return await this.updateGame(gameID, gameInst => {
           gameInst.addPlayer(player);
        });
    }

    async updateMoves(gameID, turnID, moves) {
        return await this.updateGame(gameID, gameInst => {
            moves.forEach( move => {
                gameInst.setMove(move.turnID, move.playerID, move.stayNextMove );
            });
        });
    }



    genIDs() {
        let shortID = Math.floor(Math.random() * 899999 + 100000);
        let fullID = ""+Math.floor(Math.random() * 899999 + 100000);

        //todo verify ID uniqueness
        return {shortID, fullID};
    }

    getCurrTime() {
        return Math.floor(Date.now() / 1000);
    }

}

module.exports = {
    GameManager
}