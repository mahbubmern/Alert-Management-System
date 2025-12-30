import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./app/store.js";
import App from "./App.jsx";
import "react-toastify/dist/ReactToastify.css";

import setupGlobalSocketListeners from "../src/helpers/socketListeners.js";
setupGlobalSocketListeners(store);

// import "./assets/frontend/css/bootstrap.min.css";

// import "datatables.net-dt/css/dataTables.dataTables.min.css";
// import "datatables.net-buttons-dt/css/buttons.dataTables.min.css";

// import pdfMake from "pdfmake/build/pdfmake";
// import pdfFonts from "pdfmake/build/vfs_fonts";
// pdfMake.vfs = pdfFonts.pdfMake.vfs;

import { Buffer } from "buffer";
window.Buffer = Buffer;

import "../node_modules/jszip/dist/jszip.min.js";

// Import jQuery
// import $ from "jquery";

// Import DataTables and buttons extensions
// import "datatables.net-dt";
// import "datatables.net-buttons-dt";
// import "datatables.net-buttons/js/dataTables.buttons";
// import "datatables.net-buttons/js/buttons.html5"; // Import for Excel and PDF export
// import "datatables.net-buttons/js/buttons.print"; // Optional - Print button
// import "datatables.net-buttons/js/buttons.colVis";

// import "./assets/frontend/plugins/fontawesome/css/fontawesome.min.css";
import "./assets/frontend/plugins/fontawesome/css/all.min.css";
import "./assets/frontend/css/feathericon.min.css";
// import "./assets/frontend/plugins/morris/morris.css";

import "./assets/frontend/css/custom.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
