// Paper 5's DefaultTheme is Material 3 (MD3LightTheme). The app was designed on
// Paper 4 / Material 2, so it keeps the MD2 theme (version: 2) to preserve the
// existing look; moving to MD3 is a separate, visual-only change.
import {MD2LightTheme} from "react-native-paper";

export const theme = {
  ...MD2LightTheme,
  colors: {
    ...MD2LightTheme.colors,
    secondary: "#6a85ad",
    primary: "#196331",
    //secondary: "#1f1d1c",
    //primary: "#E6C500",
    error: "#f13a59",
  },
};
