

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

module.exports = app => {
  /**
   * @description Generate OTP using AWS SNS
   * @author Tirumal Rao
   */
  app.post('/generateOTP', async (req, res) => {
    const { mobile } = req.body.input;
    const userid = req.body.session_variables['x-hasura-user-id'];
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
};