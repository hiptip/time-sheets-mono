const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');

const region = process.env.AWS_REGION || 'us-east-1';
const recipientsTable = process.env.RECIPIENTS_TABLE_NAME;
const employeesTable = process.env.EMPLOYEES_TABLE_NAME;

if (!recipientsTable || !employeesTable) {
  throw new Error('RECIPIENTS_TABLE_NAME and EMPLOYEES_TABLE_NAME must be set when DATA_STORE=dynamodb');
}

const credentials =
  process.env.MY_AWS_ACCESS_KEY_ID && process.env.MY_AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
      }
    : undefined;

const client = new DynamoDBClient({ region, credentials });
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

const normalizeActive = (value) => (value === undefined ? true : Boolean(value));

const scanAll = async (params) => {
  let items = [];
  let lastKey;
  do {
    const response = await doc.send(new ScanCommand({ ...params, ExclusiveStartKey: lastKey }));
    items = items.concat(response.Items || []);
    lastKey = response.LastEvaluatedKey;
  } while (lastKey);
  return items;
};

const buildFilter = ({ activeOnly, company }) => {
  const expressions = [];
  const names = {};
  const values = {};

  if (activeOnly) {
    expressions.push('#active = :active');
    names['#active'] = 'active';
    values[':active'] = true;
  }

  if (company) {
    expressions.push('#company = :company');
    names['#company'] = 'company';
    values[':company'] = company;
  }

  if (!expressions.length) {
    return {};
  }

  return {
    FilterExpression: expressions.join(' AND '),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values
  };
};

const getRecipients = async (activeOnly = false) => {
  const params = {
    TableName: recipientsTable,
    ...buildFilter({ activeOnly })
  };
  const items = await scanAll(params);
  return items.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
};

const createRecipient = async ({ email, label, active = true }) => {
  const item = {
    id: crypto.randomUUID(),
    email: email.trim(),
    label: label ? label.trim() : null,
    active: normalizeActive(active)
  };
  await doc.send(new PutCommand({ TableName: recipientsTable, Item: item }));
  return item;
};

const updateRecipient = async (id, { email, label, active }) => {
  const item = {
    id: String(id),
    email: email.trim(),
    label: label ? label.trim() : null,
    active: normalizeActive(active)
  };
  await doc.send(new PutCommand({ TableName: recipientsTable, Item: item }));
  return item;
};

const deleteRecipient = async (id) => {
  await doc.send(new DeleteCommand({ TableName: recipientsTable, Key: { id: String(id) } }));
};

const getEmployees = async ({ activeOnly = false, company } = {}) => {
  const params = {
    TableName: employeesTable,
    ...buildFilter({ activeOnly, company })
  };
  const items = await scanAll(params);
  return items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

const createEmployee = async ({ name, company, role, active = true }) => {
  const item = {
    id: crypto.randomUUID(),
    name: name.trim(),
    company: company ? company.trim() : null,
    role: role ? role.trim() : null,
    active: normalizeActive(active)
  };
  await doc.send(new PutCommand({ TableName: employeesTable, Item: item }));
  return item;
};

const updateEmployee = async (id, { name, company, role, active }) => {
  const item = {
    id: String(id),
    name: name.trim(),
    company: company ? company.trim() : null,
    role: role ? role.trim() : null,
    active: normalizeActive(active)
  };
  await doc.send(new PutCommand({ TableName: employeesTable, Item: item }));
  return item;
};

const deleteEmployee = async (id) => {
  await doc.send(new DeleteCommand({ TableName: employeesTable, Key: { id: String(id) } }));
};

module.exports = {
  getRecipients,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
