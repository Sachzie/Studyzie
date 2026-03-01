import { StatusBar } from 'expo-status-bar';
import Header from './Shared/Header';
import { NavigationContainer } from '@react-navigation/native'
import { Provider } from 'react-redux';
import store from './Redux/store';
import Toast from 'react-native-toast-message';
import Auth from './Context/Store/Auth';
import DrawerNavigator from './Navigators/DrawerNavigator';
import CartSync from './Context/Store/CartSync';

export default function App() {
  return (
    <Auth>
      <Provider store={store}>
        <CartSync />
        <NavigationContainer>
          <StatusBar style="dark" />
          <Header />
          <DrawerNavigator />
          <Toast />
        </NavigationContainer>
      </Provider>
    </Auth>
  );
}
