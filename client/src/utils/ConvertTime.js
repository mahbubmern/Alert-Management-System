import { useRef } from "react";
// import { useReactToPrint } from "react-to-print";

// Function to convert ISO date to local DD/MM/YYYY format
export const formatDateToDDMMYYYY = (isoDateString) => {
  const date = new Date(isoDateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Function to convert ISO date to local HH:MM:SS format
export const formatTimeToHHMMSS = (isoDateString) => {
  const date = new Date(isoDateString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export const formatDateTimeReadable = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const pad = (n) => (n < 10 ? "0" + n : n);

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // Months are 0-indexed
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  return `${day}-${month}-${year}   ${hours}:${minutes} ${ampm}`;
};

// export const usePrintHelper = (pageStyle) => {

//   const componentRef = useRef();
//   const handlePrint = useReactToPrint({
//     documentTitle : `Sonali Bank PLC`,
//     contentRef: componentRef, // v3 হলে
//     // অথবা content: () => componentRef.current // v2 হলে
//     pageStyle: `
//       @page {
//         size: A4;
//         margin: 12mm; 
//       }
//         @media print {
//     .container, .row, .col {
//       margin: 0 !important;
//       padding: 0 !important;
//       max-width: 100% !important;
//     }
  
//     .print-container {
//       margin: 0 !important;
//       padding: 10px !important;
//       page-break-inside: avoid !important;
//     }
//       body {
//         -webkit-print-color-adjust: exact;
//         padding: 0 !important;
//         margin: 0 !important;
//         font-size: 12px;
//       }
//       h3 {
//         margin: 0 0 5px 0;
//         font-size: 16px;
//       }
//       p {
//         margin: 0 0 3px 0;
//       }
//     `,
//   });
//   return { componentRef, handlePrint };
// };

// check valid ip address
export const isValidIP = (ip) => {
  const regex =
    /^(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)){3}$/;
  return regex.test(ip);
};
