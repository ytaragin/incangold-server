const cdk = require('@aws-cdk/core');
const lambda = require( '@aws-cdk/aws-lambda');
// const lambdanode = require( '@aws-cdk/aws-lambda-nodejs');
const apigw = require( '@aws-cdk/aws-apigateway');
const dynamodb = require('@aws-cdk/aws-dynamodb');

const iam = require('@aws-cdk/aws-iam');

const apigatewayv2 = require('@aws-cdk/aws-apigatewayv2');
const apigatewayv2int = require('@aws-cdk/aws-apigatewayv2-integrations');
const HttpApi =  apigatewayv2.HttpApi;
const HttpMethod = apigatewayv2.HttpMethod;
const WebSocketApi = apigatewayv2.WebSocketApi;
const WebSocketStage = apigatewayv2.WebSocketStage;
const LambdaProxyIntegration = apigatewayv2int.LambdaProxyIntegration;
const LambdaWebSocketIntegration = apigatewayv2int.LambdaWebSocketIntegration;



// const gwToLambda  = require( '@aws-solutions-constructs/aws-apigateway-lambda');

class IncangoldServerCdkStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    this.defaultLambdaProps = {
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 128,
      code: new lambda.AssetCode('incan.zip'),
      environment:  {
        SYSTEM_NAME: "mySystem",
        MOVES_TABLE: "movesTable",
        GAMES_TABLE: "gamesTable",
        CONN_TABLE: "connTable"
      },
      xxcode: lambda.Code.fromAsset('handlers', {
        exclude: ["package-lock.json", 
                  "package.json", 
                  "tests/**",
                  "other/**",
                  "node_modules/aws-cdk/**",
                  "node_modules/@aws-cdk/**"
                 ]
      }),  // code loaded from "handlers" directory
    };
    
    const serviceName = 'incan-gold';
  

    const httpapigw = new HttpApi(this, 'IncanGoldHttpApiGateway', {
      apiName: serviceName,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: ['*']
      }
    });

    this.createGameFuncs(httpapigw, this.defaultLambdaProps.environment.GAMES_TABLE);  
    this.createMoveFuncs(httpapigw, this.defaultLambdaProps.environment.MOVES_TABLE);
    this.createConnectFuncs(httpapigw, this.defaultLambdaProps.environment.CONN_TABLE);
  } 


  createConnectFuncs(httpapi, tableName) {
    const table = new dynamodb.Table(this, 'ConnectTable', {
      tableName: tableName,      
      partitionKey: { name: 'connID', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gameID', type: dynamodb.AttributeType.STRING }
    });

    table.addGlobalSecondaryIndex({
      indexName: 'ConnTableGameIDIndex',
      partitionKey: {name: 'gameID', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    const connect_handler = this.createlambdaFunctionHandler({
      name:`ConnectHandler`, 
      lambdaFunctionProps: {
        handler: 'handlers/conn.onConnect'
      },
      tables: [table]
    });

    const disconnect_handler = this.createlambdaFunctionHandler({
      name:`DisonnectHandler`, 
      lambdaFunctionProps: {
        handler: 'handlers/conn.onDisconnect'
      },
      tables: [table]
    });

    const webSocketApi = new WebSocketApi(this, 'MsgWebsocketApi', {
      connectRouteOptions: { integration: new LambdaWebSocketIntegration({ handler: connect_handler }) },
      disconnectRouteOptions: { integration: new LambdaWebSocketIntegration({ handler: disconnect_handler }) },
    });

    const apiStage = new WebSocketStage(this, 'DevStage', {
      webSocketApi,
      stageName: 'dev',
      autoDeploy: true,
    });

    const send_handler = this.createlambdaFunctionHandler({
      name:`SendMsgHandler`, 
      lambdaFunctionProps: {
        handler: 'handlers/conn.sendMessage'
      },
      tables: [table]
    });

    webSocketApi.addRoute('sendMessage', {
      integration: new LambdaWebSocketIntegration({
        handler: send_handler,
      }),
    });

    

    const connectionsArns = this.formatArn({
      service: 'execute-api',
      resourceName: `${apiStage.stageName}/POST/*`,
      resource: webSocketApi.apiId,
    });
    
    send_handler.addToRolePolicy(
      new iam.PolicyStatement({ actions: ['execute-api:ManageConnections'], resources: [connectionsArns] })
    );
  }

  createlambdaFunctionHandler({name, lambdaFunctionProps, tables}) {

    let lambdaprops = {
      ...this.defaultLambdaProps, 
      ...lambdaFunctionProps,
    };

    const new_handler = new lambda.Function(this, name, lambdaprops);


    if (tables !== undefined) {
      tables.forEach(table => {
        table.grantReadWriteData(new_handler);
      });
    }

    return new_handler;

  }

  createMoveFuncs(httpapi, tableName) {
    const table = new dynamodb.Table(this, 'MovesTable', {
      tableName: tableName,      
      partitionKey: { name: 'gameID', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'turnPerson', type: dynamodb.AttributeType.STRING }
    });

    this.createGWLambda(httpapi, {
      lambdaFunctionProps: {
        handler: 'handlers/move.post'
      },
      name: 'move_post',
      path: '/game/{gameid}/turn/{turnid}/player/{playerid}',
      //path: '/game/{id}',
      methods: [HttpMethod.POST],
      tables: [table]
    });

    this.createGWLambda(httpapi, {
      lambdaFunctionProps: {
        handler: 'handlers/move.movelist'
      },
      name: 'move_movelist',
      path: '/game/{gameid}/turn/{turnid}',
      //path: '/game/{id}',
      methods: [HttpMethod.GET],
      tables: [table]
    });


  }

  createGameFuncs(httpapi, tableName) {
    const table = new dynamodb.Table(this, 'GameTable', {
      tableName: tableName,      
      partitionKey: { name: 'gameID', type: dynamodb.AttributeType.STRING }//,
      //sortKey: { name: 'path', type: dynamodb.AttributeType.STRING }
    });


      this.createGWLambda(httpapi, {
        lambdaFunctionProps: {
          xxxentry: 'handlers/games.js',
          handler: 'handlers/games.get'
        },
        name: 'games_get',
        path: '/games',
        methods: [HttpMethod.GET, HttpMethod.OPTIONS],
        tables: [table]
      });
      this.createGWLambda(httpapi, {
        lambdaFunctionProps: {
          xxentry: 'handlers/handler.js',
          handler: 'handlers/handler.hello'
        },
        name: 'Hello',
        path: '/hello',
        methods: [HttpMethod.ANY],
        tables: [table]
      });
      this.createGWLambda(httpapi, {
        lambdaFunctionProps: {
          xxcode: 'handlers/game.js',
          handler: 'delete'
        },
        name: 'game_delete',
        path: '/game/{id}',
        methods: [HttpMethod.DELETE],
        tables: [table]
      });
      this.createGWLambda(httpapi, {
        lambdaFunctionProps: {
          xxcode: 'handlers/game.js',
          handler: 'handlers/game.post'
        },
        name: 'game_post',
        path: '/game',
        methods: [HttpMethod.POST],
        tables: [table]
      });
      this.createGWLambda(httpapi, {
        lambdaFunctionProps: {
          xxcode: 'handlers/game.js',
          handler: 'handlers/game.get'
        },
        name: 'game_get',
        path: '/game/{id}',
        methods: [HttpMethod.GET],
        tables: [table]
      });

      this.createGWLambda(httpapi, {
        lambdaFunctionProps: {
          xxcode: 'handlers/game.js',
          handler: 'handlers/game.addplayer'
        },
        name: 'game_addplayer',
        path: '/game/{gameid}/player',
        methods: [HttpMethod.POST],
        tables: [table]
      });

      
  }

  

  createGWLambda(httpapi, def) {
    //const new_handler = this.createlambdaFunctionHandler(def);

    let lambdaprops = {
      ...this.defaultLambdaProps, 
      ...def.lambdaFunctionProps,
    };

   //   const new_handler = new lambdanode.NodejsFunction(this, `${def.name}Handler`, lambdaprops);
    const new_handler = new lambda.Function(this, `${def.name}Handler`, lambdaprops);

    const new_integration = new LambdaProxyIntegration({
      handler: new_handler,
    });

    httpapi.addRoutes({
      integration: new_integration,
      methods: def.methods,
      path: def.path,

    });

    if (def.tables !== undefined) {
      def.tables.forEach(table => {
        table.grantReadWriteData(new_handler);
      });
    }

    return new_handler;
  }



otherstuff() {


    // The code that defines your stack goes here
    const games_get = new lambda.Function(this, 'GamesGetLambda', {
      runtime: runtime,    // execution environment
      code: lambda.Code.fromAsset('handlers'),  // code loaded from "handlers" directory
      handler: 'games.get',                // file is "games", function is "get"
      environment: {
        DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
        HITS_TABLE_NAME: table.tableName
      }
    });

    new apigwtolambda(this, 'GamesGetApiLambda', {
      lambdaFunctionProps: {
        runtime: runtime,    // execution environment
        code: lambda.Code.fromAsset('handlers'),  // code loaded from "handlers" directory
        handler: 'games.get',                // file is "games", function is "get"
        memorySize: 128
      }
    });

    new apigw.LambdaRestApi(this, 'GamesGet', {
      handler: games_get
    });

    const table = new dynamodb.Table(this, 'Hits', {
      partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING }
    });

    // grant the lambda role read/write permissions to our table
    table.grantReadWriteData(this.handler);

    props.downstream.grantInvoke(this.handler);

  
  }

}

module.exports = { IncangoldServerCdkStack }
