import { currency } from '@/context/constants';
export const statisticData = [{
  icon: 'solar:users-group-two-rounded-broken',
  title: 'No. of investors',
  amount: '2,854',
  change: 7.34
}, {
  icon: 'solar:money-bag-broken',
  title: 'Total Funds',
  amount: '705',
  change: 4.5
}, {
  icon: 'solar:graph-up-broken',
  title: 'YTD return',
  amount: '$12.1M',
  change: 4.5,
}, {
  icon: 'solar:wad-of-money-broken',
  title: 'AUM ',
  amount: `${currency}2.8B`,
  change: 4.21
}];
export const propertyData = [{
  title: 'Investor Onboarding: X',
  icon: 'solar:users-group-two-rounded-broken',
  amount: '',
  progress: 60,
  variant: 'primary'
}, {
  title: 'Investor Onboarding: Y',
  icon: 'solar:users-group-two-rounded-broken',
  amount: ``,
  progress: 80,
  variant: 'success'
}];
export const chartOptions = {
  chart: {
    height: 95,
    parentHeightOffset: 0,
    type: 'bar',
    toolbar: {
      show: !1
    }
  },
  plotOptions: {
    bar: {
      barHeight: '100%',
      columnWidth: '40%',
      borderRadius: 4,
      distributed: !0
    }
  },
  grid: {
    show: !1,
    padding: {
      top: -20,
      bottom: -10,
      left: 0,
      right: 0
    }
  },
  colors: ['#eef2f7', '#eef2f7', '#604ae3', '#eef2f7'],
  dataLabels: {
    enabled: !1
  },
  series: [{
    name: 'New Agents',
    data: [40, 50, 65, 40, 40, 65, 40]
  }],
  legend: {
    show: !1
  },
  xaxis: {
    categories: ['J', 'F', 'M', 'A', 'M', 'J', 'J'],
    axisBorder: {
      show: !1
    },
    axisTicks: {
      show: !1
    }
  },
  yaxis: {
    labels: {
      show: !1
    }
  },
  tooltip: {
    enabled: !0
  },
  responsive: [{
    breakpoint: 1025,
    options: {
      chart: {
        height: 199
      }
    }
  }]
};
export const salesChart = {
  chart: {
    height: 341,
    type: 'area',
    dropShadow: {
      enabled: true,
      opacity: 0.2,
      blur: 10,
      left: -7,
      top: 22
    },
    toolbar: {
      show: false
    }
  },
  colors: ['#47ad94', '#604ae3'],
  dataLabels: {
    enabled: false
  },
  stroke: {
    show: true,
    curve: 'smooth',
    width: 2,
    lineCap: 'square'
  },
  series: [
   {
    name: 'Expenses',
    data: [1460923, 1419534, 1536847, 1488031, 1488031, 1499035, 1406878, 1406878, 1406878, 1532504, 1462342, 2004014]
  }, {
    name: 'Income',
    data: [2465812, 2863984, 2163403, 2542326, 2627313, 1967837, 2642830, 2135516,1982322, 3085885, 3085885, 3085885]
  }],
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  xaxis: {
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    },
    crosshairs: {
      show: true
    },
    labels: {
      offsetX: 0,
      offsetY: 5,
      style: {
        fontSize: '12px',
        cssClass: 'apexcharts-xaxis-title'
      }
    }
  },
  yaxis: {
    labels: {
      formatter: function (value, index) {
        return value / 1000 + 'K';
      },
      offsetX: -15,
      offsetY: 0,
      style: {
        fontSize: '12px',
        cssClass: 'apexcharts-yaxis-title'
      }
    }
  },
  grid: {
    borderColor: '#191e3a',
    strokeDashArray: 5,
    xaxis: {
      lines: {
        show: true
      }
    },
    yaxis: {
      lines: {
        show: false
      }
    },
    padding: {
      top: -50,
      right: 0,
      bottom: 0,
      left: 5
    }
  },
  legend: {
    show: false
  },
  fill: {
    type: 'gradient',
    gradient: {
      type: 'vertical',
      shadeIntensity: 1,
      inverseColors: !1,
      opacityFrom: 0.12,
      opacityTo: 0.1,
      stops: [100, 100]
    }
  },
  responsive: [{
    breakpoint: 575,
    options: {
      legend: {
        offsetY: -50
      }
    }
  }]
};
export const socialOptions = {
  chart: {
    height: 349,
    type: 'radialBar',
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 225,
      hollow: {
        margin: 0,
        size: '70%',
        background: 'transparent',
        image: undefined,
        imageOffsetX: 0,
        imageOffsetY: 0,
        position: 'front',
        dropShadow: {
          enabled: true,
          top: 3,
          left: 0,
          blur: 4,
          opacity: 0.24
        }
      },
      track: {
        background: 'rgba(170,184,197, 0.4)',
        strokeWidth: '67%',
        margin: 0
      },
      dataLabels: {
        // showOn: "always",
        name: {
          offsetY: -10,
          show: true,
          color: '#888',
          fontSize: '17px'
        },
        value: {
          // formatter: function (val) {
          //   return parseInt(val);
          // },
          color: '#111',
          fontSize: '36px',
          show: true
        }
      }
    }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'horizontal',
      shadeIntensity: 0.5,
      gradientToColors: ['#7f56da', '#4697ce'],
      inverseColors: true,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 100]
    }
  },
  series: [70],
  stroke: {
    lineCap: 'round'
  },
  labels: ['Total Buyer']
};
export const salesOptions = {
  chart: {
    height: 120,
    parentHeightOffset: 0,
    type: 'bar',
    toolbar: {
      show: !1
    }
  },
  plotOptions: {
    bar: {
      barHeight: '100%',
      columnWidth: '40%',
      // startingShape: "rounded",
      // endingShape: "rounded",
      borderRadius: 4,
      distributed: !0
    }
  },
  grid: {
    show: true,
    padding: {
      top: -20,
      bottom: -10,
      left: 0,
      right: 0
    }
  },
  colors: ['#604ae3', '#604ae3', '#604ae3', '#604ae3'],
  dataLabels: {
    enabled: !1
  },
  series: [{
    name: 'Property Sales',
    data: [40, 50, 65, 45, 40, 70, 40]
  }],
  legend: {
    show: !1
  },
  xaxis: {
    categories: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    axisBorder: {
      show: !1
    },
    axisTicks: {
      show: !1
    }
  },
  yaxis: {
    labels: {
      show: true
    }
  },
  tooltip: {
    enabled: !0
  },
  responsive: [{
    breakpoint: 1025,
    options: {
      chart: {
        height: 199
      }
    }
  }]
};