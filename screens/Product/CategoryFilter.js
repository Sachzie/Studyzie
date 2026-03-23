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
        paddingBottom: 2,
        paddingLeft: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pill: {
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
    },
    activePill: {
        backgroundColor: "#103B28",
        borderColor: "#103B28",
        elevation: 2,
    },
    inactivePill: {
        backgroundColor: "#FFFFFF",
        borderColor: "#E5E7EB",
    },
    pillText: {
        color: "#4B5563",
        fontSize: 13,
        fontWeight: "600",
    },
    activePillText: {
        color: "#FFFFFF",
    },
});

export default CategoryFilter;
