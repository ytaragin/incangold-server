//const AWS = require('aws-sdk');

//AWS.config.update({region: 'us-east-1'});

//const apigatewaymanagementapi = new awsProvider.ApiGatewayManagementApi({apiVersion: '2018-11-29'});
//const DDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});





class ConnectionManager {
    constructor({tableName, docClient , apiGW}) {
        console.log("ConnectionManager created");
        this.table = tableName;
        this.docClient = docClient;
        this.apiGW = apiGW;

       // apigatewaymanagementapi.config.update({});
        console.log("ConnectionManager Initialized")

    }

    async sendMessageToAll(msg) {
        let connectionData;

        console.log(`Will send: ${msg}`);
        try {
            connectionData = await this.docClient.scan({ TableName: this.table, ProjectionExpression: 'connId' }).promise();
        } catch (e) {
            console.log(`Error getting connections: ${e}`);
            return { statusCode: 500, body: e.stack };
        }

        console.log(`Query returned:`);
        console.log(connectionData);

        const postCalls = connectionData.Items.map(async ({ connId }) => this.postMessage(connId, msg));

        try {
            await Promise.all(postCalls);
        } catch (e) {
            return { statusCode: 500, body: e.stack };
        }

        return { statusCode: 200, body: 'Data sent.' };

    };


    async sendMessageToGame(gameID, msg) {

        let games = this.getConnsForGame(gameID);

        const postCalls = games.map(async ({ g }) => this.postMessage(g.connID, msg));

        try {
            await Promise.all(postCalls);
        } catch (e) {
            return { statusCode: 500, body: e.stack };
        }

        return { statusCode: 200, body: 'Data sent.' };

    };

    async postMessage(ConnectionId, Data) {
        try {
            console.log(`Sending: ${Data} to ${ConnectionId}`)
            await this.apiGW.postToConnection({ ConnectionId, Data}).promise();
        } catch (e) {
            if (e.statusCode === 410) {
                console.log(`Found stale connection, deleting ${ConnectionId}`);
                this.disconnectConnection(ConnectionId);
            } else {
                throw e;
            }
        }
    }

    async addConnection(connID, gameID, playerID) {
        let p = {
            TableName: this.table,
            Item: {
                connID,
                gameID,
                playerID
            }
        };


        try {

            let r = this.docClient.put(p);
            let prom  = r.promise();
            let res = await prom;
            console.log(`Connection: ${connID} for ${playerID}  in game ${gameID} created: `);

            return true;
        }
        catch (err) {
            console.log("Error adding connection");
            console.log(err);
            return false;
        }
    };

    async disconnectConnection(connID) {
        const params = {
            TableName: this.table,
            Key: {
                connID
            }
        };
        console.log(`Attempting to delete: ${connID} from ${this.table}`);

        try {

            await this.docClient.delete(params).promise();
            console.log(`Connection: ${connID} deleted`);
            return true;
        }
        catch (err) {
            console.log("Error deleting connection")
            console.log(err);
            return false;
        }

    };


    async getConnsForGame(gameID) {
        let params = {
            TableName: this.table,
            IndexName: "gameIDIndex",
            ExpressionAttributeValues: {
                ':g': gameID
            },
            KeyConditionExpression: 'gameID = :g ',
            ProjectionExpression: 'connID, gameID, playerID'
        };


        try {
            let data =  await this.docClient.query(params).promise();
            console.log(data);
            return data.Items;
        }  catch (error) {
            console.log(error);
            return null;
        }

    }

}


module.exports = {ConnectionManager};
