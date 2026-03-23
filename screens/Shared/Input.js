import React from 'react';
import { TextInput, StyleSheet } from 'react-native'

const Input = (props) => {
    return (
        <TextInput
            style={[styles.input, props.inputStyle]}
            placeholder={props.placeholder}
            placeholderTextColor={props.placeholderTextColor || 'rgba(0,0,0,0.55)'}
            selectionColor={props.selectionColor || 'rgba(0,0,0,0.7)'}
            name={props.name}
            id={props.id}
            value={props.value}
            autoCorrect={props.autoCorrect}
            onChangeText={props.onChangeText}
            onFocus={props.onFocus}
            secureTextEntry={props.secureTextEntry}
            keyboardType={props.keyboardType}
        >
        </TextInput>
    );
}

const styles = StyleSheet.create({
    input: {
        width: '80%',
        height: 60,
        backgroundColor: 'white',
        color: 'rgba(0,0,0,0.72)',
        margin: 10,
        borderRadius: 20,
        padding: 10,
        borderWidth: 2,
        borderColor: '#103B28'
    },
});

export default Input;
