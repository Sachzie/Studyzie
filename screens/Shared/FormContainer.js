import React from 'react';
import { ScrollView, Dimensions, StyleSheet, Text } from 'react-native';

var { width } = Dimensions.get('window');

const FormContainer = ({ children, title }) => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {children}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 100,
        marginBottom: 400,
        width: width,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 30,
        color: '#103B28',
        fontWeight: '600'
    }
})

export default FormContainer;
