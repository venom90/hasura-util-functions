const AWS = require('aws-sdk');
const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });
const util = require('../lib/util');

const s3Client = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const uploadParams = {
  Bucket: process.env.S3_BUCKET_NAME,
  Key: '', // pass key
  Body: null, // pass file body
};

module.exports = app => {
  /**
   * @description Upload to file to S3 and insert file meta information into Hasura
   * @author Tirumal Rao
   */
  app.post('/upload', upload.single("file"), async (req, res) => {
    const { name, base64str } = req.body.input;
    const userid = req.body.session_variables['x-hasura-user-id'];

    if (!userid) return res.json({message: 'Please login to upload the file'});

    let fileBuffer = Buffer.from(base64str, 'base64');

    let fileName = `${userid}-${decodeURIComponent(name).toLowerCase()}`;
    fileName = fileName.replace(/ /g, '-').replace('---', '-');

    const params = uploadParams;

    uploadParams.Key = fileName;
    uploadParams.Body = fileBuffer;
    

    try {
      // Upload the file S3
      s3Client.upload(params, async (err, data) => {
        if (err) {
          return res.status(500).json({ error: "Error -> " + err });
        }

        // insert into hasura db
        const HASURA_MUTATION = `
          mutation ($file_path: String!, $userid: String!) {
            insert_files_one(object: {
              file_path: $file_path
              userid: $userid
            }) {
              id
            }
          }
        `;
        const variables = {
          file_path: data.Location,
          userid
        };

        const { errors, data: fetch_data } = await util.executeGraphQL(HASURA_MUTATION, variables, 'POST');

        const file_id = fetch_data.insert_files_one && fetch_data.insert_files_one.id
        
        const payload = {
          message: 'File uploaded successfully',
          filename: fileName,
          file_path: data.Location,
          userid,
          file_id
        }
        
        // if Hasura operation errors, then throw error
        if (errors) {
          return res.json({
            message: errors[0].message,
            filename: '',
            file_path: '',
            userid
          })
        } else {
          // success
          return res.json({
            message: 'File uploaded successfully',
            filename: fileName,
            file_path: data.Location,
            userid,
            file_id
          });
        }
      });
    } catch ({ message }) {
      res.status(200).send({ message });
    }
  });
};