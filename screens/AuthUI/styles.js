import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const colors = {
    primary: '#8D7B68',
    secondary: '#A4907C',
    light: '#C8B6A6',
    lighter: '#F1DEC9',
    white: '#FFFFFF',
    text: '#333333',
    textLight: '#666666',
    error: '#EF4444',
    success: '#10B981',
    inputBg: '#FAF5F0',
    placeholder: '#A4907C',
    overlay: 'rgba(255, 255, 255, 0.9)'
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor removed to allow Gradient
        justifyContent: 'center',
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
        overflow: 'hidden',
    },
    slideContainer: {
        flexDirection: 'row',
        width: width * 2,
        height: '100%',
        alignItems: 'center',
    },
    screen: {
        width: width,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        width: '90%', // Reduced width for better mobile fit
        backgroundColor: 'rgba(255, 255, 255, 0.3)', 
        borderRadius: 20, 
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 0,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px)',
    },
    // New Styles for Animation
    toggleButtonContainer: {
        position: 'absolute',
        bottom: 40,
        width: width * 0.8,
        height: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 30,
        flexDirection: 'row',
        alignSelf: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        padding: 5,
        zIndex: 10
    },
    toggleIndicator: {
        position: 'absolute',
        width: '50%',
        height: '100%',
        borderRadius: 25,
        top: 5,
        left: 5,
        // Background color handled by LinearGradient or animated style
    },
    toggleItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        borderRadius: 25,
    },
    toggleItemText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    
    // Existing styles...
    logoContainer: {
        marginBottom: 10, 
        alignItems: 'center',
    },
    logo: {
        width: 70, 
        height: 70, 
        marginBottom: 5,
    },
    title: {
        fontSize: 22, 
        fontWeight: '800',
        color: colors.primary,
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13, 
        color: colors.secondary,
        marginBottom: 15, 
        textAlign: 'center',
        lineHeight: 18,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 10, 
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12, 
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        height: 48, 
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: 14, // Reduced font size
        height: '100%',
    },
    button: {
        width: '100%',
        marginTop: 15, 
        borderRadius: 12, 
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 14, 
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    buttonText: {
        fontSize: 15, 
        fontWeight: 'bold',
        color: colors.white,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    toggleContainer: {
        marginTop: 15, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex' 
    },
    toggleText: {
        color: colors.textLight,
        fontSize: 12, 
    },
    toggleButton: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 12, 
        marginLeft: 5,
        textDecorationLine: 'underline',
    },
    errorText: {
        color: colors.error,
        marginTop: 5,
        marginBottom: 8,
        textAlign: 'center',
        fontSize: 11, 
        fontWeight: '600'
    },
    imageContainer: {
        width: 90, 
        height: 90, 
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15, 
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    imageBlock: {
        width: '100%',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
        gap: 8,
        alignSelf: 'center',
    },
    imageAction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.9)',
    },
    imageActionText: {
        marginLeft: 6,
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    circle1: {
        position: 'absolute',
        top: -80,
        left: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    circle2: {
        position: 'absolute',
        bottom: -100,
        right: -50,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: 'rgba(141, 123, 104, 0.2)',
    },
    circle3: {
        position: 'absolute',
        top: height * 0.4,
        right: -60,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(164, 144, 124, 0.15)',
    }
});

export { styles, colors };
