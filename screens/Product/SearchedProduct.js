import React from 'react';
import { View, StyleSheet, Dimensions, } from 'react-native'

import { FlatList, TouchableOpacity } from 'react-native';
import { Surface, Text, Avatar, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import baseURL from "../assets/common/baseurl";
var { width } = Dimensions.get("window")
const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");
const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const resolveImageUri = (rawUri) => {
    if (!rawUri) return "";
    if (/^https?:\/\//i.test(rawUri)) {
        try {
            const url = new URL(rawUri);
            if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
                return `${API_ORIGIN}${url.pathname}`;
            }
            return rawUri;
        } catch (e) {
            return rawUri;
        }
    }

    if (rawUri.startsWith("/")) {
        return `${API_ORIGIN}${rawUri}`;
    }

    return `${API_ORIGIN}/public/uploads/${rawUri}`;
};

const SearchedProduct = ({ productsFiltered }) => {
    const navigation = useNavigation();
    return (

        <View style={{ width: width }}>
            {productsFiltered.length > 0 ? (

                <Surface >
                    <FlatList
                        data={productsFiltered}
                        renderItem={({ item }) =>
                            <TouchableOpacity
                                style={{ width: '50%' }}
                                onPress={() => navigation.navigate("Product Detail", { item })}
                            >
                                <Surface width="90%">
                                    <Avatar.Image size={24}
                                        source={{
                                            uri: resolveImageUri(item?.image || "") || FALLBACK_IMAGE
                                        }} />
                                    <Text variant="labelMedium">{item.name}</Text>
                                    <Text variant="labelMedium">{item.description}</Text>
                                    <Divider />
                                    <Text variant="labelMedium">
                                        {item.price}
                                    </Text>
                                </Surface>

                            </TouchableOpacity>}

                        keyExtractor={item => item._id} />
                </Surface >
            ) : (
                <View style={styles.center}>
                    <Text style={{ alignSelf: 'center' }}>
                        No products match the selected criteria
                    </Text>
                </View>
            )}
        </View >

    );
};


const styles = StyleSheet.create({
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 100
    },
    listContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        flexWrap: "wrap",
        backgroundColor: "#FFF8E1",
    },
})

export default SearchedProduct;
