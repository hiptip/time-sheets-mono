require('dotenv').config();
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

var bodyParser = require('body-parser')
const app = express();

const { generatePDF } = require('./pdf/generatePDF');
const { sendPDF } = require('./sendEmail');
const fs = require('fs');
const fsp = fs.promises;
const { uploadFileToS3 } = require('./uploadFileToS3');
const crypto = require('crypto');
const {
  getRecipients,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('./store');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cors());

const adminPassword = process.env.ADMIN_PASSWORD;
const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET;
const adminTokenTtlSeconds = Number(process.env.ADMIN_TOKEN_TTL_SECONDS || 12 * 60 * 60);

const base64UrlEncode = (input) =>
  Buffer.from(JSON.stringify(input))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const base64UrlDecode = (input) => {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = padded.length % 4 ? 4 - (padded.length % 4) : 0;
  const normalized = padded + '='.repeat(padLength);
  return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
};

const signToken = (payload) => {
  if (!adminTokenSecret) {
    throw new Error('ADMIN_TOKEN_SECRET is not configured');
  }
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', adminTokenSecret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
};

const verifyToken = (token) => {
  if (!adminTokenSecret) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', adminTokenSecret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (signature !== expectedSignature) return null;
  const payload = base64UrlDecode(encodedPayload);
  if (!payload.exp || Date.now() / 1000 > payload.exp) return null;
  return payload;
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.headers['x-admin-token'];
};

const requireAdmin = (req, res, next) => {
  if (!adminPassword) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }
  if (!adminTokenSecret) {
    return res.status(500).json({ error: 'Admin token secret not configured' });
  }
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing admin token' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  return next();
};

app.use((req, res, next) => {
  console.log('Time: ', Date.now());
  next();
});

app.use('/request-type', (req, res, next) => {
  console.log('Request type: ', req.method);
  next();
});

// add app.get
app.get('/', (req, res) => {
  console.log(req.query);
  res.send('Hello World!');
});

// Admin auth
app.post('/admin/login', (req, res) => {
  if (!adminPassword) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }
  if (!adminTokenSecret) {
    return res.status(500).json({ error: 'Admin token secret not configured' });
  }
  const { password } = req.body || {};
  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const exp = Math.floor(Date.now() / 1000) + adminTokenTtlSeconds;
  const token = signToken({ sub: 'admin', exp });
  return res.json({ token, expiresIn: adminTokenTtlSeconds });
});

// Admin recipients
app.get('/admin/recipients', requireAdmin, async (req, res) => {
  try {
    const recipients = await getRecipients();
    return res.json(recipients);
  } catch (error) {
    console.log('Error fetching recipients', error);
    return res.status(500).json({ error: 'Failed to load recipients' });
  }
});

app.post('/admin/recipients', requireAdmin, async (req, res) => {
  const { email, label, active } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const recipient = await createRecipient({ email, label, active });
    return res.status(201).json(recipient);
  } catch (error) {
    console.log('Error creating recipient', error);
    return res.status(500).json({ error: 'Failed to create recipient' });
  }
});

app.put('/admin/recipients/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { email, label, active } = req.body || {};
  if (!id || !email) {
    return res.status(400).json({ error: 'Valid id and email are required' });
  }
  try {
    const recipient = await updateRecipient(id, { email, label, active });
    return res.json(recipient);
  } catch (error) {
    console.log('Error updating recipient', error);
    return res.status(500).json({ error: 'Failed to update recipient' });
  }
});

app.delete('/admin/recipients/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: 'Valid id is required' });
  }
  try {
    await deleteRecipient(id);
    return res.status(204).end();
  } catch (error) {
    console.log('Error deleting recipient', error);
    return res.status(500).json({ error: 'Failed to delete recipient' });
  }
});

// Admin employees
app.get('/admin/employees', requireAdmin, async (req, res) => {
  try {
    const employees = await getEmployees();
    return res.json(employees);
  } catch (error) {
    console.log('Error fetching employees', error);
    return res.status(500).json({ error: 'Failed to load employees' });
  }
});

app.post('/admin/employees', requireAdmin, async (req, res) => {
  const { name, company, role, active } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const employee = await createEmployee({ name, company, role, active });
    return res.status(201).json(employee);
  } catch (error) {
    console.log('Error creating employee', error);
    return res.status(500).json({ error: 'Failed to create employee' });
  }
});

app.put('/admin/employees/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { name, company, role, active } = req.body || {};
  if (!id || !name) {
    return res.status(400).json({ error: 'Valid id and name are required' });
  }
  try {
    const employee = await updateEmployee(id, { name, company, role, active });
    return res.json(employee);
  } catch (error) {
    console.log('Error updating employee', error);
    return res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.delete('/admin/employees/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: 'Valid id is required' });
  }
  try {
    await deleteEmployee(id);
    return res.status(204).end();
  } catch (error) {
    console.log('Error deleting employee', error);
    return res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Public employees list
app.get('/employees', async (req, res) => {
  const company = req.query.company ? String(req.query.company) : undefined;
  try {
    const employees = await getEmployees({ activeOnly: true, company });
    return res.json(employees);
  } catch (error) {
    console.log('Error fetching employees', error);
    return res.status(500).json({ error: 'Failed to load employees' });
  }
});

// add app.post
app.post('/process', async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.clientSignature || !payload.supervisorSignature) {
      return res.status(400).json({ error: 'Missing signatures' });
    }

    const clientSignatureKey = `clientSignature-${Date.now()}.png`;
    const supervisorSignatureKey = `supervisorSignature-${Date.now()}.png`;
    const clientSignaturePath = `/tmp/${clientSignatureKey}`;
    const supervisorSignaturePath = `/tmp/${supervisorSignatureKey}`;

    const base64clientSignature = payload.clientSignature.replace(/^data:image\/png;base64,/, '');
    const base64supervisorSignature = payload.supervisorSignature.replace(/^data:image\/png;base64,/, '');

    await fsp.writeFile(clientSignaturePath, base64clientSignature, 'base64');
    await fsp.writeFile(supervisorSignaturePath, base64supervisorSignature, 'base64');

    const clientSignatureUrl = await uploadFileToS3(clientSignaturePath, clientSignatureKey, 'site-signatures');
    const supervisorSignatureUrl = await uploadFileToS3(
      supervisorSignaturePath,
      supervisorSignatureKey,
      'site-signatures'
    );

    payload.clientSignature = `<img src="${clientSignatureUrl}" />`;
    payload.supervisorSignature = `<img src="${supervisorSignatureUrl}" />`;

    const clientCompany = payload.clientCompany ? payload.clientCompany : 'S.E.C.';
    let template;
    if (clientCompany === 'MEARS') {
      template = 'receiptTemplateMEARS.docx';
    } else if (clientCompany === 'Windsor Commercial' || clientCompany === 'Smith & Jennings') {
      template = 'receiptTemplateNoJob.docx';
    } else {
      template = 'receiptTemplate.docx';
    }

    const receiptPath = `/tmp/receipt-${Date.now()}.json`;
    await fsp.writeFile(receiptPath, JSON.stringify(payload));
    await generatePDF(receiptPath, template);

    const teamLead = payload.teamLead;
    await sendPDF(teamLead);

    return res.json({ ok: true });
  } catch (error) {
    console.log('Error processing request', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

const port = process.env.PORT || 3001;

const handler = serverless(app);

app.listen(port, () => console.log(`API is listening on port ${port}.`));

module.exports.handler = (event, context, callback) => {
  const response = handler(event, context, callback);
  return response;
}
