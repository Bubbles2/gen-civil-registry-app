import React from "react";
import { Image, StyleSheet, View } from "react-native";
import BuildConfig from 'react-native-build-config';
const flavor = BuildConfig.FLAVOR

const Logo = (): React.JSX.Element => {


  const getSourceByFlavor = () => {
    switch (flavor) {
      case "dev":
        return require("../../assets/logo_nekkal_digitech.png")
      case "qua":
        return require("../../assets/logo_nekkal_test.png");
      case "preprod":
        return require("../../assets/logo_nekkal_preprod.png");
      case "prod":
        return require("../../assets/logo_nekkal_prod.png");
    }
  }

  return (

    <Image
      resizeMode='contain'
      source={getSourceByFlavor()}
      style={styles.image}
    />


  )
}

const styles = StyleSheet.create({
  image: {

    width: 300,
    height: 200,
    marginBottom:60,
    alignSelf: "center",
  },
});

export default Logo;
