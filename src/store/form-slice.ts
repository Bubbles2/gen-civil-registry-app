import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: FormState = {forms : [{"ID":"6423fde505dcadd19239a24d","ACT_NAI":null,"CHILD":null,"ISEE":null,"ACT":{"POINT_COLLECTE":"","ACT_DECL_DATE":"29/03/2023","ACT_DECL_HOUR":"10:59"},"FATHER":null,"MOTHER":null,"DEFUNCT":{"FIRSTNAME":"Initial","NAME":"Name","INFO_DEC":{"EVT_DATE":"29/03/2023","EVT_HOUR":"10:59"}},"TYPE":"DECES","STATUS":"BROUILLON","ERROR":""}]}


const formSlice = createSlice({
    name: 'forms',
    initialState:initialState,
    reducers: {
        setForms: (state, action:PayloadAction<IFORM[]>) => {
            state.forms = action.payload
        } ,
        addForms: (state,  action:PayloadAction<IFORM>) => {
            state.forms.push(action.payload);
        }
    }
});

export const formActions = formSlice.actions;
export default formSlice.reducer;
