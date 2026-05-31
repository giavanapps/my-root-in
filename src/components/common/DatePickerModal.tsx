import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface DatePickerModalProps {
  visible: boolean;
  initialDate: string; // "YYYY-MM-DD"
  onClose: () => void;
  onSave: (date: string) => void;
  title?: string;
  useNativeModal?: boolean;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  initialDate,
  onClose,
  onSave,
  title = "Choisir la date du soin 📅",
  useNativeModal = true
}) => {
  const { themeMode } = useAppState();
  const isLight = themeMode === 'light';

  const monthsFrench = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(5); // 0-indexed (5 = June)
  const [selectedDay, setSelectedDay] = useState(30);

  useEffect(() => {
    if (visible && initialDate) {
      const [y, m, d] = initialDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        setSelectedYear(y);
        setSelectedMonth(m - 1);
        setSelectedDay(d);
      }
    }
  }, [visible, initialDate]);

  // Compute days in currently selected month/year
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Make sure selectedDay is not out of bounds when changing month
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth]);

  const handleSave = () => {
    const yStr = selectedYear.toString();
    const mStr = (selectedMonth + 1).toString().padStart(2, '0');
    const dStr = selectedDay.toString().padStart(2, '0');
    onSave(`${yStr}-${mStr}-${dStr}`);
    onClose();
  };

  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const customBtnBg = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)';
  const customOverlay = isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay;

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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

        {/* Quick Year Selection */}
        <View style={styles.yearRow}>
          {[2026, 2027].map(year => {
            const isSelected = selectedYear === year;
            return (
              <TouchableOpacity
                key={year}
                onPress={() => setSelectedYear(year)}
                style={[
                  styles.yearBtn,
                  { backgroundColor: customBtnBg, borderColor: isSelected ? colors.primary : customBorder },
                  isSelected && { backgroundColor: 'rgba(229, 169, 130, 0.12)' }
                ]}
              >
                <Text style={{ fontSize: 13, color: isSelected ? colors.primary : customText, fontWeight: '800' }}>
                  {year}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Scrollable Months selection */}
        <Text style={[styles.sectionHeader, { color: customTextSec }]}>Mois :</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthsScroll}
          style={styles.monthsWrapper}
        >
          {monthsFrench.map((m, idx) => {
            const isSelected = selectedMonth === idx;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMonth(idx)}
                style={[
                  styles.monthBtn,
                  { backgroundColor: customBtnBg, borderColor: isSelected ? colors.primary : 'transparent' },
                  isSelected && { backgroundColor: 'rgba(229, 169, 130, 0.15)' }
                ]}
              >
                <Text style={{ fontSize: 11, color: isSelected ? colors.primary : customTextSec, fontWeight: '700' }}>
                  {m.substring(0, 4)}.
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grid of Days (1-31) */}
        <Text style={[styles.sectionHeader, { color: customTextSec, marginTop: 12 }]}>Jour :</Text>
        <View style={styles.daysGrid}>
          {daysArray.map(day => {
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayCell,
                  { 
                    backgroundColor: isLight ? '#F9F9FB' : 'rgba(255,255,255,0.02)', 
                    borderColor: isSelected ? colors.primary : 'transparent' 
                  },
                  isSelected && { backgroundColor: 'rgba(229, 169, 130, 0.2)' }
                ]}
              >
                <Text style={{ fontSize: 12, color: isSelected ? colors.primary : customText, fontWeight: isSelected ? '900' : '600' }}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Validation */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Valider la date 📅</Text>
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
    padding: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 360,
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
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  yearBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  monthsWrapper: {
    maxHeight: 40,
    marginBottom: 8,
  },
  monthsScroll: {
    alignItems: 'center',
  },
  monthBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 3,
    borderWidth: 1.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -3,
    marginBottom: 20,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 3,
    borderWidth: 1.5,
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
