import PageTitle from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { getAllReview } from '@/helpers/data'
import Image from 'next/image'
import Link from 'next/link'
import ComponentContainerCard from '@/components/ComponentContainerCard'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Col,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  Modal,
} from 'react-bootstrap'
import { AddFundModal } from '@/app/(admin)/base-ui/modals/components/AllModals'

const ReviewsPage = async () => {
  const reviewData = await getAllReview()

  return (
   
    <ComponentContainerCard id="static-backdrop" >
    <PageTitle title="Fundadmin" subName="Tychi" />

      {/* Button to trigger the modal */}

      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <CardTitle as={'h4'}>Fundadmin</CardTitle>
              <Dropdown>
               <AddFundModal/>
              </Dropdown>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <table className="table align-middle text-nowrap table-hover table-centered border-bottom mb-0">
                  <thead className="bg-light-subtle"></thead>
                  <tbody></tbody>
                </table>
              </div>
            </CardBody>
            <CardFooter>
              <nav aria-label="Page navigation example">
                <ul className="pagination justify-content-end mb-0">
                  <li className="page-item">
                    <Link className="page-link" href="">
                      Previous
                    </Link>
                  </li>
                  <li className="page-item active">
                    <Link className="page-link" href="">
                      1
                    </Link>
                  </li>
                  <li className="page-item">
                    <Link className="page-link" href="">
                      2
                    </Link>
                  </li>
                  <li className="page-item">
                    <Link className="page-link" href="">
                      3
                    </Link>
                  </li>
                  <li className="page-item">
                    <Link className="page-link" href="">
                      Next
                    </Link>
                  </li>
                </ul>
              </nav>
            </CardFooter>
          </Card>
        </Col>
      </Row>

    </ComponentContainerCard>

  )
}
export default ReviewsPage
