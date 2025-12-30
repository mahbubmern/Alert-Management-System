// create slice

import { createSlice } from "@reduxjs/toolkit";
import { updateUserCred } from "./userCredApiSlice";

const userCredSlice = createSlice({
  name: "userCred",
  initialState: {
    userCred: null,
    message: null,
    error: null,
    loader: false,
  },
  reducers: {
    setEmptyMessage : (state) =>{
      state.message = null,
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserCred.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateUserCred.fulfilled, (state, action) => {
        state.loader = false;
        state.userCred = action.payload.userCred;
        state.message = action.payload.message
      })
      .addCase(updateUserCred.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      })
      ;
  },
});



//selector export

export const userCredSelector = (state) => state.userCred;

//actions export

export const {setEmptyMessage} = userCredSlice.actions;

//reducer export

export default userCredSlice.reducer;

