import { useState, useRef, useEffect } from 'react';
import './App.css';
import dayjs from 'dayjs';
import { TextField, Button, Stack, TextareaAutosize, MenuItem } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import SignatureCanvas from 'react-signature-canvas'



const LoadingScreen = () => {
  return (
    <div>
      <h1>Loading...</h1>
    </div>
  )
}

const SubmittedScreen = () => {
  return (
    <div>
      <h1>Form Submitted</h1>
    </div>
  )
}


const handleEmployeeChange = (e, id, employees, setFormData) => {
  e.preventDefault();
  const { name, value } = e.target;
  const newEmployees = employees.map((employee) => {
    if (employee.id === id) {
      return {
        ...employee,
        [name]: value,
      };
    }
    return employee;
  });
  setFormData((prevFormData) => ({
    ...prevFormData,
    employees: newEmployees,
  }));
};

const handleEmployeeTimeChange = (time, id, column, employees, setFormData) => {
  //convert time to string of form HH:MM AM/PM
  time = time.format('hh:mm A');
  const newEmployees = employees.map((employee) => {
    if (employee.id === id) {
      return {
        ...employee,
        [column]: time,
      };
    }
    return employee;
  });
  setFormData((prevFormData) => ({
    ...prevFormData,
    employees: newEmployees,
  }));
}

const handleEquipmentChange = (e, id, equipment, setFormData) => {
  e.preventDefault();
  const { name, value } = e.target;
  const newEquipment = equipment.map((equipment) => {
    if (equipment.id === id) {
      return {
        ...equipment,
        [name]: value,
      };
    }
    return equipment;
  });
  setFormData((prevFormData) => ({
    ...prevFormData,
    equipment: newEquipment,
  }));
}

const CustomTableCellText = ({ id, column, employees, setFormData, size, datalistId }) => {
  const width = size === 'small' ? '50px' : '200px'
  const employee = employees.find((employee) => employee.id === id);
  return (
    <TableCell>
      <TextField
        type="text"
        variant="outlined"
        color="secondary"
        name={column}
        value={employee[column]}
        onChange={(e) => handleEmployeeChange(e, employee.id, employees, setFormData)}
        fullWidth
        inputProps={datalistId ? { list: datalistId } : undefined}
        style={{ width }}
      />
    </TableCell>
  );
};

const CustomTableCellTime = ({ id, column, employees, setFormData }) => {
  const employee = employees.find((employee) => employee.id === id);
  return (
    <TableCell>
      {/* <TextField
        type="time"
        vairant="outlined"
        color="secondary"
        name={column}
        value={employee[column]}
        onChange={(e) => handleEmployeeChange(e, employee.id, employees, setFormData)}
        fullWidth
        style={{ width: '135px' }}
      /> */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <TimePicker
          label="time"
          value={employee[column]}
          color="secondary"
          onChange={(e) => handleEmployeeTimeChange(e, employee.id, column, employees, setFormData)}
          slotProps={{
            textField: {
              error: false,
              // make wider
              style: { width: '130px' }
            },
          }}
          // disable all minutes except 00, 15, 30, 45
          minutesStep={15}


          // renderInput={(params) => (
          //   <TextField
          //     {...params}
          //     variant="outlined"
          //     fullWidth
          //     style={{ width: '135px' }}
          //   />
          // )}
        />
      </LocalizationProvider>
    </TableCell>
  )
}

const addEmployee = (employees, setFormData) => {
  const newEmployees = [...employees];
  newEmployees.push({
    id: employees.length,
    name: "",
    startTime: "",
    endTime: "",
    flaggerInitials: "",
    clientInitials: "",
  });
  setFormData((prevFormData) => ({
    ...prevFormData,
    employees: newEmployees,
  }));
}

const removeEmployee = (employees, setFormData) => {
  const newEmployees = [...employees];
  newEmployees.pop();
  setFormData((prevFormData) => ({
    ...prevFormData,
    employees: newEmployees,
  }));
}

const addEquipment = (equipment, setFormData) => {
  const newEquipment = [...equipment];
  newEquipment.push({
    id: equipment.length,
    equipment: "",
    qty: "",
    dailyWeekly: "",
  });
  setFormData((prevFormData) => ({
    ...prevFormData,
    equipment: newEquipment,
  }));
}

const removeEquipment = (equipment, setFormData) => {
  if (equipment.length === 1) return;
  const newEquipment = [...equipment];
  newEquipment.pop();
  setFormData((prevFormData) => ({
    ...prevFormData,
    equipment: newEquipment,
  }));
}


const EmployeeTable = ({ employees, setFormData, nameDatalistId }) => {
  return (
    <>
      <Table className="table">
        {/* <caption>Employee Information</caption> */}
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>End Time</TableCell>
            <TableCell>Flagger Initials</TableCell>
              <TableCell>Client Initials</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* for each employee in employees create a row */}
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <CustomTableCellText id={employee.id} column="name" employees={employees} setFormData={setFormData} datalistId={nameDatalistId} />
              <CustomTableCellTime id={employee.id} column="startTime" employees={employees} setFormData={setFormData} />
              <CustomTableCellTime id={employee.id} column="endTime" employees={employees} setFormData={setFormData} />
              <CustomTableCellText id={employee.id} column="flaggerInitials" employees={employees} setFormData={setFormData} size="small" />
              <CustomTableCellText id={employee.id} column="clientInitials" employees={employees} setFormData={setFormData} size="small" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => addEmployee(employees, setFormData)}>Add Employee</Button>
        <Button onClick={() => removeEmployee(employees, setFormData)} style={{ marginLeft: '10px' }}>Remove Employee</Button>
      </div>
    </>
  )
}

const EquipmentRow = ({ equipment, allEquipment, setFormData }) => {
  return (
    <div className="content" style={{padding: "10px"}}>
      {/* <TextField
        type="text"
        vairant="outlined"
        color="secondary"
        label="EQUIPMENT NAME"
        name="equipment"
        value={equipment.equipment}
        onChange={(e) => handleEquipmentChange(e, equipment.id, allEquipment, setFormData)}
        fullWidth
      /> */}
      <TextField
        value={equipment.equipment}
        onChange={(e) => handleEquipmentChange(e, equipment.id, allEquipment, setFormData)}
        select
        label="EQUIPMENT NAME"
        inputProps={
          {
            name: 'equipment',
            id: 'equipment'
          }
        }
        className='dropdown'
      >
        <MenuItem value={'Arrow Board'}>Arrow Board</MenuItem>
        <MenuItem value={'Light Tower'}>Light Tower</MenuItem>
        <MenuItem value={'AFAD'}>AFAD</MenuItem>
        <MenuItem value={'Other'}>Other</MenuItem>
      </TextField>
      {equipment.equipment === 'Other' && <TextField
        type="text"
        vairant="outlined"
        color="secondary"
        label="Other Equipment"
        name="otherEquipment"
        value={equipment.otherEquipment}
        onChange={(e) => handleEquipmentChange(e, equipment.id, allEquipment, setFormData)}
        fullWidth
      />}
      <TextField
        value={equipment.qty}
        onChange={(e) => handleEquipmentChange(e, equipment.id, allEquipment, setFormData)}
        select
        label="QTY"
        inputProps={
          {
            name: 'qty',
            id: 'qty'
          }
        }
        className='dropdown'
      >
        {Array.from({ length: 20 }, (_, index) => {
          const qty = index + 1;
          return (
            <MenuItem key={qty} value={qty}>
              {qty}
            </MenuItem>
          );
        })}
      </TextField>
      {/* <TextField
              type="text"
              vairant="outlined"
              color="secondary"
              label="DAILY/WKLY"
              name="dailyWeekly"
              value={formData.dailyWeekly}
              onChange={handleInputChange}
              fullWidth
            /> */}
      <TextField
        value={equipment.dailyWeekly}
        onChange={(e) => handleEquipmentChange(e, equipment.id, allEquipment, setFormData)}
        select
        label="DAILY/WKLY"
        inputProps={
          {
            name: 'dailyWeekly',
            id: 'dailyWeekly'
          }
        }
        className='dropdown'
      >
        <MenuItem value={'Daily'}>Daily</MenuItem>
        <MenuItem value={'Weekly'}>Weekly</MenuItem>
      </TextField>
    </div>
  )
}


const AdminApp = () => {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newRecipient, setNewRecipient] = useState({ email: '', label: '', active: true });
  const [newEmployee, setNewEmployee] = useState({ name: '', company: '', role: '', active: true });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchWithAuth = (url, options = {}) =>
    fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {})
      }
    });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [recipientsRes, employeesRes] = await Promise.all([
        fetchWithAuth('/admin/recipients'),
        fetchWithAuth('/admin/employees')
      ]);

      if (recipientsRes.ok) {
        const data = await recipientsRes.json();
        setRecipients(Array.isArray(data) ? data : []);
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        setLoginError('Invalid password');
        return;
      }
      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setRecipients([]);
    setEmployees([]);
  };

  const updateRecipientField = (id, field, value) => {
    setRecipients((prev) =>
      prev.map((recipient) =>
        recipient.id === id ? { ...recipient, [field]: value } : recipient
      )
    );
  };

  const saveRecipient = async (recipient) => {
    await fetchWithAuth(`/admin/recipients/${recipient.id}`, {
      method: 'PUT',
      body: JSON.stringify(recipient)
    });
    loadAdminData();
  };

  const deleteRecipientRow = async (id) => {
    await fetchWithAuth(`/admin/recipients/${id}`, { method: 'DELETE' });
    loadAdminData();
  };

  const addRecipient = async () => {
    if (!newRecipient.email) return;
    await fetchWithAuth('/admin/recipients', {
      method: 'POST',
      body: JSON.stringify(newRecipient)
    });
    setNewRecipient({ email: '', label: '', active: true });
    loadAdminData();
  };

  const updateEmployeeField = (id, field, value) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === id ? { ...employee, [field]: value } : employee
      )
    );
  };

  const saveEmployee = async (employee) => {
    await fetchWithAuth(`/admin/employees/${employee.id}`, {
      method: 'PUT',
      body: JSON.stringify(employee)
    });
    loadAdminData();
  };

  const deleteEmployeeRow = async (id) => {
    await fetchWithAuth(`/admin/employees/${id}`, { method: 'DELETE' });
    loadAdminData();
  };

  const addEmployee = async () => {
    if (!newEmployee.name) return;
    await fetchWithAuth('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(newEmployee)
    });
    setNewEmployee({ name: '', company: '', role: '', active: true });
    loadAdminData();
  };

  if (!token) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Login</h1>
        </div>
        <form className="admin-section" onSubmit={handleLogin}>
          <TextField
            label="Admin Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
          />
          {loginError && <p className="admin-error">{loginError}</p>}
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin</h1>
        <Button variant="outlined" onClick={handleLogout}>Sign Out</Button>
      </div>

      <section className="admin-section">
        <div className="admin-section-header">
          <h2>Recipients</h2>
        </div>
        <div className="admin-row admin-row--form">
          <TextField
            label="Email"
            value={newRecipient.email}
            onChange={(event) => setNewRecipient({ ...newRecipient, email: event.target.value })}
          />
          <TextField
            label="Label"
            value={newRecipient.label}
            onChange={(event) => setNewRecipient({ ...newRecipient, label: event.target.value })}
          />
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={newRecipient.active}
              onChange={(event) => setNewRecipient({ ...newRecipient, active: event.target.checked })}
            />
            Active
          </label>
          <Button variant="contained" onClick={addRecipient}>Add</Button>
        </div>

        <div className="admin-list">
          {recipients.map((recipient) => (
            <div className="admin-row" key={recipient.id}>
              <TextField
                label="Email"
                value={recipient.email}
                onChange={(event) => updateRecipientField(recipient.id, 'email', event.target.value)}
              />
              <TextField
                label="Label"
                value={recipient.label || ''}
                onChange={(event) => updateRecipientField(recipient.id, 'label', event.target.value)}
              />
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(recipient.active)}
                  onChange={(event) => updateRecipientField(recipient.id, 'active', event.target.checked)}
                />
                Active
              </label>
              <div className="admin-actions">
                <Button variant="outlined" onClick={() => saveRecipient(recipient)}>Save</Button>
                <Button color="error" onClick={() => deleteRecipientRow(recipient.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header">
          <h2>Employees</h2>
        </div>
        <div className="admin-row admin-row--form">
          <TextField
            label="Name"
            value={newEmployee.name}
            onChange={(event) => setNewEmployee({ ...newEmployee, name: event.target.value })}
          />
          <TextField
            label="Company"
            value={newEmployee.company}
            onChange={(event) => setNewEmployee({ ...newEmployee, company: event.target.value })}
          />
          <TextField
            label="Role"
            value={newEmployee.role}
            onChange={(event) => setNewEmployee({ ...newEmployee, role: event.target.value })}
          />
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={newEmployee.active}
              onChange={(event) => setNewEmployee({ ...newEmployee, active: event.target.checked })}
            />
            Active
          </label>
          <Button variant="contained" onClick={addEmployee}>Add</Button>
        </div>

        <div className="admin-list">
          {employees.map((employee) => (
            <div className="admin-row" key={employee.id}>
              <TextField
                label="Name"
                value={employee.name}
                onChange={(event) => updateEmployeeField(employee.id, 'name', event.target.value)}
              />
              <TextField
                label="Company"
                value={employee.company || ''}
                onChange={(event) => updateEmployeeField(employee.id, 'company', event.target.value)}
              />
              <TextField
                label="Role"
                value={employee.role || ''}
                onChange={(event) => updateEmployeeField(employee.id, 'role', event.target.value)}
              />
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(employee.active)}
                  onChange={(event) => updateEmployeeField(employee.id, 'active', event.target.checked)}
                />
                Active
              </label>
              <div className="admin-actions">
                <Button variant="outlined" onClick={() => saveEmployee(employee)}>Save</Button>
                <Button color="error" onClick={() => deleteEmployeeRow(employee.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {loading && <p className="admin-status">Syncing...</p>}
    </div>
  );
};

const FormApp = () => {
  const clientSig = useRef();
  const supervisorSig = useRef();
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    teamLead: "",
    teamLeadNumber: "",
    streetAddress: "",
    cityAddress: "",
    date: "",
    day: "",
    license: "",
    job: "",
    maximo: "",
    clientCompany: "",
    otherClientCompany: "",
    equipment: [
      {
        id: 0,
        equipment: "",
        qty: "",
        dailyWeekly: "",
      }
    ],
    qty: "",
    dailyWeekly: "",
    employees: [
      {
        id: 0,
        name: "",
        startTime: "",
        endTime: "",
        flaggerInitials: "",
        clientInitials: "",
      },
      {
        id: 1,
        name: "",
        startTime: "",
        endTime: "",
        flaggerInitials: "",
        clientInitials: "",
      },
      {
        id: 2,
        name: "",
        startTime: "",
        endTime: "",
        flaggerInitials: "",
        clientInitials: "",
      }
    ],
    comment: "",
    clientName: "",
    supervisorName: "",
    clientSignature: null,
    supervisorSignature: null,
  });

  const [employeeDirectory, setEmployeeDirectory] = useState([]);
  const employeeNameListId = 'employee-name-list';

  useEffect(() => {
    let isMounted = true;
    const loadEmployees = async () => {
      try {
        const query = formData.clientCompany
          ? `?company=${encodeURIComponent(formData.clientCompany)}`
          : '';
        const response = await fetch(`/employees${query}`);
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted) {
          setEmployeeDirectory(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setEmployeeDirectory([]);
        }
      }
    };
    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, [formData.clientCompany]);



  // const

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true)
    // console.log(JSON.stringify(formData));
    // update state to have date be of the form MM-DD-YYYY
    const date = formData.date;
    const formattedDate = dayjs(date).format('MM-DD-YYYY');
    setFormData((prevFormData) => ({
      ...prevFormData,
      date: formattedDate,
      day: dayjs(date).format('dddd')
    }));
    // determine weekday from date
    // const day = dayjs(date).format('dddd');
    // setFormData((prevFormData) => ({
    //   ...prevFormData,
    //   day,
    // }));

    // send to local api at port 3001
    // fetch('https://7ctna56fk6.execute-api.us-east-1.amazonaws.com/prod/', {
    const apiBaseUrl =
      process.env.REACT_APP_API_BASE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://7ctna56fk6.execute-api.us-east-1.amazonaws.com/prod'
        : '');

    fetch(`${apiBaseUrl}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch((err) => console.log(err))
      .finally(() => {
        setLoading(false)
        setSubmitted(true)
      })
  };

  const handleSignatureEnd = (sigRef) => {
    const key = sigRef === clientSig ? 'clientSignature' : 'supervisorSignature'
    return () => {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [key]: sigRef.current.toDataURL()
      }))
    }
  }

  return (
    loading ? <LoadingScreen /> : submitted ? <SubmittedScreen /> :
    <form onSubmit={handleSubmit}>
      <header className="header">
        <h1>Flagging Billing / Information Sheet</h1>
        <p>Please complete all job info and billing hours.</p>
      </header>
      <main>
        {/* <div class="title">
          <h1>FLAGGING BILLING/INFORMATION SHEET</h1>
          <h3>*Please complete <i>ALL JOB</i> INFO</h3>
        </div> */}
        <div className="client-company">
          <TextField
            value={formData.clientCompany}
            onChange={handleInputChange}
            select
            label="Client Company"
            inputProps={
              {
                name: 'clientCompany',
                id: 'clientCompany'
              }
            }
            className='dropdown'
            required
          >
            <MenuItem value={'S.E.C.'}>S.E.C.</MenuItem>
            <MenuItem value={'Piedmont-Duke Energy'}>Piedmont-Duke Energy</MenuItem>
            <MenuItem value={'UCLS'}>UCLS</MenuItem>
            <MenuItem value={'Greensboro Building Services'}>Greensboro Building Services</MenuItem>
            <MenuItem value={'Windsor Commercial'}>Windsor Commercial</MenuItem>
            <MenuItem value={'MEARS'}>MEARS</MenuItem>
            <MenuItem value={'Other'}>Other</MenuItem>
          </TextField>
          {formData.clientCompany === 'Other' && <TextField
            type="text"
            vairant="outlined"
            color="secondary"
            label="Other Client Company"
            name="otherClientCompany"
            value={formData.otherClientCompany}
            onChange={handleInputChange}
            required
          />}
        </div>
        <section className="team-lead">
          <TextField
            type="text"
            vairant="outlined"
            color="secondary"
            label="Team Lead"
            name="teamLead"
            value={formData.teamLead}
            onChange={handleInputChange}
            fullWidth
            required
          />
          <TextField
            type="text"
            vairant="outlined"
            color="secondary"
            label="Team Lead Phone Number"
            name="teamLeadNumber"
            value={formData.teamLeadNumber}
            onChange={handleInputChange}
            fullWidth
            required
          />
        </section>
        <section className="sec">
          {/* <h3 class="section-title">S.E.C.</h3> */}
          <Stack spacing={2} direction="row" sx={{marginBottom: 4}}>
            <TextField
              type="text"
              vairant="outlined"
              color="secondary"
              label="Street Address"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              type="text"
              vairant="outlined"
              color="secondary"
              label="City"
              name="cityAddress"
              value={formData.cityAddress}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Stack>
          <Stack spacing={2} direction="row" sx={{marginBottom: 4}}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date Work Performed"
                value={formData.date}
                onChange={(newValue) => {
                  // convert newValue to string of form MM-DD-YYYY
                  newValue = newValue.format('MM-DD-YYYY');
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    date: newValue,
                    day: dayjs(newValue).format('dddd')
                  }));
                }
                }
                slotProps={{
                  textField: {
                    // size: "small",
                    error: false,
                  },
                }}
                // color="secondary"
              />
            </LocalizationProvider>
            {/* <label for="day">Day Work Performed:</label>
            <input type="text" id="day" name="day" required /><br /> */}
            <TextField
              type="text"
              vairant="outlined"
              color="secondary"
              label="Vehicle #"
              name="license"
              value={formData.license}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Stack>

          {formData.clientCompany != 'Windsor Commercial' && formData.clientCompany != 'MEARS' && (
           <Stack spacing={2} direction="row" sx={{marginBottom: 4}}>
            <TextField
              type="text"
              vairant="outlined"
              color="secondary"
              label="Job #"
              name="job"
              value={formData.job}
              onChange={handleInputChange}
              fullWidth
              required
            />

            <TextField
              type="text"
              vairant="outlined"
              color="secondary"
              label={formData.clientCompany === 'S.E.C.' ? "Maximo #" : "PO #"}
              name="maximo"
              value={formData.maximo}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Stack>
          )}
        </section>
        <section className="equipment">
          <h3 className="section-title">Additional Equipment Needed</h3>
          {formData.equipment.map((equipment) => (
            <EquipmentRow key={equipment.id} equipment={equipment} allEquipment={formData.equipment} setFormData={setFormData}/>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => addEquipment(formData.equipment, setFormData)}>Add Equipment</Button>
            <Button onClick={() => removeEquipment(formData.equipment, setFormData)} style={{ marginLeft: '10px' }}>Remove Equipment</Button>
          </div>
        </section>
        <datalist id={employeeNameListId}>
          {employeeDirectory.map((employee) => (
            <option key={employee.id} value={employee.name} />
          ))}
        </datalist>
        <section className="employees">
          <EmployeeTable employees={formData.employees} setFormData={setFormData} nameDatalistId={employeeNameListId} />
        </section>
        <section className="comments">
          <p>Comment(s):</p>
          <TextareaAutosize
            minRows={3}
            placeholder="Enter your comment here"
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            className="comment-box"
          />
        </section>
        <p id="notice"><strong>By signing below, you are agreeing to the above billing hours. Contact your immediate supervisor with any concerns.</strong></p>
        <section className="signatures">
          <div id="client">
            <TextField
              className="footerName"
              type="text"
              vairant="outlined"
              color="secondary"
              label="Foreman/Client Name"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <SignatureCanvas
              penColor='black'
              canvasProps={{ width: 350, height: 100, className: 'sigCanvas' }}
              ref={clientSig}
              onEnd={handleSignatureEnd(clientSig)}
            />
            <Button onClick={() => clientSig.current.clear()}>Clear Signature</Button>
          </div>
          <div id='supervisor'>
            <TextField
              className="footerName"
              type="text"
              vairant="outlined"
              color="secondary"
              label="Supervisor Name"
              name="supervisorName"
              value={formData.supervisorName}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <SignatureCanvas
              penColor='black'
              canvasProps={{ width: 350, height: 100, className: 'sigCanvas' }}
              ref={supervisorSig}
              onEnd={handleSignatureEnd(supervisorSig)}
            />
            <Button onClick={() => supervisorSig.current.clear()}>Clear Signature</Button>
          </div>
        </section>
        <section className="submit">
          <Button type="submit" variant="contained" color="primary">Submit Billing Sheet</Button>
        </section>
        {/* <img src="https://site-signatures.s3.amazonaws.com/clientSignature-1706470395478.png" width={125} height={50} /> */}
      </main>
    </form>
  );
}

const App = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  return isAdminRoute ? <AdminApp /> : <FormApp />;
}

export default App;
