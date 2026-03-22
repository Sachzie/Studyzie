import React, { useEffect, useState, useContext, useMemo } from 'react'
import { View, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native'
import { Button } from 'react-native-paper'
import FormContainer from '../Shared/FormContainer'
import Input from '../Shared/Input'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'
import AuthGlobal from '../../backend/Context/Store/AuthGlobal'
import Toast from 'react-native-toast-message'
import axios from 'axios'
import baseURL from '../assets/common/baseurl'

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
    const [promoCode, setPromoCode] = useState('')
    const [promoPercent, setPromoPercent] = useState(0)
    const [promoStatus, setPromoStatus] = useState(null)

    const navigation = useNavigation()
    const cartItems = useSelector(state => state.cartItems)
    const context = useContext(AuthGlobal);

    const subtotal = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const price = Number(item?.price) || 0
            const quantity = Number(item?.quantity) || 1
            return sum + price * quantity
        }, 0)
    }, [cartItems])

    const discountValue = useMemo(() => {
        if (!promoPercent) return 0
        return subtotal * (promoPercent / 100)
    }, [promoPercent, subtotal])

    const total = Math.max(subtotal - discountValue, 0)

    const formatPeso = (value) =>
        `\u20B1${Number(value || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`

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

        const appliedCode = promoPercent > 0 ? promoCode.trim().toUpperCase() : ""

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
            promoCode: appliedCode,
            discountPercent: promoPercent,
            discountValue: discountValue,
            subtotal: subtotal,
        }
        navigation.navigate("Payment", { order })
    }

    const applyPromoCode = async () => {
        const code = promoCode.trim().toUpperCase()
        if (!code) {
            setPromoPercent(0)
            setPromoStatus({ type: "error", message: "Please enter a promo code." })
            return
        }

        try {
            const response = await axios.get(`${baseURL}promotions/validate`, {
                params: { code }
            })
            if (response?.data?.valid && response.data.promotion?.discountAmount) {
                setPromoPercent(Number(response.data.promotion.discountAmount) || 0)
                setPromoStatus({ type: "success", message: `Promo ${code} applied!` })
            } else {
                setPromoPercent(0)
                setPromoStatus({ type: "error", message: response?.data?.message || "Invalid promo code." })
            }
        } catch (error) {
            setPromoPercent(0)
            setPromoStatus({ type: "error", message: "Unable to validate promo code right now." })
        }
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

                <View style={styles.promoSection}>
                    <Text style={styles.promoTitle}>Promotion Code</Text>
                    <View style={styles.promoRow}>
                        <TextInput
                            style={styles.promoInput}
                            placeholder="Enter promo code"
                            value={promoCode}
                            autoCapitalize="characters"
                            onChangeText={(text) => {
                                setPromoCode(text)
                                setPromoStatus(null)
                            }}
                        />
                        <TouchableOpacity style={styles.promoButton} onPress={applyPromoCode}>
                            <Text style={styles.promoButtonText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                    {promoStatus?.message ? (
                        <Text style={[
                            styles.promoStatus,
                            promoStatus.type === "success" ? styles.promoSuccess : styles.promoError
                        ]}>
                            {promoStatus.message}
                        </Text>
                    ) : null}
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatPeso(subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Discount</Text>
                        <Text style={styles.summaryValue}>- {formatPeso(discountValue)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryTotalLabel}>Total</Text>
                        <Text style={styles.summaryTotalValue}>{formatPeso(total)}</Text>
                    </View>
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
    promoSection: {
        width: '80%',
        alignSelf: 'center',
        marginBottom: 16,
    },
    promoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    promoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    promoInput: {
        flex: 1,
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
    },
    promoButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#103B28',
    },
    promoButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    promoStatus: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
    },
    promoSuccess: {
        color: '#16A34A',
    },
    promoError: {
        color: '#DC2626',
    },
    summaryCard: {
        width: '80%',
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '700',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    summaryTotalLabel: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '800',
    },
    summaryTotalValue: {
        fontSize: 16,
        color: '#103B28',
        fontWeight: '800',
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
