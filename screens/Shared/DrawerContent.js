import {useNavigation} from '@react-navigation/native';
import React, {useContext, useState} from 'react';
import {Drawer} from 'react-native-paper';
import AuthGlobal from '../../backend/Context/Store/AuthGlobal';

const DrawerContent = () => {
  const [active, setActive] = useState('');
  const navigation = useNavigation();
  const context = useContext(AuthGlobal);
  const isAdmin = Boolean(context?.stateUser?.user?.isAdmin);

  const navigateToProfile = () => {
    if (isAdmin) {
      navigation.navigate('Studyzie', {
        screen: 'AdminTabs',
        params: {screen: 'Settings'},
      });
      return;
    }

    navigation.navigate('Studyzie', {
      screen: 'User',
      params: {screen: 'User Profile'},
    });
  };

  return (
    <Drawer.Section title="Studyzie">
      <Drawer.Item
        label={isAdmin ? 'Admin Settings' : 'My Profile'}
        onPress={navigateToProfile}
        icon="account"
      />
    </Drawer.Section>
  );
};

export default DrawerContent;
