'use strict';

var AWS = require('aws-sdk');

exports.pinPointSMS = (payload) => {

  // The Amazon Pinpoint project/application ID to use when you send this message.
  // Make sure that the SMS channel is enabled for the project or application
  // that you choose.
  const applicationId = process.env.PINPOINT_SMS_APP_ID;

  // The type of SMS message that you want to send. If you plan to send
  // time-sensitive content, specify TRANSACTIONAL. If you plan to send
  // marketing-related content, specify PROMOTIONAL.
  const messageType = "TRANSACTIONAL";

  // The registered keyword associated with the originating short code.
  const registeredKeyword = "myKeyword";

  //Create a new Pinpoint object.
  const pinpoint = new AWS.Pinpoint();

  // Specify the parameters to pass to the API.
  const params = {
    ApplicationId: applicationId,
    MessageRequest: {
      Addresses: {
        [payload.destinationNumber]: {
          ChannelType: 'SMS'
        }
      },
      MessageConfiguration: {
        SMSMessage: {
          Body: payload.message,
          Keyword: registeredKeyword,
          MessageType: messageType
        }
      }
    }
  };

  //Try to send the message.
  return pinpoint.sendMessages(params).promise();
}