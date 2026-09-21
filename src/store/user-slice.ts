import { createSlice, PayloadAction } from "@reduxjs/toolkit";




const initialState = {
};
const userSlice = createSlice({
  name: "user",
  initialState: initialState,
  reducers: {
    addUser: (state, action: PayloadAction) => {
      return state = action.payload;
    },
    login: (state, action: PayloadAction) => {
      return state = action.payload;
    },
    logout: (state, action: PayloadAction) => {
      return state = {};
    },

  },
});

export const userActions = userSlice.actions;
export default userSlice.reducer;
