import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import store from './backend/Redux/store';
import Toast from 'react-native-toast-message';
import Auth from './backend/Context/Store/Auth';
import DrawerNavigator from './backend/Navigators/DrawerNavigator';
import CartSync from './backend/Context/Store/CartSync';
import CartSQLiteSync from './backend/Context/Store/CartSQLiteSync';
import NotificationHandler from './Shared/NotificationHandler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Auth>
        <Provider store={store}>
          <CartSQLiteSync />
          <CartSync />
          <NavigationContainer>
            <StatusBar style="dark" />
            <NotificationHandler />
            <DrawerNavigator />
            <Toast />
          </NavigationContainer>
        </Provider>
      </Auth>
    </GestureHandlerRootView>
  );
}
