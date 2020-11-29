'use strict';

module.exports.there = async (event,context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go CDK! Handler 2!',
      context: context,
      input: event
    }),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
