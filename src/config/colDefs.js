  import { format } from 'date-fns';
const CustomButtonComponent = (props) => {
  return <button onClick={() => window.alert("The Data has been Delete")} className='btn-sm btn-danger btn'>Delete</button>;
};

// Default column definitions (optional)
export const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true, // Allow resizing
}

// Manual Journal Table
export const manualJournalColDefs = [
  { field: 'Id', headerName: 'Id', sortable: true, filter: true},
  { field: 'Journal Id', headerName: 'Journal ID', sortable: true, filter: true },
  { field: 'Date', headerName: 'Date', sortable: true, filter: true },
  { field: 'Debit Account', headerName: 'Debit Account', sortable: true, filter: true },
  { field: 'Credit Account', headerName: 'Credit Account', sortable: true, filter: true },
  { field: 'Amount', headerName: 'Amount', sortable: true, filter: true, cellStyle: { textAlign: 'right' } },
]

export const TradeColDefs = [
  { field: 'TradeID', flex: 2, sortable: true, filter: true, search: true },
  { 
    field: 'TradeDate',
    sortable: true,
    filter: true,
    valueFormatter: (params) => {
      // Assuming TradeDate is in ISO string format
      if (!params.value) return ''; // Handle null or undefined dates
      try {
        return format(new Date(params.value), 'yyyy-MM-dd'); // Formats as YYYY-MM-DD
      } catch (error) {
        console.error('Invalid date format', params.value, error);
        return params.value; // Fallback to original value if formatting fails
      }
    }
  },
  { field: 'Symbol', sortable: true, filter: true, search: true },
  { field: 'price' },
  { field: 'Quantity' },
  { field: 'Amount' },
  { field: 'Action', cellRenderer: CustomButtonComponent, flex: 1 },
];
// Configuration Table
export const BrokerageTableColDefs = [
  { field: 'SrNo', headerName: 'Sr. No', sortable: true, filter: true ,flex:1},
  { field: 'UID', headerName: 'UID', sortable: true, filter: true ,flex:1},
  { field: 'Name', headerName: 'Name', sortable: true, filter: true ,flex:1},
  { field: 'StartDate', headerName: 'Start Date', sortable: true, filter: true ,flex:1},
  { 
    field: 'Action', 
    headerName: 'Action', 
    cellRenderer: CustomButtonComponent, // Assuming this is your custom component for actions
    flex: 1 
  }
];

export const bankTableColDefs = [
  { field: 'Sno', headerName: 'Sno.', sortable: true, filter: true},
  { field: 'UID', headerName: 'UID', sortable: true, filter: true ,flex:1},
  { field: 'BankID', headerName: 'Bank ID', sortable: true, filter: true,flex:1 },
  { field: 'BankName', headerName: 'Bank Name', sortable: true, filter: true ,flex:1},
  { 
    field: 'StartDate', 
    flex:1,
    headerName: 'Start Date', 
    sortable: true,
    valueFormatter: (params) => {
      // Format the date as a simple readable format
      if (!params.value) return '';
      try {
        return new Date(params.value).toLocaleDateString(); // Locale-based date format
      } catch (error) {
        console.error('Invalid date format', params.value, error);
        return params.value;
      }
    }
  },
  { 
    field: 'Action', 
    headerName: 'Action', 
    cellRenderer: CustomButtonComponent, // Assuming you have a custom button renderer
    flex: 1 
  }
];

export const exchangeTableColDefs = [
  { field: 'Sno', headerName: 'Sno.', sortable: true, filter: true ,flex:1},
  { field: 'UID', headerName: 'UID', sortable: true, filter: true  ,flex:1},
  { field: 'ExchangeID', headerName: 'Exchange ID', sortable: true, filter: true  ,flex:1},
  { field: 'ExchangeName', headerName: 'Exchange Name', sortable: true, filter: true  ,flex:1},
  { 
    field: 'Action', 
    headerName: 'Action', 
    cellRenderer: CustomButtonComponent, // Assuming you have a custom button renderer
    flex: 1 
  }
];

export const assetTypeColDefs = [
  { field: 'Sno', headerName: 'Sno.', sortable: true, filter: true,flex:1},
  { field: 'UID', headerName: 'UID', sortable: true, filter: true ,flex:1},
  { field: 'Name', headerName: 'Name', sortable: true, filter: true ,flex:1},
  { field: 'LongTermRule', headerName: 'Long Term Rule', sortable: true, filter: true ,flex:1},
  { field: 'CloserRule', headerName: 'Closer Rule', sortable: true, filter: true ,flex:1},
  { field: 'Status', headerName: 'Status',  cellRenderer: CustomButtonComponent, sortable: true, filter: true }
];

export const symbolColDefs = [
  { field: 'Sno', headerName: 'Sno.', sortable: true, filter: true},
  { field: 'UID', headerName: 'UID', sortable: true, filter: true },
  { field: 'SymbolID', headerName: 'Symbol ID', sortable: true, filter: true },
  { field: 'SymbolName', headerName: 'Symbol Name', sortable: true, filter: true },
  { field: 'ISIN', headerName: 'ISIN', sortable: true, filter: true },
  { field: 'CUSIP', headerName: 'CUSIP', sortable: true, filter: true },
  { field: 'AssetType', headerName: 'Asset Type', sortable: true, filter: true },
  { field: 'Exchange', headerName: 'Exchange', sortable: true, filter: true },
  { field: 'ContractSize', headerName: 'Contract Size', sortable: true, filter: true },
  { 
    field: 'Action', 
    headerName: 'Action', 
    cellRenderer: CustomButtonComponent, // Replace with your custom button renderer
    flex: 1 
  }
]
// Pricing Table
export const pricingColDefs = [
  { field: 'SrNo', headerName: 'Sr. No.', sortable: true, filter: true},
  { field: 'Month', headerName: 'Month', sortable: true, filter: true },
  { field: 'Date', headerName: 'Date', sortable: true, filter: true },
  { field: 'Status', headerName: 'Status', sortable: true, filter: true },
  { 
    field: 'Action', 
    headerName: 'Action', 
    cellRenderer: CustomButtonComponent, // Replace with your custom button renderer
    flex: 1 
  }
];

export const tableColDefs = {
  trades: [
  { field: 'TradeID', flex: 2, sortable: true, filter: true, search: true },
  { field: 'Date', sortable: true, filter: true, search: true },
  { field: 'Symbol', sortable: true, filter: true, search: true },
  { field: 'price' },
  { field: 'Quantity' },
  { field: 'Amount' },
  { field: 'Action', cellRenderer: CustomButtonComponent, flex: 1 },
  ],
  bank: [
    { field: 'Sno', headerName: 'Sno.', sortable: true, filter: true},
    { field: 'UID', headerName: 'UID', sortable: true, filter: true ,flex:1},
    { field: 'BankID', headerName: 'Bank ID', sortable: true, filter: true,flex:1 },
    { field: 'BankName', headerName: 'Bank Name', sortable: true, filter: true ,flex:1},
    { 
      field: 'StartDate', 
      flex:1,
      headerName: 'Start Date', 
      sortable: true,
      valueFormatter: (params) => {
        // Format the date as a simple readable format
        if (!params.value) return '';
        try {
          return new Date(params.value).toLocaleDateString(); // Locale-based date format
        } catch (error) {
          console.error('Invalid date format', params.value, error);
          return params.value;
        }
      }
    },
  ],
};

var AllModules = {
  defaultColDef,
  manualJournalColDefs,
  pricingColDefs,
  tableColDefs
}
export default AllModules
