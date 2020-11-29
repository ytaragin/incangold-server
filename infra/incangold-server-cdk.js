#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { IncangoldServerCdkStack } = require('./incangold-server-cdk-stack');

const app = new cdk.App();
new IncangoldServerCdkStack(app, 'IncangoldServerCdkStack');
