// create appi instance

import axios from "axios";

// const API = axios.create({
//   baseURL: "https://document-management-system-pjp8.onrender.com/",
//   timeout: "20000",
//   withCredentials: true,
// });
const API = axios.create({
    baseURL : 'http://localhost:5050',
    timeout : '20000',
    withCredentials : true
});

//export api

export default API;
