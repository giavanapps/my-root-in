import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Modal, Alert, Dimensions, Platform, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState, Profile } from '../../store/AppStateContext';
import { db } from '../../store/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { NotificationService } from '../../store/NotificationService';
import * as Notifications from 'expo-notifications';
import { Button } from '../../components/common/Button';
import { avatarList, avatarImageMap } from '../onboarding/DiagnosticScreen';
import { TimePickerModal } from '../../components/common/TimePickerModal';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  onRefireDiagnostic: () => void;
  onLogoutPress: () => void;
  onGoBackToHome?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onRefireDiagnostic, onLogoutPress, onGoBackToHome }) => {
  const {
    profiles,
    activeProfileId,
    activeProfile,
    selectProfile,
    renameProfile,
    changeAvatar,
    deleteProfile,
    updateNotificationsSetting,
    themeMode,
    toggleThemeMode,
    masterEmail,
    updateMasterAccount,
    deleteMasterAccount,
    completePorosity
  } = useAppState();

  // Collapsible panels state
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Edit fields state for multiple profiles
  const [profileNamesMap, setProfileNamesMap] = useState<{[key: string]: string}>({});
  const [targetAvatarProfileId, setTargetAvatarProfileId] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  // Notification states
  const [notifEnabled, setNotifEnabled] = useState(activeProfile?.notifications?.enabled ?? true);
  const [notifTime, setNotifTime] = useState(activeProfile?.notifications?.time ?? '08:30');
  const [notifTone, setNotifTone] = useState<any>(activeProfile?.notifications?.tone ?? 'Motivant');

  // Master account states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newEmail, setNewEmail] = useState(masterEmail);
  const [newPass, setNewPass] = useState('••••••••');

  // Porosity edit modal state
  const [showPorosityEditModal, setShowPorosityEditModal] = useState(false);

  // Native permissions state checkup
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('granted');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Beta Feedback States
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<'Oui' | 'Non' | 'Pas totalement' | null>(null);
  const [q2Text, setQ2Text] = useState('');
  const [q3, setQ3] = useState<'Oui' | 'Non' | null>(null);
  const [q4, setQ4] = useState<'Oui, souvent' | 'Oui, une ou deux fois' | 'Non' | null>(null);
  const [q5, setQ5] = useState<'Très rapide' | 'Moyen' | 'Lent' | 'Ça a bugué' | null>(null);
  const [q6, setQ6] = useState<number | null>(null);
  const [q6Text, setQ6Text] = useState('');
  const [q7, setQ7] = useState<number | null>(null);
  const [q8, setQ8] = useState('');
  const [q9, setQ9] = useState('');
  const [q10, setQ10] = useState('');
  const [q11, setQ11] = useState<'2,99€' | '4,99€' | '7,99€' | 'Je ne paierais pas' | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!activeProfile) return;
    if (q1 === null || q2 === null || q3 === null || q4 === null || q5 === null || q6 === null || q7 === null || q11 === null) {
      if (Platform.OS === 'web') {
        window.alert("Veuillez répondre à toutes les questions à choix multiples avant d'envoyer.");
      } else {
        Alert.alert("Formulaire incomplet", "Veuillez répondre à toutes les questions à choix multiples avant d'envoyer.");
      }
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await addDoc(collection(db, 'beta_feedbacks'), {
        profileId: activeProfile.id,
        profileName: activeProfile.name,
        submittedAt: new Date().toISOString(),
        answers: {
          q1,
          q2,
          q2Text,
          q3,
          q4,
          q5,
          q6,
          q6Text,
          q7,
          q8,
          q9,
          q10,
          q11,
        }
      });
      setFeedbackSuccess(true);
      // Reset form
      setQ1(null);
      setQ2(null);
      setQ2Text('');
      setQ3(null);
      setQ4(null);
      setQ5(null);
      setQ6(null);
      setQ6Text('');
      setQ7(null);
      setQ8('');
      setQ9('');
      setQ10('');
      setQ11(null);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      if (Platform.OS === 'web') {
        window.alert("Une erreur est survenue lors de l'envoi de ton avis. Réessaie.");
      } else {
        Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de ton avis. Réessaie.");
      }
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const checkNotifPermission = async () => {
    const status = await NotificationService.checkPermissions();
    setPermissionStatus(status);
  };

  React.useEffect(() => {
    checkNotifPermission();
  }, [activeProfileId]);

  if (!activeProfile) return null;

  const togglePanel = (panelName: string) => {
    setActivePanel(prev => prev === panelName ? null : panelName);
    if (panelName === 'notifications') {
      checkNotifPermission();
    }
  };

  // Profile Management Handlers
  const handleTempNameChange = (id: string, text: string) => {
    setProfileNamesMap(prev => ({ ...prev, [id]: text }));
  };

  const handleSaveProfileName = (id: string) => {
    const newName = profileNamesMap[id]?.trim() || profiles.find(p => p.id === id)?.name || '';
    if (newName) {
      renameProfile(id, newName);
      if (Platform.OS === 'web') {
        window.alert(`Nom du profil mis à jour : ${newName}`);
      } else {
        Alert.alert('Profil mis à jour', `Le prénom a été modifié en ${newName}.`);
      }
    }
  };

  const handleSelectAvatar = (emoji: string) => {
    const profileIdToUpdate = targetAvatarProfileId || activeProfile.id;
    changeAvatar(profileIdToUpdate, emoji);
    setTargetAvatarProfileId(null);
    setShowAvatarPicker(false);
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) onConfirm();
    } else {
      Alert.alert(title, message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', style: 'destructive', onPress: onConfirm }
      ]);
    }
  };

  const handleDeleteProfile = (p: Profile) => {
    if (profiles.length <= 1) {
      if (Platform.OS === 'web') {
        window.alert('Impossible de supprimer le seul profil restant.');
      } else {
        Alert.alert('Impossible', 'Vous devez conserver au moins un profil actif.');
      }
      return;
    }
    
    confirmAction(
      'Supprimer le profil',
      `Êtes-vous sûr de vouloir supprimer définitivement le profil de ${p.name} ?`,
      () => {
        deleteProfile(p.id);
        if (Platform.OS === 'web') {
          window.alert(`Le profil de ${p.name} a été supprimé.`);
        } else {
          Alert.alert('Profil supprimé', `Le profil de ${p.name} a été supprimé.`);
        }
      }
    );
  };

  const handleSaveNotifications = async () => {
    if (notifEnabled) {
      const status = await NotificationService.requestPermissions();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert("Note : Les notifications ne sont pas autorisées sur cet appareil.");
        } else {
          Alert.alert("Permission requise", "Les notifications ne sont pas autorisées par votre appareil. Activez-les dans les réglages système pour recevoir les alertes de soins.");
        }
      }
    }
    updateNotificationsSetting(notifEnabled, notifTime, notifTone);
    if (Platform.OS === 'web') {
      window.alert('Notifications sauvegardées : Vos réglages ont été mis à jour.');
    } else {
      Alert.alert('Notifications sauvegardées', 'Vos réglages ont été mis à jour.');
    }
  };

  const handleTestNotification = async () => {
    if (Platform.OS === 'web') {
      window.alert("Test sonore simulé : Pshhht ! Le vaporisateur fonctionne. C'est l'heure de ton soin ! 💨");
      return;
    }
    const status = await NotificationService.requestPermissions();
    if (status !== 'granted') {
      Alert.alert("Permission refusée", "Vous devez autoriser les notifications dans les réglages système pour tester.");
      return;
    }
    
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('my-root-in-reminders-v4', {
          name: 'Rappels de soins Root\'In',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E5A982', // Terracotta
          showBadge: true,
          sound: 'two_pshit.mp3',
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "My Root'In 🌿 Test Sonore",
          body: "Pshhht ! Le vaporisateur fonctionne. C'est l'heure de ton soin ! 💨",
          sound: 'two_pshit.mp3',
          data: { test: true },
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          channelId: 'my-root-in-reminders-v4',
        },
      });

      Alert.alert("Test programmé", "Verrouille ton écran ou place l'application en arrière-plan. La notification va sonner dans 5 secondes ! 💨");
    } catch (error) {
      console.warn("Error scheduling test notification:", error);
      Alert.alert("Erreur", "Impossible de planifier la notification de test.");
    }
  };

  const handleSaveAccount = () => {
    updateMasterAccount(newEmail, newPass);
    setShowAccountModal(false);
    Alert.alert('Compte mis à jour', 'Vos identifiants de compte ont été modifiés.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '🚨 Supprimer le compte Maître',
      'ATTENTION : Cela supprimera définitivement votre compte et TOUS les profils associés de votre famille.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteMasterAccount(onLogoutPress) }
      ]
    );
  };

  const isLight = themeMode === 'light';
  const customBg = isLight ? '#F5F6FA' : colors.background;
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const customInputBg = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.04)';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: customBg }]}>
      {/* 👤 TOP HORIZONTAL SELECTOR */}
      <View style={[styles.profileSelectorContainer, { backgroundColor: customCard, borderColor: customBorder }]}>
        <Text style={[styles.topLabel, { color: isLight ? '#888' : colors.textSecondary }]}>
          Gérer les profils familiaux :
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true} contentContainerStyle={styles.profileScroll}>
          {profiles.map(p => {
            const isActive = p.id === activeProfileId;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.profileAvatarWrapper, isActive && styles.profileAvatarWrapperActive]}
                onPress={() => {
                  selectProfile(p.id);
                  setNotifEnabled(p.notifications?.enabled ?? true);
                  setNotifTime(p.notifications?.time ?? '08:30');
                  setNotifTone(p.notifications?.tone ?? 'Motivant');
                }}
              >
                {avatarImageMap[p.avatar] ? (
                  <Image
                    source={avatarImageMap[p.avatar]}
                    style={styles.profileAvatarEmoji}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.profileAvatarEmoji}>{p.avatar}</Text>
                )}
                <Text style={[styles.profileAvatarName, isActive && styles.profileAvatarNameActive]} numberOfLines={1}>
                  {p.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 🌿 ACTIVE HAIR PROFILE CARD (Fiche d'identité capillaire) */}
        <View style={[styles.identityCard, { backgroundColor: customCard, borderColor: customBorder }]}>
          <View style={styles.identityHeader}>
            {avatarImageMap[activeProfile.avatar] ? (
              <Image
                source={avatarImageMap[activeProfile.avatar]}
                style={{ width: 70, height: 70, borderRadius: 35, marginRight: 16 }}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.identityEmoji}>{activeProfile.avatar}</Text>
            )}
            <View>
              <Text style={[styles.identityName, { color: customText }]}>{activeProfile.name}</Text>
              <Text style={styles.identitySub}>Identité capillaire active</Text>
            </View>
          </View>
          
          <View style={styles.badgeContainer}>
            <View style={styles.badge}><Text style={styles.badgeText}>Texture: {activeProfile.diagnostic.texture}</Text></View>
            <View style={[styles.badge, { backgroundColor: 'rgba(92, 133, 138, 0.1)' }]}><Text style={[styles.badgeText, { color: colors.porosityLow }]}>Porosité: {activeProfile.diagnostic.porosity ?? 'Non définie'}</Text></View>
            {activeProfile.diagnostic.scalpCondition && 
             activeProfile.diagnostic.scalpCondition !== 'Aucune' && 
             activeProfile.diagnostic.scalpCondition !== 'Aucune de ces situations' && (
              <View style={[styles.badge, { backgroundColor: 'rgba(217, 83, 79, 0.1)', borderColor: 'rgba(217, 83, 79, 0.25)', borderWidth: 1 }]}>
                <Text style={[styles.badgeText, { color: colors.danger }]}>
                  ⚠️ Cuir chevelu: {activeProfile.diagnostic.scalpCondition}
                </Text>
              </View>
            )}
          </View>

          {/* Refaire diagnostic capillaire bouton majeur */}
          <Button
            title="🔄 Mettre à jour mon diagnostic capillaire"
            onPress={onRefireDiagnostic}
            variant="primary"
            style={styles.evolveBtn}
          />
        </View>

        {/* ============================================================== */}
        {/* SETTINGS MENU ACCORDIONS */}
        {/* ============================================================== */}

        {/* 1. GESTION DES PROFILS */}
        <View style={[styles.accordionItem, { backgroundColor: customCard, borderColor: customBorder }]}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => togglePanel('profiles')}>
            <Text style={[styles.accordionTitle, { color: customText }]}>👥 Gestion des Profils</Text>
            <Text style={styles.accordionArrow}>{activePanel === 'profiles' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {activePanel === 'profiles' && (
            <View style={styles.panelContent}>
              {profiles.map((p, idx) => {
                const isCurrentActive = p.id === activeProfileId;
                return (
                  <View key={p.id} style={[
                    styles.profileManageCard, 
                    { 
                      borderColor: isCurrentActive ? colors.primary : 'rgba(255, 255, 255, 0.05)',
                      backgroundColor: isCurrentActive ? 'rgba(229, 169, 130, 0.03)' : 'rgba(255, 255, 255, 0.01)'
                    }
                  ]}>
                    <View style={styles.profileManageHeader}>
                      {/* Avatar Button */}
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        style={styles.profileManageAvatarBtn}
                        onPress={() => {
                          setTargetAvatarProfileId(p.id);
                          setShowAvatarPicker(true);
                        }}
                      >
                        {avatarImageMap[p.avatar] ? (
                          <Image
                            source={avatarImageMap[p.avatar]}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={styles.profileManageAvatarEmoji}>{p.avatar}</Text>
                        )}
                        <Text style={styles.changeAvatarSmallText}>🎭 Modifier</Text>
                      </TouchableOpacity>

                      <View style={styles.profileManageInfo}>
                        <Text style={styles.fieldLabel}>Prénom du profil</Text>
                        <View style={styles.rowWrapper}>
                          <TextInput
                            style={[styles.textInput, { color: customText, borderColor: customBorder }]}
                            defaultValue={p.name}
                            placeholder="Nom"
                            placeholderTextColor={colors.textMuted}
                            onChangeText={(text) => handleTempNameChange(p.id, text)}
                          />
                          <TouchableOpacity 
                            activeOpacity={0.8}
                            style={styles.saveBtnPill} 
                            onPress={() => handleSaveProfileName(p.id)}
                          >
                            <Text style={styles.saveBtnText}>OK</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Actions row */}
                    <View style={styles.profileManageActions}>
                      {idx === 0 ? (
                        <Text style={styles.primaryBadge}>⭐ Profil Principal</Text>
                      ) : (
                        <TouchableOpacity 
                          activeOpacity={0.8}
                          style={styles.deleteMiniBtn}
                          onPress={() => handleDeleteProfile(p)}
                        >
                          <Text style={styles.deleteMiniBtnText}>🗑️ Supprimer ce profil</Text>
                        </TouchableOpacity>
                      )}
                      {isCurrentActive && (
                        <Text style={styles.activeProfileBadge}>⚡ Actif</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 2. PARAMÈTRES CAPILLAIRES */}
        <View style={[styles.accordionItem, { backgroundColor: customCard, borderColor: customBorder }]}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => togglePanel('hair')}>
            <Text style={[styles.accordionTitle, { color: customText }]}>🔬 Paramètres Capillaires</Text>
            <Text style={styles.accordionArrow}>{activePanel === 'hair' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {activePanel === 'hair' && (
            <View style={styles.panelContent}>
              <Text style={styles.panelDesc}>
                Vous avez déclaré un changement radical de coupe ou de soin ? Mettez à jour vos données ici.
              </Text>
              <Button
                title="📝 Refaire le diagnostic complet"
                onPress={onRefireDiagnostic}
                variant="outline"
                style={styles.hairOptionBtn}
              />
              <Button
                title="💧 Modifier uniquement la porosité"
                onPress={() => setShowPorosityEditModal(true)}
                variant="secondary"
                style={styles.hairOptionBtn}
              />
            </View>
          )}
        </View>

        {/* 3. PARAMÈTRES DE NOTIFICATIONS */}
        <View style={[styles.accordionItem, { backgroundColor: customCard, borderColor: customBorder }]}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => togglePanel('notifications')}>
            <Text style={[styles.accordionTitle, { color: customText }]}>🔔 Réglages des Notifications</Text>
            <Text style={styles.accordionArrow}>{activePanel === 'notifications' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {activePanel === 'notifications' && (
            <View style={styles.panelContent}>
              {/* Permission Denied Recovery Alert */}
              {permissionStatus === 'denied' && (
                <View style={{
                  backgroundColor: 'rgba(217, 83, 79, 0.06)',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(217, 83, 79, 0.2)',
                  padding: 16,
                  marginBottom: 16,
                }}>
                  <Text style={{
                    color: colors.danger,
                    fontWeight: '800',
                    fontSize: 13,
                    marginBottom: 4,
                  }}>
                    🔔 Rappels Désactivés par votre téléphone
                  </Text>
                  <Text style={{ fontSize: 12, color: customText, lineHeight: 18, marginBottom: 12 }}>
                    Les notifications sont bloquées dans les réglages système de votre appareil. Pour recevoir vos rappels capillaires au bon moment, réactivez-les.
                  </Text>
                  <Button
                    title="⚙️ Ouvrir mes Réglages Système"
                    onPress={() => Linking.openSettings()}
                    variant="outline"
                    style={{ paddingVertical: 10 }}
                  />
                </View>
              )}

              {/* Enable / Disable */}
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: customText }]}>Activer les rappels quotidiens</Text>
                <Switch
                  value={notifEnabled}
                  onValueChange={setNotifEnabled}
                  trackColor={{ false: '#767577', true: colors.primary }}
                />
              </View>

              {/* Time Selection */}
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Heure de rappel par défaut</Text>
                <TouchableOpacity
                  style={[
                    styles.textInput, 
                    { 
                      borderColor: customBorder,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: customInputBg,
                      paddingVertical: 12
                    }
                  ]}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: customText, fontWeight: '700', fontSize: 15 }}>⏰ {notifTime}</Text>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Modifier ➔</Text>
                </TouchableOpacity>
              </View>

              {/* Tone of Voice */}
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Ton de l'ambiance des rappels</Text>
                <View style={styles.tonePillRow}>
                  {['Doux', 'Motivant', 'Direct'].map(t => {
                    const isActive = notifTone === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.tonePill, isActive && styles.tonePillActive]}
                        onPress={() => setNotifTone(t)}
                      >
                        <Text style={[styles.tonePillText, isActive && styles.tonePillTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Button
                title="💾 Enregistrer les préférences"
                onPress={handleSaveNotifications}
                variant="primary"
                style={styles.saveNotifBtn}
              />
              {__DEV__ && (
                <Button
                  title="🔔 Tester la notification (5s)"
                  onPress={handleTestNotification}
                  variant="outline"
                  style={{ marginTop: 12, borderColor: colors.primary }}
                />
              )}
            </View>
          )}
        </View>

        {/* 4. COMPTE MAÎTRE */}
        <View style={[styles.accordionItem, { backgroundColor: customCard, borderColor: customBorder }]}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => togglePanel('account')}>
            <Text style={[styles.accordionTitle, { color: customText }]}>🔒 Gestion du Compte</Text>
            <Text style={styles.accordionArrow}>{activePanel === 'account' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {activePanel === 'account' && (
            <View style={styles.panelContent}>
              <Text style={styles.panelDesc}>
                Compte Maître : <Text style={styles.boldText}>{masterEmail}</Text>
              </Text>
              
              <Button
                title="✏️ Modifier l'email / mot de passe"
                onPress={() => setShowAccountModal(true)}
                variant="outline"
                style={styles.hairOptionBtn}
              />

              <Button
                title="🚨 Supprimer définitivement le compte"
                onPress={handleDeleteAccount}
                variant="danger"
                style={styles.hairOptionBtn}
              />
            </View>
          )}
        </View>

        {/* 5. AFFICHAGE (MODE SOMBRE / CLAIR) */}
        <View style={[styles.accordionItem, { backgroundColor: customCard, borderColor: customBorder }]}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => togglePanel('display')}>
            <Text style={[styles.accordionTitle, { color: customText }]}>🎨 Options d'Affichage</Text>
            <Text style={styles.accordionArrow}>{activePanel === 'display' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {activePanel === 'display' && (
            <View style={styles.panelContent}>
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: customText }]}>Mode Sombre</Text>
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={toggleThemeMode}
                  trackColor={{ false: '#ccc', true: colors.primary }}
                />
              </View>
              <Text style={styles.panelDesc}>
                Basculez entre le Mode Sombre pour reposer vos yeux ou le Mode Clair.
              </Text>
            </View>
          )}
        </View>

        {/* 6. AVIS SUR LA BÊTA */}
        <View style={[styles.accordionItem, { backgroundColor: customCard, borderColor: customBorder }]}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => togglePanel('feedback')}>
            <Text style={[styles.accordionTitle, { color: customText }]}>💬 Donner mon avis sur la Bêta</Text>
            <Text style={styles.accordionArrow}>{activePanel === 'feedback' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {activePanel === 'feedback' && (
            <View style={styles.panelContent}>
              {feedbackSuccess ? (
                <View style={styles.feedbackSuccessContainer}>
                  <Text style={styles.successEmoji}>🎉</Text>
                  <Text style={[styles.successTitle, { color: customText }]}>Avis envoyé !</Text>
                  <Text style={[styles.successSubtitle, { color: customTextSec }]}>
                    Merci infiniment d'avoir partagé ton expérience. Tes réponses nous aident à façonneer le futur de My Root'In ! 🌿
                  </Text>
                  <Button
                    title="Remplir à nouveau"
                    onPress={() => setFeedbackSuccess(false)}
                    variant="outline"
                    style={{ marginTop: 12 }}
                  />
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  <Text style={styles.panelDesc}>
                    Aide-nous à perfectionner My Root'In en répondant à ce questionnaire rapide (11 questions). Tes retours sont précieux !
                  </Text>

                  {/* PART 1 */}
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>Partie 1 : Le Diagnostic et la Personnalisation</Text>
                    
                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q1 : Lors de votre inscription, avez-vous trouvé les étapes du diagnostic claires et faciles à remplir ?
                      </Text>
                      <Text style={[styles.ratingLegend, { color: customTextSec }]}>
                        (1 = Très difficile, 5 = Très facile)
                      </Text>
                      <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.ratingPill, q1 === val && styles.ratingPillActive]}
                            onPress={() => setQ1(val)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.ratingPillText, q1 === val && styles.ratingPillTextActive]}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q2 : Les options proposées (types de boucles, locks, porosité) vous ont-elles permis de cibler exactement votre nature de cheveux ?
                      </Text>
                      <View style={styles.pillOptionsRow}>
                        {(['Oui', 'Non', 'Pas totalement'] as const).map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.choicePill, q2 === val && styles.choicePillActive]}
                            onPress={() => setQ2(val)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.choicePillText, q2 === val && styles.choicePillTextActive]}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput
                        style={[styles.feedbackTextInput, { color: customText, borderColor: customBorder, backgroundColor: customInputBg }]}
                        placeholder="Précise ta pensée si tu le souhaites..."
                        placeholderTextColor={colors.textMuted}
                        value={q2Text}
                        onChangeText={setQ2Text}
                        multiline={true}
                      />
                    </View>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q3 : Trouveriez-vous utile de pouvoir ajouter des photos de vos cheveux directement dans votre profil pour suivre votre évolution ?
                      </Text>
                      <View style={styles.pillOptionsRow}>
                        {(['Oui', 'Non'] as const).map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.choicePill, q3 === val && styles.choicePillActive]}
                            onPress={() => setQ3(val)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.choicePillText, q3 === val && styles.choicePillTextActive]}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* PART 2 */}
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>Partie 2 : Le Scanner d'ingrédients</Text>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q4 : Avez-vous utilisé le scanner d'ingrédients sur vos produits de salle de bain ou en magasin ?
                      </Text>
                      <View style={styles.pillOptionsColumn}>
                        {([
                          'Oui, souvent',
                          'Oui, une ou deux fois',
                          'Non'
                        ] as const).map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.choicePillLong, q4 === val && styles.choicePillLongActive]}
                            onPress={() => setQ4(val)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.choicePillText, q4 === val && styles.choicePillTextActive]}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q5 : Le scanner a-t-il été rapide à analyser le produit et à afficher le résultat ?
                      </Text>
                      <View style={styles.pillOptionsColumn}>
                        {([
                          'Très rapide',
                          'Moyen',
                          'Lent',
                          'Ça a bugué'
                        ] as const).map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.choicePillLong, q5 === val && styles.choicePillLongActive]}
                            onPress={() => setQ5(val)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.choicePillText, q5 === val && styles.choicePillTextActive]}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q6 : Les explications du scanner sur les ingrédients (bons ou mauvais pour votre type de cheveu) étaient-elles faciles à comprendre ?
                      </Text>
                      <Text style={[styles.ratingLegend, { color: customTextSec }]}>
                        (1 = Très difficile à comprendre, 5 = Très facile à comprendre)
                      </Text>
                      <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.ratingPill, q6 === val && styles.ratingPillActive]}
                            onPress={() => setQ6(val)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.ratingPillText, q6 === val && styles.ratingPillTextActive]}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput
                        style={[styles.feedbackTextInput, { color: customText, borderColor: customBorder, backgroundColor: customInputBg }]}
                        placeholder="Une suggestion ou une explication manquante ?"
                        placeholderTextColor={colors.textMuted}
                        value={q6Text}
                        onChangeText={setQ6Text}
                        multiline={true}
                      />
                    </View>
                  </View>

                  {/* PART 3 */}
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>Partie 3 : L'Agenda et les Conseils de Routine</Text>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q7 : Les rappels et notifications de l'application vous ont-ils aidé(e) à être plus régulier(ère) dans vos soins ?
                      </Text>
                      <Text style={[styles.ratingLegend, { color: customTextSec }]}>
                        (1 = Pas du tout d'accord, 5 = Tout à fait d'accord)
                      </Text>
                      <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.ratingPill, q7 === val && styles.ratingPillActive]}
                            onPress={() => setQ7(val)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.ratingPillText, q7 === val && styles.ratingPillTextActive]}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q8 : Que pensez-vous de la clarté des conseils donnés pour chaque étape de votre routine (shampoing, masque, soin sans rinçage, etc.) ?
                      </Text>
                      <TextInput
                        style={[styles.feedbackTextInputLarge, { color: customText, borderColor: customBorder, backgroundColor: customInputBg }]}
                        placeholder="Trop long ? Pas assez précis ? Dis-nous tout..."
                        placeholderTextColor={colors.textMuted}
                        value={q8}
                        onChangeText={setQ8}
                        multiline={true}
                      />
                    </View>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q9 : Quelle fonctionnalité ou quel conseil vous a le plus manqué durant ce test ?
                      </Text>
                      <TextInput
                        style={[styles.feedbackTextInputLarge, { color: customText, borderColor: customBorder, backgroundColor: customInputBg }]}
                        placeholder="Qu'aimerais-tu ajouter dans l'application ?"
                        placeholderTextColor={colors.textMuted}
                        value={q9}
                        onChangeText={setQ9}
                        multiline={true}
                      />
                    </View>
                  </View>

                  {/* PART 4 */}
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>Partie 4 : Avis global et Prix</Text>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q10 : Quelle est la fonctionnalité que vous avez préféré(e) dans My Root'In ?
                      </Text>
                      <TextInput
                        style={[styles.feedbackTextInputLarge, { color: customText, borderColor: customBorder, backgroundColor: customInputBg }]}
                        placeholder="Le scanner ? Le calendrier ? Ma salle de bain ?..."
                        placeholderTextColor={colors.textMuted}
                        value={q10}
                        onChangeText={setQ10}
                        multiline={true}
                      />
                    </View>

                    <View style={styles.feedbackQuestionBlock}>
                      <Text style={[styles.feedbackQuestionText, { color: customText }]}>
                        Q11 : Si l'application devenait payante avec le scanner complet et un suivi de routine ultra-personnalisé, quel prix par mois vous semblerait juste ?
                      </Text>
                      <View style={styles.pillOptionsColumn}>
                        {([
                          '2,99€',
                          '4,99€',
                          '7,99€',
                          'Je ne paierais pas'
                        ] as const).map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.choicePillLong, q11 === val && styles.choicePillLongActive]}
                            onPress={() => setQ11(val)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.choicePillText, q11 === val && styles.choicePillTextActive]}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <Button
                    title={isSubmittingFeedback ? "Envoi en cours..." : "📤 Envoyer mon avis sur la Bêta"}
                    onPress={handleSubmitFeedback}
                    disabled={isSubmittingFeedback}
                    variant="primary"
                    style={{ marginTop: 8 }}
                  />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom Actions Container */}
        <View style={styles.bottomActionsContainer}>
          {onGoBackToHome && (
            <Button
              title="🏠 Retour à l'accueil"
              onPress={onGoBackToHome}
              variant="outline"
              style={styles.bottomActionBtn}
            />
          )}
          <Button
            title="🚪 Se déconnecter du compte"
            onPress={onLogoutPress}
            variant="danger"
            style={styles.bottomActionBtn}
          />
        </View>

      </ScrollView>

      {/* ⏰ TIME PICKER MODAL */}
      <TimePickerModal
        visible={showTimePicker}
        initialTime={notifTime}
        onClose={() => setShowTimePicker(false)}
        onSave={(time) => setNotifTime(time)}
        title="Heure de rappel par défaut ⏰"
      />

      {/* 🎭 AVATAR PICKER MODAL */}
      <Modal
        visible={showAvatarPicker}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎭 Choisir mon nouvel avatar</Text>
            
            <ScrollView style={styles.avatarScrollView} contentContainerStyle={styles.avatarGridScroll}>
              <View style={styles.avatarGrid}>
                {avatarList.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.avatarGridItem}
                    onPress={() => handleSelectAvatar(item.id)}
                  >
                    {avatarImageMap[item.id] ? (
                      <View style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden' }}>
                        <Image
                          source={avatarImageMap[item.id]}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      </View>
                    ) : (
                      <Text style={styles.gridEmoji}>👤</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Button
              title="Fermer"
              onPress={() => setShowAvatarPicker(false)}
              variant="outline"
              style={styles.modalCloseBtn}
            />
          </View>
        </View>
      </Modal>

      {/* ✏️ EDIT ACCOUNT MODAL */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔒 Modifier mon compte Maître</Text>
            
            <View style={styles.inputField}>
              <Text style={styles.fieldLabel}>Nouvel Email</Text>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputField}>
              <Text style={styles.fieldLabel}>Nouveau Mot de Passe</Text>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                value={newPass}
                onChangeText={setNewPass}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActionRow}>
              <Button
                title="Annuler"
                onPress={() => setShowAccountModal(false)}
                variant="secondary"
                style={styles.modalBtnHalf}
              />
              <Button
                title="Enregistrer"
                onPress={handleSaveAccount}
                variant="primary"
                style={styles.modalBtnHalf}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 💧 EDIT POROSITY MODAL */}
      <Modal
        visible={showPorosityEditModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔬 Modifier la porosité</Text>
            
            <View style={styles.modalOptionsContainer}>
              <TouchableOpacity
                style={[styles.modalOptionPill, { borderColor: colors.porosityLow }]}
                onPress={() => {
                  completePorosity('Faible');
                  setShowPorosityEditModal(false);
                  Alert.alert('Porosité modifiée', 'Votre profil est désormais réglé sur porosité Faible.');
                }}
              >
                <Text style={styles.modalOptionEmoji}>🌊</Text>
                <Text style={styles.modalOptionLabel}>Porosité Faible</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOptionPill, { borderColor: colors.porosityMedium }]}
                onPress={() => {
                  completePorosity('Moyenne');
                  setShowPorosityEditModal(false);
                  Alert.alert('Porosité modifiée', 'Votre profil est désormais réglé sur porosité Moyenne.');
                }}
              >
                <Text style={styles.modalOptionEmoji}>🌿</Text>
                <Text style={styles.modalOptionLabel}>Porosité Moyenne</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOptionPill, { borderColor: colors.porosityHigh }]}
                onPress={() => {
                  completePorosity('Forte');
                  setShowPorosityEditModal(false);
                  Alert.alert('Porosité modifiée', 'Votre profil est désormais réglé sur porosité Forte.');
                }}
              >
                <Text style={styles.modalOptionEmoji}>🔥</Text>
                <Text style={styles.modalOptionLabel}>Porosité Forte</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Annuler"
              onPress={() => setShowPorosityEditModal(false)}
              variant="outline"
              style={styles.modalCloseBtn}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSelectorContainer: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  topLabel: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileScroll: {
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  profileAvatarWrapper: {
    width: 60,
    marginRight: 16,
    alignItems: 'center',
    opacity: 0.5,
  },
  profileAvatarWrapperActive: {
    opacity: 1,
  },
  profileAvatarEmoji: {
    fontSize: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    textAlign: 'center',
    lineHeight: 50,
  },
  profileAvatarName: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  profileAvatarNameActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  identityCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  identityEmoji: {
    fontSize: 46,
    marginRight: 16,
  },
  identityName: {
    fontSize: 20,
    fontWeight: '800',
  },
  identitySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(229, 169, 130, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 6,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  evolveBtn: {
    marginVertical: 0,
    paddingVertical: 12,
  },
  accordionItem: {
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  accordionArrow: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  panelContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 16,
  },
  panelDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtnPill: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  avatarButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
  },
  avatarButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatarButtonVal: {
    fontSize: 24,
  },
  deleteProfileBtn: {
    marginVertical: 0,
    marginTop: 10,
  },
  hairOptionBtn: {
    marginVertical: 6,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tonePillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  tonePill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tonePillActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 169, 130, 0.06)',
  },
  tonePillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tonePillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  saveNotifBtn: {
    marginTop: 12,
    marginVertical: 0,
  },
  boldText: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarScrollView: {
    maxHeight: 250,
    width: '100%',
  },
  avatarGridScroll: {
    paddingBottom: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarGridItem: {
    width: '47%', // Grid layout for exactly 2 columns in modal
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalCloseBtn: {
    marginTop: 16,
    marginVertical: 0,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalBtnHalf: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 0,
  },
  modalOptionsContainer: {
    marginVertical: 8,
  },
  modalOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginVertical: 6,
  },
  modalOptionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  modalOptionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  profileManageCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  profileManageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileManageAvatarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 8,
    width: 70,
  },
  profileManageAvatarEmoji: {
    fontSize: 28,
  },
  changeAvatarSmallText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 4,
  },
  profileManageInfo: {
    flex: 1,
  },
  profileManageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 8,
  },
  primaryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    backgroundColor: 'rgba(92, 138, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeProfileBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: 'rgba(229, 169, 130, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteMiniBtn: {
    backgroundColor: 'rgba(235, 94, 85, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(235, 94, 85, 0.2)',
  },
  deleteMiniBtnText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  // Feedback panel styles
  feedbackSuccessContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  successEmoji: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  feedbackSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 16,
    marginBottom: 8,
    gap: 12,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  feedbackQuestionBlock: {
    gap: 8,
    marginBottom: 12,
  },
  feedbackQuestionText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  ratingPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  ratingPillActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 169, 130, 0.1)',
  },
  ratingPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  ratingPillTextActive: {
    color: colors.primary,
  },
  pillOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  choicePill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  choicePillActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 169, 130, 0.1)',
  },
  choicePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  choicePillTextActive: {
    color: colors.primary,
  },
  pillOptionsColumn: {
    gap: 8,
    marginVertical: 4,
  },
  choicePillLong: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  choicePillLongActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 169, 130, 0.1)',
  },
  feedbackTextInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    height: 60,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  feedbackTextInputLarge: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    height: 80,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  ratingLegend: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: -2,
    marginBottom: 4,
  },
  bottomActionsContainer: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  bottomActionBtn: {
    marginVertical: 0,
    paddingVertical: 14,
  },
});
