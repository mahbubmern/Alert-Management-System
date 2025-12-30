// import { createAsyncThunk } from "@reduxjs/toolkit";
// import API from "../../utils/api";

// // create Incoming File

// export const createIncoming = createAsyncThunk(
//   "incoming/createIncoming",
//   async (data) => {

//     try {
//       const response = await API.post(`/api/v1/incoming`, data);

//       return response.data;
//     } catch (error) {
//       throw new Error(error.response.data.message);
//     }
//   }
// );

// export const createAlert = createAsyncThunk(
//   "incoming/createAlert",
//   async (data) => {

//     try {
//       const response = await API.post(`/api/v1/incoming`, data);

//       return response.data;
//     } catch (error) {
//       throw new Error(error.response.data.message);
//     }
//   }
// );

// // Get All Incoming File

// export const getIncomings = createAsyncThunk(
//   "incoming/getIncomings",
//   async () => {
//     try {
//       const response = await API.get(`/api/v1/incoming`);

//       return response.data;
//     } catch (error) {
//       throw new Error(error.response.data.message);
//     }
//   }
// );

// // Update Incoming File

// // export const editIncomings = createAsyncThunk(
// //   "incoming/editIncomings",
// //   async (data) => {
// //     console.log(data);
// //     try {
// //       const response = await API.patch(`api/v1/incoming/${data._id}`);

// //       console.log(response.data);
// //       return response.data;
// //     } catch (error) {
// //       throw new Error(error.response.data.message);
// //     }
// //   }
// // );

// export const editIncomings = createAsyncThunk(
//   "user/editIncomings",
//   async (data) => {

//     try {
//       const response = await API.patch(`/api/v1/incoming/${data._id}`, data);

//       return response.data;
//     } catch (error) {
//       throw new Error(error.response.data.message);
//     }
//   }
// );
