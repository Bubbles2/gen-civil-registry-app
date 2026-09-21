import React from 'react';
import {StyleSheet, Text} from 'react-native';

type Props = {
  children: React.ReactNode;
};

const Header = (props: Props) => (
  <Text style={styles.header}>{props.children}</Text>
);

const styles = StyleSheet.create({
  header: {
    fontSize: 26,
    color: '#000000',
    fontWeight: 'bold',
    paddingVertical: 14,
  },
});

export default Header;
