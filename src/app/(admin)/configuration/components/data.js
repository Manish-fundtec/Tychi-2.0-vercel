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

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

// Use component references instead of JSX to prevent instantiation at module load
// Components will only be instantiated when the tab is actually rendered
export const tabContents = [{
  id: '1',
  title: 'Basic',
  component: BasicForm, // Component reference, not JSX
  icon: 'bx:home'
}, {
  id: '2',
  title: 'Brokerage Account',
  component: BrokerageTab,
  icon: 'bx:user'
}, {
  id: '3',
  title: 'Bank',
  component: BankTab,
  icon: 'bx:user'
}, {
  id: '4',
  title: 'Exchange',
  component: ExchangeTab,
  icon: 'bx:user'
}, {
  id: '5',
  title: 'Asset Type',
  component: AssetTypeTab,
  icon: 'bx:user'
}, {
  id: '6',
  title: 'Symbol',
  component: SymbolTab,
  icon: 'bx:user'
},
{
  id: '7',
  title: 'Mapping',
  component: MappingTab, // Will be handled specially in ConfigurationTab
  isMappingTab: true,
  icon: 'bx:user'
}

];