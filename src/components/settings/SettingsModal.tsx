import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Switch,
  ScrollView, Linking, Alert, TextInput, Platform, Share
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';
import { db } from '../../store/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { NotificationService } from '../../store/NotificationService';
import * as Notifications from 'expo-notifications';
import { Button } from '../common/Button';
import { TimePickerModal } from '../common/TimePickerModal';
import { PrivacyModal } from '../common/PrivacyModal';
import { LegalNoticeModal } from '../common/LegalNoticeModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  themeMode: 'dark' | 'light';
  masterEmail?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible, onClose, onLogout, themeMode: propThemeMode, masterEmail: propMasterEmail
}) => {
  const {
    activeProfile,
    themeMode,
    tempUnit,
    masterEmail,
    toggleThemeMode,
    toggleTempUnit,
    updateNotificationsSetting,
    updateMasterAccount,
    deleteMasterAccount
  } = useAppState();

  const isDark = themeMode === 'dark';
  const bg       = isDark ? '#0B0D17' : '#F5F5FA';
  const card     = isDark ? '#16192A' : '#FFFFFF';
  const text     = isDark ? '#F0F2FF' : '#1C1E26';
  const textSec  = isDark ? '#8A8FA8' : '#6A6F82';
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const rowBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const appVersion = '1.0.0';

  // Collapsible panels state
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Notification states
  const [notifEnabled, setNotifEnabled] = useState(activeProfile?.notifications?.enabled ?? true);
  const [notifTime, setNotifTime] = useState(activeProfile?.notifications?.time ?? '09:00');
  const [notifTone, setNotifTone] = useState<any>(activeProfile?.notifications?.tone ?? 'Motivant');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('granted');

  // Master account states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newEmail, setNewEmail] = useState(masterEmail || '');
  const [newPass, setNewPass] = useState('••••••••');

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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  const checkNotifPermission = async () => {
    const status = await NotificationService.checkPermissions();
    setPermissionStatus(status);
  };

  useEffect(() => {
    if (visible) {
      checkNotifPermission();
      // Initialize states when the settings modal becomes visible
      if (activeProfile?.notifications) {
        setNotifEnabled(activeProfile.notifications.enabled ?? true);
        setNotifTime(activeProfile.notifications.time ?? '09:00');
        setNotifTone(activeProfile.notifications.tone ?? 'Motivant');
      }
      if (masterEmail) {
        setNewEmail(masterEmail);
      }
    }
  }, [visible, activeProfile?.id, masterEmail]);

  const togglePanel = (panelName: string) => {
    setActivePanel(prev => prev === panelName ? null : panelName);
    if (panelName === 'notifications') {
      checkNotifPermission();
    }
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
          priority: Notifications.AndroidNotificationPriority.MAX,
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

  const handleSaveAccount = async () => {
    try {
      await updateMasterAccount(newEmail, newPass);
      setShowAccountModal(false);
      if (Platform.OS === 'web') {
        window.alert('Compte mis à jour : Vos identifiants de compte ont été modifiés.');
      } else {
        Alert.alert('Compte mis à jour', 'Vos identifiants de compte ont été modifiés.');
      }
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/requires-recent-login') {
        msg = "Cette opération est sensible et nécessite une reconnexion récente. Veuillez vous déconnecter puis vous reconnecter avant de réessayer.";
      } else if (error.code === 'auth/invalid-email') {
        msg = "Adresse email invalide.";
      } else if (error.code === 'auth/email-already-in-use') {
        msg = "Cette adresse email est déjà utilisée.";
      }
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Erreur', msg);
      }
    }
  };


  const handleDeleteAccount = () => {
    Alert.alert(
      '🚨 Supprimer le compte Maître',
      'ATTENTION : Cela supprimera définitivement votre compte et TOUS les profils associés de votre famille.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => {
          onClose();
          deleteMasterAccount(onLogout);
        }}
      ]
    );
  };

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

  const handleShareApp = async () => {
    const shareMessage = "Coucou ! Regarde cette super appli 'My Root'In' pour prendre soin de tes cheveux texturés, c'est génial : https://my-root-in-nine.vercel.app/ 🌿✨";
    if (Platform.OS === 'web') {
      const shareData = {
        title: "My Root'In",
        text: shareMessage,
        url: "https://my-root-in-nine.vercel.app/"
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (error) {
          copyToClipboardOrFallback(shareMessage);
        }
      } else {
        copyToClipboardOrFallback(shareMessage);
      }
    } else {
      try {
        await Share.share({
          message: shareMessage,
        });
      } catch (error: any) {
        Alert.alert('Erreur', error.message);
      }
    }
  };

  const copyToClipboardOrFallback = (message: string) => {
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert(
        "Partager l'application",
        `Copie ce message pour l'envoyer à tes proches :\n\n"${message}"`
      );
    });
  };

  const handleHelpSupport = () => {
    Alert.alert(
      "Aide & Support 🙋‍♀️",
      "Besoin d'aide ? Tu peux contacter notre équipe de support ou consulter notre guide d'utilisation.",
      [
        {
          text: "📧 Contacter par Email",
          onPress: () => {
            Linking.openURL('mailto:support@myrootin.com?subject=Aide My RootIn').catch(() => {
              Alert.alert(
                "Support par email",
                "Envoie-nous un e-mail à : support@myrootin.com"
              );
            });
          }
        },
        {
          text: "📖 Guide d'Utilisation",
          onPress: () => {
            Linking.openURL('https://my-root-in-nine.vercel.app/guide').catch(() => {
              Alert.alert('Erreur', 'Impossible d\'ouvrir le guide.');
            });
          }
        },
        {
          text: "Annuler",
          style: "cancel"
        }
      ]
    );
  };

  const Section = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: textSec }]}>{title}</Text>
  );

  const Row = ({
    emoji, label, sublabel, onPress, rightElement
  }: {
    emoji: string;
    label: string;
    sublabel?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { backgroundColor: rowBg, borderColor: border }]}
    >
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowTextBlock}>
        <Text style={[styles.rowLabel, { color: text }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: textSec }]}>{sublabel}</Text> : null}
      </View>
      {rightElement ?? (
        onPress ? <Text style={{ color: textSec, fontSize: 16 }}>›</Text> : null
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: border }]}>
          <View style={styles.headerHandle} />
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: text }]}>⚙️ Paramètres</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}
            >
              <Text style={{ color: textSec, fontWeight: '700', fontSize: 15 }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Mon Compte ────────────────────────── */}
          <Section title="COMPTE" />
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <TouchableOpacity 
              style={styles.accordionHeader} 
              onPress={() => togglePanel('account')}
              activeOpacity={0.7}
            >
              <Text style={[styles.accordionTitle, { color: text }]}>🔒 Gestion du Compte</Text>
              <Text style={[styles.accordionArrow, { color: textSec }]}>{activePanel === 'account' ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {activePanel === 'account' && (
              <View style={[styles.panelContent, { borderTopColor: border }]}>
                <Text style={[styles.panelDesc, { color: textSec }]}>
                  Compte Maître : <Text style={{ color: colors.primary, fontWeight: '700' }}>{masterEmail || 'Non défini'}</Text>
                </Text>
                
                <Button
                  title="✏️ Modifier l'email / mot de passe"
                  onPress={() => setShowAccountModal(true)}
                  variant="outline"
                  style={{ marginBottom: 12 }}
                />

                <Button
                  title="🚨 Supprimer définitivement le compte"
                  onPress={handleDeleteAccount}
                  variant="danger"
                />
              </View>
            )}
          </View>

          {/* ── Notifications ─────────────────────── */}
          <Section title="PRÉFÉRENCES" />
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <TouchableOpacity 
              style={styles.accordionHeader} 
              onPress={() => togglePanel('notifications')}
              activeOpacity={0.7}
            >
              <Text style={[styles.accordionTitle, { color: text }]}>🔔 Réglages des Notifications</Text>
              <Text style={[styles.accordionArrow, { color: textSec }]}>{activePanel === 'notifications' ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {activePanel === 'notifications' && (
              <View style={[styles.panelContent, { borderTopColor: border }]}>
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
                    <Text style={{ fontSize: 12, color: text, lineHeight: 18, marginBottom: 12 }}>
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

                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: text }]}>Activer les rappels quotidiens</Text>
                  <Switch
                    value={notifEnabled}
                    onValueChange={setNotifEnabled}
                    trackColor={{ false: isDark ? '#333' : '#CCC', true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.inputField}>
                  <Text style={[styles.fieldLabel, { color: textSec }]}>Heure de rappel par défaut</Text>
                  <TouchableOpacity
                    style={[
                      styles.textInput, 
                      { 
                        borderColor: border,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: rowBg,
                        paddingVertical: 12
                      }
                    ]}
                    onPress={() => setShowTimePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: text, fontWeight: '700', fontSize: 15 }}>⏰ {notifTime}</Text>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Modifier ➔</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputField}>
                  <Text style={[styles.fieldLabel, { color: textSec }]}>Ton de l'ambiance des rappels</Text>
                  <View style={styles.tonePillRow}>
                    {['Doux', 'Motivant', 'Direct'].map(t => {
                      const isActive = notifTone === t;
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.tonePill, 
                            { 
                              borderColor: isActive ? colors.primary : border, 
                              backgroundColor: isActive ? (isDark ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : rowBg 
                            }
                          ]}
                          onPress={() => setNotifTone(t)}
                        >
                          <Text style={[styles.tonePillText, { color: isActive ? colors.primary : textSec, fontWeight: isActive ? '700' : '600' }]}>{t}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <Button
                  title="💾 Enregistrer les préférences"
                  onPress={handleSaveNotifications}
                  variant="primary"
                />

                {__DEV__ && (
                  <Button
                    title="🔔 Tester la notification (5s)"
                    onPress={handleTestNotification}
                    variant="outline"
                    style={{ marginTop: 12, borderColor: colors.primary }}
                  />
                )}

                <View style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: border,
                  padding: 16,
                  marginTop: 16,
                }}>
                  <Text style={{
                    color: colors.primary,
                    fontWeight: '800',
                    fontSize: 13,
                    marginBottom: 6,
                  }}>
                    💡 Problème avec vos rappels ?
                  </Text>
                  <Text style={{ fontSize: 12, color: textSec, lineHeight: 18, marginBottom: 8 }}>
                    Si vos rappels capillaires ne sonnent pas à l'heure ou ne s'affichent pas du tout :
                  </Text>
                  {Platform.OS === 'android' ? (
                    <Text style={{ fontSize: 12, color: textSec, lineHeight: 18 }}>
                      • <Text style={{ fontWeight: '700', color: text }}>Économiseur de batterie</Text> : Allez dans les réglages du téléphone ➔ Applications ➔ My Root'In ➔ Batterie ➔ Choisissez <Text style={{ fontWeight: '700', color: colors.primary }}>"Pas de restrictions"</Text> pour éviter les retards.{"\n\n"}
                      • <Text style={{ fontWeight: '700', color: text }}>Lancement automatique</Text> : Sur Xiaomi/Redmi, cochez l'option <Text style={{ fontWeight: '700', color: colors.primary }}>"Lancement automatique"</Text> pour autoriser l'arrière-plan.
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 12, color: textSec, lineHeight: 18 }}>
                      • <Text style={{ fontWeight: '700', color: text }}>Actualisation en arrière-plan</Text> : Vérifiez dans Réglages ➔ My Root'In que l'option <Text style={{ fontWeight: '700', color: colors.primary }}>"Actualisation en arrière-plan"</Text> est bien activée.{"\n\n"}
                      • <Text style={{ fontWeight: '700', color: text }}>Notifications & Sons</Text> : Assurez-vous d'avoir autorisé les alertes dans Réglages ➔ Notifications ➔ My Root'In.
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* ── Affichage ────────────────────────── */}
          <Section title="AFFICHAGE" />
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <TouchableOpacity 
              style={styles.accordionHeader} 
              onPress={() => togglePanel('display')}
              activeOpacity={0.7}
            >
              <Text style={[styles.accordionTitle, { color: text }]}>🎨 Options d'Affichage</Text>
              <Text style={[styles.accordionArrow, { color: textSec }]}>{activePanel === 'display' ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {activePanel === 'display' && (
              <View style={[styles.panelContent, { borderTopColor: border }]}>
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: text }]}>Mode Sombre</Text>
                  <Switch
                    value={themeMode === 'dark'}
                    onValueChange={toggleThemeMode}
                    trackColor={{ false: isDark ? '#333' : '#CCC', true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: text }]}>Unités de mesure (Météo)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: tempUnit === 'C' ? colors.primary : textSec, fontWeight: '700', fontSize: 13 }}>°C</Text>
                    <Switch
                      value={tempUnit === 'F'}
                      onValueChange={toggleTempUnit}
                      trackColor={{ false: isDark ? '#333' : '#CCC', true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                    <Text style={{ color: tempUnit === 'F' ? colors.primary : textSec, fontWeight: '700', fontSize: 13 }}>°F</Text>
                  </View>
                </View>

                <Text style={[styles.panelDesc, { color: textSec }]}>
                  Configurez l'affichage du mode sombre et l'unité de mesure de la météo capillaire (Celsius / Fahrenheit).
                </Text>
              </View>
            )}
          </View>

          {/* ── Bêta Feedback ─────────────────────── */}
          <Section title="BÊTA" />
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <TouchableOpacity 
              style={styles.accordionHeader} 
              onPress={() => togglePanel('feedback')}
              activeOpacity={0.7}
            >
              <Text style={[styles.accordionTitle, { color: text }]}>💬 Donner mon avis sur la Bêta</Text>
              <Text style={[styles.accordionArrow, { color: textSec }]}>{activePanel === 'feedback' ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {activePanel === 'feedback' && (
              <View style={[styles.panelContent, { borderTopColor: border }]}>
                {feedbackSuccess ? (
                  <View style={styles.feedbackSuccessContainer}>
                    <Text style={styles.successEmoji}>🎉</Text>
                    <Text style={[styles.successTitle, { color: text }]}>Avis envoyé !</Text>
                    <Text style={[styles.successSubtitle, { color: textSec }]}>
                      Merci infiniment d'avoir partagé ton expérience. Tes réponses nous aident à façonner le futur de My Root'In ! 🌿
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
                    <Text style={[styles.panelDesc, { color: textSec }]}>
                      Aide-nous à perfectionner My Root'In en répondant à ce questionnaire rapide (11 questions). Tes retours sont précieux !
                    </Text>

                    {/* PART 1 */}
                    <View style={[styles.feedbackSection, { borderBottomColor: border }]}>
                      <Text style={styles.feedbackSectionTitle}>Partie 1 : Le Diagnostic et la Personnalisation</Text>
                      
                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
                          Q1 : Lors de votre inscription, avez-vous trouvé les étapes du diagnostic claires et faciles à remplir ?
                        </Text>
                        <Text style={[styles.ratingLegend, { color: textSec }]}>
                          (1 = Très difficile, 5 = Très facile)
                        </Text>
                        <View style={styles.ratingRow}>
                          {[1, 2, 3, 4, 5].map(val => (
                            <TouchableOpacity
                              key={val}
                              style={[
                                styles.ratingPill, 
                                { 
                                  borderColor: q1 === val ? colors.primary : border, 
                                  backgroundColor: q1 === val ? (isDark ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : rowBg 
                                }
                              ]}
                              onPress={() => setQ1(val)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.ratingPillText, { color: q1 === val ? colors.primary : textSec }]}>{val}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
                          Q2 : Les options proposées (types de boucles, locks, porosité) vous ont-elles permis de cibler exactement votre nature de cheveux ?
                        </Text>
                        <View style={styles.pillOptionsRow}>
                          {(['Oui', 'Non', 'Pas totalement'] as const).map(val => (
                            <TouchableOpacity
                              key={val}
                              style={[
                                styles.choicePill, 
                                { 
                                  borderColor: q2 === val ? colors.primary : border, 
                                  backgroundColor: q2 === val ? (isDark ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : rowBg 
                                }
                              ]}
                              onPress={() => setQ2(val)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.choicePillText, { color: q2 === val ? colors.primary : textSec }]}>{val}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TextInput
                          style={[styles.feedbackTextInput, { color: text, borderColor: border, backgroundColor: rowBg }]}
                          placeholder="Précise ta pensée si tu le souhaites..."
                          placeholderTextColor={colors.textMuted}
                          value={q2Text}
                          onChangeText={setQ2Text}
                          multiline={true}
                        />
                      </View>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
                          Q3 : Trouveriez-vous utile de pouvoir ajouter des photos de vos cheveux directement dans votre profil pour suivre votre évolution ?
                        </Text>
                        <View style={styles.pillOptionsRow}>
                          {(['Oui', 'Non'] as const).map(val => (
                            <TouchableOpacity
                              key={val}
                              style={[
                                styles.choicePill, 
                                { 
                                  borderColor: q3 === val ? colors.primary : border, 
                                  backgroundColor: q3 === val ? (isDark ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : rowBg 
                                }
                              ]}
                              onPress={() => setQ3(val)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.choicePillText, { color: q3 === val ? colors.primary : textSec }]}>{val}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>

                    {/* PART 2 */}
                    <View style={[styles.feedbackSection, { borderBottomColor: border }]}>
                      <Text style={styles.feedbackSectionTitle}>Partie 2 : Le Scanner d'ingrédients</Text>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
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
                              style={[
                                styles.choicePillLong, 
                                { 
                                  borderColor: q4 === val ? colors.primary : border, 
                                  backgroundColor: q4 === val ? (isDark ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : rowBg 
                                }
                              ]}
                              onPress={() => setQ4(val)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.choicePillText, { color: q4 === val ? colors.primary : textSec }]}>{val}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
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
                              style={[
                                styles.choicePillLong, 
                                { 
                                  borderColor: q5 === val ? colors.primary : border, 
                                  backgroundColor: q5 === val ? (isDark ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : rowBg 
                                }
                              ]}
                              onPress={() => setQ5(val)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.choicePillText, { color: q5 === val ? colors.primary : textSec }]}>{val}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
                          Q6 : Les explications du scanner sur les ingrédients (bons ou mauvais pour votre type de cheveu) étaient-elles faciles à comprendre ?
                        </Text>
                        <Text style={[styles.ratingLegend, { color: textSec }]}>
                          (1 = Très difficile à comprendre, 5 = Très facile à comprendre)
                        </Text>
                        <View style={styles.ratingRow}>
                          {[1, 2, 3, 4, 5].map(val => (
                            <TouchableOpacity
                              key={val}
                              style={[
                                styles.ratingPill, 
                                { 
                                  borderColor: q6 === val ? colors.primary : border, 
                                  backgroundColor: q6 === val ? (isDark ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : rowBg 
                                }
                              ]}
                              onPress={() => setQ6(val)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.ratingPillText, { color: q6 === val ? colors.primary : textSec }]}>{val}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TextInput
                          style={[styles.feedbackTextInput, { color: text, borderColor: border, backgroundColor: rowBg }]}
                          placeholder="Une suggestion ou une explication manquante ?"
                          placeholderTextColor={colors.textMuted}
                          value={q6Text}
                          onChangeText={setQ6Text}
                          multiline={true}
                        />
                      </View>
                    </View>

                    {/* PART 3 */}
                    <View style={[styles.feedbackSection, { borderBottomColor: border }]}>
                      <Text style={styles.feedbackSectionTitle}>Partie 3 : L'Agenda et les Conseils de Routine</Text>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
                          Q7 : Les rappels et notifications de l'application vous ont-ils aidé(e) à être plus régulier(ère) dans vos soins ?
                        </Text>
                        <Text style={[styles.ratingLegend, { color: textSec }]}>
                          (1 = Pas du tout d'accord, 5 = Tout à fait d'accord)
                        </Text>
                        <View style={styles.ratingRow}>
                          {[1, 2, 3, 4, 5].map(val => (
                            <TouchableOpacity
                              key={val}
                              style={[
                                styles.ratingPill, 
                                { 
                                  borderColor: q7 === val ? colors.primary : border, 
                                  backgroundColor: q7 === val ? (isDark ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : rowBg 
                                }
                              ]}
                              onPress={() => setQ7(val)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.ratingPillText, { color: q7 === val ? colors.primary : textSec }]}>{val}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
                          Q8 : Que pensez-vous de la clarté des conseils donnés pour chaque étape de votre routine (shampoing, masque, soin sans rinçage, etc.) ?
                        </Text>
                        <TextInput
                          style={[styles.feedbackTextInputLarge, { color: text, borderColor: border, backgroundColor: rowBg }]}
                          placeholder="Trop long ? Pas assez précis ? Dis-nous tout..."
                          placeholderTextColor={colors.textMuted}
                          value={q8}
                          onChangeText={setQ8}
                          multiline={true}
                        />
                      </View>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
                          Q9 : Quelle fonctionnalité ou quel conseil vous a le plus manqué durant ce test ?
                        </Text>
                        <TextInput
                          style={[styles.feedbackTextInputLarge, { color: text, borderColor: border, backgroundColor: rowBg }]}
                          placeholder="Qu'aimerais-tu ajouter dans l'application ?"
                          placeholderTextColor={colors.textMuted}
                          value={q9}
                          onChangeText={setQ9}
                          multiline={true}
                        />
                      </View>
                    </View>

                    {/* PART 4 */}
                    <View style={[styles.feedbackSection, { borderBottomColor: border }]}>
                      <Text style={styles.feedbackSectionTitle}>Partie 4 : Avis global et Prix</Text>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
                          Q10 : Quelle est la fonctionnalité que vous avez préféré(e) dans My Root'In ?
                        </Text>
                        <TextInput
                          style={[styles.feedbackTextInputLarge, { color: text, borderColor: border, backgroundColor: rowBg }]}
                          placeholder="Le scanner ? Le calendrier ? Ma salle de bain ?..."
                          placeholderTextColor={colors.textMuted}
                          value={q10}
                          onChangeText={setQ10}
                          multiline={true}
                        />
                      </View>

                      <View style={styles.feedbackQuestionBlock}>
                        <Text style={[styles.feedbackQuestionText, { color: text }]}>
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
                              style={[
                                styles.choicePillLong, 
                                { 
                                  borderColor: q11 === val ? colors.primary : border, 
                                  backgroundColor: q11 === val ? (isDark ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : rowBg 
                                }
                              ]}
                              onPress={() => setQ11(val)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.choicePillText, { color: q11 === val ? colors.primary : textSec }]}>{val}</Text>
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

          {/* ── Sécurité ──────────────────────────── */}
          <Section title="SÉCURITÉ" />
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <Row
              emoji="🔐"
              label="Sécurité & Confidentialité"
              sublabel="Politique de confidentialité"
              onPress={() => setShowPrivacyModal(true)}
            />
          </View>

          {/* ── Mentions Légales ──────────────────── */}
          <Section title="MENTIONS LÉGALES" />
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <Row
              emoji="⚖️"
              label="Mentions Légales"
              sublabel="Mentions légales de l'application"
              onPress={() => setShowLegalModal(true)}
            />
          </View>

          {/* ── À propos ──────────────────────────── */}
          <Section title="À PROPOS" />
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <Row
              emoji="ℹ️"
              label="À propos de My Root'In"
              sublabel={`Version ${appVersion} — Tous droits réservés © 2026`}
              onPress={() =>
                Alert.alert(
                  'My Root\'In',
                  `Version ${appVersion}\n\nApplication de soin capillaire personnalisée pour cheveux afro et texturés.\n\n© 2026 My Root\'In — Tous droits réservés.`,
                  [{ text: 'Fermer' }]
                )
              }
            />
            <Row
              emoji="📢"
              label="Partager l'application"
              sublabel="Envoyer un lien à tes proches sur WhatsApp ou Instagram"
              onPress={handleShareApp}
            />
            <Row
              emoji="🙋‍♀️"
              label="Aide & Support"
              sublabel="Contacter l'équipe en cas de bug ou lire le guide"
              onPress={handleHelpSupport}
            />
          </View>

          {/* ── Déconnexion ───────────────────────── */}
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert(
                'Déconnexion',
                'Es-tu sûre de vouloir te déconnecter ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Déconnecter', style: 'destructive', onPress: () => { onClose(); onLogout(); } }
                ]
              )
            }
          >
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* ⏰ TIME PICKER MODAL */}
      <TimePickerModal
        visible={showTimePicker}
        initialTime={notifTime}
        onClose={() => setShowTimePicker(false)}
        onSave={(time) => setNotifTime(time)}
        title="Heure de rappel par défaut ⏰"
      />

      {/* ✏️ EDIT ACCOUNT MODAL */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.modalTitle, { color: text }]}>🔒 Modifier mon compte Maître</Text>
            
            <View style={styles.inputField}>
              <Text style={[styles.fieldLabel, { color: textSec }]}>Nouvel Email</Text>
              <TextInput
                style={[styles.textInput, { color: text, borderColor: border, backgroundColor: rowBg }]}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputField}>
              <Text style={[styles.fieldLabel, { color: textSec }]}>Nouveau Mot de Passe</Text>
              <TextInput
                style={[styles.textInput, { color: text, borderColor: border, backgroundColor: rowBg }]}
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

      {/* 🔒 PRIVACY POLICY MODAL */}
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* ⚖️ LEGAL NOTICE MODAL */}
      <LegalNoticeModal
        visible={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,150,150,0.3)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  rowTextBlock: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutEmoji: {
    fontSize: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Relocated styles for settings accordions
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  accordionArrow: {
    fontSize: 12,
  },
  panelContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    paddingTop: 16,
  },
  panelDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
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
    gap: 8,
  },
  tonePill: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tonePillText: {
    fontSize: 12,
    fontWeight: '600',
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
  ratingLegend: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: -2,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    gap: 4,
  },
  ratingPill: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ratingPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pillOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    gap: 4,
  },
  choicePill: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  choicePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillOptionsColumn: {
    gap: 8,
    marginVertical: 4,
  },
  choicePillLong: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  modalBtnHalf: {
    flex: 1,
  },
});
