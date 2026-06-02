import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterStep1Screen } from '../screens/auth/RegisterStep1Screen';
import { RegisterStep2Screen } from '../screens/auth/RegisterStep2Screen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { PaymentMethodsScreen } from '../screens/auth/PaymentMethodsScreen';
import { AddPaymentScreen } from '../screens/auth/AddPaymentScreen';
import { MainTabs } from './MainTabs';
import { AuctionDetailScreen } from '../screens/auctions/AuctionDetailScreen';
import { AuctionRoomScreen } from '../screens/auctions/AuctionRoomScreen';
import { WonAuctionScreen } from '../screens/auctions/WonAuctionScreen';
import { DeliveryConfirmationScreen } from '../screens/auctions/DeliveryConfirmationScreen';
import { NewItemScreen } from '../screens/items/NewItemScreen';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterStep1" component={RegisterStep1Screen} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2Screen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
    </Stack.Navigator>
  );
}

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} />
      <Stack.Screen name="AuctionRoom" component={AuctionRoomScreen} />
      <Stack.Screen name="WonAuction" component={WonAuctionScreen} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmationScreen} />
      <Stack.Screen name="NewItem" component={NewItemScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
    </Stack.Navigator>
  );
}
