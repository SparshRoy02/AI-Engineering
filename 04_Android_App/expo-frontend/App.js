import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import ChatScreen from './src/screens/ChatScreen';
import VoiceAssistantScreen from './src/screens/VoiceAssistantScreen';
import OCRScannerScreen from './src/screens/OCRScannerScreen';
import DocumentSummarizerScreen from './src/screens/DocumentSummarizerScreen';
import ImageCaptionScreen from './src/screens/ImageCaptionScreen';
import AINotesScreen from './src/screens/AINotesScreen';
import TaskPlannerScreen from './src/screens/TaskPlannerScreen';

const Tab = createBottomTabNavigator();

const tabs = [
  { name: 'Chat',      component: ChatScreen,              icon: 'chatbubble-ellipses' },
  { name: 'Voice',     component: VoiceAssistantScreen,    icon: 'mic' },
  { name: 'OCR',       component: OCRScannerScreen,        icon: 'scan' },
  { name: 'Summarize', component: DocumentSummarizerScreen,icon: 'document-text' },
  { name: 'Caption',   component: ImageCaptionScreen,      icon: 'image' },
  { name: 'Notes',     component: AINotesScreen,           icon: 'create' },
  { name: 'Tasks',     component: TaskPlannerScreen,       icon: 'checkmark-circle' },
];

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
            borderTopWidth: 1,
            paddingTop: 6,
            paddingBottom: 6,
            height: 62,
          },
          tabBarActiveTintColor: '#a5b4fc',
          tabBarInactiveTintColor: '#475569',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarIcon: ({ color, size, focused }) => {
            const tab = tabs.find(t => t.name === route.name);
            const iconName = tab?.icon || 'apps';
            return (
              <Ionicons
                name={focused ? iconName : `${iconName}-outline`}
                size={size}
                color={color}
              />
            );
          },
        })}
      >
        {tabs.map(tab => (
          <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
