import React, { useState, useCallback, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    Dimensions, 
    ScrollView, 
    ActivityIndicator, 
    RefreshControl,
    TouchableOpacity,
    Image
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const chartConfig = {
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
        borderRadius: 16
    },
    propsForDots: {
        r: "4",
        strokeWidth: "2",
        stroke: "#000000"
    },
    fillShadowGradient: "#F472B6",
    fillShadowGradientOpacity: 0.2,
};

const StatCard = ({ title, value, color, progress, dark }) => (
    <View style={[styles.card, dark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardValue, dark ? styles.textWhite : styles.textDark]}>{value}</Text>
        <Text style={[styles.cardTitle, dark ? styles.textGray : styles.textGrayLight]}>{title}</Text>
        
        <View style={styles.progressContainer}>
            <Text style={[styles.progressText, dark ? styles.textGray : styles.textGrayLight]}>0%</Text>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
            </View>
            <Text style={[styles.progressText, dark ? styles.textGray : styles.textGrayLight]}>{progress}%</Text>
        </View>
    </View>
);

const Dashboard = (props) => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("Weekly");

    // Stats
    const [totalSales, setTotalSales] = useState(0);
    const [salesData, setSalesData] = useState({
        labels: ["S", "M", "T", "W", "T", "F", "S"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }, { data: [0, 0, 0, 0, 0, 0, 0], color: (opacity = 1) => `rgba(244, 114, 182, ${opacity})` }] // Pink line
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(token).then(() => setRefreshing(false));
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem("jwt")
                .then((res) => {
                    setToken(res);
                    fetchData(res);
                })
                .catch((error) => console.log(error));

            return () => {
                setOrders([]);
                setProducts([]);
                setUsers([]);
            };
        }, [])
    );

    const fetchData = async (jwt) => {
        const currentToken = jwt || token;
        setLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${currentToken}` }
            };

            const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
                axios.get(`${baseURL}products`),
                axios.get(`${baseURL}orders`, config),
                axios.get(`${baseURL}users`, config)
            ]);

            if (productsRes.status === 'fulfilled') {
                setProducts(productsRes.value.data);
            }

            if (ordersRes.status === 'fulfilled') {
                const ordersData = ordersRes.value.data;
                setOrders(ordersData);
                const total = ordersData.reduce((acc, order) => acc + order.totalPrice, 0);
                setTotalSales(total);
                processChartData(ordersData);
            }

            if (usersRes.status === 'fulfilled') {
                setUsers(usersRes.value.data);
            } else {
                setUsers([]);
            }

        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const processChartData = (ordersData) => {
        // Mocking curve data for demo purposes as we don't have enough historical data usually
        // Real implementation would group by day of week
        const mockData1 = [40, 25, 30, 15, 40, 16, 17]; // Black line
        const mockData2 = [35, 20, 55, 30, 60, 30, 32]; // Pink line
        
        setSalesData({
            labels: ["S", "M", "T", "W", "T", "F", "S"],
            datasets: [
                { data: mockData1, color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, strokeWidth: 3 },
                { data: mockData2, color: (opacity = 1) => `rgba(244, 114, 182, ${opacity})`, strokeWidth: 3 }
            ]
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <View style={styles.avatarContainer}>
                     <Image 
                        source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }} 
                        style={styles.avatar} 
                    />
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#000000" style={{ marginTop: 20 }} />
                ) : (
                    <>
                        <View style={styles.cardsContainer}>
                            <TouchableOpacity style={styles.cardWrapper} onPress={() => props.navigation.navigate("Products")}>
                                <StatCard 
                                    title="Total Products" 
                                    value={products.length} 
                                    color="#9CA3AF" 
                                    progress={30} 
                                    dark={true} 
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cardWrapper} onPress={() => props.navigation.navigate("Orders")}>
                                <StatCard 
                                    title="Total Orders" 
                                    value={orders.length} 
                                    color="#3B82F6" 
                                    progress={70} 
                                    dark={false} 
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cardWrapper} onPress={() => props.navigation.navigate("Users")}>
                                <StatCard 
                                    title="Total Clients" 
                                    value={users.length > 0 ? users.length : '0'} 
                                    color="#9CA3AF" 
                                    progress={70} 
                                    dark={false} 
                                />
                            </TouchableOpacity>
                            <View style={styles.cardWrapper}>
                                <StatCard 
                                    title="Revenue" 
                                    value={`$${totalSales.toFixed(0)}`} 
                                    color="#F472B6" 
                                    progress={70} 
                                    dark={false} 
                                />
                            </View>
                        </View>

                        <View style={styles.chartSection}>
                            <View style={styles.chartHeader}>
                                <Text style={styles.sectionTitle}>Revenue</Text>
                                <View style={styles.tabContainer}>
                                    {["Monthly", "Weekly", "Today"].map((tab) => (
                                        <TouchableOpacity 
                                            key={tab} 
                                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                                            onPress={() => setActiveTab(tab)}
                                        >
                                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            
                            <LineChart
                                data={salesData}
                                width={width - 40}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                withInnerLines={true}
                                withOuterLines={false}
                                withVerticalLines={false}
                                withHorizontalLines={true}
                                withShadow={false}
                            />
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Bottom Tab Simulation for Admin - Visual only as we are in Stack */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="grid" size={24} color="#000" />
                    <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="stats-chart-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => props.navigation.navigate("Orders")}>
                    <Ionicons name="list-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="settings-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Settings</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: "#F9FAFB",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#111827",
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#E5E7EB",
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    cardsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    cardWrapper: {
        width: "48%",
        marginBottom: 16,
    },
    card: {
        borderRadius: 20,
        padding: 16,
        height: 140,
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardDark: {
        backgroundColor: "#1F2937",
    },
    cardLight: {
        backgroundColor: "#FFFFFF",
    },
    cardValue: {
        fontSize: 24,
        fontWeight: "bold",
    },
    cardTitle: {
        fontSize: 14,
        marginTop: 4,
    },
    textWhite: {
        color: "#FFFFFF",
    },
    textDark: {
        color: "#111827",
    },
    textGray: {
        color: "#9CA3AF",
    },
    textGrayLight: {
        color: "#6B7280",
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 10,
    },
    progressText: {
        fontSize: 10,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: "rgba(0,0,0,0.05)",
        borderRadius: 3,
        marginHorizontal: 8,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 3,
    },
    chartSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#F3F4F6",
        borderRadius: 20,
        padding: 4,
    },
    tab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    activeTab: {
        backgroundColor: "#1F2937",
    },
    tabText: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },
    activeTabText: {
        color: "#FFFFFF",
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
        paddingRight: 0,
        paddingLeft: 0,
    },
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    navItem: {
        alignItems: "center",
    },
    navText: {
        fontSize: 10,
        marginTop: 4,
        color: "#9CA3AF",
        fontWeight: "600",
    },
    navTextActive: {
        color: "#000000",
    },
});

export default Dashboard;
