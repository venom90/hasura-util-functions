

const otpGenerator = require('otp-generator')
const smsutil = require('../lib/pinpointsms')
const util = require('../lib/util')

const INSERT_OTP = `
  mutation MyMutation($code: String!, $id: uuid) {
    insert_otp(objects: {code: $code, user: $id}) {
      returning {
        code
        id
      }
    }
  }
`;

const GET_OTP = `
  query GetOTP($code: String!, $user: uuid) {
    otp(where: {code: {_eq: $code}, user: {_eq: $user}}) {
      id
    }
  }
`;

const DEL_OTP = `
  mutation DELETE_OTP($code: String!, $user: uuid) {
    delete_otp(where: {code: {_eq: $code}, user: {_eq: $user}}) {
      affected_rows
    }
  }
`;

module.exports = app => {
  /**
   * @description Generate OTP using AWS SNS
   * @author Tirumal Rao
   */
  app.post('/otp/generate', async (req, res) => {
    const { mobile } = req.body.input;
    const userid = req.body.session_variables['x-hasura-user-id'] || '0e14f43a-12a7-49cc-995d-b1e891eb2cf0';
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
      alphabets: false,
      digits: true
    });

    try {
      // Send SMS
      const sms = await smsutil.pinPointSMS({
        destinationNumber: mobile,
        message: `Your OTP to verify Aerem acccount is ${otp}`
      })

      if (sms?.$response?.error) {
        return res.status(200).send({ otp: '', error: true, message: sms?.$response?.error || 'Service error' })
      }

      const variables = {
        code: otp
      }

      if (userid)
        variables['id'] = userid

      // Store OTP in Hasura DB
      const { errors, data } = await util.executeGraphQL(INSERT_OTP, variables, 'POST');

      if (errors && Array.isArray(errors) && errors.length > 1 && errors[0].message) {
        return res.status(200).send({ error: true, message: errors[0].message, otp: ''})
      }

      if (data?.insert_otp?.returning[0].id) {
        return res.status(200).send({ error: false, otp, message: '' })
      } else {
        return res.status(200).send({ error: true, otp: '', message: 'Error while inserting otp' })
      }
    } catch (err) {
      res.status(200).send({ error: true, otp: '', message: err?.message || 'otp error'})
    }
  })

  app.post('/otp/verify', async (req, res) => {
    const { code } = req.body.input;
    const user = req.body.session_variables['x-hasura-user-id'] || '0e14f43a-12a7-49cc-995d-b1e891eb2cf0';

    // Variables
    const variables = {
      code,
      user
    }

    // Check if provided OTP is presend in DB
    const { errors, data } = await util.executeGraphQL(GET_OTP, variables, 'POST');

    // Query Errors
    if (errors && Array.isArray(errors) && errors.length > 1 && errors[0].message) {
      return res.status(200).send({ verified: false, message: errors[0].message, error: true })
    }

    // Check if it's correct
    if (data?.otp[0]?.id) { 
      // Delete OTP from db
      await util.executeGraphQL(DEL_OTP, variables, 'POST');

      // Send response back
      res.send({
        verified: true,
        error: false,
        message: ''
      })
    } else {
      return res.status(200).send({ verified: false, message: 'Invalid OTP', error: true })
    }

  });
};