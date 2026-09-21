import * as React from "react";
import Svg, {Defs, G, Path} from "react-native-svg";
import {View} from "react-native";
/* SVGR has dropped some elements not supported by react-native-svg: title, filter */

const NaissanceSVG  = (props) => (
  <View>
    <Svg width={48} height={48} xmlns="http://www.w3.org/2000/svg" {...props}>
      <Defs />
      <G
        transform="translate(-27 -10)"
        filter="url(#a)"
        fill="none"
        fillRule="evenodd">
        <Path d="M27.75 10.75h46.5v46.5h-46.5z" />
        <G fill="#000">
          <Path d="M47.802 35.26a1.295 1.295 0 1 0 0-2.59 1.295 1.295 0 0 0 0 2.59ZM54.046 35.26a1.295 1.295 0 1 0 0-2.59 1.295 1.295 0 0 0 0 2.59Z" />
        </G>
        <Path
          d="M52.442 28.983s-6.325.392-6.311-4.953c.013-5.346 6.211-5.14 6.211-5.14s9.257.137 13.087 11.102c0 0 3.008 1.096 3.008 3.358s-2.53 3.22-2.53 3.22S63.098 49.044 51.1 49.044c-12 0-14.734-12.335-14.734-12.335s-2.803-1.166-2.803-3.29 3.008-3.357 3.008-3.357 2.136-5.684 5.616-8.119"
          stroke={props.color}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M53.97 41.504a2.818 2.818 0 1 1-5.637-.002 2.818 2.818 0 0 1 5.637.002Z"
          stroke={props.color}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M48.335 41.428a.762.762 0 1 1-1.524 0 .762.762 0 0 1 1.524 0ZM55.645 41.428a.762.762 0 1 1-1.524 0 .762.762 0 0 1 1.524 0Z"
          stroke={props.color}
          strokeWidth={2.25}
          fill="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  </View>
);

export default NaissanceSVG;
