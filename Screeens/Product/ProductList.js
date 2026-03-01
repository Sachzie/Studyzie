import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import ProductCard from "./ProductCard";
var { width } = Dimensions.get("window")

const ProductList = (props) => {
    const { item } = props;
    return (
        <View style={styles.column}>
            <View style={styles.cardWrap}>
                <ProductCard {...item} />
            </View>
        </View>
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
