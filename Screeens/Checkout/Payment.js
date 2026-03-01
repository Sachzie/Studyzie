import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { Surface, RadioButton, Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

const methods = [
    { name: 'Cash on Delivery', value: 1 },
    { name: 'Bank Transfer', value: 2 },
    { name: 'Card Payment', value: 3 }
]

const paymentCards = [
    { name: 'Wallet', value: 1 },
    { name: 'Visa', value: 2 },
    { name: 'MasterCard', value: 3 },
    { name: 'Other', value: 4 }
]

const Payment = ({ route }) => {
    const order = route.params;
    const [selected, setSelected] = useState(1); // Default to COD
    const [card, setCard] = useState('');
    const navigation = useNavigation()

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Choose your payment method</Text>
            
            <Surface style={styles.surface}>
                <RadioButton.Group
                    onValueChange={newValue => setSelected(newValue)}
                    value={selected}
                >
                    {methods.map((item, index) => (
                        <View key={index} style={styles.radioItem}>
                            <RadioButton.Item
                                label={item.name}
                                value={item.value}
                                color='#103B28'
                                labelStyle={styles.radioLabel}
                            />
                        </View>
                    ))}
                </RadioButton.Group>
            </Surface>

            {selected === 3 ? (
                <Surface style={styles.pickerSurface}>
                    <Picker
                        mode="dropdown"
                        selectedValue={card}
                        onValueChange={(itemValue) => setCard(itemValue)}
                    >
                        {paymentCards.map((c, index) => (
                            <Picker.Item key={c.name} label={c.name} value={c.name} />
                        ))}
                    </Picker>
                </Surface>
            ) : null}

            <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    buttonColor="#103B28"
                    textColor="#FFFFFF"
                    onPress={() => navigation.navigate("Confirm", { order })}
                    style={styles.confirmButton}
                >
                    Confirm
                </Button>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#103B28',
        marginBottom: 20,
        textAlign: 'center'
    },
    surface: {
        padding: 10,
        borderRadius: 10,
        elevation: 2,
        backgroundColor: 'white',
        marginBottom: 20
    },
    radioItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    radioLabel: {
        fontSize: 16,
        color: '#374151'
    },
    pickerSurface: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: 'white',
        marginBottom: 20,
        elevation: 1
    },
    buttonContainer: {
        marginTop: 20,
        alignItems: 'center'
    },
    confirmButton: {
        width: '100%',
        borderRadius: 8,
        paddingVertical: 6
    }
})

export default Payment;
