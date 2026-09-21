import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  loadIngComplete:false
}
const appParamsSlice = createSlice({
  name: 'appParams',
  initialState:initialState,
  reducers: {
    setloadIngComplete: (state, action:PayloadAction) => {
      state = true
    }
  }
});

export const appParamsActions = appParamsSlice.actions;
export default appParamsSlice.reducer;
