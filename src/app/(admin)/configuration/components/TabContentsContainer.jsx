'use client';

import { useDashboardToken } from '@/hooks/useDashboardToken';
import { BasicForm } from "@/app/(admin)/forms/validation/components/ConfigurationForm";
import BrokerageTab from './BrokerageTab';
import BankTab from './BankTab';
import ExchangeTab from './ExchangeTab';
import SymbolTab from './SymbolTab';
import AssetTypeTab from './AssetTypeTab';
import MappingTab from './MappingTab';

const TabContentsContainer = () => {
  const token = useDashboardToken();

  const tabContents = [
    {
      id: '1',
      title: 'Basic',
      description: <BasicForm />,
      icon: 'bx:home',
    },
    {
      id: '2',
      title: 'Brokerage Account',
      description: <BrokerageTab />,
      icon: 'bx:user',
    },
    {
      id: '3',
      title: 'Bank',
      description: <BankTab />,
      icon: 'bx:user',
    },
    {
      id: '4',
      title: 'Exchange',
      description: <ExchangeTab />,
      icon: 'bx:user',
    },
    {
      id: '5',
      title: 'Asset Type',
      description: <AssetTypeTab />,
      icon: 'bx:user',
    },
    {
      id: '6',
      title: 'Symbol',
      description: <SymbolTab />,
      icon: 'bx:user',
    },
    {
      id: '7',
      title: 'Mapping',
      description: <MappingTab fund_id={token?.fund_id} />,
      icon: 'bx:user',
    }
  ];

  // Return the component that renders tabs using this data
  // Example: if you're using a <TabComponent>:
  return (
    <tabContents tabData={tabContents} />
  );
};

export default TabContentsContainer;
