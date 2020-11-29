
const AWS = require('aws-sdk');

//const DDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});
//const DDBDOC = new AWS.DynamoDB.DocumentClient();

//const apigatewaymanagementapi = new aws.ApiGatewayManagementApi({apiVersion: '2018-11-29'});
AWS.config.update({ region: process.env.AWS_REGION });
const ConnManager = require('../lib/connection_manager');
console.log(`Starting`);



function genConnMgr(event, tableName) {
    let apiGW = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    let docClient = new AWS.DynamoDB.DocumentClient();

    return new ConnManager.ConnectionManager({ tableName, docClient, apiGW});


}


module.exports.onConnect = async (event, context) => {
    console.log("New Connect Event:");
    console.log(event);
    console.log("Context:");
    console.log(context);

    let CM =genConnMgr(event, process.env.CONN_TABLE);


    let ret;
    let res = await CM.addConnection(event.requestContext.connectionId, "G1", "P1" );
    if (res) {
        ret =  {
            statusCode: 200,
            body: "Connected"
        };
    }
    else {
        ret  = {
            statusCode: 200,
            body: "Connected"
        };
    }

    return ret;

};

module.exports.onDisconnect = async (event, context) => {
    console.log("New Connect Event:")
    console.log(event);
    console.log("Context:");
    console.log(context);
    let CM =genConnMgr(event, process.env.CONN_TABLE);

    let ret;
    let res = await CM.disconnectConnection(event.requestContext.connectionId );
    if (res) {
        ret =  {
            statusCode: 200,
            body: "Connected"
        };
    }
    else {
        ret  = {
            statusCode: 200,
            body: "Connected"
        };
    }

    return ret;
}



module.exports.sendMessage = async (event, context) => {

    console.log("Send Message Event:")
    console.log(event);
    console.log("Context:");
    console.log(context);
    let CM =genConnMgr(event, process.env.CONN_TABLE);


    return (await CM.sendMessageToAll(JSON.parse(event.body).data));

};



