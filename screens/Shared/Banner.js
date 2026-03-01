import React, { useState, useEffect } from "react";
import { Image, StyleSheet, Dimensions, View, Text } from "react-native";
import Swiper from "react-native-swiper";

var { width } = Dimensions.get("window");

const Banner = () => {
  const [bannerData, setBannerData] = useState([]);

  useEffect(() => {
    setBannerData([
      {
        image: "https://images.pexels.com/photos/5088009/pexels-photo-5088009.jpeg",
        title: "Back to School",
        subtitle: "Get your essentials now!"
      },
      {
        image: "https://images.pexels.com/photos/4144097/pexels-photo-4144097.jpeg",
        title: "Study Smart",
        subtitle: "Premium supplies for you"
      },
      {
        image: "https://images.pexels.com/photos/4144225/pexels-photo-4144225.jpeg",
        title: "Limited Offer",
        subtitle: "50% off on selected items"
      },
    ]);

    return () => {
      setBannerData([]);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.swiper}>
        <Swiper
          style={{ height: width / 1.8 }}
          showButtons={false}
          autoplay={true}
          autoplayTimeout={5}
          dotColor="#D1FAE5"
          activeDotColor="#103B28"
          paginationStyle={{ bottom: 10 }}
        >
          {bannerData.map((item) => {
            return (
              <View key={item.image} style={styles.slide}>
                <Image
                  style={styles.imageBanner}
                  resizeMode="cover"
                  source={{ uri: item.image }}
                />
                <View style={styles.overlay}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                </View>
              </View>
            );
          })}
        </Swiper>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    marginBottom: 20, // Keep space below the banner
  },
  swiper: {
    width: width,
    alignItems: "center",
    height: width / 1.8,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: width,
    backgroundColor: 'white'
  },
  imageBanner: {
    height: "100%",
    width: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3
  },
  subtitle: {
    color: "#D1FAE5",
    fontSize: 14,
    fontWeight: "500",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3
  }
});

export default Banner;
