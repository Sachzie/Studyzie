import React from "react";
import { View, Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ProductCard from "./ProductCard";
var { width } = Dimensions.get("window")

const ProductList = (props) => {
    const { item } = props;
    const navigation = useNavigation();
    
    return (
        <TouchableOpacity 
            style={styles.column}
            onPress={() => navigation.navigate("Product Detail", { item: item })}
        >
            <View style={styles.cardWrap}>
                <ProductCard {...item} />
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    column: {
        width: "50%",
        alignItems: "center",
    },
    cardWrap: {
        width: width / 2 - 8,
        backgroundColor: "transparent",
        alignItems: "center",
    },
});

export default ProductList;
