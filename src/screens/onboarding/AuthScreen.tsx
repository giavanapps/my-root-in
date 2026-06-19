import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { useAppState } from '../../store/AppStateContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup,
  OAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../../store/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { PrivacyModal } from '../../components/common/PrivacyModal';
import { LegalNoticeModal } from '../../components/common/LegalNoticeModal';

WebBrowser.maybeCompleteAuthSession();

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface AuthScreenProps {
  onNavigateToDiagnostic: (userName: string) => void;
}

const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée.';
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Identifiants incorrects. Veuillez réessayer.';
    default:
      return `Une erreur est survenue (${errorCode || 'inconnue'}). Veuillez réessayer.`;
  }
};

const isPasswordRobust = (pass: string): boolean => {
  const hasMinLength = pass.length >= 8;
  const hasUppercase = /[A-Z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  return hasMinLength && hasUppercase && hasNumber;
};


export const AuthScreen: React.FC<AuthScreenProps> = ({ onNavigateToDiagnostic }) => {
  const { themeMode } = useAppState();
  const isLight = themeMode === 'light';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Détermination de l'URI de redirection en fonction de l'environnement (Expo Go vs Natif)
  const redirectUri = isExpoGo
    ? (makeRedirectUri as any)({
        useProxy: true,
        projectNameForProxy: 'my-root-in',
      })
    : Platform.select({
        ios: 'com.googleusercontent.apps.907074249813-f135370i5o54jsq44s7mf65it2vavvva:/oauth2redirect',
        android: makeRedirectUri({
          scheme: 'myrootin',
        }),
        default: makeRedirectUri({
          scheme: 'myrootin',
        }),
      });

  // Configuration du flux d'authentification Google (Expo Auth Session)
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Client ID Web réel de la console Google Cloud / Firebase (nbrp6epb3quec96ss4jba5ik8e3d4fvd)
    webClientId: "907074249813-nbrp6epb3quec96ss4jba5ik8e3d4fvd.apps.googleusercontent.com",
    androidClientId: isExpoGo
      ? "907074249813-nbrp6epb3quec96ss4jba5ik8e3d4fvd.apps.googleusercontent.com" 
      : "907074249813-fj5r7b6bugg091s1n68g2cljns2gjcmf.apps.googleusercontent.com",
    iosClientId: isExpoGo 
      ? "907074249813-nbrp6epb3quec96ss4jba5ik8e3d4fvd.apps.googleusercontent.com" 
      : "907074249813-f135370i5o54jsq44s7mf65it2vavvva.apps.googleusercontent.com",
    redirectUri,
  });



  // Écouteur de retour de la session d'authentification Google
  useEffect(() => {
    console.log("[DEBUG AUTH] isExpoGo:", isExpoGo);
    console.log("[DEBUG AUTH] redirectUri:", redirectUri);
  }, [redirectUri]);

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      const { idToken } = response.authentication;
      const credential = GoogleAuthProvider.credential(idToken);
      setIsLoadingLocal(true);
      signInWithCredential(auth, credential)
        .catch((err: any) => {
          setIsLoadingLocal(false);
          setError(getFirebaseErrorMessage(err?.code));
        });
    } else if (response?.type === 'error') {
      setError("Une erreur est survenue lors de la connexion avec Google.");
    }
  }, [response]);


  const handleSubmit = async () => {
    if (!name && isSignUp) {
      setError('Veuillez entrer votre prénom.');
      return;
    }
    if (!email || !password || (isSignUp && !confirmPassword)) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (isSignUp && !isPasswordRobust(password)) {
      const msg = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.';
      setError(msg);
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Mot de passe trop faible', msg);
      }
      return;
    }

    setError('');
    setIsLoadingLocal(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
        // After successful sign-up and displayName set, AppStateContext will sync
        // profiles.length === 0, App.tsx will route to 'diagnostic' with userName
      } else {
        await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
        // After successful sign-in, AppStateContext will load profiles
        // App.tsx will automatically route to 'home'
      }
    } catch (err: any) {
      setIsLoadingLocal(false);
      setError(getFirebaseErrorMessage(err?.code));
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        setIsLoadingLocal(true);
        await signInWithPopup(auth, provider);
      } else {
        // Bloquer uniquement sur iOS dans Expo Go car Google Sign-In sur Android fonctionne désormais avec le proxy
        if (isExpoGo && Platform.OS === 'ios') {
          const msg = "En raison des règles de sécurité de Google, la connexion Google (OAuth) ne peut pas fonctionner dans l'application générique Expo Go sur iOS. Veuillez utiliser le bouton de test rapide tout en bas de l'écran, ou tester avec un build de développement natif (EAS).";
          setError(msg);
          Alert.alert("Connexion Google non disponible sur Expo Go iOS", msg);
          return;
        }
        setIsLoadingLocal(true);
        const useProxyForCall = isExpoGo;
        const result = await promptAsync(useProxyForCall ? ({ useProxy: true } as any) : undefined);
        if (result.type !== 'success') {
          setIsLoadingLocal(false);
        }
      }
    } catch (err: any) {
      setIsLoadingLocal(false);
      setError(getFirebaseErrorMessage(err?.code));
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    try {
      if (Platform.OS === 'web') {
        const provider = new OAuthProvider('apple.com');
        setIsLoadingLocal(true);
        await signInWithPopup(auth, provider);
      } else {
        if (isExpoGo) {
          const msg = "La connexion Apple ne peut pas fonctionner dans Expo Go car l'application est signée par Expo (audience mismatch). Veuillez utiliser le bouton de test rapide tout en bas de l'écran, ou tester avec un build de développement natif (EAS).";
          setError(msg);
          Alert.alert("Connexion Apple non disponible sur Expo Go", msg);
          return;
        }
        setIsLoadingLocal(true);
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        const { identityToken } = credential;
        if (identityToken) {
          const provider = new OAuthProvider('apple.com');
          const firebaseCredential = provider.credential({
            idToken: identityToken,
          });
          await signInWithCredential(auth, firebaseCredential);
        } else {
          setIsLoadingLocal(false);
          setError("Impossible d'obtenir le jeton d'identité Apple.");
        }
      }
    } catch (err: any) {
      setIsLoadingLocal(false);
      if (err.code === 'ERR_CANCELED' || err.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled flow, do not show error message
        return;
      }
      setError(getFirebaseErrorMessage(err?.code) || err.message);
    }
  };



  const handleBypass = async () => {
    setError('');
    setIsLoadingLocal(true);
    try {
      const testEmail = 'test@myrootin.com';
      const testPassword = 'password123';
      try {
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
          await updateProfile(userCredential.user, { displayName: 'Amandine' });
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setIsLoadingLocal(false);
      setError(getFirebaseErrorMessage(err?.code));
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      const msg = "Veuillez saisir votre adresse email dans le champ ci-dessus pour recevoir un lien de réinitialisation.";
      setError(msg);
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert("Adresse email manquante", msg);
      }
      return;
    }

    setError('');
    setIsLoadingLocal(true);
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      setIsLoadingLocal(false);
      const msg = `Un e-mail contenant un lien de réinitialisation a été envoyé à l'adresse : ${email}.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert("E-mail envoyé 📧", msg);
      }
    } catch (err: any) {
      setIsLoadingLocal(false);
      setError(getFirebaseErrorMessage(err?.code));
    }
  };

  const customBg = isLight ? '#F5F6FA' : colors.background;
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const customInputBg = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.04)';
  const customInputBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';

  const logoSource = isLight 
    ? require('../../../assets/logo_jour.png') 
    : require('../../../assets/logo_nuit.png');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: customBg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo and Slogan */}
        <View style={styles.headerContainer}>
          <Image 
            source={logoSource} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <Text style={[styles.sloganText, { color: customTextSec }]}>
            Sublimez la nature de vos boucles, cheveux crépus, frisés et locksés.
          </Text>
        </View>

        {/* Auth Box */}
        <View style={[styles.formCard, { backgroundColor: customCard, borderColor: customBorder }]}>
          <Text style={[styles.formTitle, { color: customText }]}>
            {isSignUp ? 'Création de compte' : 'Connexion'}
          </Text>
          <Text style={[styles.formSubtitle, { color: customTextSec }]}>
            {isSignUp 
              ? 'Créez votre profil principal et commencez le diagnostic.' 
              : 'Accédez à vos routines capillaires.'}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isSignUp && (
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: customTextSec }]}>Votre Prénom</Text>
              <TextInput
                style={[styles.input, { color: customText, backgroundColor: customInputBg, borderColor: customInputBorder }]}
                placeholder="Ex: Amandine"
                placeholderTextColor={isLight ? '#888D9F' : colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoadingLocal}
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: customTextSec }]}>Adresse Email</Text>
            <TextInput
              style={[styles.input, { color: customText, backgroundColor: customInputBg, borderColor: customInputBorder }]}
              placeholder="votre.email@exemple.com"
              placeholderTextColor={isLight ? '#888D9F' : colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoadingLocal}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: customTextSec }]}>Mot de passe</Text>
            <TextInput
              style={[styles.input, { color: customText, backgroundColor: customInputBg, borderColor: customInputBorder }]}
              placeholder="••••••••"
              placeholderTextColor={isLight ? '#888D9F' : colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              textContentType="oneTimeCode"
              editable={!isLoadingLocal}
            />
            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={handleForgotPassword}
                disabled={isLoadingLocal}
                activeOpacity={0.7}
              >
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            )}
            {isSignUp && (
              <View style={styles.criteriaContainer}>
                <View style={styles.criteriaRow}>
                  <Text style={[styles.criteriaIcon, { color: password.length >= 8 ? colors.success : (password.length > 0 ? colors.danger : '#888D9F') }]}>
                    {password.length >= 8 ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.criteriaText, { color: password.length >= 8 ? colors.success : (password.length > 0 ? colors.danger : customTextSec) }]}>
                    8 caractères minimum
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={[styles.criteriaIcon, { color: /[A-Z]/.test(password) ? colors.success : (password.length > 0 ? colors.danger : '#888D9F') }]}>
                    {/[A-Z]/.test(password) ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.criteriaText, { color: /[A-Z]/.test(password) ? colors.success : (password.length > 0 ? colors.danger : customTextSec) }]}>
                    Au moins 1 majuscule
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={[styles.criteriaIcon, { color: /[0-9]/.test(password) ? colors.success : (password.length > 0 ? colors.danger : '#888D9F') }]}>
                    {/[0-9]/.test(password) ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.criteriaText, { color: /[0-9]/.test(password) ? colors.success : (password.length > 0 ? colors.danger : customTextSec) }]}>
                    Au moins 1 chiffre
                  </Text>
                </View>
              </View>
            )}
          </View>

          {isSignUp && (
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: customTextSec }]}>Confirmer le mot de passe</Text>
              <TextInput
                style={[styles.input, { color: customText, backgroundColor: customInputBg, borderColor: customInputBorder }]}
                placeholder="••••••••"
                placeholderTextColor={isLight ? '#888D9F' : colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                textContentType="oneTimeCode"
                editable={!isLoadingLocal}
              />
            </View>
          )}

          <Button
            title={isLoadingLocal ? 'Chargement...' : (isSignUp ? 'Commencer le Diagnostic ➔' : 'Se Connecter')}
            onPress={handleSubmit}
            variant="primary"
            style={styles.submitBtn}
            disabled={isLoadingLocal}
          />

{isSignUp && (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 15, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 12, color: '#888888', textAlign: 'center', lineHeight: 18 }}>
            En vous inscrivant, vous acceptez nos{' '}
            <Text style={{ color: colors.primary, textDecorationLine: 'underline', fontWeight: '600' }} onPress={() => setShowLegalModal(true)}>Mentions Légales</Text>
            {' '}et notre{' '}
            <Text style={{ color: colors.primary, textDecorationLine: 'underline', fontWeight: '600' }} onPress={() => setShowPrivacyModal(true)}>Politique de Confidentialité</Text>.
          </Text>
        </View>
      )}

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]} />
            <Text style={[styles.dividerText, { color: customTextSec }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]} />
          </View>

          {/* Google Sign-in Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.googleBtn,
              {
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
                borderColor: isLight ? '#E3E6EF' : 'rgba(255, 255, 255, 0.15)',
              }
            ]}
            onPress={handleGoogleSignIn}
            disabled={isLoadingLocal}
          >
            <Image 
              source={require('../../../assets/google_logo.png')} 
              style={styles.googleIcon} 
            />
            <Text style={[styles.googleBtnText, { color: isLight ? '#1C1E26' : '#FFFFFF' }]}>
              Se connecter avec Google
            </Text>
          </TouchableOpacity>

          {/* Apple Sign-in Button (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.appleBtn,
                {
                  backgroundColor: isLight ? '#000000' : '#FFFFFF',
                  borderColor: isLight ? '#000000' : '#FFFFFF',
                  marginTop: 10,
                }
              ]}
              onPress={handleAppleSignIn}
              disabled={isLoadingLocal}
            >
              <Image 
                source={require('../../../assets/apple_logo.png')} 
                style={[styles.appleIcon, { tintColor: isLight ? '#FFFFFF' : '#1C1E26' }]} 
              />
              <Text style={[styles.appleBtnText, { color: isLight ? '#FFFFFF' : '#1C1E26' }]}>
                Se connecter avec Apple
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => {
              setError('');
              setIsSignUp(!isSignUp);
            }}
            disabled={isLoadingLocal}
          >
            <Text style={[styles.toggleText, { color: customTextSec }]}>
              {isSignUp 
                ? 'Déjà un compte ? Connectez-vous' 
                : 'Pas encore de compte ? Créez-le ici'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Direct Bypass for Easy Testing */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.bypassBtn}
            onPress={handleBypass}
            disabled={isLoadingLocal}
          >
            <Text style={[styles.bypassText, { color: isLight ? colors.primary : colors.textSecondary }]}>
              ⚡ Tester directement (Firebase Auth simulé)
            </Text>
          </TouchableOpacity>
        )}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoImage: {
    width: 280,
    height: 140,
    marginBottom: 10,
    alignSelf: 'center',
  },
  sloganText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  submitBtn: {
    marginTop: 10,
  },
  toggleBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  bypassBtn: {
    alignSelf: 'center',
    marginTop: 30,
    padding: 10,
    backgroundColor: 'rgba(229, 169, 130, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 130, 0.2)',
  },
  bypassText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  appleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  appleBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  criteriaContainer: {
    marginTop: 8,
    gap: 4,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaIcon: {
    fontSize: 12,
    marginRight: 6,
    fontWeight: 'bold',
  },
  criteriaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 2,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  privacyLinkContainer: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  privacyLinkText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});


