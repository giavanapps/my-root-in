import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { HairDiagnostic, useAppState } from '../../store/AppStateContext';
import { NotificationService } from '../../store/NotificationService';

const { width } = Dimensions.get('window');

interface DiagnosticScreenProps {
  userName: string;
  onFinishDiagnostic: () => void;
  isEditing?: boolean;
}

export const avatarImageMap: { [key: string]: any } = {
  avatar_1: require('../../../assets/avatars/avatar_1.png'),
  avatar_2: require('../../../assets/avatars/avatar_2.png'),
  avatar_3: require('../../../assets/avatars/avatar_3.png'),
  avatar_4: require('../../../assets/avatars/avatar_4.png'),
  avatar_5: require('../../../assets/avatars/avatar_5.png'),
  avatar_6: require('../../../assets/avatars/avatar_6.png'),
  avatar_7: require('../../../assets/avatars/avatar_7.png'),
  avatar_8: require('../../../assets/avatars/avatar_8.png'),
  avatar_9: require('../../../assets/avatars/avatar_9.png'),
  avatar_10: require('../../../assets/avatars/avatar_10.png'),
  avatar_11: require('../../../assets/avatars/avatar_11.png'),
  avatar_12: require('../../../assets/avatars/avatar_12.png'),
};

export const avatarList = [
  { id: 'avatar_1', label: 'Afro Doré' },
  { id: 'avatar_2', label: 'Tresses Perlées' },
  { id: 'avatar_3', label: 'Locks Sublimes' },
  { id: 'avatar_4', label: 'Afro Court' },
  { id: 'avatar_5', label: 'Locks Homme' },
  { id: 'avatar_6', label: 'Court Ondulé' },
  { id: 'avatar_7', label: 'Foulard Chic' },
  { id: 'avatar_8', label: 'Boucles Ambrées' },
  { id: 'avatar_9', label: 'Tresses Longues' },
  { id: 'avatar_10', label: 'Double Chignons' },
  { id: 'avatar_11', label: 'Locks Colorées' },
  { id: 'avatar_12', label: 'Frangette Crépue' },
];

export const DiagnosticScreen: React.FC<DiagnosticScreenProps> = ({ userName, onFinishDiagnostic, isEditing = false }) => {
  const { addProfile, updateDiagnostic, changeAvatar, activeProfile } = useAppState();

  // Local state for diagnostic steps
  const [step, setStep] = useState(1);
  const totalSteps = isEditing ? 7 : 9; // Name, Avatar, Texture, Porosity, Thickness, Sensitivity, Style, History, Notifications (Soft Pitch)
  const [notifTone, setNotifTone] = useState<'Doux' | 'Motivant' | 'Direct'>('Motivant');

  // Hair care history states
  const [lastWash, setLastWash] = useState<'hier' | '3-5_jours' | 'plus_une_semaine' | 'ne_sais_plus'>('3-5_jours');
  const [recentOil, setRecentOil] = useState<'cette_semaine' | '2_semaines' | 'pas_recent'>('2_semaines');
  const [recentMask, setRecentMask] = useState<'cette_semaine' | '2_semaines' | 'pas_recent'>('2_semaines');
  const [currentFeeling, setCurrentFeeling] = useState<'secs' | 'equilibres' | 'lourds'>('equilibres');

  const [profileName, setProfileName] = useState(isEditing && activeProfile ? activeProfile.name : (userName || ''));
  const [nameError, setNameError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(isEditing && activeProfile ? activeProfile.avatar : 'avatar_1');

  const [texture, setTexture] = useState<HairDiagnostic['texture']>(
    isEditing && activeProfile ? activeProfile.diagnostic.texture : 'Crépus'
  );
  const [porosity, setPorosity] = useState<HairDiagnostic['porosity']>(
    isEditing && activeProfile ? activeProfile.diagnostic.porosity : 'Moyenne'
  );
  const [thickness, setThickness] = useState<HairDiagnostic['thickness']>(
    isEditing && activeProfile ? activeProfile.diagnostic.thickness : 'Moyens'
  );
  const [sensitivity, setSensitivity] = useState<HairDiagnostic['sensitivity']>(
    isEditing && activeProfile ? activeProfile.diagnostic.sensitivity : ['Naturels']
  );
  const [activeStyle, setActiveStyle] = useState<HairDiagnostic['activeStyle']>(
    isEditing && activeProfile ? activeProfile.diagnostic.activeStyle : 'Naturel'
  );

  useEffect(() => {
    if (isEditing && activeProfile) {
      setProfileName(activeProfile.name);
      setSelectedAvatar(activeProfile.avatar);
      setTexture(activeProfile.diagnostic.texture);
      setPorosity(activeProfile.diagnostic.porosity);
      setThickness(activeProfile.diagnostic.thickness);
      setSensitivity(activeProfile.diagnostic.sensitivity);
      setActiveStyle(activeProfile.diagnostic.activeStyle);
    } else {
      setProfileName(userName || '');
      setNameError('');
      setSelectedAvatar('avatar_1');
    }
  }, [userName, isEditing, activeProfile]);

  // Option Lists
  const textureOptions: { value: HairDiagnostic['texture']; desc: string; icon: string }[] = [
    { value: 'Locksés', desc: 'Mèches emmêlées, évolution organique', icon: '👑' },
    { value: 'Crépus', desc: 'Forme en Z ou crépuscule compact, rétraction forte', icon: '🦁' },
    { value: 'Frisés', desc: 'Ressorts serrés, volume marqué', icon: '➰' },
    { value: 'Bouclés', desc: 'Boucles spirales bien définies', icon: '🌀' },
    { value: 'Ondulés', desc: 'Forme en S détendue, légères vagues', icon: '〰️' },
    { value: 'Raides', desc: 'Cheveux lisses, pas d\'ondulations ni de boucles', icon: '💇‍♀️' },
  ];

  const porosityOptions: { value: HairDiagnostic['porosity']; desc: string; indicatorColor: string }[] = [
    { value: 'Faible', desc: 'Les écailles sont fermées. L\'eau pénètre difficilement mais reste emprisonnée une fois dedans.', indicatorColor: colors.porosityLow },
    { value: 'Moyenne', desc: 'L\'hydratation idéale. L\'humidité pénètre et reste de façon équilibrée.', indicatorColor: colors.porosityMedium },
    { value: 'Forte', desc: 'Écailles très ouvertes. Absorbe l\'eau instantanément mais sèche hyper vite.', indicatorColor: colors.porosityHigh },
  ];

  const thicknessOptions: { value: HairDiagnostic['thickness']; desc: string }[] = [
    { value: 'Fins', desc: 'Brins délicats, ont besoin de volume sans être alourdis.' },
    { value: 'Moyens', desc: 'Épaisseur standard, polyvalents et équilibrés.' },
    { value: 'Épais', desc: 'Forte densité de matière, demandent des soins riches et profonds.' },
  ];

  const sensitivityOptions: { value: HairDiagnostic['sensitivity'][number]; desc: string }[] = [
    { value: 'Cuir chevelu sensible', desc: 'Démangeaisons, pellicules sèches ou grasses.' },
    { value: 'Casse/Fourches', desc: 'Pointes abîmées, cheveux cassants.' },
    { value: 'Naturels', desc: 'Sans défrisage, coloration ni décoloration chimique.' },
    { value: 'Traités chimiquement', desc: 'Colorés, décolorés, lissés ou défrisés.' },
  ];

  const activeStyleOptions: { value: HairDiagnostic['activeStyle']; desc: string; icon: string }[] = [
    { value: 'Naturel', desc: 'Cheveux portés libres (wash & go, twist outs, afro, etc.)', icon: '🌿' },
    { value: 'Coiffure protectrice', desc: 'Nattes, tresses, vanilles pour reposer la fibre', icon: '🛡️' },
    { value: 'Locks en évolution', desc: 'Départ de dreadlocks ou locks matures', icon: '☀️' },
  ];

  const toggleSensitivity = (value: typeof sensitivityOptions[number]['value']) => {
    setSensitivity(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value) 
        : [...prev, value]
    );
  };

  const handleFinish = async (requestPush: boolean) => {
    const diagnosticData: HairDiagnostic = {
      texture,
      porosity,
      thickness,
      sensitivity,
      activeStyle,
    };

    if (isEditing && activeProfile) {
      updateDiagnostic(diagnosticData);
      changeAvatar(activeProfile.id, selectedAvatar);
    } else {
      let pushGranted = false;
      if (requestPush) {
        const status = await NotificationService.requestPermissions();
        pushGranted = status === 'granted';
      }
      // Package dynamic offsets history
      const historyData = {
        lastWash,
        recentOil,
        recentMask,
        currentFeeling,
      };
      addProfile(profileName, diagnosticData, selectedAvatar, pushGranted, notifTone, historyData);
    }

    onFinishDiagnostic();
  };

  const handleNext = () => {
    if (step === 1) {
      if (!profileName.trim()) {
        setNameError('Veuillez renseigner le prénom pour ce profil.');
        return;
      }
      setNameError('');
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Step 7 editing mode completion
      handleFinish(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.stepIndicatorText}>Étape {step} sur {totalSteps}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step 1: Prénom du profil */}
        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.welcomeText}>{isEditing ? 'Mise à jour du diagnostic' : 'Création de profil'} 👤</Text>
            <Text style={styles.title}>{isEditing ? 'Validation du prénom enregistré' : 'Quel est le prénom du membre ?'}</Text>
            <Text style={styles.subtitle}>
              {isEditing 
                ? 'Le prénom est verrouillé. Pour le modifier, rendez-vous dans la Gestion des Profils.'
                : 'Chaque membre de la famille aura son diagnostic propre et son calendrier personnalisé.'}
            </Text>
            
            <View style={styles.nameInputWrapper}>
              <Text style={styles.inputLabel}>{isEditing ? 'Prénom (Verrouillé)' : 'Prénom'}</Text>
              <TextInput
                style={[
                  styles.nameInput,
                  isEditing && {
                    opacity: 0.6,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'rgba(255, 255, 255, 0.04)',
                    color: colors.textSecondary
                  }
                ]}
                placeholder="Ex: Sarah, Amandine, Léo..."
                placeholderTextColor={colors.textMuted}
                value={profileName}
                onChangeText={setProfileName}
                autoCapitalize="words"
                autoFocus={!isEditing}
                editable={!isEditing}
              />
              {nameError ? <Text style={styles.nameErrorText}>{nameError}</Text> : null}
            </View>

            {/* Helper Card */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                💡 Vous pourrez basculer instantanément d'un profil à un autre depuis le sélecteur d'avatar en haut de l'écran d'accueil.
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: Choix de l'avatar illustré */}
        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.welcomeText}>Profil : {profileName} 👤</Text>
            <Text style={styles.title}>Choisissez un avatar représentatif ✨</Text>
            <Text style={styles.subtitle}>
              Sélectionnez une illustration qui représente le style capillaire ou l'identité de ce profil.
            </Text>

            <View style={styles.avatarGrid}>
              {avatarList.map(item => {
                const isSelected = selectedAvatar === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.avatarItem, isSelected && styles.avatarItemActive, { justifyContent: 'center', alignItems: 'center' }]}
                    onPress={() => setSelectedAvatar(item.id)}
                    activeOpacity={0.8}
                  >
                    {avatarImageMap[item.id] ? (
                      <View style={{ width: 72, height: 72, borderRadius: 36, overflow: 'hidden' }}>
                        <Image
                          source={avatarImageMap[item.id]}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      </View>
                    ) : (
                      <Text style={styles.avatarEmojiText}>👤</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Texture */}
        {step === 3 && (
          <View style={styles.stepCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.welcomeText}>Profil : {profileName} </Text>
              {avatarImageMap[selectedAvatar] ? (
                <Image source={avatarImageMap[selectedAvatar]} style={{ width: 22, height: 22, borderRadius: 11 }} resizeMode="contain" />
              ) : (
                <Text style={styles.welcomeText}>{selectedAvatar}</Text>
              )}
            </View>
            <Text style={styles.title}>Quelle est la forme ou texture principale de vos cheveux ?</Text>
            <Text style={styles.subtitle}>Sélectionnez l'option qui correspond le mieux à votre nature de cheveux.</Text>
            
            {textureOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  texture === option.value && styles.selectedOptionCard,
                ]}
                onPress={() => setTexture(option.value)}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionTextWrapper}>
                  <Text style={[styles.optionTitle, texture === option.value && styles.selectedOptionTitle]}>
                    {option.value}
                  </Text>
                  <Text style={styles.optionDesc}>{option.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 4: Porosity */}
        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.title}>Quelle est la porosité de vos cheveux ? 🔬</Text>
            <Text style={styles.subtitle}>La porosité détermine la capacité de votre cheveu à absorber et retenir l'eau.</Text>
            
            {porosityOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  porosity === option.value && styles.selectedOptionCard,
                ]}
                onPress={() => setPorosity(option.value)}
              >
                <View style={[styles.porosityIndicator, { backgroundColor: option.indicatorColor }]} />
                <View style={styles.optionTextWrapper}>
                  <Text style={[styles.optionTitle, porosity === option.value && styles.selectedOptionTitle]}>
                    Porosité {option.value}
                  </Text>
                  <Text style={styles.optionDesc}>{option.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Skip Porosity Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.optionCard,
                styles.skipPorosityCard,
                porosity === null && styles.selectedOptionCard,
              ]}
              onPress={() => {
                setPorosity(null);
                setStep(5); // Shift to step 5 (Thickness)
              }}
            >
              <Text style={styles.optionIcon}>❓</Text>
              <View style={styles.optionTextWrapper}>
                <Text style={[styles.optionTitle, porosity === null && styles.selectedOptionTitle]}>
                  Je ne sais pas encore
                </Text>
                <Text style={styles.optionDesc}>Passer pour l'instant — Enregistrer null et programmer un rappel J+7</Text>
              </View>
            </TouchableOpacity>

            {/* Micro-learning tip */}
            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 Le test du verre d'eau :</Text>
              <Text style={styles.tipText}>
                Déposez un cheveu propre dans un verre d'eau. S'il coule au fond (forte porosité), s'il flotte au milieu (porosité moyenne), s'il reste en surface (faible porosité).
              </Text>
            </View>
          </View>
        )}

        {/* Step 5: Thickness */}
        {step === 5 && (
          <View style={styles.stepCard}>
            <Text style={styles.title}>Quelle est l'épaisseur de vos brins individuels ? 📏</Text>
            <Text style={styles.subtitle}>Cela permet de définir le poids idéal des crèmes et des huiles.</Text>
            
            {thicknessOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  thickness === option.value && styles.selectedOptionCard,
                ]}
                onPress={() => setThickness(option.value)}
              >
                <View style={styles.thicknessLineWrapper}>
                  <View style={[
                    styles.thicknessLine,
                    option.value === 'Fins' && styles.lineFine,
                    option.value === 'Moyens' && styles.lineMedium,
                    option.value === 'Épais' && styles.lineThick,
                  ]} />
                </View>
                <View style={styles.optionTextWrapper}>
                  <Text style={[styles.optionTitle, thickness === option.value && styles.selectedOptionTitle]}>
                    Cheveux {option.value}
                  </Text>
                  <Text style={styles.optionDesc}>{option.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 6: Sensitivity / Health State */}
        {step === 6 && (
          <View style={styles.stepCard}>
            <Text style={styles.title}>Quel est l'état actuel ou la sensibilité de vos cheveux ? ⚠️</Text>
            <Text style={styles.subtitle}>Sélectionnez toutes les affirmations qui s'appliquent.</Text>
            
            {sensitivityOptions.map(option => {
              const isSelected = sensitivity.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.8}
                  style={[
                    styles.optionCard,
                    isSelected && styles.selectedOptionCard,
                  ]}
                  onPress={() => toggleSensitivity(option.value)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                    {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <View style={styles.optionTextWrapper}>
                    <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
                      {option.value}
                    </Text>
                    <Text style={styles.optionDesc}>{option.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 7: Active Style */}
        {step === 7 && (
          <View style={styles.stepCard}>
            <Text style={styles.title}>Quel est votre style ou coiffure active en ce moment ? 💇🏾</Text>
            <Text style={styles.subtitle}>Nous adapterons les rappels d'hydratation et de manipulation en fonction de cela.</Text>
            
            {activeStyleOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  activeStyle === option.value && styles.selectedOptionCard,
                ]}
                onPress={() => setActiveStyle(option.value)}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionTextWrapper}>
                  <Text style={[styles.optionTitle, activeStyle === option.value && styles.selectedOptionTitle]}>
                    {option.value}
                  </Text>
                  <Text style={styles.optionDesc}>{option.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 8: Hair History Questionnaire */}
        {step === 8 && (
          <View style={styles.stepCard}>
            <Text style={styles.welcomeText}>Historique de soins 🌿</Text>
            <Text style={styles.title}>Dis-nous où tu en es</Text>
            <Text style={styles.subtitle}>
              Ces réponses nous permettent de caler votre premier lavage et vos masques précisément sans surcharger vos cheveux.
            </Text>

            {/* Q1: Dernier lavage */}
            <View style={styles.historyQuestionBlock}>
              <Text style={styles.historyQuestionLabel}>1. Quand as-tu fait ton dernier lavage ?</Text>
              <View style={styles.historyPillsRow}>
                {[
                  { value: 'hier', label: 'Hier' },
                  { value: '3-5_jours', label: '3-5 jours' },
                  { value: 'plus_une_semaine', label: '> 1 semaine' },
                  { value: 'ne_sais_plus', label: 'Je ne sais plus' }
                ].map(opt => {
                  const isActive = lastWash === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.historyPill, isActive && styles.historyPillActive]}
                      onPress={() => setLastWash(opt.value as any)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.historyPillText, isActive && styles.historyPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Q2: Bain d'huile */}
            <View style={styles.historyQuestionBlock}>
              <Text style={styles.historyQuestionLabel}>2. As-tu fait un bain d'huile récemment ?</Text>
              <View style={styles.historyPillsRow}>
                {[
                  { value: 'cette_semaine', label: 'Cette semaine' },
                  { value: '2_semaines', label: 'Il y a 2 semaines' },
                  { value: 'pas_recent', label: 'Pas récemment' }
                ].map(opt => {
                  const isActive = recentOil === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.historyPill, isActive && styles.historyPillActive]}
                      onPress={() => setRecentOil(opt.value as any)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.historyPillText, isActive && styles.historyPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Q3: Masque */}
            <View style={styles.historyQuestionBlock}>
              <Text style={styles.historyQuestionLabel}>3. As-tu fait un masque récemment ?</Text>
              <View style={styles.historyPillsRow}>
                {[
                  { value: 'cette_semaine', label: 'Cette semaine' },
                  { value: '2_semaines', label: 'Il y a 2 semaines' },
                  { value: 'pas_recent', label: 'Pas récemment' }
                ].map(opt => {
                  const isActive = recentMask === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.historyPill, isActive && styles.historyPillActive]}
                      onPress={() => setRecentMask(opt.value as any)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.historyPillText, isActive && styles.historyPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Q4: État des cheveux */}
            <View style={styles.historyQuestionBlock}>
              <Text style={styles.historyQuestionLabel}>4. Comment se sentent tes cheveux en ce moment ?</Text>
              <View style={styles.historyPillsRow}>
                {[
                  { value: 'secs', label: 'Secs 🍂' },
                  { value: 'equilibres', label: 'Équilibrés 🌿' },
                  { value: 'lourds', label: 'Lourds 😬' }
                ].map(opt => {
                  const isActive = currentFeeling === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.historyPill, isActive && styles.historyPillActive]}
                      onPress={() => setCurrentFeeling(opt.value as any)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.historyPillText, isActive && styles.historyPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Step 9: Onboarding Soft Pitch Notification Permission */}
        {step === 9 && (
          <View style={styles.stepCard}>
            <Text style={styles.welcomeText}>Dernière étape ! 🔔</Text>
            <Text style={styles.title}>Ne manquez aucun soin de votre routine</Text>
            <Text style={styles.subtitle}>
              My Root'In vous envoie un rappel discret et silencieux le matin de votre soin pour vous guider pas à pas.
            </Text>

            {/* Custom Interactive Preview Tone Selector */}
            <Text style={styles.inputLabel}>Choisissez le ton de vos rappels :</Text>
            <View style={styles.toneSelectorGrid}>
              {[
                { value: 'Doux', icon: '🌸', desc: 'Bienveillant' },
                { value: 'Motivant', icon: '🔥', desc: 'Boostant' },
                { value: 'Direct', icon: '⚡', desc: 'Efficace' }
              ].map(t => {
                const isActive = notifTone === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.tonePillCard, isActive && styles.tonePillCardActive]}
                    onPress={() => setNotifTone(t.value as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tonePillIcon}>{t.icon}</Text>
                    <Text style={[styles.tonePillTitle, isActive && styles.tonePillTitleActive]}>{t.value}</Text>
                    <Text style={styles.tonePillDesc}>{t.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Premium Simulated iPhone/Android Push Notification Card */}
            <Text style={styles.inputLabel}>Aperçu de votre rappel :</Text>
            <View style={styles.simulatedNotification}>
              <View style={styles.simulatedNotificationHeader}>
                <Text style={styles.simulatedNotificationApp}>🌿 MY ROOT'IN</Text>
                <Text style={styles.simulatedNotificationTime}>À l'instant</Text>
              </View>
              <Text style={styles.simulatedNotificationTitle}>Rappel de soin quotidien</Text>
              <Text style={styles.simulatedNotificationBody}>
                {(() => {
                  const name = profileName.split(' ')[0] || 'Sarah';
                  if (notifTone === 'Doux') {
                    return `Bonjour ${name} ! C'est le moment de chouchouter tes cheveux : ton soin ${texture === 'Locksés' ? 'Retwist' : 'Lavage'} t'attend. Prends ce doux moment 🌿`;
                  }
                  if (notifTone === 'Motivant') {
                    return `Aujourd'hui on ne lâche rien, ${name} ! Ton soin ${texture === 'Locksés' ? 'Retwist' : 'Lavage'} est prévu. Tes boucles vont adorer, let's go ! 💪`;
                  }
                  return `Rappel : Soin ${texture === 'Locksés' ? 'Retwist' : 'Lavage'} à réaliser aujourd'hui. Ouvre ton guide d'étapes sur l'application.`;
                })()}
              </Text>
            </View>

            {/* Reassurance Info Box */}
            <View style={styles.reassuranceBox}>
              <Text style={styles.reassuranceText}>
                🔒 **Respect de votre tranquillité** :{"\n"}
                • Aucun son ou lecture vocale en public (respecte le mode vibreur/silencieux).{"\n"}
                • Zéro message publicitaire ou spam.{"\n"}
                • Modifiable à tout moment dans l'onglet Profil.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button Row */}
      <View style={styles.footer}>
        {step === 9 ? (
          <View style={styles.softPitchFooterRow}>
            <Button
              title="Plus tard"
              onPress={() => handleFinish(false)}
              variant="secondary"
              style={styles.softPitchBtnLeft}
            />
            <Button
              title="Activer les rappels 🔔"
              onPress={() => handleFinish(true)}
              variant="primary"
              style={styles.softPitchBtnRight}
            />
          </View>
        ) : (
          <>
            {step > 1 ? (
              <Button
                title="Retour"
                onPress={handleBack}
                variant="secondary"
                style={styles.backBtn}
              />
            ) : <View style={styles.backBtnPlaceholder} />}
            
            <Button
              title={step === totalSteps ? 'Finaliser mon diagnostic 🎉' : 'Suivant ➔'}
              onPress={handleNext}
              variant="primary"
              style={styles.nextBtn}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepIndicatorText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  stepCard: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedOptionCard: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 169, 130, 0.05)',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionTextWrapper: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  selectedOptionTitle: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  porosityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 16,
  },
  thicknessLineWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  thicknessLine: {
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  lineFine: {
    width: 2,
    height: 18,
  },
  lineMedium: {
    width: 4,
    height: 18,
  },
  lineThick: {
    width: 8,
    height: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.textMuted,
    borderRadius: 6,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxTick: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '900',
  },
  tipBox: {
    backgroundColor: 'rgba(92, 138, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(92, 138, 107, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  tipTitle: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
  },
  tipText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  skipPorosityCard: {
    borderStyle: 'dashed',
    borderColor: 'rgba(229, 169, 130, 0.4)',
    backgroundColor: 'rgba(229, 169, 130, 0.02)',
  },
  nameInputWrapper: {
    marginVertical: 20,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  nameErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: 'rgba(229, 169, 130, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 130, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  infoBoxText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
  },
  backBtn: {
    flex: 1,
    marginRight: 12,
  },
  backBtnPlaceholder: {
    flex: 0,
    width: 0,
  },
  nextBtn: {
    flex: 2,
  },
  
  // Illustrated Avatar grid styles
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  avatarItem: {
    width: (width - 48 - 32) / 3, // Grid layout for 3 columns on mobile safely
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarItemActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 169, 130, 0.06)',
  },
  avatarEmojiText: {
    fontSize: 42,
    lineHeight: 46,
    marginBottom: 6,
  },
  avatarLabelText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  avatarLabelActive: {
    color: colors.primary,
  },
  toneSelectorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  tonePillCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tonePillCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 169, 130, 0.05)',
  },
  tonePillIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  tonePillTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tonePillTitleActive: {
    color: colors.primary,
  },
  tonePillDesc: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  simulatedNotification: {
    backgroundColor: '#1E2130',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginVertical: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  simulatedNotificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  simulatedNotificationApp: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  simulatedNotificationTime: {
    fontSize: 9,
    color: colors.textMuted,
  },
  simulatedNotificationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  simulatedNotificationBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  reassuranceBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  reassuranceText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  softPitchFooterRow: {
    flexDirection: 'row',
    width: '100%',
  },
  softPitchBtnLeft: {
    flex: 1,
    marginRight: 10,
  },
  softPitchBtnRight: {
    flex: 2,
  },
  historyQuestionBlock: {
    marginBottom: 20,
  },
  historyQuestionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  historyPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  historyPill: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyPillActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 169, 130, 0.08)',
  },
  historyPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  historyPillTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
