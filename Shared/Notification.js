import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Notification = ({ visible, message, type, onClose }) => {
  const isSuccess = type === 'success';
  const iconName = isSuccess ? 'checkmark-circle' : 'close-circle';
  const backgroundColor = isSuccess ? '#28a745' : '#dc3545'; // Green for success, Red for error
  const slideAnim = new Animated.Value(-100); // Start off-screen

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 40, // Slide down to this position
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 3000); // Auto-dismiss after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -100, // Slide back up
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose(); // Call onClose after animation is complete
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor, transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name={iconName} size={24} color="#fff" style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    flex: 1, // Take up remaining space
  },
  closeButton: {
    marginLeft: 10,
  },
});

export default Notification;
