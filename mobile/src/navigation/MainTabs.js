import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/auctions/HomeScreen';
import { ActivitiesScreen } from '../screens/activities/ActivitiesScreen';
import { ItemsScreen } from '../screens/items/ItemsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors, fonts } from '../theme';

const Tab = createBottomTabNavigator();

function TabBarIcon({ name, color, size = 26 }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brown,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.regular, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.lavender,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Subastas',
          tabBarIcon: ({ color }) => <TabBarIcon name="gavel" color={color} />,
        }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesScreen}
        options={{
          title: 'Actividades',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
        }}
      />
      <Tab.Screen
        name="Items"
        component={ItemsScreen}
        options={{
          title: 'Artículos',
          tabBarIcon: ({ color }) => <TabBarIcon name="inventory-2" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
