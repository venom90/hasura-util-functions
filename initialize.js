// Load Env from .env file
require('dotenv').config();

// util
const { breakLog, currentDateNTime, exitProcess, showInfo, showError, showWarnings } = require('./lib/util');

// Initiate with current timestamp
showInfo(`${currentDateNTime()} Initiating...\n\n`);

// Stacks
const errorStack = [];
const warningStack = [];

// Check required env variables
if (!process.env.HASURA_URL) { errorStack.push('Missing env variable: HASURA_URL'); }
if (!process.env.HASURA_ADMIN_SECRET) { errorStack.push('Missing env variable: HASURA_ADMIN_SECRET'); }
if (!process.env.AWS_ACCESS_KEY_ID) { errorStack.push('Missing env variable: AWS_ACCESS_KEY_ID'); }
if (!process.env.AWS_SECRET_ACCESS_KEY) { errorStack.push('Missing env variable: AWS_SECRET_ACCESS_KEY'); }
if (!process.env.S3_BUCKET_NAME) { errorStack.push('Missing env variable: S3_BUCKET_NAME'); }


// IF initErrors THEN
if (errorStack.length > 0) {
  // Error messages from the stack
  showInfo('Encountered errors while initiating the application! Following are the list of errors.\n\n')
  for (let i = 0; i < errorStack.length; i++) {
    showError(errorStack[i]);
  }
  breakLog();
  showInfo('Please fix above errors to start the application\n\n');
  exitProcess();
} else {
  showInfo('Successfully Initiated.\n');
}

// IF initWarnings THEN
if (warningStack.length > 0) {
  for (let i = 0; i < warningStack.length; i++) {
    showWarnings(warningStack[i]);
  }
  breakLog();
}