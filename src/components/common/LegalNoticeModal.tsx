import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LEGAL_NOTICE_TEXT } from '../../constants/legalNotice';
import { useAppState } from '../../store/AppStateContext';

interface LegalNoticeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({ visible, onClose }) => {
  const { themeMode } = useAppState();
  const isDark = themeMode === 'dark';

  const bg = isDark ? '#0B0D17' : '#F5F5FA';
  const text = isDark ? '#F0F2FF' : '#1C1E26';
  const textSec = isDark ? '#8A8FA8' : '#6A6F82';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: border }]}>
          <View style={styles.headerHandle} />
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: text }]}>⚖️ Mentions Légales</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }
              ]}
            >
              <Text style={{ color: textSec, fontWeight: '700', fontSize: 15 }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={true}>
          <Text style={[styles.policyText, { color: text }]}>{LEGAL_NOTICE_TEXT}</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
    fontSize: 18,
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
    padding: 20,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
});
