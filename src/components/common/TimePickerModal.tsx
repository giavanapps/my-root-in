import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface TimePickerModalProps {
  visible: boolean;
  initialTime: string; // "HH:MM"
  onClose: () => void;
  onSave: (time: string) => void;
  title?: string;
  useNativeModal?: boolean;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime,
  onClose,
  onSave,
  title = "Choisir l'heure de rappel ⏰",
  useNativeModal = true
}) => {
  const { themeMode } = useAppState();
  const isLight = themeMode === 'light';

  // Parse initial time
  const getCurrentTimeRounded = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    if (roundedMinutes === 60) {
      minutes = 0;
      hours = (hours + 1) % 24;
    } else {
      minutes = roundedMinutes;
    }
    return { hours, minutes };
  };

  const defaultTime = getCurrentTimeRounded();
  const [hour, setHour] = useState(defaultTime.hours);
  const [minute, setMinute] = useState(defaultTime.minutes);

  useEffect(() => {
    if (visible && initialTime) {
      const [h, m] = initialTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        setHour(h);
        setMinute(m);
      }
    } else if (visible) {
      const current = getCurrentTimeRounded();
      setHour(current.hours);
      setMinute(current.minutes);
    }
  }, [visible, initialTime]);

  const handleIncrementHour = () => {
    setHour(prev => (prev + 1) % 24);
  };

  const handleDecrementHour = () => {
    setHour(prev => (prev - 1 + 24) % 24);
  };

  const handleIncrementMinute = (amount: number = 5) => {
    setMinute(prev => (prev + amount) % 60);
  };

  const handleDecrementMinute = (amount: number = 5) => {
    setMinute(prev => (prev - amount + 60) % 60);
  };

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  const handlePreset = (h: number, m: number) => {
    setHour(h);
    setMinute(m);
  };

  const handleSave = () => {
    const timeStr = `${formatNumber(hour)}:${formatNumber(minute)}`;
    onSave(timeStr);
    onClose();
  };

  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const customBtnBg = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)';
  const customOverlay = isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay;

  const modalContent = (
    <View style={[
      styles.overlay, 
      { backgroundColor: customOverlay },
      !useNativeModal && { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 99999,
        width: '100%',
        height: '100%'
      }
    ]}>
      <View style={[styles.card, { backgroundColor: customCard, borderColor: customBorder }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.titleText, { color: customText }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]}>
            <Text style={{ color: customTextSec, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Time Display */}
        <View style={[styles.timeDisplayBox, { backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.02)' }]}>
          <Text style={[styles.timeText, { color: colors.primary }]}>
            {formatNumber(hour)}
            <Text style={{ color: customTextSec }}> : </Text>
            {formatNumber(minute)}
          </Text>
        </View>

        {/* Tactile Adjustments */}
        <View style={styles.controlsContainer}>
          {/* Hours adjustment row */}
          <View style={styles.adjustRow}>
            <Text style={[styles.adjustLabel, { color: customTextSec }]}>Heures</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={handleDecrementHour} style={[styles.adjustBtn, { backgroundColor: customBtnBg, borderColor: customBorder }]}>
                <Text style={[styles.btnSymbol, { color: colors.primary }]}>-1h</Text>
              </TouchableOpacity>
              <View style={styles.valueBox}>
                <Text style={[styles.valueText, { color: customText }]}>{formatNumber(hour)}h</Text>
              </View>
              <TouchableOpacity onPress={handleIncrementHour} style={[styles.adjustBtn, { backgroundColor: customBtnBg, borderColor: customBorder }]}>
                <Text style={[styles.btnSymbol, { color: colors.primary }]}>+1h</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Minutes adjustment row */}
          <View style={styles.adjustRow}>
            <Text style={[styles.adjustLabel, { color: customTextSec }]}>Minutes</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={() => handleDecrementMinute(5)} style={[styles.adjustBtn, { backgroundColor: customBtnBg, borderColor: customBorder }]}>
                <Text style={[styles.btnSymbol, { color: colors.primary }]}>-5m</Text>
              </TouchableOpacity>
              <View style={styles.valueBox}>
                <Text style={[styles.valueText, { color: customText }]}>{formatNumber(minute)}m</Text>
              </View>
              <TouchableOpacity onPress={() => handleIncrementMinute(5)} style={[styles.adjustBtn, { backgroundColor: customBtnBg, borderColor: customBorder }]}>
                <Text style={[styles.btnSymbol, { color: colors.primary }]}>+5m</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Presets (Quick select buttons) */}
        <Text style={[styles.presetHeader, { color: customTextSec }]}>Raccourcis rapides :</Text>
        <View style={styles.presetsRow}>
          <TouchableOpacity onPress={() => handlePreset(8, 30)} style={[styles.presetBtn, { backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }]}>
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>🌅 08:30</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePreset(12, 30)} style={[styles.presetBtn, { backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }]}>
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>☀️ 12:30</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePreset(18, 0)} style={[styles.presetBtn, { backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }]}>
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>🌆 18:00</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePreset(20, 30)} style={[styles.presetBtn, { backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }]}>
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>🌙 20:30</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Valider l'heure 💾</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!visible) return null;

  if (useNativeModal) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        {modalContent}
      </Modal>
    );
  }

  return modalContent;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  closeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplayBox: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
  },
  controlsContainer: {
    marginBottom: 16,
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  adjustLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adjustBtn: {
    width: 44,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSymbol: {
    fontSize: 12,
    fontWeight: '800',
  },
  valueBox: {
    width: 60,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '800',
  },
  presetHeader: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  presetBtn: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  }
});
