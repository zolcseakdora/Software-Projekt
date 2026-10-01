import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthScreen } from '@/screens/auth-screen';
import { HomeScreen } from '@/screens/home-screen';
import { LanguageSelectionScreen } from '@/screens/language-selection-screen';
import { VerificationPendingScreen } from '@/screens/verification-pending-screen';

import { Toast } from '@/components/feedback/toast';

import i18n from '@/i18n';
import { auth, db } from '@/src/config/firebase';
import { useAuth } from '@/src/context/AuthContext';

export default function App() {
const { t } = useTranslation();
const router = useRouter();
const { profile, isLoggedIn, login, register, logout } = useAuth();

const [toastMessage, setToastMessage] = useState('');
const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
const [isToastVisible, setIsToastVisible] = useState(false);

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  setToastMessage(message);
  setToastType(type);
  setIsToastVisible(true);
};
const [language, setLanguage] = useState<'hu' | 'en' | null>(null);
const [isLoginMode, setIsLoginMode] = useState<boolean>(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [securePassword, setSecurePassword] = useState(true);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });


  const userRole = profile?.role ?? 'Csapattag';
  const hasIgazolas = Boolean(profile?.igazolas);
  const isVerified = profile?.isVerified ?? false;
  const safeRole = userRole.toLowerCase();
  const isOrganizerOrHead = safeRole.includes('szervez');
  const showIgazolasUpload = safeRole.includes('csapat') || safeRole.includes('kapitany') || safeRole.includes('kapitány');
  const isCaptainOrDeputy = safeRole.includes('kapitany') || safeRole.includes('kapitány');

  const handleSelectLanguage = (nextLanguage: 'hu' | 'en') => {
    void i18n.changeLanguage(nextLanguage).then(() => setLanguage(nextLanguage));
  };

  useEffect(() => {
    const targetDate = new Date('2027-05-20T00:00:00');
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        setTimeLeft({ days, hours, minutes });
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const resetForm = () => { setFullName(''); setEmail(''); setPassword(''); setTeamName(''); setSecurePassword(true); };

  const handleRegister = async () => {
    if (!fullName || !email || !password) return showToast(t('alerts.requiredFields'), 'error');
    try { await register({ name: fullName, email, password, team: teamName }); }
    catch (error: any) { showToast(t('alerts.generic', { message: error.message }), 'error'); }
  };

  const handleLogin = async () => {
    if (!email || !password) return showToast(t('alerts.emailPasswordRequired'), 'error');
    try { await login(email, password); } catch { showToast(t('alerts.wrongCredentials'), 'error'); }
  };

  const handleLogout = () => { void logout(); resetForm(); };

  const handleUploadIgazolas = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) return showToast(t('alerts.permissionRequired'), 'error');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.1, base64: true });
      if (!result.canceled && result.assets[0].base64 && auth.currentUser) {
        const imgStr = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (imgStr.length > 1000000) return showToast(t('alerts.imageTooLarge'), 'error');
        await updateDoc(doc(db, "users", auth.currentUser.uid), { igazolas: imgStr, isVerified: false });
        showToast(t('alerts.idUploaded'), 'success');
      }
    } catch (e: any) { showToast(t('alerts.generic', { message: e.message }), 'error'); }
  };

  // 1. Meghatározzuk, hogy éppen melyik képernyőt kell mutatni
  let activeScreen = null;

  if (!language) {
    activeScreen = <LanguageSelectionScreen onSelectLanguage={handleSelectLanguage} />;
  } else if (!isLoggedIn) {
    activeScreen = (
      <AuthScreen
        isLoginMode={isLoginMode}
        fullName={fullName}
        teamName={teamName}
        email={email}
        password={password}
        securePassword={securePassword}
        onFullNameChange={setFullName}
        onTeamNameChange={setTeamName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTogglePassword={() => setSecurePassword(!securePassword)}
        onSubmit={isLoginMode ? handleLogin : handleRegister}
        onToggleMode={() => { setIsLoginMode(!isLoginMode); resetForm(); }}
      />
    );
  } else if (isLoggedIn && !isVerified && userRole !== 'Főszervező') {
    activeScreen = <VerificationPendingScreen hasIgazolas={hasIgazolas} onUploadIgazolas={handleUploadIgazolas} onLogout={handleLogout} />;
  } else {
    activeScreen = (
      <HomeScreen
        userRole={userRole}
        timeLeft={timeLeft}
        showIgazolasUpload={showIgazolasUpload}
        hasIgazolas={hasIgazolas}
        isVerified={isVerified}
        isCaptainOrDeputy={isCaptainOrDeputy}
        isOrganizerOrHead={isOrganizerOrHead}
        onOpenProfile={() => router.push('/profile')}
        onLogout={handleLogout}
        onUploadIgazolas={handleUploadIgazolas}
        onOpenSchedule={() => router.push('/schedule/index')}
        onOpenTeams={() => router.push('/teams/index')}
        onOpenMap={() => router.push('/map')}
        onOpenGallery={() => router.push('/gallery/index')}
        onOpenPhotoHunt={() => router.push('/photo-hunt')}
        onOpenTeamManagement={() => router.push('/team-management')}
        onOpenRegisteredUsers={() => router.push('/users')}
        onOpenAdmin={() => router.push('/admin')}
      />
    );
  }

  // 2. A VÉGLEGES, EGYETLEN RETURN, ami mindig tartalmazza a Toast-ot is a képernyő felett!
  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      {activeScreen}
      <Toast 
        message={toastMessage} 
        type={toastType} 
        visible={isToastVisible} 
        onHide={() => setIsToastVisible(false)} 
      />
    </View>
  );
}