import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {Drawer} from 'react-native-paper';

const DrawerContent = () => {
  const [active, setActive] = useState('');
  const navigation = useNavigation();

  return (
    <Drawer.Section title="Studyzie">
      <Drawer.Item
        label="My Profile"
        onPress={() => navigation.navigate('User', {screen: 'User Profile'})}
        icon="account"
      />
    </Drawer.Section>
  );
};

export default DrawerContent;
