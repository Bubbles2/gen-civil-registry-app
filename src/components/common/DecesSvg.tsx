import * as React from "react";
import {View} from "react-native";
import Svg, {G, Path} from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */

const DecesSvg = props => (
  <View>
    <Svg
      width={48}
      height={48}
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <G fill="none" fillRule="evenodd">
        <Path d="M4 4h248v248H4z" />
        <Path
          d="M62.198 101.297C62.198 64.682 91.88 35 128.495 35c36.615 0 66.297 29.682 66.297 66.297v112.342H62.198V101.297ZM18 220.079h220.99M104 122.842l49 .158m-62 21.842h74m-74 22h74"
          stroke={props.color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  </View>
);

export default DecesSvg;
