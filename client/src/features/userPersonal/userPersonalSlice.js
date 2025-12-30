// create slice

import { createSlice } from "@reduxjs/toolkit";
import { updateUserPersonal } from "./userPersonalApiSlice";

const userPersonalSlice = createSlice({
  name: "userPersonal",
  initialState: {
    userPersonal: null,
    personalmessage: null,
    personalerror: null,
    loader: false,
  },
  reducers: {
    setPersonalEmptyMessage : (state) =>{
      state.personalmessage = null,
      state.personalerror = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserPersonal.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateUserPersonal.fulfilled, (state, action) => {
        state.loader = false;
        state.userPersonal = action.payload.userPersonal;
        state.personalmessage = action.payload.message
      })
      .addCase(updateUserPersonal.rejected, (state, action) => {
        state.loader = false;
        state.personalerror = action.error.message;
      })
      ;
  },
});



//selector export

export const userPersonalSelector = (state) => state.userPersonal;

//actions export

export const {setPersonalEmptyMessage} = userPersonalSlice.actions;

//reducer export

export default userPersonalSlice.reducer;

