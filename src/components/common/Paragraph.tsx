import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {theme} from '../../core/theme';

type Props = {
  children: React.ReactNode;
};

const Paragraph = (props: Props) => (
  <Text style={styles.text}>{props.children}</Text>
);

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 26,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 14,
  },
});

export default Paragraph;
