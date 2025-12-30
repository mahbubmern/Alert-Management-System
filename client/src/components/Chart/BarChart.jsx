import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const BarChart = ({ data }) => {
  const chartRef = useRef(null);
  let myChart = useRef(null);

  // with y axis fraction data like 0.5, 1, 1.5, 2, 2.5 start
  // useEffect(() => {
  //   // Check if a chart instance already exists and destroy it
  //   if (myChart.current) {
  //     myChart.current.destroy();
  //   }

  //   // Create a new chart instance
  //   const ctx = chartRef.current.getContext('2d');
  //   myChart.current = new Chart(ctx, {
  //     type: 'bar',
  //     data: data,
  //     options: {
  //       scales: {
  //         y: {
  //           beginAtZero: true
  //         }
  //       }
  //     }
  //   });

  //   // Clean up function
  //   return () => {
  //     if (myChart.current) {
  //       myChart.current.destroy();
  //     }
  //   };
  // }, [data]);
  // with y axis fraction data like 0.5, 1, 1.5, 2, 2.5 end

  // with y axis not fraction data like  1,  2, 3 start
  useEffect(() => {
    if (myChart.current) {
      myChart.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    myChart.current = new Chart(ctx, {
      type: "bar",
      data: data,
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function (value) {
                if (Number.isInteger(value)) {
                  return value;
                }
                return null;
              },
            },
          },
        },
      },
    });

    return () => {
      if (myChart.current) {
        myChart.current.destroy();
      }
    };
  }, [data]);
  // with y axis not fraction data like  1,  2, 3 end

  return <canvas ref={chartRef} />;
};

export default BarChart;
