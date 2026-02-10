// upload png to s3 bucket

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const fs = require('fs');
// const path = require('path');
// const { generatePDF } = require('./pdf/generatePDF');
// const { sendPDF } = require('./sendEmail');

AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
});

//check that aws is configured

const uploadFileToS3 = async (fileName, key, bucket) => {
  // Read content from the file
  const fileContent = fs.createReadStream(fileName);

  // Setting up S3 upload parameters
  const params = {
    Bucket: bucket,
    Key: key, // File name you want to save as in S3
    Body: fileContent
    // ACL: 'public-read'
  };

  // Uploading files to the bucket

  const url = await s3.upload(params, function(err, data) {
    if (err) {
      console.log('Error uploading file', err);
    }
    console.log(`File uploaded successfully. ${data.Location}`);
    return data.Location;
  }).promise();

  return url.Location;
}

module.exports = { uploadFileToS3 };