require('dotenv').config();
const e = require('cors');
const { generatePDF } = require('./pdf/generatePDF');
const { sendPDF } = require('./sendEmail');
const { uploadFileToS3 } = require('./uploadFileToS3');
const fs = require('fs');
const fsp = require('fs').promises;

module.exports.handler = async (event, context, callback) => {
  console.log(event)
  console.log(event.body)
  console.log(context)

  // Save event.clientSignature to a file called clientSignature.png

  if (event.clientSignature) {

    const base64clientSignature = event.clientSignature.replace(/^data:image\/png;base64,/, "");

    await fsp.writeFile('/tmp/clientSignature.png', base64clientSignature, 'base64', (err) => {
      if (err) throw err;
      console.log('clientSignature saved to clientSignature.png');
    })

    const clientSignatureKey = `clientSignature-${Date.now()}.png`;

    await uploadFileToS3('/tmp/clientSignature.png', clientSignatureKey, 'site-signatures')
      .then((clientSignatureUrl) => {
        console.log('clientSignature.png uploaded to S3 bucket');
        console.log('clientSignatureUrl', clientSignatureUrl);
        const imgTag = `<img src="${clientSignatureUrl}" />`;
        event.clientSignature = imgTag;
      }
      )
      .catch(err => {
        console.log('Error uploading clientSignature.png to S3 bucket', err);
      }
      );
  }

  if (event.supervisorSignature) {


    const base64supervisorSignature = event.supervisorSignature.replace(/^data:image\/png;base64,/, "");

    // Save event.supervisorSignature to a file called supervisorSignature.png
    await fsp.writeFile('/tmp/supervisorSignature.png', base64supervisorSignature, 'base64', (err) => {
      if (err) throw err;
      console.log('supervisorSignature saved to supervisorSignature.png');
    })

    const supervisorSignatureKey = `supervisorSignature-${Date.now()}.png`;

    await uploadFileToS3('/tmp/supervisorSignature.png', supervisorSignatureKey, 'site-signatures')
      .then((supervisorSignatureUrl) => {
        console.log('supervisorSignature.png uploaded to S3 bucket');
        const imgTag = `<img src="${supervisorSignatureUrl}" />`;
        event.supervisorSignature = imgTag;
      }
      )
      .catch(err => {
        console.log('Error uploading supervisorSignature.png to S3 bucket', err);
      }
      );

    }



  console.log('event.body', event.body)

  clientCompany = event.clientCompany ? event.clientCompany : 'S.E.C.';
  console.log('clientCompany', clientCompany);
  if (clientCompany === 'MEARS') {
    template = 'receiptTemplateMEARS.docx';
  } else if (clientCompany === 'Windsor Commercial' || clientCompany === 'Smith & Jennings') {
    template = 'receiptTemplateNoJob.docx';
  } else {
    template = 'receiptTemplate.docx';
  }

  // create a unique filename for receipt.json
  const uniqueFileName = `/tmp/receipt-${Date.now()}.json`;``

  

  // Save event.body to a file called receipt.json
  fs.writeFile(uniqueFileName, JSON.stringify(event), (err) => {
    if (err) throw err;
    console.log('Receipt saved to receipt.json');
    generatePDF(uniqueFileName, template = 'receiptTemplate.docx')
    .then(() => {
      console.log('PDF generated');
      // await Send the PDF
      // get teamLead from event
      const teamLead = event.teamLead;
      console.log('event', event)
      console.log('teamLead', teamLead);
      sendPDF(teamLead)
        // .then(() => {
        //   console.log('PDF sent');
        // })
        // .catch(err => {
        //   console.log('Error sending PDF', err);
        // });
    })
    .catch(err => {
      console.log('Error generating PDF', err);
    });
  });

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello World!',
      input: event,
    }),
    headers: {
      'Access-Control-Allow-Headers' : 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      "Access-Control-Allow-Credentials": true,
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    },
  };

  callback(null, response);
}
