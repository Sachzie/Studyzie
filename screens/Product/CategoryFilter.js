import React from "react";
import { StyleSheet, TouchableOpacity, ScrollView, View, Text } from "react-native";

const CategoryFilter = (props) => {
    return (
        <ScrollView
            bounces={true}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.row}>
                <TouchableOpacity
                    key={1}
                    onPress={() => {
                        props.categoryFilter("all");
                        props.setActive(-1);
                    }}
                    style={[
                        styles.pill,
                        props.active === -1 ? styles.activePill : styles.inactivePill,
                    ]}
                >
                    <Text
                        style={[
                            styles.pillText,
                            props.active === -1 && styles.activePillText,
                        ]}
                    >
                        All
                    </Text>
                </TouchableOpacity>
                {props.categories.map((item) => (
                    <TouchableOpacity
                        key={item._id}
                        onPress={() => {
                            props.categoryFilter(item._id);
                            props.setActive(props.categories.indexOf(item));
                        }}
                        style={[
                            styles.pill,
                            props.active === props.categories.indexOf(item) ? styles.activePill : styles.inactivePill
                        ]}
                    >
                        <Text
                            style={[
                                styles.pillText,
                                props.active === props.categories.indexOf(item) && styles.activePillText,
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 0,
        paddingLeft: 4, // Align with layout
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pill: {
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "transparent",
    },
    activePill: {
        backgroundColor: "#103B28", // Dark Green active state
        borderColor: "#103B28",
        elevation: 2,
    },
    inactivePill: {
        backgroundColor: "#FFFFFF",
        borderColor: "#E5E7EB",
    },
    pillText: {
        color: "#4B5563",
        fontSize: 14,
        fontWeight: "600",
    },
    activePillText: {
        color: "#FFFFFF",
    },
});

export default CategoryFilter;
