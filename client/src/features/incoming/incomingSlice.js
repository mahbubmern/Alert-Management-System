// // create slice

// import { createSlice } from "@reduxjs/toolkit";
// import {
//   createAlert,
//   createIncoming,
//   editIncomings,
//   getIncomings,
// } from "./incomingApiSlice";

// const initialState = {
//   incomingFile: null,
//   incomingMessage: null,
//   incomingError: null,
//   incomingLoader: false,
// };

// const incomingSlice = createSlice({
//   name: "incoming",
//   initialState,
//   reducers: {
//     setEmptyIncomingMessage: (state) => {
//       (state.incomingMessage = null), (state.incomingError = null);
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(createIncoming.pending, (state) => {
//         state.incomingLoader = true;
//       })
//       .addCase(createIncoming.fulfilled, (state, action) => {
//         state.incomingLoader = false;
//         state.incomingFile = action.payload.incomingLetter;
//         state.incomingMessage = action.payload.message;
//       })
//       .addCase(createIncoming.rejected, (state, action) => {
//         state.incomingLoader = false;
//         state.incomingError = action.error.message;
//       })
//       // get All Incomings
//       .addCase(getIncomings.pending, (state) => {
//         state.incomingLoader = true;
//       })
//       .addCase(getIncomings.fulfilled, (state, action) => {
//         state.incomingLoader = false;
//         state.incomingFile = action.payload.incomingFile;
//         state.incomingMessage = action.payload.message;
//       })
//       .addCase(getIncomings.rejected, (state, action) => {
//         state.incomingLoader = false;
//         state.incomingError = action.error.message;
//       })

//       // Update Incomings file
//       .addCase(editIncomings.pending, (state) => {
//         state.incomingLoader = true;
//       })
//       .addCase(editIncomings.fulfilled, (state, action) => {
//         state.incomingLoader = false;
//         state.incomingFile = action.payload.incomingFile;
//         state.incomingMessage = action.payload.message;
//       })
//       .addCase(editIncomings.rejected, (state, action) => {
//         state.incomingLoader = false;
//         state.incomingError = action.error.message;
//       });
//   },
// });

// //selector export

// export const incomingSelector = (state) => state.incoming;

// //actions export

// export const { setEmptyIncomingMessage } = incomingSlice.actions;

// //reducer export

// export default incomingSlice.reducer;
