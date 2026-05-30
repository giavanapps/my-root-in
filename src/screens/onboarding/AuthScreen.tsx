import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { useAppState } from '../../store/AppStateContext';

interface AuthScreenProps {
  onNavigateToDiagnostic: (userName: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNavigateToDiagnostic }) => {
  const { themeMode, updateMasterAccount } = useAppState();
  const isLight = themeMode === 'light';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = () => {
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
    setError('');
    // Sync email and password into global master state
    updateMasterAccount(email, password);
    
    if (isSignUp) {
      // Proceed to diagnostic onboarding with their name
      onNavigateToDiagnostic(name);
    }
    // For logins (isSignUp === false), we do NOT immediately navigate.
    // Instead, App.tsx will detect when isLoading becomes false and redirect accordingly.
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
            {isSignUp ? 'Création de compte Maître' : 'Connexion Maître'}
          </Text>
          <Text style={[styles.formSubtitle, { color: customTextSec }]}>
            {isSignUp 
              ? 'Créez votre profil principal et commencez le diagnostic.' 
              : 'Accédez à vos routines capillaires familiales.'}
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
            />
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
              />
            </View>
          )}

          <Button
            title={isSignUp ? 'Commencer le Diagnostic ➔' : 'Se Connecter'}
            onPress={handleSubmit}
            variant="primary"
            style={styles.submitBtn}
          />

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsSignUp(!isSignUp)}
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
            onPress={() => onNavigateToDiagnostic('Amandine')}
          >
            <Text style={[styles.bypassText, { color: isLight ? colors.primary : colors.textSecondary }]}>⚡ Tester directement (Passer l'inscription)</Text>
          </TouchableOpacity>
        )}
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
    marginTop: 16,
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
});
