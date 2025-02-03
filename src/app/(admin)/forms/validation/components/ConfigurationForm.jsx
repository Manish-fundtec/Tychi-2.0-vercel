'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Button, Col, Form, FormCheck, FormControl, FormGroup, FormLabel, FormSelect, InputGroup } from 'react-bootstrap';
import Feedback from 'react-bootstrap/esm/Feedback';
import InputGroupText from 'react-bootstrap/esm/InputGroupText';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import { serverSideFormValidate } from '@/helpers/data';
import ChoicesFormInput from '@/components/from/ChoicesFormInput';
const BrowserDefault = () => {
  return <ComponentContainerCard id="browser-defaults" title="Browser Default" description={<>Depending on your browser and OS, you’ll see a slightly different style of feedback.</>}>
      <form className="row g-3">
        <Col md={4}>
          <FormLabel htmlFor="validationDefault01">First name</FormLabel>
          <FormControl type="text" id="validationDefault01" defaultValue="Mark" required />
        </Col>
        <Col md={4}>
          <FormLabel htmlFor="validationDefault02">Last name</FormLabel>
          <FormControl type="text" id="validationDefault02" defaultValue="Otto" required />
        </Col>
        <Col md={4}>
          <FormLabel htmlFor="validationDefaultUsername">Username</FormLabel>
          <div className="input-group">
            <span className="input-group-text" id="inputGroupPrepend2">
              @
            </span>
            <FormControl type="text" id="validationDefaultUsername" aria-describedby="inputGroupPrepend2" required />
          </div>
        </Col>
        <Col md={6}>
          <FormLabel htmlFor="validationDefault03">City</FormLabel>
          <FormControl type="text" id="validationDefault03" required />
        </Col>
        <Col md={3}>
          <FormLabel htmlFor="validationDefault04">State</FormLabel>
          <FormSelect id="validationDefault04" required>
            <option disabled>Choose...</option>
            <option>...</option>
          </FormSelect>
        </Col>
        <Col md={3}>
          <FormLabel htmlFor="validationDefault05">Zip</FormLabel>
          <FormControl type="text" id="validationDefault05" required />
        </Col>
        <Col xs={12}>
          <FormCheck label="Agree to terms and conditions" id="term1" required />
        </Col>
        <Col xs={12}>
          <Button variant="primary" type="submit">
            Submit form
          </Button>
        </Col>
      </form>
    </ComponentContainerCard>;
};
const CustomStyles = () => {
  const [validated, setValidated] = useState(false);
  const handleSubmit = event => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    setValidated(true);
  };
  return <ComponentContainerCard id="custom-styles" title="Custom styles" description={<>
          For custom Bootstrap form validation messages, you’ll need to add the <code>novalidate</code> boolean attribute to your{' '}
          <code>&lt;form&gt;</code>. This disables the browser default feedback tooltips, but still provides access to the form validation APIs in
          JavaScript. When attempting to submit, you’ll see the <code>:invalid</code> and <code>:valid</code> styles applied to your form controls.
        </>}>
      <Form className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
        <FormGroup className="col-md-4">
          <FormLabel>First name</FormLabel>
          <FormControl type="text" id="validationCustom01" placeholder="First name" defaultValue="Mark" required />
          <Feedback>Looks good!</Feedback>
        </FormGroup>
        <FormGroup className="col-md-4">
          <FormLabel>Last name</FormLabel>
          <FormControl type="text" id="validationCustom02" placeholder="Last name" defaultValue="Otto" required />
          <Feedback>Looks good!</Feedback>
        </FormGroup>
        <FormGroup className="col-md-4">
          <FormLabel>Username</FormLabel>
          <InputGroup>
            <InputGroupText id="inputGroupPrepend">@</InputGroupText>
            <FormControl type="text" id="validationCustomUsername" placeholder="Username" required />
            <Feedback type="invalid">Please choose a username.</Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-6">
          <FormLabel>City</FormLabel>
          <FormControl type="text" id="validationCustom03" placeholder="City" required />
          <Feedback type="invalid">Please provide a valid city.</Feedback>
        </FormGroup>
        <FormGroup className="col-md-3">
          <FormLabel>State</FormLabel>
          <FormControl type="text" id="validationCustom04" placeholder="State" required />
          <Feedback type="invalid">Please provide a valid state.</Feedback>
        </FormGroup>
        <FormGroup className="col-md-3">
          <FormLabel>Zip</FormLabel>
          <FormControl type="text" id="validationCustom05" placeholder="Zip" required />
          <Feedback type="invalid">Please provide a valid zip.</Feedback>
        </FormGroup>
        <FormGroup className="col-12">
          <FormCheck id="invalidCheck" required label="Agree to terms and conditions" feedback="You must agree before submitting." feedbackType="invalid" />
        </FormGroup>
        <Col xs={12}>
          <Button variant="primary" type="submit">
            Submit form
          </Button>
        </Col>
      </Form>
    </ComponentContainerCard>;
};
const ServerSideValidation = () => {
  const [validated, setValidated] = useState(false);
  const [formErrors, setFormErrors] = useState([]);
  const [formValue, setFormValue] = useState({
    fName: 'Mark',
    lName: 'Otto',
    username: '',
    city: '',
    state: '',
    zip: ''
  });
  const handleChange = e => {
    setFormValue({
      ...formValue,
      [e.target.name]: e.target.value
    });
  };
  const isValidInput = name => {
    return !formErrors.find(key => key.name === name);
  };
  const handleSubmit = async event => {
    event.preventDefault();
    event.stopPropagation();
    setValidated(true);
    const validationReply = await serverSideFormValidate(formValue);
    const allErrors = [];
    validationReply?.inner?.forEach(e => {
      allErrors.push({
        name: e.path,
        message: e.message
      });
    });
    setFormErrors(allErrors);
  };
  return <ComponentContainerCard id="server-side" title="Server side" description={<>
          We recommend using client-side validation, but in case you require server-side validation, you can indicate invalid and valid form fields
          with <code>.is-invalid</code> and <code>.is-valid</code>. Note that <code>.invalid-feedback</code> is also supported with these classes.
        </>}>
      <Form className="row g-3" onSubmit={handleSubmit} noValidate>
        <FormGroup className="col-md-4" controlId="firstNameInput">
          <FormLabel>First name</FormLabel>
          <InputGroup hasValidation>
            <FormControl type="text" placeholder="First name" name="fName" isInvalid={!isValidInput('fName')} value={formValue.fName} className={clsx({
            'is-valid': validated && isValidInput('fName')
          })} onChange={handleChange} />
            <Feedback type={isValidInput('fName') ? 'valid' : 'invalid'}>
              {isValidInput('fName') ? 'Looks good!' : formErrors.find(err => err.name === 'fName')?.message}
            </Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-4">
          <FormLabel>Last name</FormLabel>
          <InputGroup hasValidation>
            <FormControl type="text" placeholder="Last name" name="lName" value={formValue.lName} onChange={handleChange} className={clsx({
            'is-valid': validated && isValidInput('lName')
          })} isInvalid={!isValidInput('lName')} />
            <Feedback type={isValidInput('lName') ? 'valid' : 'invalid'}>
              {isValidInput('lName') ? 'Looks good!' : formErrors.find(err => err.name === 'lName')?.message}
            </Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-4">
          <FormLabel>Username</FormLabel>
          <InputGroup>
            <InputGroup hasValidation>
              <InputGroupText>@</InputGroupText>
              <FormControl type="text" placeholder="Username" value={formValue.username} onChange={handleChange} name="username" className={clsx({
              'is-valid': validated && isValidInput('username')
            })} isInvalid={!isValidInput('username')} />
              <Feedback type={isValidInput('username') ? 'valid' : 'invalid'}>
                {isValidInput('username') ? 'Looks good!' : formErrors.find(err => err.name === 'username')?.message}
              </Feedback>
            </InputGroup>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-6">
          <FormLabel>City</FormLabel>
          <InputGroup hasValidation>
            <FormControl type="text" placeholder="City" name="city" value={formValue.city} onChange={handleChange} className={clsx({
            'is-valid': validated && isValidInput('city')
          })} isInvalid={!isValidInput('city')} />
            <Feedback type={isValidInput('city') ? 'valid' : 'invalid'}>
              {isValidInput('city') ? 'Looks good!' : formErrors.find(err => err.name === 'city')?.message}
            </Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-3">
          <FormLabel>State</FormLabel>
          <InputGroup hasValidation>
            <FormControl type="text" name="state" placeholder="State" value={formValue.state} onChange={handleChange} className={clsx({
            'is-valid': validated && isValidInput('state')
          })} isInvalid={!isValidInput('state')} />
            <Feedback type={isValidInput('state') ? 'valid' : 'invalid'}>
              {isValidInput('state') ? 'Looks good!' : formErrors.find(err => err.name === 'state')?.message}
            </Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-3">
          <FormLabel>Zip</FormLabel>
          <FormControl type="text" placeholder="Zip" name="zip" value={formValue.zip} onChange={handleChange} className={clsx({
          'is-valid': validated && isValidInput('zip')
        })} isInvalid={!isValidInput('zip')} />
          <Feedback type={isValidInput('zip') ? 'valid' : 'invalid'}>
            {isValidInput('zip') ? 'Looks good!' : formErrors.find(err => err.name === 'zip')?.message}
          </Feedback>
        </FormGroup>
        <FormGroup className="col-12">
          <FormCheck type="checkbox" label="Agree to terms and conditions" />
        </FormGroup>
        <Col xs={12}>
          <Button variant="primary" type="submit">
            Submit form
          </Button>
        </Col>
      </Form>
    </ComponentContainerCard>;
};
export const Tooltips = () => {
  const [validated, setValidated] = useState(false);
  const handleSubmit = event => {
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }
    setValidated(true);
  };
  return (
      <Form className="row g-5 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
        <FormGroup className="position-relative col-md-6 ">
        <FormLabel>Symbol name</FormLabel>
          <ChoicesFormInput options={{
            shouldSort: false
            }}>
            <option value="Madrid">Madrid</option>
            <option value="Toronto">Toronto</option>
            <option value="Vancouver">Vancouver</option>
            <option value="London">London</option>
            <option value="Manchester">Manchester</option>
            <option value="Liverpool">Liverpool</option>
            <option value="Paris">Paris</option>
            <option value="Malaga">Malaga</option>
            <option value="Washington" disabled>
              Washington
            </option>
            <option value="Lyon">Lyon</option>
            <option value="Marseille">Marseille</option>
            <option value="Hamburg">Hamburg</option>
            <option value="Munich">Munich</option>
            <option value="Barcelona">Barcelona</option>
            <option value="Berlin">Berlin</option>
            <option value="Montreal">Montreal</option>
            <option value="New York">New York</option>
            <option value="Michigan">Michigan</option>
          </ChoicesFormInput>
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter first name.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-6 ">
          <FormLabel>Date</FormLabel>
          <FormControl type="date" required />
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter last name.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-3 mt-3">
          <FormLabel>Commission</FormLabel>
          <FormControl type="text" placeholder="Commission" required />
          <Feedback type="invalid" tooltip>
            Please provide a valid city.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-3 mt-3">
          <FormLabel>Price</FormLabel>
          <FormControl type="text" placeholder="Price" required />
          <Feedback type="invalid" tooltip>
            Please provide a valid city.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-3 mt-3">
          <FormLabel>Quantity</FormLabel>
          <FormControl type="text" placeholder="Quantity" required />
          <Feedback type="invalid"  tooltip>
            Please provide a valid city.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-3 mt-3">
          <FormLabel>Amount</FormLabel>
          <FormControl type="text" placeholder="Amount" required />
          <Feedback type="invalid" tooltip>
            Please provide a valid city.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-6 mt-4">
        <FormLabel>Brokers</FormLabel>
          <ChoicesFormInput options={{
            shouldSort: false
            }}>
            <option value="Madrid">Madrid</option>
            <option value="Toronto">Toronto</option>
            <option value="Vancouver">Vancouver</option>
            <option value="London">London</option>
            <option value="Manchester">Manchester</option>
            <option value="Liverpool">Liverpool</option>
            <option value="Paris">Paris</option>
            <option value="Malaga">Malaga</option>
            <option value="Washington" disabled>
              Washington
            </option>
            <option value="Lyon">Lyon</option>
            <option value="Marseille">Marseille</option>
            <option value="Hamburg">Hamburg</option>
            <option value="Munich">Munich</option>
            <option value="Barcelona">Barcelona</option>
            <option value="Berlin">Berlin</option>
            <option value="Montreal">Montreal</option>
            <option value="New York">New York</option>
            <option value="Michigan">Michigan</option>
          </ChoicesFormInput>
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter first name.
          </Feedback>
        </FormGroup>

        <FormGroup className="position-relative col-md-6 mt-4">
          <FormLabel>Description</FormLabel>
          <FormControl type="text" placeholder="Description" required />
          <Feedback type="invalid" tooltip>
            Please provide a valid state.
          </Feedback>
        </FormGroup>
        <Col xs={12}>
          <Button variant="primary" type="submit">
            Submit form
          </Button>
        </Col>
      </Form>
  );
};

export const BasicForm = () => {
    const [validated, setValidated] = useState(false);
    const handleSubmit = event => {
      const form = event.currentTarget;
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      setValidated(true);
    };
    return (
        <Form className="row g-5 needs-validation m-3 " noValidate validated={validated} onSubmit={handleSubmit}>
          <FormGroup className="position-relative col-md-3 mt-3 ">
          <FormLabel>Fund Name</FormLabel>
          <ChoicesFormInput options={{
            shouldSort: false
            }}>
            <option value="Madrid">Active</option>
            <option value="Toronto">InActive</option>
            
          </ChoicesFormInput>
            <Feedback tooltip>Looks good!</Feedback>
            <Feedback type="invalid" tooltip>
              Please enter first name.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-3 ">
            <FormLabel>Fund ID </FormLabel>
            <FormControl type="text" placeholder="Fund ID" required />
            <Feedback tooltip>Looks good!</Feedback>
            <Feedback type="invalid" tooltip>
              Please enter last name.
            </Feedback>
          </FormGroup>
          
          <FormGroup className="position-relative col-md-3 mt-3">
            <FormLabel>Address</FormLabel>
            <FormControl type="text" placeholder="Price" required />
            <Feedback type="invalid" tooltip>
              Please provide a valid city.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-3">
            <FormLabel>Incorporation Date</FormLabel>
            <FormControl type="date" placeholder="Quantity" required />
            <Feedback type="invalid"  tooltip>
              Please provide a valid city.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-3">
            <FormLabel>Reporting Start Date</FormLabel>
            <FormControl type="date" placeholder="Amount" required />
            <Feedback type="invalid" tooltip>
              Please provide a valid city.
            </Feedback>
          </FormGroup>
  
          <FormGroup className="position-relative col-md-3 mt-4">
            <FormLabel>Financial Year Ends On </FormLabel>
            <ChoicesFormInput options={{
            removeItemButton: true,
            searchEnabled: false
            }}>
                <option value="Zero">March</option>
                <option value="One">June</option>
                <option value="Two">September</option>
                <option value="Three">December</option>
            </ChoicesFormInput>
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-4">
            <FormLabel>Reporting Frequency</FormLabel>
            <ChoicesFormInput options={{
            removeItemButton: true,
            searchEnabled: false
            }}>
                <option value="Zero">Monthly</option>
                <option value="One">Quaterly</option>
            </ChoicesFormInput>
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-4">
            <FormLabel>Reporting Currency</FormLabel>
            <ChoicesFormInput options={{
            removeItemButton: true,
            searchEnabled: false
            }}>
                <option value="USD">US Dollar - $</option>
                <option value="EUR">Euro - €</option>
                <option value="GBP">British Pound - £</option>
                <option value="JPY">Japanese Yen - ¥</option>
                <option value="AUD">Australian Dollar - A$</option>
                <option value="CAD">Canadian Dollar - C$</option>
                <option value="CHF">Swiss Franc - Fr</option>
                <option value="CNY">Chinese Yuan - ¥</option>
                <option value="INR">Indian Rupee - ₹</option>
                <option value="MXN">Mexican Peso - MX$</option>
            </ChoicesFormInput>
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-4">
            <FormLabel>Decimal Precision</FormLabel>
            <ChoicesFormInput options={{
            removeItemButton: true,
            searchEnabled: false
            }}>
                <option value="Zero">1 - 0.0</option>
                <option value="One">2 - 0.00</option>
                <option value="Two">3 - 0.000</option>
                <option value="Three">4 - 0.0000</option>
                <option value="Four">5 - 0.00000</option>
                <option value="Five">6 - 0.000000</option>
                <option value="Six">7 - 0.0000000</option>
                <option value="Seven">8 - 0.00000000</option>
                <option value="Eight">9 - 0.000000000</option>
                <option value="Nine">10 - 0.0000000000</option>
            </ChoicesFormInput>
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-4">
            <FormLabel>Contribution Timing</FormLabel>
            <ChoicesFormInput options={{
            removeItemButton: true,
            searchEnabled: false
            }}>
                <option value="Zero">Opening</option>
                <option value="One">Closing</option>
            </ChoicesFormInput>
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-4">
            <FormLabel>Withdraw Timing</FormLabel>
            <ChoicesFormInput options={{
            removeItemButton: true,
            searchEnabled: false
            }}>
                <option value="Zero">Opening</option>
                <option value="One">Closing</option>
            </ChoicesFormInput>
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-4">
            <FormLabel>Reinvestement Timing</FormLabel>
            <ChoicesFormInput options={{
            removeItemButton: true,
            searchEnabled: false
            }}>
                <option value="Zero">Opening</option>
                <option value="One">Closing</option>
            </ChoicesFormInput>
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-4">
            <FormLabel>Commission Accounting Method</FormLabel>
            <ChoicesFormInput options={{
            removeItemButton: true,
            searchEnabled: false
            }}>
                <option value="Zero">Expense</option>
                <option value="One">Capitalize</option>
            </ChoicesFormInput>
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-3 mt-4">
            <FormLabel>Withdrawals(Befor/After P&L)</FormLabel>
            <ChoicesFormInput options={{
            removeItemButton: true,
            searchEnabled: false
            }}>
                <option value="Zero">Before Net P&L</option>
                <option value="One">After Net P&L</option>
            </ChoicesFormInput>
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-4 ">
            <FormLabel className="ml-3 ">Reporting Component</FormLabel>
            <FormCheck type="radio" name="" label="Mtd" id="flexRadioDefault1" inline />
            <FormCheck type="radio" name="" label="Qtd" id="flexRadioDefault2" inline />
            <FormCheck type="radio" name="" label="Ytd" id="flexRadioDefault3" inline />
            <FormCheck type="radio" name="" label="Itd" id="flexRadioDefault4" inline />
            <Feedback type="invalid" tooltip>
              Please provide a valid state.
            </Feedback>
          </FormGroup>
          <Col xs={12}>
            <Button variant="primary" type="submit">
              Submit form
            </Button>
          </Col>
        </Form>
    );
  };

  
export const BrokerForm = () => {
    const [validated, setValidated] = useState(false);
    const handleSubmit = event => {
      const form = event.currentTarget;
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      setValidated(true);
    };
    return (
        <Form className="row g-5 needs-validation m-1 " noValidate validated={validated} onSubmit={handleSubmit}>
          <FormGroup className="position-relative col-md-6 mt-3">
          <FormLabel>Broker Name</FormLabel>
          <FormControl type="text" placeholder="Enter Broker Name" required />
            <Feedback tooltip>Looks good!</Feedback>
            <Feedback type="invalid" tooltip>
              Please enter first name.
            </Feedback>
          </FormGroup>
          
          <FormGroup className="position-relative col-md-6 mt-3 ">
            <FormLabel>Start Date</FormLabel>
            <FormControl type="date" placeholder="Quantity" required />
            <Feedback type="invalid"  tooltip>
              Please provide a valid city.
            </Feedback>
          </FormGroup>
          <Col sm={12}>
            <Button variant="primary" type="submit" >
              Submit form
            </Button>
          </Col>
        </Form>
    );
};
export const BankForm = () => {
    const [validated, setValidated] = useState(false);
    const handleSubmit = event => {
      const form = event.currentTarget;
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      setValidated(true);
    };
    return (
        <Form className="row g-5 needs-validation m-1 " noValidate validated={validated} onSubmit={handleSubmit}>
          <FormGroup className="position-relative col-md-6 mt-3">
          <FormLabel>Bank Id</FormLabel>
          <FormControl type="text" placeholder="Enter Bank Id" required />
            <Feedback tooltip>Looks good!</Feedback>
            <Feedback type="invalid" tooltip>
              Please enter first id.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-6 mt-3">
          <FormLabel>Broker Name</FormLabel>
          <FormControl type="text" placeholder="Enter Bank Name" required />
            <Feedback tooltip>Looks good!</Feedback>
            <Feedback type="invalid" tooltip>
              Please enter first name.
            </Feedback>
          </FormGroup>
          
          <FormGroup className="position-relative col-md-6 mt-3 ">
            <FormLabel>Start Date</FormLabel>
            <FormControl type="date" placeholder="Quantity" required />
            <Feedback type="invalid"  tooltip>
              Please provide a valid city.
            </Feedback>
          </FormGroup>
          <Col sm={12}>
            <Button variant="primary" type="submit" >
              Submit form
            </Button>
          </Col>
        </Form>
    );
}; 
export const ExchangeForm = () => {
    const [validated, setValidated] = useState(false);
    const handleSubmit = event => {
      const form = event.currentTarget;
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      setValidated(true);
    };
    return (
        <Form className="row g-5 needs-validation m-1 " noValidate validated={validated} onSubmit={handleSubmit}>
          <FormGroup className="position-relative col-md-6 mt-3">
          <FormLabel>Exchange ID</FormLabel>
          <FormControl type="text" placeholder="Enter Exchange Id" required />
            <Feedback tooltip>Looks good!</Feedback>
            <Feedback type="invalid" tooltip>
              Please enter first name.
            </Feedback>
          </FormGroup>
          <FormGroup className="position-relative col-md-6 mt-3">
          <FormLabel>Exchange Name</FormLabel>
          <FormControl type="text" placeholder="Enter Exchange Name" required />
            <Feedback tooltip>Looks good!</Feedback>
            <Feedback type="invalid" tooltip>
              Please enter first name.
            </Feedback>
          </FormGroup>
          
          <Col sm={12}>
            <Button variant="primary" type="submit" >
              Submit form
            </Button>
          </Col>
        </Form>
    );
}; 
export const SymbolForm = () => {
  const [validated, setValidated] = useState(false);
  const handleSubmit = event => {
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }
    setValidated(true);
  };
  return (
      <Form className="row g-5 needs-validation m-1 " noValidate validated={validated} onSubmit={handleSubmit}>
        <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>Symbol</FormLabel>
        <FormControl type="text" placeholder="Enter Symbol" required />
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter first name.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>Symbol Name</FormLabel>
        <FormControl type="text" placeholder="Enter Symbol Name" required />
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter first name.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>Asset Type</FormLabel>
        <ChoicesFormInput options={{
            shouldSort: false
            }}>
            <option value="Madrid">Active</option>
            <option value="Toronto">InActive</option>
            
          </ChoicesFormInput>
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter first name.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>ISIN </FormLabel>
        <FormControl type="text" placeholder="Enter ISIN " required />
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter first name.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>CUSIP Number</FormLabel>
        <FormControl type="text" placeholder="Enter CUSIP Number" required />
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter first name.
          </Feedback>
        </FormGroup>
        
        <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>Exhange</FormLabel>
        <ChoicesFormInput options={{
            shouldSort: false
            }}>
            <option value="Madrid">Active</option>
            <option value="Toronto">InActive</option>
            
          </ChoicesFormInput>
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter first name.
          </Feedback>
        </FormGroup>
        <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>Contarct Size</FormLabel>
        <FormControl type="text" placeholder="Contarct Size" required />
          <Feedback tooltip>Looks good!</Feedback>
          <Feedback type="invalid" tooltip>
            Please enter first name.
          </Feedback>
        </FormGroup>
       
        <Col sm={12}>
          <Button variant="primary" type="submit" >
            Submit form
          </Button>
        </Col>
      </Form>
  );
}; 


const AllFormValidation = () => {
  return <>
      <BrowserDefault />

      <CustomStyles />

      <ServerSideValidation />

      <SymbolForm />

      <ExchangeForm />

      <BrokerForm />

      <BankForm />

      <Tooltips />

      <BasicForm />
    </>;
};
export default AllFormValidation;
