import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Dimensions, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAppState, Profile, HairDiagnostic } from '../../store/AppStateContext';
import { Button } from '../../components/common/Button';
import { avatarList, avatarImageMap } from '../onboarding/DiagnosticScreen';

const { width } = Dimensions.get('window');

const fieldOptionsMap = {
  texture: [
    { value: 'Raides', label: 'Raides 📏', desc: 'Cheveux lisses, pas d\'ondulations' },
    { value: 'Ondulés', label: 'Ondulés 🌊', desc: 'Forme en S détendue' },
    { value: 'Bouclés', label: 'Bouclés 🌀', desc: 'Boucles spirales bien définies' },
    { value: 'Frisés', label: 'Frisés 🌀✨', desc: 'Ressorts serrés, volume marqué' },
    { value: 'Crépus', label: 'Crépus 🪮', desc: 'Boucles très serrées ou en Z' },
    { value: 'Locksés', label: 'Locksés 👑', desc: 'Dreadlocks en évolution ou matures' },
  ],
  porosity: [
    { value: 'Faible', label: 'Faible 💧', desc: 'Écailles fermées, l\'eau pénètre difficilement' },
    { value: 'Moyenne', label: 'Moyenne 🌿', desc: 'Écailles équilibrées, hydratation idéale' },
    { value: 'Forte', label: 'Forte 🔥', desc: 'Écailles très ouvertes, sèche très vite' },
  ],
  thickness: [
    { value: 'Fins', label: 'Fins 📏', desc: 'Fibre délicate, s\'alourdit facilement' },
    { value: 'Moyens', label: 'Moyens 📐', desc: 'Épaisseur standard, équilibrée' },
    { value: 'Épais', label: 'Épais 🪵', desc: 'Forte densité, demande des soins riches' },
  ],
  activeStyle: [
    { value: 'Naturel', label: 'Naturel 🥥', desc: 'Cheveux libres (afro, twist out, etc.)' },
    { value: 'Coiffure protectrice', label: 'Coiffure protectrice 🪮', desc: 'Tresses, nattes, vanilles' },
    { value: 'Locks en évolution', label: 'Locks en évolution 👑', desc: 'Dreadlocks' },
  ],
  scalpCondition: [
    { value: 'Aucune de ces situations', label: 'Sain / Normal 💆‍♀️', desc: 'Pas de condition médicale' },
    { value: 'Pellicules/Dermite séborrhéique', label: 'Pellicules / Dermite 🫧', desc: 'Desquamations ou démangeaisons' },
    { value: 'Psoriasis', label: 'Psoriasis 🩹', desc: 'Plaques épaisses de peaux mortes' },
    { value: 'Cuir chevelu très réactif/sensible', label: 'Très sensible ⚡', desc: 'Échauffements et tiraillements' },
    { value: 'Alopécie/Chute importante', label: 'Alopécie / Chute 📉', desc: 'Perte de cheveux localisée ou diffuse' },
  ],
  sensitivity: [
    { value: 'Cuir chevelu sensible', label: 'Cuir chevelu sensible ⚡', desc: 'Sujet aux irritations' },
    { value: 'Casse/Fourches', label: 'Casse / Fourches ✂️', desc: 'Cheveux cassants ou pointes abîmées' },
    { value: 'Naturels', label: 'Naturels 🌿', desc: 'Sans traitement chimique' },
    { value: 'Traités chimiquement', label: 'Traités chimiquement 🧪', desc: 'Défrisés, colorés ou décolorés' },
  ]
};

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
    themeMode,
    completePorosity,
    updateDiagnostic
  } = useAppState();

  // Collapsible panels state
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Edit fields state for multiple profiles
  const [profileNamesMap, setProfileNamesMap] = useState<{[key: string]: string}>({});
  const [targetAvatarProfileId, setTargetAvatarProfileId] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  // Diagnostic edit modal state
  const [editingField, setEditingField] = useState<'texture' | 'porosity' | 'thickness' | 'activeStyle' | 'scalpCondition' | 'sensitivity' | null>(null);
  if (!activeProfile) return null;

  const handleSelectOption = (field: string, value: any) => {
    if (field === 'porosity') {
      completePorosity(value);
      setEditingField(null);
    } else if (field === 'sensitivity') {
      const currentSens = activeProfile.diagnostic.sensitivity || [];
      const updatedSens = currentSens.includes(value)
        ? currentSens.filter((x: string) => x !== value)
        : [...currentSens, value];
      
      updateDiagnostic({
        ...activeProfile.diagnostic,
        sensitivity: updatedSens
      });
    } else {
      updateDiagnostic({
        ...activeProfile.diagnostic,
        [field]: value
      });
      setEditingField(null);
    }
  };

  const togglePanel = (panelName: string) => {
    setActivePanel(prev => prev === panelName ? null : panelName);
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

  const isLight = themeMode === 'light';
  const customBg = isLight ? '#F5F6FA' : colors.background;
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: customBg }]}>
      {/* 👤 TOP HORIZONTAL SELECTOR */}
      <View style={[styles.profileSelectorContainer, { backgroundColor: customCard, borderColor: customBorder }]}>
        <Text style={[styles.topLabel, { color: isLight ? '#888' : colors.textSecondary }]}>
          Gérer les profils :
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
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setTargetAvatarProfileId(activeProfile.id);
                setShowAvatarPicker(true);
              }}
            >
              {avatarImageMap[activeProfile.avatar] ? (
                <Image
                  source={avatarImageMap[activeProfile.avatar]}
                  style={{ width: 70, height: 70, borderRadius: 35, marginRight: 16 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.identityEmoji}>{activeProfile.avatar}</Text>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.identityName, { color: customText }]}>{activeProfile.name}</Text>
              <Text style={styles.identitySub}>Identité capillaire active</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setTargetAvatarProfileId(activeProfile.id);
                  setShowAvatarPicker(true);
                }}
                style={{
                  marginTop: 6,
                  alignSelf: 'flex-start',
                  backgroundColor: isLight ? 'rgba(229, 169, 130, 0.08)' : 'rgba(229, 169, 130, 0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '800' }}>
                  🎭 Changer d'avatar
                </Text>
              </TouchableOpacity>
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

        {/* 2. SYNTHÈSE DU DIAGNOSTIC */}
        <View style={[styles.accordionItem, { backgroundColor: customCard, borderColor: customBorder }]}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => togglePanel('diagnostic_summary')}>
            <Text style={[styles.accordionTitle, { color: customText }]}>📋 Synthèse de mon Diagnostic</Text>
            <Text style={styles.accordionArrow}>{activePanel === 'diagnostic_summary' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {activePanel === 'diagnostic_summary' && (
            <View style={styles.panelContent}>
              <Text style={styles.panelDesc}>
                Voici le détail de vos caractéristiques capillaires issues de votre diagnostic pour {activeProfile.name}. Appuyez sur une ligne pour la modifier directement :
              </Text>
              
              <View style={styles.diagSummaryGrid}>
                {/* Texture */}
                <TouchableOpacity 
                  style={[styles.diagSummaryItem, { borderBottomColor: customBorder }]}
                  activeOpacity={0.7}
                  onPress={() => setEditingField('texture')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.diagSummaryLabel}>👩‍🦱 Texture de cheveux</Text>
                    <Text style={[styles.diagSummaryValue, { color: customText }]}>
                      {activeProfile.diagnostic.texture || 'Non renseignée'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Modifier ➔</Text>
                </TouchableOpacity>

                {/* Porosité */}
                <TouchableOpacity 
                  style={[styles.diagSummaryItem, { borderBottomColor: customBorder }]}
                  activeOpacity={0.7}
                  onPress={() => setEditingField('porosity')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.diagSummaryLabel}>💧 Porosité</Text>
                    <Text style={[styles.diagSummaryValue, { color: colors.primary }]}>
                      {activeProfile.diagnostic.porosity || 'Non renseignée'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Modifier ➔</Text>
                </TouchableOpacity>

                {/* Épaisseur */}
                <TouchableOpacity 
                  style={[styles.diagSummaryItem, { borderBottomColor: customBorder }]}
                  activeOpacity={0.7}
                  onPress={() => setEditingField('thickness')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.diagSummaryLabel}>📏 Épaisseur de la fibre</Text>
                    <Text style={[styles.diagSummaryValue, { color: customText }]}>
                      {activeProfile.diagnostic.thickness || 'Non renseignée'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Modifier ➔</Text>
                </TouchableOpacity>

                {/* Style Actuel */}
                <TouchableOpacity 
                  style={[styles.diagSummaryItem, { borderBottomColor: customBorder }]}
                  activeOpacity={0.7}
                  onPress={() => setEditingField('activeStyle')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.diagSummaryLabel}>🪮 Style / Coiffure actuelle</Text>
                    <Text style={[styles.diagSummaryValue, { color: customText }]}>
                      {activeProfile.diagnostic.activeStyle || 'Non renseigné'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Modifier ➔</Text>
                </TouchableOpacity>

                {/* Cuir Chevelu */}
                <TouchableOpacity 
                  style={[styles.diagSummaryItem, { borderBottomColor: customBorder }]}
                  activeOpacity={0.7}
                  onPress={() => setEditingField('scalpCondition')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.diagSummaryLabel}>💆‍♀️ État du cuir chevelu</Text>
                    <Text style={[styles.diagSummaryValue, { color: customText }]}>
                      {activeProfile.diagnostic.scalpCondition || 'Sain / Normal'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Modifier ➔</Text>
                </TouchableOpacity>

                {/* Sensibilité & Besoins */}
                <TouchableOpacity 
                  style={[styles.diagSummaryItem, { borderBottomWidth: 0, flexDirection: 'row', alignItems: 'center' }]}
                  activeOpacity={0.7}
                  onPress={() => setEditingField('sensitivity')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.diagSummaryLabel}>🎯 Sensibilités / Besoins ciblés</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {activeProfile.diagnostic.sensitivity && activeProfile.diagnostic.sensitivity.length > 0 ? (
                        activeProfile.diagnostic.sensitivity.map((sens: string, idx: number) => (
                          <View 
                            key={idx} 
                            style={{ 
                              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', 
                              borderRadius: 8, 
                              paddingHorizontal: 8, 
                              paddingVertical: 4, 
                              borderWidth: 0.5, 
                              borderColor: customBorder 
                            }}
                          >
                            <Text style={{ fontSize: 11, color: customText, fontWeight: '600' }}>{sens}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.diagSummaryValue, { color: customText }]}>Aucun besoin particulier</Text>
                      )}
                    </View>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Modifier ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 3. PARAMÈTRES CAPILLAIRES */}
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
                onPress={() => setEditingField('porosity')}
                variant="secondary"
                style={styles.hairOptionBtn}
              />
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
        </View>

      </ScrollView>

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

      {/* 🔮 UNIFIED DIAGNOSTIC EDIT MODAL */}
      <Modal
        visible={editingField !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingField(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingField === 'texture' && '👩‍🦱 Modifier la texture'}
              {editingField === 'porosity' && '💧 Modifier la porosité'}
              {editingField === 'thickness' && '📏 Modifier l\'épaisseur'}
              {editingField === 'activeStyle' && '✨ Modifier le style actuel'}
              {editingField === 'scalpCondition' && '💆‍♀️ État du cuir chevelu'}
              {editingField === 'sensitivity' && '🎯 Sensibilités & Besoins'}
            </Text>
            
            <ScrollView style={styles.avatarScrollView}>
              <View style={styles.modalOptionsContainer}>
                {editingField && (fieldOptionsMap as any)[editingField]?.map((opt: any) => {
                  let isActive = false;
                  if (editingField === 'sensitivity') {
                    isActive = (activeProfile.diagnostic.sensitivity || []).includes(opt.value);
                  } else {
                    isActive = activeProfile.diagnostic[editingField] === opt.value;
                  }

                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.modalOptionPill, 
                        { 
                          borderColor: isActive ? colors.primary : customBorder,
                          backgroundColor: isActive ? (isLight ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.1)') : 'rgba(255, 255, 255, 0.02)'
                        }
                      ]}
                      onPress={() => handleSelectOption(editingField, opt.value)}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.modalOptionLabel, { color: isActive ? colors.primary : customText }]}>
                          {opt.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: isLight ? '#666' : colors.textSecondary, marginTop: 2 }}>
                          {opt.desc}
                        </Text>
                      </View>
                      {editingField === 'sensitivity' && (
                        <Text style={{ fontSize: 18, color: colors.primary }}>
                          {isActive ? '✅' : '⬜'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Button
                title={editingField === 'sensitivity' ? "Terminer" : "Fermer"}
                onPress={() => setEditingField(null)}
                variant="primary"
                style={{ flex: 1, marginVertical: 0 }}
              />
            </View>
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
  hairOptionBtn: {
    marginVertical: 6,
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
    width: '47%',
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
  modalCloseBtn: {
    marginTop: 16,
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
  bottomActionsContainer: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  bottomActionBtn: {
    marginVertical: 0,
    paddingVertical: 14,
  },
  diagSummaryGrid: {
    marginTop: 4,
  },
  diagSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  diagSummaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  diagSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
