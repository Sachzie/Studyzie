import React, { useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    Image,
    TouchableOpacity,
    Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

var { width } = Dimensions.get("window");

const ListItem = (props) => {
    const { item, index, dark } = props;

    return (
        <View 
            style={[
                styles.container, 
                dark ? styles.cardDark : styles.cardLight,
                { marginBottom: 10, borderRadius: 10 }
            ]}
        >
            <Image
                source={{
                    uri: item.image
                        ? item.image
                        : 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png'
                }}
                resizeMode="contain"
                style={styles.image}
            />
            
            <View style={styles.body}>
                <Text style={[styles.title, dark ? styles.textWhite : styles.textDark]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.subtitle, dark ? styles.textGray : styles.textGrayLight]} numberOfLines={1}>
                    {item.brand} | {item.category ? item.category.name : 'No Category'}
                </Text>
                <View style={styles.stockContainer}>
                     <View style={[
                         styles.stockBadge, 
                         { backgroundColor: item.countInStock > 0 ? '#10B981' : '#EF4444' }
                     ]}>
                         <Text style={styles.stockText}>
                             {item.countInStock > 0 ? `In Stock: ${item.countInStock}` : 'Out of Stock'}
                         </Text>
                     </View>
                </View>
            </View>
            
            <View style={styles.priceContainer}>
                 <Text style={styles.price}>
                     $ {item.price}
                 </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 10,
        width: width - 40,
        alignSelf: "center",
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        alignItems: "center"
    },
    cardDark: {
        backgroundColor: "#1F2937",
    },
    cardLight: {
        backgroundColor: "white",
    },
    image: {
        borderRadius: 10,
        width: 60,
        height: 60,
        marginRight: 15,
        backgroundColor: 'transparent'
    },
    body: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 4
    },
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    stockText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold'
    },
    priceContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingLeft: 10
    },
    price: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#10B981"
    },
    textWhite: {
        color: "white"
    },
    textDark: {
        color: "#111827"
    },
    textGray: {
        color: "#9CA3AF"
    },
    textGrayLight: {
        color: "#6B7280"
    }
})

export default ListItem;