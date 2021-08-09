//This code was posted for an article at https://codingislove.com/send-sms-developers/

const axios = require("axios");

const tlClient = axios.create({
  baseURL: "https://api.textlocal.in/",
  params: {
    apiKey: process.env.TEXT_LOCAL_API, //Text local api key
    sender: "AEREMF"
  }
});

const smsClient = {
  sendVerificationMessage: user => {
    if (user && user.phone) {
      const params = new URLSearchParams();
      params.append("numbers", [parseInt("91" + user.phone)]);
      params.append(
        "message",
        `You verification code for Aerem is ${user.verifyCode}`
      );
      tlClient.post("/send", params);
    }
  }
};

module.exports = smsClient;

// Now import the client in any other file or wherever required and run these functions
// const smsClient = require("./smsClient");
// smsClient.sendVerificationMessage(user)