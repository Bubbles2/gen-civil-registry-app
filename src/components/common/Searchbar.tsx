import * as React from 'react';
import { StyleSheet, Image } from 'react-native';
import { Searchbar as Search } from 'react-native-paper';



const Searchbar = (props) => {

    return (
       <Search style={styles.input} placeholder="Recherche..." onChangeText={text => props.handleChangeSearch(text)} value={props.value} />     
    );
}


const styles = StyleSheet.create({
    input: {
        width: "60%",
    }
});

export default Searchbar;