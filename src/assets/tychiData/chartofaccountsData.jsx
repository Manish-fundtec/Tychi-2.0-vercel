export const chartOfAccountsData = [
 {
    gl_name: 'Asset',
    gl_number: '10000',
    balance: 'Dr',
    sub_accounts1: [
      {
        gl_name: 'Cash',
        gl_number: '11000',
        balance: 'Dr',
        sub_accounts2: [
          {
            gl_name: 'Clear Street',
            gl_number: '11001',
            balance: 'Dr',
          },
          {
            gl_name: 'Velocity',
            gl_number: '11002',
            balance: 'Dr',
          },
          {
            gl_name: 'ADM',
            gl_number: '11003',
            balance: 'Dr',
          },
        ],
      },
      {
        gl_name: 'Bank',
        gl_number: '12000',
        balance: 'Dr',
      },
      {
        gl_name: 'Investment Long',
        gl_number: '13000',
        balance: 'Dr',
        sub_accounts: [
          {
            gl_name: 'Cost',
            gl_number: '13100',
            balance: 'Dr',
            sub_accounts: [
              {
                gl_name: 'Stock',
                gl_number: '13110',
                balance: 'Dr',
              },
            ],
          },
          {
            gl_name: 'Appreciation/ Depreciation',
            gl_number: '13200',
            balance: 'Dr',
            sub_accounts: [
              {
                gl_name: 'Stock',
                gl_number: '13210',
                balance: 'Dr',
              },
            ],
          },
        ],
      },
      {
        gl_name: 'Investment Clearing',
        gl_number: '14000',
        balance: 'Dr',
      },
    ],
  },
  {
    gl_name: 'Liability',
    gl_number: '20000',
    balance: 'Cr',
    sub_accounts1: [
      {
        gl_name: 'Investment_Short',
        gl_number: '21000',
        balance: 'Cr',
        sub_accounts2: [
          {
            gl_name: 'Cost',
            gl_number: '21100',
            balance: 'Cr',
            sub_accounts: [
              {
                gl_name: 'Stock',
                gl_number: '21110',
                balance: 'Cr',
              },
            ],
          },
          {
            gl_name: 'Appreciation/ Depreciation',
            gl_number: '21200',
            balance: 'Cr',
            sub_accounts: [
              {
                gl_name: 'Stock',
                gl_number: '21210',
                balance: 'Cr',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    gl_name: 'Equity',
    gl_number: '30000',
    balance: 'Cr',
    sub_accounts1: [
      {
        gl_name: 'Opening Equity',
        gl_number: '31000',
        balance: 'Cr',
      },
      {
        gl_name: 'Contribution',
        gl_number: '32000',
        balance: 'Cr',
      },
      {
        gl_name: 'Distribution',
        gl_number: '33000',
        balance: 'Cr',
      },
      {
        gl_name: 'Retained Earning',
        gl_number: '34000',
        balance: 'Cr',
      },
    ],
  },
  {
    gl_name: 'Income',
    gl_number: '40000',
    balance: 'Cr',
    sub_accounts1: [
      {
        gl_name: 'Realized P&L',
        gl_number: '41000',
        balance: 'Cr',
        sub_accounts2: [
          {
            gl_name: 'Long Term Realized P&L',
            gl_number: '41100',
            balance: 'Cr',
          },
          {
            gl_name: 'Short Term Realized P&L',
            gl_number: '41200',
            balance: 'Cr',
          },
        ],
      },
      {
        gl_name: 'Unrealized P&L',
        gl_number: '42000',
        balance: 'Cr',
      },
    ],
  },
  {
    gl_name: 'Expense',
    gl_number: '50000',
    balance: 'Dr',
    sub_accounts1: [
      {
        gl_name: 'Management Fee',
        gl_number: '51000',
        balance: 'Dr',
      },
      {
        gl_name: 'Performance Fee',
        gl_number: '52000',
        balance: 'Dr',
      },
      {
        gl_name: 'Administration Fee',
        gl_number: '53000',
        balance: 'Dr',
      },
      {
        gl_name: 'Brokerage Expense',
        gl_number: '54000',
        balance: 'Dr',
      },
    ],
  },
]
