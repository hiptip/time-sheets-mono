const crypto = require('crypto');
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
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

const inferKeyFromTableName = (tableName, fallback) => {
  if (!tableName) return fallback;
  const lower = tableName.toLowerCase();
  if (lower.includes('recipient')) return 'recipient_id';
  if (lower.includes('employee')) return 'employee_id';
  return fallback;
};

const resolveTableKey = async (tableName, fallback) => {
  if (!tableName) return fallback;
  try {
    const response = await client.send(new DescribeTableCommand({ TableName: tableName }));
    const keySchema = response?.Table?.KeySchema || [];
    const hashKey = keySchema.find((key) => key.KeyType === 'HASH');
    if (hashKey?.AttributeName) {
      return hashKey.AttributeName;
    }
  } catch (error) {
    console.log('Error describing DynamoDB table for key schema', tableName, error);
  }
  return fallback;
};

let recipientsKeyPromise;
let employeesKeyPromise;

const getRecipientsKey = () => {
  if (!recipientsKeyPromise) {
    const fallback = process.env.RECIPIENTS_TABLE_KEY || 'id';
    const inferred = inferKeyFromTableName(recipientsTable, fallback);
    recipientsKeyPromise = resolveTableKey(recipientsTable, inferred);
  }
  return recipientsKeyPromise;
};

const getEmployeesKey = () => {
  if (!employeesKeyPromise) {
    const fallback = process.env.EMPLOYEES_TABLE_KEY || 'id';
    const inferred = inferKeyFromTableName(employeesTable, fallback);
    employeesKeyPromise = resolveTableKey(employeesTable, inferred);
  }
  return employeesKeyPromise;
};

const withIdAlias = (items, keyName) =>
  items.map((item) =>
    keyName === 'id'
      ? item
      : {
          ...item,
          id: item[keyName]
        }
  );

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
  const recipientsKey = await getRecipientsKey();
  const params = {
    TableName: recipientsTable,
    ...buildFilter({ activeOnly })
  };
  const items = await scanAll(params);
  const normalized = withIdAlias(items, recipientsKey);
  return normalized.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
};

const createRecipient = async ({ email, label, active = true }) => {
  const recipientsKey = await getRecipientsKey();
  const id = crypto.randomUUID();
  const item = {
    [recipientsKey]: id,
    email: email.trim(),
    label: label ? label.trim() : null,
    active: normalizeActive(active)
  };
  await doc.send(new PutCommand({ TableName: recipientsTable, Item: item }));
  return recipientsKey === 'id' ? item : { ...item, id };
};

const updateRecipient = async (id, { email, label, active }) => {
  const recipientsKey = await getRecipientsKey();
  const item = {
    [recipientsKey]: String(id),
    email: email.trim(),
    label: label ? label.trim() : null,
    active: normalizeActive(active)
  };
  await doc.send(new PutCommand({ TableName: recipientsTable, Item: item }));
  return recipientsKey === 'id' ? item : { ...item, id: String(id) };
};

const deleteRecipient = async (id) => {
  const recipientsKey = await getRecipientsKey();
  await doc.send(new DeleteCommand({ TableName: recipientsTable, Key: { [recipientsKey]: String(id) } }));
};

const getEmployees = async ({ activeOnly = false, company } = {}) => {
  const employeesKey = await getEmployeesKey();
  const params = {
    TableName: employeesTable,
    ...buildFilter({ activeOnly, company })
  };
  const items = await scanAll(params);
  const normalized = withIdAlias(items, employeesKey);
  return normalized.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

const createEmployee = async ({ name, company, role, active = true }) => {
  const employeesKey = await getEmployeesKey();
  const id = crypto.randomUUID();
  const item = {
    [employeesKey]: id,
    name: name.trim(),
    company: company ? company.trim() : null,
    role: role ? role.trim() : null,
    active: normalizeActive(active)
  };
  await doc.send(new PutCommand({ TableName: employeesTable, Item: item }));
  return employeesKey === 'id' ? item : { ...item, id };
};

const updateEmployee = async (id, { name, company, role, active }) => {
  const employeesKey = await getEmployeesKey();
  const item = {
    [employeesKey]: String(id),
    name: name.trim(),
    company: company ? company.trim() : null,
    role: role ? role.trim() : null,
    active: normalizeActive(active)
  };
  await doc.send(new PutCommand({ TableName: employeesTable, Item: item }));
  return employeesKey === 'id' ? item : { ...item, id: String(id) };
};

const deleteEmployee = async (id) => {
  const employeesKey = await getEmployeesKey();
  await doc.send(new DeleteCommand({ TableName: employeesTable, Key: { [employeesKey]: String(id) } }));
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
