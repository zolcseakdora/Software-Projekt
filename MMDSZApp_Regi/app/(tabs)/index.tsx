import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where, deleteDoc } from 'firebase/firestore';import React, { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AdminDashboardScreen } from '@/screens/admin-dashboard-screen';
import { AuthScreen } from '@/screens/auth-screen';
import { GalleryImageScreen } from '@/screens/gallery-image-screen';
import { GalleryScreen } from '@/screens/gallery-screen';
import { HomeScreen } from '@/screens/home-screen';
import { LanguageSelectionScreen } from '@/screens/language-selection-screen';
import { MapScreen } from '@/screens/map-screen';
import { PhotoHuntScreen } from '@/screens/photo-hunt-screen';
import { ProgramDetailsScreen } from '@/screens/program-details-screen';
import { ProfileScreen } from '@/screens/profile-screen';
import { RegisteredUsersScreen } from '@/screens/registered-users-screen';
import { ScheduleScreen } from '@/screens/schedule-screen';
import { TeamManagementScreen } from '@/screens/team-management-screen';
import { TeamsScreen } from '@/screens/teams-screen';
import { VerificationPendingScreen } from '@/screens/verification-pending-screen';

import { Toast } from '@/components/feedback/toast';

import i18n from '@/i18n';
import { EVENT_DAY_LABEL_KEYS } from '@/constants/event-days';
import { auth, db } from '@/src/config/firebase';
import { useAuth } from '@/src/context/AuthContext';

export default function App() {
const { t } = useTranslation();
const { user, profile, isLoggedIn, login, register, logout } = useAuth();

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

  const [currentView, setCurrentView] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [securePassword, setSecurePassword] = useState(true);

  const [registeredUsers, setRegisteredUsers] = useState<Array<any>>([]);
  const [programs, setPrograms] = useState<Array<any>>([]);
  const [mapPoints, setMapPoints] = useState<Array<any>>([]);
  const [galleryImages, setGalleryImages] = useState<Array<any>>([]);
  const [selectedGalleryFolder, setSelectedGalleryFolder] = useState<string | null>(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<any>(null);
  const [photoHuntProgress, setPhotoHuntProgress] = useState<any>({});
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  const [allTeams, setAllTeams] = useState<Array<any>>([]);
  const [teamDescription, setTeamDescription] = useState('');
  const [teamVideoLink, setTeamVideoLink] = useState('');
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [teamFlag, setTeamFlag] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Csapattag' | 'Alcsapatkapitány'>('Csapattag');

  const [selectedCategory, setSelectedCategory] = useState<string>('Szerda');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  const [adminEventTitle, setAdminEventTitle] = useState('');
  const [adminEventTime, setAdminEventTime] = useState('');
  const [adminEventLocation, setAdminEventLocation] = useState('');
  const [adminEventDay, setAdminEventDay] = useState('Szerda');
  const [isUploading, setIsUploading] = useState(false);

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [showPending, setShowPending] = useState(false);

  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');

  const userRole = profile?.role ?? 'Csapattag';
  const sessionName = profile?.name ?? '';
  const sessionTeam = profile?.team ?? '';
  const profileImage = profile?.profileImage ?? null;
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

  const handleLogout = () => { void logout(); setCurrentView(null); setSelectedProgram(null); setSelectedGalleryFolder(null); setSelectedGalleryImage(null); resetForm(); };

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

  const handleUploadProfileImage = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) return showToast(t('alerts.permissionRequired'), 'error');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.1, base64: true });
      if (!result.canceled && result.assets[0].base64 && auth.currentUser) {
        const imgStr = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (imgStr.length > 1000000) return showToast(t('alerts.imageTooLarge'), 'error');
        await updateDoc(doc(db, "users", auth.currentUser.uid), { profileImage: imgStr });
        showToast(t('alerts.profileUpdated'), 'success');
      }
    } catch (e: any) { showToast(t('alerts.generic', { message: e.message }), 'error'); }
  };

  const handleUploadGalleryImage = async (folderName: string) => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) return showToast(t('alerts.permissionRequired'), 'error');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.15, base64: true });
      if (!result.canceled && result.assets && result.assets.length > 0 && auth.currentUser) {
        for (let asset of result.assets) {
          if (asset.base64) {
            const imgStr = `data:image/jpeg;base64,${asset.base64}`;
            if (imgStr.length <= 1000000) {
              await addDoc(collection(db, "gallery"), { 
                image: imgStr, 
                category: folderName, 
                uploadedBy: sessionName || 'Névtelen', 
                createdAt: new Date() 
              });
            }
          }
        }
        showToast(t('alerts.galleryUploaded', { count: result.assets.length, folder: folderName }), 'success');
        fetchGallery(folderName);
      }
    } catch (e: any) { showToast(t('alerts.generic', { message: e.message }), 'error'); }
  };

  const handleUploadPhotoHunt = async (taskId: number) => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) return showToast(t('alerts.permissionRequired'), 'error');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.1, base64: true });
      if (!result.canceled && result.assets[0].base64 && auth.currentUser) {
        const fileStr = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (fileStr.length > 1000000) return showToast(t('alerts.photoTooLarge'), 'error');
        await setDoc(doc(db, "photohunt_uploads", `${auth.currentUser.uid}_${taskId}`), { taskId: taskId, userId: auth.currentUser.uid, file: fileStr, uploadedAt: new Date() });
        showToast(t('alerts.photoHuntUploaded'), 'success');
        fetchPhotoHuntProgress();
      }
    } catch (e: any) { showToast(t('alerts.generic', { message: e.message }), 'error'); }
  };

  const handleAddAdminEvent = async () => {
    if (!adminEventTitle || !adminEventTime || !adminEventLocation) {
      return showToast(t('alerts.fillProgramFields'), 'error');
    }
    setIsUploading(true);
    try {
      await addDoc(collection(db, "programs"), {
        title: adminEventTitle,
        time: adminEventTime,
        helyszín: adminEventLocation,
        day: adminEventDay,
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid
      });
      const dayKey = EVENT_DAY_LABEL_KEYS[adminEventDay as keyof typeof EVENT_DAY_LABEL_KEYS];
      showToast(t('alerts.programAdded', { day: dayKey ? t(dayKey) : adminEventDay }), 'success');
      setAdminEventTitle('');
      setAdminEventTime('');
      setAdminEventLocation('');
    } catch (error: any) {
      showToast(t('alerts.generic', { message: error.message }), 'error');
    } finally {
      setIsUploading(false);
    }
  };
  const handleDeleteProgram = async (programId: string) => {
      try {
        // Törlés a Firestore-ból
        await deleteDoc(doc(db, "programs", programId));
        
        // Lokális lista frissítése azonnal (hogy eltűnjön a képernyőről)
        setPrograms(prev => prev.filter(p => p.id !== programId));
        
        // Ha épp nyitva volt a részletek nézet, zárjuk be
        if (selectedProgram?.id === programId) {
          setSelectedProgram(null);
        }
      } catch (error: any) {
        console.error("Hiba az esemény törlésekor:", error);
      }
    };
  const fetchPendingUsers = async () => {
    try {
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      const list: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.igazolas) {
          list.push({ id: doc.id, ...data });
        }
      });
      setPendingUsers(list);
      setShowPending(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveId = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { isVerified: true });
      showToast(t('alerts.idApproved'), 'success');
      fetchPendingUsers();
    } catch (error: any) {
      showToast(t('alerts.generic', { message: error.message }), 'error');
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle || !notifBody) return showToast(t('alerts.notificationRequired'), 'error');
    try {
      await addDoc(collection(db, "notifications"), {
        title: notifTitle,
        body: notifBody,
        createdAt: new Date(),
      });
      showToast(t('alerts.notificationSent'), 'success');
      setNotifTitle('');
      setNotifBody('');
    } catch (e: any) {
      showToast(t('alerts.generic', { message: e.message }), 'error');
    }
  };

  const handleSendTeamInvite = async () => {
    if (!inviteEmail || !sessionTeam) return showToast(t('alerts.inviteEmailRequired'), 'error');
    try {
      const translatedInviteRole = inviteRole === 'Csapattag' ? t('roles.member') : t('roles.deputy');
      const inviteEmailBody = t('teamManagement.inviteEmailBody', { teamName: sessionTeam, role: translatedInviteRole });
      // 1. Belső meghívó mentése az appnak (opcionális, de jó ha megmarad)
      await addDoc(collection(db, "invites"), {
        email: inviteEmail,
        team: sessionTeam,
        role: inviteRole,
        invitedBy: sessionName || 'Csapatkapitány',
        createdAt: new Date(),
        status: 'Függőben'
      });

      // 2. VALÓS E-MAIL KÜLDÉSE a Firebase Trigger Email bővítménynek
      await addDoc(collection(db, "mail"), {
        to: inviteEmail,
        message: {
          subject: t('teamManagement.inviteEmailSubject'),
          text: `${t('teamManagement.inviteEmailGreeting')} ${inviteEmailBody} ${t('teamManagement.inviteEmailAction')}`,
          html: `
            <h3>${t('teamManagement.inviteEmailGreeting')}</h3>
            <p>${inviteEmailBody}</p>
            <p>${t('teamManagement.inviteEmailAction')}</p>
          `
        }
      });
      
      showToast(t('alerts.inviteSent', { email: inviteEmail }), 'success');
      setInviteEmail('');
    } catch (e: any) {
      showToast(t('alerts.generic', { message: e.message }), 'error');
    }
  };

  const fetchTeamData = async () => {
    if (!sessionTeam) return;
    try {
      const docRef = doc(db, "teams", sessionTeam);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const d = docSnap.data();
        setTeamDescription(d.description || '');
        setTeamVideoLink(d.videoLink || '');
        setTeamLogo(d.logo || null);
        setTeamFlag(d.flag || null);
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveTeamData = async () => {
    if (!sessionTeam) return showToast(t('alerts.teamNameRequired'), 'error');
    try {
      await setDoc(doc(db, "teams", sessionTeam), { description: teamDescription, videoLink: teamVideoLink, updatedAt: new Date(), name: sessionTeam }, { merge: true });
      showToast(t('alerts.teamSaved'), 'success');
    } catch (e: any) { showToast(t('alerts.generic', { message: e.message }), 'error'); }
  };

  const handleUploadTeamImage = async (type: 'logo' | 'flag') => {
    if (!sessionTeam) return showToast(t('alerts.teamNameRequired'), 'error');
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) return showToast(t('alerts.permissionRequired'), 'error');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.15, base64: true });
      if (!result.canceled && result.assets[0].base64) {
        const imgStr = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (imgStr.length > 1000000) return showToast(t('alerts.teamImageTooLarge'), 'error');
        await setDoc(doc(db, "teams", sessionTeam), { [type]: imgStr, name: sessionTeam }, { merge: true });
        if (type === 'logo') setTeamLogo(imgStr);
        if (type === 'flag') setTeamFlag(imgStr);
        showToast(t(type === 'logo' ? 'alerts.teamLogoUpdated' : 'alerts.teamFlagUpdated'), 'success');
      }
    } catch (e: any) { showToast(t('alerts.generic', { message: e.message }), 'error'); }
  };

  const fetchAllTeams = async () => {
    try {
      const q = query(collection(db, "teams"));
      const snapshot = await getDocs(q);
      const list: any[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setAllTeams(list);
    } catch (e) { console.error(e); }
  };

  const fetchRegisteredUsers = async () => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    setRegisteredUsers(list);
  };

  const getFestivalTimeScore = (timeStr: string) => {
    if (!timeStr) return 99999;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 99999;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h < 7) h += 24;
    return h * 60 + m;
  };

  const fetchPrograms = async () => {
    const q = query(collection(db, "programs"));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    list.sort((a, b) => getFestivalTimeScore(a.time) - getFestivalTimeScore(b.time));
    setPrograms(list);
  };

  const fetchMapPoints = async () => {
    try {
      const snapshot = await getDocs(collection(db, "map_points"));
      const list: any[] = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setMapPoints(list);
    } catch (e) { console.error(e); }
  };

  const fetchGallery = async (folderName: string) => {
    try {
      const q = query(collection(db, "gallery"), where("category", "==", folderName));
      const snapshot = await getDocs(q);
      const list: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.image && data.image.length > 10) list.push({ id: doc.id, ...data });
      });
      setGalleryImages(list);
    } catch (e) { console.error(e); }
  };

  const fetchPhotoHuntProgress = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, "photohunt_uploads"));
      const snapshot = await getDocs(q);
      const progress: any = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.userId === auth.currentUser?.uid) progress[data.taskId] = true;
      });
      setPhotoHuntProgress(progress);
    } catch (e) { console.error(e); }
  };

  const handleDownloadImage = (imageBase64: string) => {
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = imageBase64;
      link.download = `diaknapok_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Linking.openURL(imageBase64).catch(() => showToast(t('alerts.downloadFailed'), 'error'));
    }
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
  } else if (currentView === 'profile') {
    activeScreen = (
      <ProfileScreen
        name={sessionName}
        email={user?.email}
        team={sessionTeam}
        role={userRole}
        profileImage={profileImage}
        hasIgazolas={hasIgazolas}
        isVerified={isVerified}
        onBack={() => setCurrentView(null)}
        onUploadProfileImage={handleUploadProfileImage}
      />
    );
  } else if (currentView === 'allTeams') {
    activeScreen = (
      <TeamsScreen
        teams={allTeams}
        onBack={() => setCurrentView(null)}
        onRefresh={fetchAllTeams}
        onOpenVideo={(videoLink) => {
          if (videoLink) Linking.openURL(videoLink).catch(() => showToast(t('alerts.openLinkFailed'), 'error'));
          else showToast(t('alerts.noTeamVideo'), 'info');
        }}
      />
    );
  } else if (currentView === 'teamManagement') {
    activeScreen = (
      <TeamManagementScreen
        teamName={sessionTeam}
        teamDescription={teamDescription}
        teamVideoLink={teamVideoLink}
        teamLogo={teamLogo}
        teamFlag={teamFlag}
        inviteEmail={inviteEmail}
        inviteRole={inviteRole}
        onBack={() => setCurrentView(null)}
        onRefresh={fetchTeamData}
        onDescriptionChange={setTeamDescription}
        onVideoLinkChange={setTeamVideoLink}
        onUploadTeamImage={handleUploadTeamImage}
        onSaveTeamData={handleSaveTeamData}
        onInviteEmailChange={setInviteEmail}
        onInviteRoleChange={setInviteRole}
        onSendTeamInvite={handleSendTeamInvite}
      />
    );
  } else if (selectedGalleryImage) {
    activeScreen = (
      <GalleryImageScreen
        image={selectedGalleryImage}
        onBack={() => setSelectedGalleryImage(null)}
        onDownloadImage={handleDownloadImage}
      />
    );
  } else if (currentView === 'gallery') {
    activeScreen = (
      <GalleryScreen
        selectedFolder={selectedGalleryFolder}
        images={galleryImages}
        onBack={() => { if (selectedGalleryFolder) setSelectedGalleryFolder(null); else setCurrentView(null); }}
        onRefresh={fetchGallery}
        onSelectFolder={(folder) => { setSelectedGalleryFolder(folder); fetchGallery(folder); }}
        onUploadImage={handleUploadGalleryImage}
        onSelectImage={setSelectedGalleryImage}
      />
    );
  } else if (currentView === 'map') {
    activeScreen = <MapScreen points={mapPoints} onBack={() => setCurrentView(null)} onRefresh={fetchMapPoints} />;
  } else if (selectedProgram) {
    activeScreen = (
      <ProgramDetailsScreen 
        program={selectedProgram} 
        isAdmin={isOrganizerOrHead}
        onDelete={handleDeleteProgram}
        onBack={() => setSelectedProgram(null)} 
      />
    );
  } else if (currentView === 'schedule') {
    activeScreen = (
      <ScheduleScreen
        programs={programs}
        selectedCategory={selectedCategory}
        isAdmin={isOrganizerOrHead}
        onDelete={handleDeleteProgram}
        onBack={() => setCurrentView(null)}
        onRefresh={fetchPrograms}
        onSelectCategory={setSelectedCategory}
        onSelectProgram={setSelectedProgram}
      />
    );
  } else if (currentView === 'photohunt') {
    activeScreen = (
      <PhotoHuntScreen
        progress={photoHuntProgress}
        onBack={() => setCurrentView(null)}
        onRefresh={fetchPhotoHuntProgress}
        onUpload={handleUploadPhotoHunt}
      />
    );
  } else if (currentView === 'usersList') {
    activeScreen = <RegisteredUsersScreen users={registeredUsers} onBack={() => setCurrentView(null)} onRefresh={fetchRegisteredUsers} />;
  } else if (currentView === 'adminDashboard') {
    activeScreen = (
      <AdminDashboardScreen
        adminEventDay={adminEventDay}
        adminEventTitle={adminEventTitle}
        adminEventTime={adminEventTime}
        adminEventLocation={adminEventLocation}
        isUploading={isUploading}
        notifTitle={notifTitle}
        notifBody={notifBody}
        showPending={showPending}
        pendingUsers={pendingUsers}
        onBack={() => setCurrentView(null)}
        onEventDayChange={setAdminEventDay}
        onEventTitleChange={setAdminEventTitle}
        onEventTimeChange={setAdminEventTime}
        onEventLocationChange={setAdminEventLocation}
        onAddEvent={handleAddAdminEvent}
        onNotifTitleChange={setNotifTitle}
        onNotifBodyChange={setNotifBody}
        onSendNotification={handleSendNotification}
        onFetchPendingUsers={fetchPendingUsers}
        onApproveUser={handleApproveId}
      />
    );
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
        onOpenProfile={() => setCurrentView('profile')}
        onLogout={handleLogout}
        onUploadIgazolas={handleUploadIgazolas}
        onOpenSchedule={() => { fetchPrograms(); setCurrentView('schedule'); }}
        onOpenTeams={() => { fetchAllTeams(); setCurrentView('allTeams'); }}
        onOpenMap={() => { fetchMapPoints(); setCurrentView('map'); }}
        onOpenGallery={() => { setSelectedGalleryFolder(null); setCurrentView('gallery'); }}
        onOpenPhotoHunt={() => { fetchPhotoHuntProgress(); setCurrentView('photohunt'); }}
        onOpenTeamManagement={() => { fetchTeamData(); setCurrentView('teamManagement'); }}
        onOpenRegisteredUsers={() => { fetchRegisteredUsers(); setCurrentView('usersList'); }}
        onOpenAdmin={() => setCurrentView('adminDashboard')}
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