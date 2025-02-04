'use client';

import { getAllTransaction } from '@/helpers/data';
import { useFetchData } from '@/hooks/useFetchData';
import { NavPills } from './ConfigurationTab';
// import { NavPills } from '@/app/(admin)/base-ui/tabs/components/AllNavTabs';
import useToggle from '@/hooks/useToggle';
import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Modal, ModalBody, Row } from 'react-bootstrap';
const ConfigurationsData = () => {
  const ConfigurationsData = useFetchData(getAllTransaction);
  const {
    isTrue,
    toggle
  } = useToggle();
  return <>
      <Row>
        <Col xl={12}>
          <Card>
            <CardBody className="p-0 pt-2">
            <NavPills />
            </CardBody>
            <CardFooter>
            </CardFooter>
          </Card>
        </Col>
      </Row>
     
    </>;
};
export default ConfigurationsData;