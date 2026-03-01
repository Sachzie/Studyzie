import React, { useEffect, useState, useContext } from 'react'
import { View, StyleSheet } from 'react-native'
import { Button } from 'react-native-paper'
import FormContainer from '../Shared/FormContainer'
import Input from '../Shared/Input'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'
import AuthGlobal from '../../backend/Context/Store/AuthGlobal'
import Toast from 'react-native-toast-message'

const countries = require("../assets/data/countries.json");

const Checkout = (props) => {
    const [user, setUser] = useState('')
    const [orderItems, setOrderItems] = useState([])
    const [address, setAddress] = useState('')
    const [address2, setAddress2] = useState('')
    const [city, setCity] = useState('')
    const [zip, setZip] = useState('')
    const [country, setCountry] = useState('Philippines')
    const [phone, setPhone] = useState('')

    const navigation = useNavigation()
    const cartItems = useSelector(state => state.cartItems)
    const context = useContext(AuthGlobal);

    useEffect(() => {
        setOrderItems(cartItems)
        if (context.stateUser.isAuthenticated) {
            setUser(context.stateUser.user.userId)
        } else {
            navigation.navigate("User", { screen: 'Login' });
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please Login to Checkout",
                text2: ""
            });
        }

        return () => {
            setOrderItems();
        }
    }, [])

    const checkOut = () => {
        if (!phone || !address || !city || !zip) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Missing Information",
                text2: "Please fill in all required fields."
            });
            return;
        }

        let order = {
            city,
            country,
            dateOrdered: Date.now(),
            orderItems,
            phone,
            shippingAddress1: address,
            shippingAddress2: address2,
            status: "3",
            user,
            zip,
        }
        navigation.navigate("Payment", { order })
    }

    return (
        <KeyboardAwareScrollView
            viewIsInsideTabBar={true}
            extraHeight={200}
            enableOnAndroid={true}
            contentContainerStyle={styles.container}
        >
            <FormContainer title={"Shipping Address"}>
                <Input
                    placeholder={"Phone"}
                    name={"phone"}
                    value={phone}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setPhone(text)}
                />
                <Input
                    placeholder={"Shipping Address 1"}
                    name={"ShippingAddress1"}
                    value={address}
                    onChangeText={(text) => setAddress(text)}
                />
                <Input
                    placeholder={"Shipping Address 2"}
                    name={"ShippingAddress2"}
                    value={address2}
                    onChangeText={(text) => setAddress2(text)}
                />
                <Input
                    placeholder={"City"}
                    name={"city"}
                    value={city}
                    onChangeText={(text) => setCity(text)}
                />
                <Input
                    placeholder={"Zip Code"}
                    name={"zip"}
                    value={zip}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setZip(text)}
                />
                
                <View style={styles.pickerContainer}>
                    <Picker
                        mode="dropdown"
                        selectedValue={country}
                        onValueChange={(e) => setCountry(e)}
                    >
                        {countries.map((c) => {
                            return <Picker.Item key={c.code} label={c.name} value={c.name} />
                        })}
                    </Picker>
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        mode="contained"
                        buttonColor="#103B28"
                        textColor="#FFFFFF"
                        onPress={() => checkOut()}
                        style={styles.confirmButton}
                    >
                        Confirm
                    </Button>
                </View>
            </FormContainer>
        </KeyboardAwareScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F9FAFB'
    },
    pickerContainer: {
        width: '80%',
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginBottom: 20,
        backgroundColor: 'white'
    },
    buttonContainer: {
        width: '80%',
        alignItems: 'center',
        marginBottom: 40
    },
    confirmButton: {
        width: '100%',
        borderRadius: 8,
        paddingVertical: 4
    }
})

export default Checkout;
