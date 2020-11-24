import React, { useCallback, useState, useEffect, FormEvent } from 'react';
import Tabs from '@material-ui/core/Tabs';
import Switch from '@material-ui/core/Switch';
import Tab from '@material-ui/core/Tab';
import Table from '@material-ui/core/Table';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import TextField from '@material-ui/core/TextField';
import { Link } from 'react-router-dom';
import { useAllowlistService, useAdminService } from '../contexts';
import { PrimaryButton } from '../components/shared/RoundedButton';
import PhoneNumberMasks from '../components/shared/PhoneNumberMask';
import { ApiValidationError } from '../services/apiClient';
import useAdminRoute from '../util/useAdminRoute';
import PATHS from './paths';
import { formatSecondsWithHours } from '../util/timeFormatters';
import { SceneProps } from './types';

function AllowlistTabContent() {
  const [allowlistState, allowlistService] = useAllowlistService();
  const { allowlistEntries = [] } = allowlistState;
  const [newAllowlistPhoneNumber, setNewAllowlistPhoneNumber] = useState('');
  const [
    newAllowlistMultiplePhoneNumbers,
    setNewAllowlistMultiplePhoneNumbers,
  ] = useState('');
  const [useMultipleNumbers, setUseMultipleNumbers] = useState(false);
  const [newAllowlistCountry, setNewAllowlistCountry] = useState('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  useEffect(() => {
    if (allowlistService) {
      (allowlistService as any).refreshAllowlistEntries();
    }
  }, [allowlistService]);

  const createAllowlistEntry = async (newNumber: string) => {
    try {
      await (allowlistService as any).createAllowlistEntry({
        phoneNumber: `+65${newNumber}`,
        destinationCountry: newAllowlistCountry,
      });
    } catch (error) {
      let errorMessage;
      if (error instanceof ApiValidationError) {
        errorMessage = error.code;
      } else {
        errorMessage = error.message;
      }
      setErrorMessages([...errorMessages, errorMessage]);
      console.error(`Failed to create entry for ${newNumber}`);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Modify the array in-place because createAllowlistEntry has a closure over the actual errorMessages instance. This can be handled more elegantly by returning the error type, but that's too much effort for now.
    errorMessages.splice(0, errorMessages.length);

    if (useMultipleNumbers) {
      const newNumbers = newAllowlistMultiplePhoneNumbers.split('\n');
      const newAllowListRequests = newNumbers.map(createAllowlistEntry);
      return Promise.all(newAllowListRequests);
    }

    return createAllowlistEntry(newAllowlistPhoneNumber);
  };

  const deleteAllowlistEntry = async (id: number) => {
    await (allowlistService as any).deleteAllowlistEntry(id);
  };

  const handlePhoneNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (useMultipleNumbers) {
      setNewAllowlistMultiplePhoneNumbers(event.target.value);
    } else {
      setNewAllowlistPhoneNumber(event.target.value);
    }
  };

  const newEntryForm = (
    <form
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px',
      }}
      onSubmit={onSubmit}
    >
      {useMultipleNumbers ? (
        <TextField
          style={{
            marginBottom: '12px',
            background: 'white',
          }}
          multiline
          variant="outlined"
          label="Phone numbers"
          value={newAllowlistMultiplePhoneNumbers}
          onChange={handlePhoneNumberChange}
        />
      ) : (
        <TextField
          style={{
            marginBottom: '12px',
            background: 'white',
          }}
          variant="outlined"
          label="Phone number"
          value={newAllowlistPhoneNumber}
          onChange={handlePhoneNumberChange}
          InputProps={{
            inputComponent: PhoneNumberMasks.SG as any,
          }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <InputLabel id="allowlist-country-label">Country</InputLabel>
        <Select
          style={{ background: 'white' }}
          labelId="allowlist-country-label"
          onChange={(e: React.ChangeEvent<any>) =>
            setNewAllowlistCountry(e.target.value)
          }
        >
          <MenuItem value="BD">BD</MenuItem>
          <MenuItem value="SG">SG</MenuItem>
        </Select>
      </div>
      <PrimaryButton type="submit" value="submit">
        Add entry
      </PrimaryButton>
    </form>
  );

  return (
    <>
      <Typography variant="h5" component="h2">
        Allowlist
      </Typography>
      <Typography variant="body2" component="h3">
        New entry
      </Typography>
      <Switch
        name="useMultipleNumbers"
        checked={useMultipleNumbers}
        onChange={() => setUseMultipleNumbers(!useMultipleNumbers)}
      />
      {errorMessages.map((errorMessage) => (
        <Typography key={errorMessage} variant="body1" color="error">
          {errorMessage}
        </Typography>
      ))}
      {newEntryForm}
      <Typography variant="body2" component="h3">
        Current entries
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Phone number</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allowlistEntries.map((allowlistEntry: any) => (
              <TableRow key={allowlistEntry.phoneNumber}>
                <TableCell>
                  <Typography variant="body2">
                    {allowlistEntry.phoneNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {allowlistEntry.destinationCountry}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => deleteAllowlistEntry(allowlistEntry.id)}
                    role="button"
                  >
                    <CloseIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function UserTabContent() {
  const [adminState, adminService] = useAdminService();
  const { users = [] } = adminState;

  useEffect(() => {
    if (adminService) {
      (adminService as any).getUsers();
    }
  }, [adminService]);

  return (
    <>
      <Typography variant="h5" component="h2">
        Users
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Call Time Balance</TableCell>
              <TableCell>Transaction history</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.phoneNumber}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.phoneNumber}</TableCell>
                <TableCell>{user.destinationCountry}</TableCell>
                <TableCell>{formatSecondsWithHours(user.callTime)}</TableCell>
                <TableCell>
                  <Link to={`${PATHS.TRANSACTIONS}?user=${user.id}`}>
                    Transaction history
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function TabPanel({
  value,
  index,
  children,
}: {
  value: number;
  index: number;
  children: JSX.Element;
}) {
  if (value !== index) {
    return null;
  }
  return children;
}

export default function AdminPage({ locale, routePath }: SceneProps) {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = useCallback(
    (_event, newValue) => {
      setTabIndex(newValue);
    },
    [setTabIndex]
  );

  const adminRedirect = useAdminRoute();
  if (adminRedirect) {
    return adminRedirect;
  }

  return (
    <>
      <Tabs value={tabIndex} onChange={handleTabChange}>
        <Tab label="Users" />
        <Tab label="Allowlist" />
      </Tabs>
      <TabPanel value={tabIndex} index={0}>
        <UserTabContent />
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <AllowlistTabContent />
      </TabPanel>
    </>
  );
}
