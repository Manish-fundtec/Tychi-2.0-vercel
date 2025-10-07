// import IconifyIcon from '@/components/wrappers/IconifyIcon';
// import Link from 'next/link';
// import { BrokerModal, SymbolModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
// import { GLEntryModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
// import { BankModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
// import { ExchangeModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
// import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
// import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from 'react-bootstrap';
// import { BrokerageTableColDefs ,bankTableColDefs, exchangeTableColDefs, assetTypeColDefs, symbolColDefs} from "@/assets/tychiData/columnDefs"
// import TradesData from '@/app/(admin)/mapping/component/mapData';
// import { getBrokers, deleteBroker } from '@/lib/api/broker';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { BasicForm } from "@/app/(admin)/forms/validation/components/ConfigurationForm";
import  BrokerageTab  from './BrokerageTab';
import  BankTab  from './BankTab';
import  ExchangeTab  from './ExchangeTab';
import  SymbolTab  from './SymbolTab';
import  AssetTypeTab from './AssetTypeTab';
import  MappingTab  from './MappingTab';
import { useDashboardToken } from '@/hooks/useDashboardToken';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

// const token = useDashboardToken();


export const tabContents = [{
  id: '1',
  title: 'Basic',
  description: <BasicForm />,
  icon: 'bx:home'
}, {
  id: '2',
  title: 'Brokerage Account',
  description: <BrokerageTab />,
  icon: 'bx:user'
}, {
  id: '3',
  title: 'Bank',
  description: <BankTab/>,
  icon: 'bx:user'
}, {
  id: '4',
  title: 'Exchange',
  description: <ExchangeTab />,
  icon: 'bx:user'
}, {
  id: '5',
  title: 'Asset Type',
  description: <AssetTypeTab />,
  icon: 'bx:user'
}, {
  id: '6',
  title: 'Symbol',
  description: <SymbolTab/>,
  icon: 'bx:user'
},
{
  id: '7',
  title: 'Mapping',
  // description: <MappingTab fund_id={token?.fund_id} />,
  // description: <MappingTab/>,
  description: "MAPPING_TAB", 
  icon: 'bx:user'
}

];