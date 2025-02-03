'use client';

import mastercard from '@/assets/images/card/mastercard.svg';
import chip from '@/assets/images/chip.png';
import contactlessImg from '@/assets/images/contactless-payment.png';
import avatar1 from '@/assets/images/users/avatar-2.jpg';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { currency } from '@/context/constants';
import { getAllTransaction } from '@/helpers/data';
import { useFetchData } from '@/hooks/useFetchData';
import { NavPills } from './ConfigurationTab';
// import { NavPills } from '@/app/(admin)/base-ui/tabs/components/AllNavTabs';
import useToggle from '@/hooks/useToggle';
import Image from 'next/image';
import Link from 'next/link';
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