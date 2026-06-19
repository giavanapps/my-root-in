import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Animated, Easing, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';
import * as Location from 'expo-location';

interface DynamicHeaderProps {
  onPriorityPress?: () => void;
}

const isNight = () => { const h = new Date().getHours(); return h >= 20 || h < 6; };

const convertTemp = (tempC: number, unit: 'C' | 'F') => {
  if (unit === 'F') {
    return Math.round((tempC * 9 / 5) + 32);
  }
  return tempC;
};

const getMockedWeather = (dateStr: string) => {
  if (isNight()) return { condition: 'Nuit calme 🌙', icon: '🌙', humidity: 60, temp: 17 };
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 3;
  const currentMonth = new Date().getMonth();
  const isSummer = currentMonth >= 5 && currentMonth <= 8;

  if (isSummer) {
    switch (index) {
      case 0: return { condition: 'Pluie/Humide 🌧️', icon: '🌧️', humidity: 80, temp: 21 };
      case 1: return { condition: 'Soleil/Chaud ☀️', icon: '☀️', humidity: 45, temp: 26 };
      default: return { condition: 'Venteux/Sec 💨', icon: '💨', humidity: 40, temp: 22 };
    }
  } else {
    const isWinter = currentMonth >= 11 || currentMonth <= 1;
    const indexWinter = Math.abs(hash) % 4;
    switch (indexWinter) {
      case 0: return { condition: 'Pluie/Humide 🌧️', icon: '🌧️', humidity: 85, temp: 12 };
      case 1: return { condition: isWinter ? 'Froid/Sec ❄️' : 'Soleil/Chaud ☀️', icon: isWinter ? '❄️' : '☀️', humidity: isWinter ? 35 : 50, temp: isWinter ? 4 : 16 };
      case 2: return { condition: 'Soleil/Doux ☀️', icon: '☀️', humidity: 55, temp: 18 };
      default: return { condition: 'Venteux/Sec 💨', icon: '💨', humidity: 40, temp: 11 };
    }
  }
};

const mapWmoToWeather = (code: number, temp: number, humidity: number, windSpeed: number) => {
  const isRainy = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code) || humidity > 75;
  if (isRainy) return { condition: 'Pluie/Humide 🌧️', icon: '🌧️' };
  const isCold = [71, 73, 75, 77, 85, 86].includes(code) || temp < 8;
  if (isCold) return { condition: 'Froid/Sec ❄️', icon: '❄️' };
  const isWindy = windSpeed > 20;
  if (isWindy) return { condition: 'Venteux/Sec 💨', icon: '💨' };
  // Night check: after 20h or before 6h → moon
  if (isNight()) return { condition: 'Nuit calme 🌙', icon: '🌙' };
  return { condition: 'Soleil/Chaud ☀️', icon: '☀️' };
};

const getWeatherAdvice = (texture: string, weatherIcon: string): string => {
  if (texture === 'Crépus') {
    if (weatherIcon === '🌧️') return "Forte humidité aujourd'hui ! Privilégie des coiffures protectrices (tresses, vanilles) ou utilise une gelée/beurre lourd pour sceller ton hydratation et limiter la rétraction (shrinkage).";
    if (weatherIcon === '❄️') return "Air très sec et froid. Sortie obligatoire avec un bonnet en satin (ou doublé satin) et mise le paquet sur une crème riche avant de sortir.";
    if (weatherIcon === '☀️') return "Indice UV élevé. Applique un beurre coiffant dense (comme le karité) pour sceller l'hydratation et faire écran contre le soleil.";
    return "Temps sec et poussiéreux. Applique un leave-in hydratant léger et fais un chignon serré (pineapple) pour limiter la prise au vent.";
  }
  if (texture === 'Frisés') {
    if (weatherIcon === '🌧️') return "Humidité en hausse ! Évite les produits trop légers à base d'eau pure ou de glycérine. Utilise un gel fixant pour verrouiller le dessin de tes boucles.";
    if (weatherIcon === '❄️') return "Froid sec. Tes boucles peuvent devenir rêches. Hydrate-les avec un lait capillaire fluide et scelle avec quelques gouttes d'huile d'avocat.";
    if (weatherIcon === '☀️') return "Indice UV élevé. Applique un soin protecteur anti-UV ou une huile végétale légère pour faire écran contre le soleil.";
    return "Vent sec. Risque de frisottis mousseux ! Protège ton dessin de boucle avec un voile de laque naturelle ou de gel de coiffage.";
  }
  if (texture === 'Locksés') {
    if (weatherIcon === '🌧️') return "Alerte humidité. Si tu laves tes locks aujourd'hui, le séchage à l'air libre est interdit. Sèche-cheveux obligatoire, surtout au niveau des racines !";
    if (weatherIcon === '❄️') return "Air sec et froid. Tes locks risquent de s'assécher aux pointes. Fais une légère brumisation d'eau de rose suivie d'une noisette d'huile de jojoba.";
    if (weatherIcon === '☀️') return "Soleil persistant. Les UV ternissent la couleur de tes locks. Vaporise un spray protecteur léger avec un filtre solaire.";
    return "Temps venteux et sec. Protège tes locks avec un foulard pour éviter que la poussière ne s'incruste dans tes longueurs.";
  }
  if (texture === 'Bouclés') {
    if (weatherIcon === '🌧️') return "Forte humidité. Les boucles peuvent perdre de leur définition. Utilise un gel de graines de lin ou une gelée de définition pour figer les boucles.";
    if (weatherIcon === '❄️') return "Vent froid. Les boucles s'assèchent vite. Fais un scellage léger avec de l'huile d'argan et porte un bonnet en satin.";
    if (weatherIcon === '☀️') return "Soleil intense. Protège tes boucles avec un spray protecteur d'hydratation et évite l'exposition directe prolongée.";
    return "Vent sec. Tes boucles s'emmêlent facilement. Utilise un spray démêlant sans rinçage et évite de les laisser totalement libres.";
  }
  if (texture === 'Ondulés') {
    if (weatherIcon === '🌧️') return "Humidité en vue. Les cheveux ondulés risquent de se détendre et de frisotter. Utilise une mousse légère ou un gel léger pour maintenir les ondulations.";
    if (weatherIcon === '❄️') return "Froid et air sec. Protège tes ondulations contre le frottement des vêtements avec une huile sèche légère.";
    if (weatherIcon === '☀️') return "Soleil radieux. Cheveux ondulés faciles à dessécher. Utilise un spray hydratant sans rinçage léger avant de t'exposer.";
    return "Vent fort. Tes ondulations vont s'ébouriffer et s'emmêler. Fais une demi-queue ou une tresse lâche pour les maintenir.";
  }
  if (weatherIcon === '🌧️') return "Temps humide. Les cheveux lisses peuvent perdre leur volume et paraître plats. Évite les huiles lourdes et privilégie un shampoing sec volumateur.";
  if (weatherIcon === '❄️') return "Air très sec. Risque d'électricité statique ! Utilise un après-shampoing hydratant léger et passe un peigne en bois.";
  if (weatherIcon === '☀️') return "Plein soleil. Les UV agressent la kératine. Applique un spray protecteur thermo-actif léger.";
  return "Vent poussiéreux. Brosse tes cheveux lisses avec une brosse en poils de sanglier pour éliminer la poussière incrustée.";
};

const getMarqueeText = (weatherIcon: string, humidity: number, cityName: string, texture: string): string => {
  const city = cityName || 'votre ville';
  if (weatherIcon === '🌧️') {
    return `🌧️ MÉTÉO CAPILLAIRE : Humidité critique détectée sur ${city} (${humidity}%) — Privilégiez un soin scellant anti-porosité aujourd'hui — Vos cheveux ${texture.toLowerCase()} ont besoin de protection — Pluie prévue : portez une capuche ou imperméable — Limitez l'exposition à l'humidité extérieure ✨ `;
  }
  if (weatherIcon === '❄️') {
    return `❄️ MÉTÉO CAPILLAIRE : Air très sec et froid sur ${city} — Hydratez vos cheveux ${texture.toLowerCase()} avec un leave-in riche ce matin — Portez un bonnet en satin pour protéger vos longueurs du froid — Évitez les coiffures exposées sans protection capillaire ✨ `;
  }
  if (weatherIcon === '☀️') {
    return `☀️ MÉTÉO CAPILLAIRE : Indice solaire élevé sur ${city} — Protégez vos cheveux ${texture.toLowerCase()} des UV avec un soin protecteur — Hydratez abondamment avant toute sortie — Les UV dégradent la kératine et assèchent la fibre capillaire ✨ `;
  }
  if (weatherIcon === '🌙') {
    return `🌙 MÉTÉO CAPILLAIRE : Nuit calme sur ${city} — Profitez-en pour faire un masque de nuit capillaire sur vos cheveux ${texture.toLowerCase()} — Dormez avec un bonnet en satin pour préserver l'hydratation — La nuit est le meilleur moment pour nourrir vos cheveux en profondeur ✨ `;
  }
  return `💨 MÉTÉO CAPILLAIRE : Conditions venteuses sur ${city} — Rassemblez vos longueurs ${texture.toLowerCase()} en tresse ou chignon protecteur — Utilisez un sérum anti-frisottis — Le vent emmêle et fragilise les boucles et les longueurs ✨ `;
};


export const DynamicHeader: React.FC<DynamicHeaderProps> = ({ onPriorityPress }) => {
  const { activeProfile, routine, themeMode, tempUnit, regularityScore, isPremium, setPremiumStatus } = useAppState();
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  if (!activeProfile) return null;

  const isLight = themeMode === 'light';
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;

  const todayStr = new Date().toISOString().split('T')[0];
  const isFirstDay = activeProfile.createdAt === todayStr;
  const todayAction = routine.find(
    r => r.profileId === activeProfile.id && r.date === todayStr && !r.completed
  );

  // Weather state
  const [weather, setWeather] = useState<{ condition: string; icon: string; humidity: number; temp: number }>(
    () => getMockedWeather(todayStr)
  );
  const [cityName, setCityName] = useState('');

  // ── Marquee: reliable recursive infinite loop ───────────────
  const marqueeAnim = useRef(new Animated.Value(0)).current;
  const [singleWidth, setSingleWidth] = useState(0);
  const animActive = useRef(false);
  const hasMeasured = useRef(false);

  const marqueeText = getMarqueeText(weather.icon, weather.humidity, cityName || 'Votre ville', activeProfile.diagnostic?.texture || 'Bouclés');

  // When marqueeText changes (city loads, weather updates), allow re-measurement
  // WITHOUT resetting singleWidth → animation keeps running, no flicker
  useEffect(() => {
    hasMeasured.current = false;
  }, [marqueeText]);

  // Launch recursive loop once singleWidth is known
  useEffect(() => {
    if (singleWidth <= 0) return;
    animActive.current = true;

    const runLoop = () => {
      if (!animActive.current) return;
      marqueeAnim.setValue(0);
      Animated.timing(marqueeAnim, {
        toValue: -singleWidth,
        // 50 px/s → comfortable reading speed
        duration: Math.max(Math.round(singleWidth / 0.050), 6000),
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && animActive.current) runLoop();
      });
    };

    runLoop();
    return () => { animActive.current = false; marqueeAnim.stopAnimation(); };
  }, [singleWidth]);


  // Weather refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(getMockedWeather(new Date().toISOString().split('T')[0]));
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real weather: GPS with IP-based fallbacks
  useEffect(() => {
    let active = true;
    const fetchWeather = async () => {
      try {
        let latitude: number | null = null;
        let longitude: number | null = null;
        let city = '';

        // Attempt 0: GPS via expo-location (with fallback to IP if denied or failed)
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            if (loc && loc.coords) {
              latitude = loc.coords.latitude;
              longitude = loc.coords.longitude;
              try {
                const geo = await Location.reverseGeocodeAsync({
                  latitude,
                  longitude,
                });
                if (geo && geo.length > 0) {
                  city = geo[0].city || geo[0].subregion || geo[0].region || '';
                }
              } catch (geoErr) {
                console.warn('Reverse geocoding failed:', geoErr);
              }
            }
          }
        } catch (gpsErr) {
          console.warn('GPS location request failed:', gpsErr);
        }

        // Attempt 1: ipapi.co (HTTPS) - Fallback for coordinates if GPS failed, or for city if geocode failed
        if (!latitude || !longitude || !city) {
          try {
            const r = await fetch('https://ipapi.co/json/');
            if (r.ok) {
              const d = await r.json();
              if (!latitude || !longitude) {
                latitude = d.latitude;
                longitude = d.longitude;
              }
              if (!city) {
                city = d.city || '';
              }
            }
          } catch {}
        }

        // Attempt 2: ipwho.is (HTTPS, no key) - Fallback
        if (!latitude || !longitude || !city) {
          try {
            const r = await fetch('https://ipwho.is/');
            if (r.ok) {
              const d = await r.json();
              if (!latitude || !longitude) {
                latitude = d.latitude;
                longitude = d.longitude;
              }
              if (!city) {
                city = d.city || '';
              }
            }
          } catch {}
        }

        // Attempt 3: ipinfo.io (HTTPS) - Fallback
        if (!latitude || !longitude || !city) {
          try {
            const r = await fetch('https://ipinfo.io/json');
            if (r.ok) {
              const d = await r.json();
              if (!latitude || !longitude) {
                if (d.loc) {
                  const [lat, lon] = d.loc.split(',').map(Number);
                  latitude = lat;
                  longitude = lon;
                }
              }
              if (!city) {
                city = d.city || '';
              }
            }
          } catch {}
        }

        if (!latitude || !longitude) throw new Error('No coordinates from any provider');

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error('Weather API failed');
        const weatherData = await weatherRes.json();

        if (active && weatherData.current) {
          const c = weatherData.current;
          const temp = Math.round(c.temperature_2m);
          const humidity = Math.round(c.relative_humidity_2m);
          const mapped = mapWmoToWeather(c.weather_code, temp, humidity, c.wind_speed_10m || 0);
          setCityName(city);
          setWeather({ condition: mapped.condition, icon: mapped.icon, humidity, temp });
        }
      } catch (err) {
        console.warn('Weather fetch failed, using fallback:', err);
      }
    };
    fetchWeather();
    return () => { active = false; };
  }, [todayStr]);

  const displayCity = cityName || 'Votre ville';
  // marqueeText is already defined above (before useEffect)

  // Weather widget gradient colors based on condition
  const getWeatherGradientColors = () => {
    if (weather.icon === '🌧️') return { top: '#1a2744', bottom: '#0d1a3a', accent: '#4a7fc1' };
    if (weather.icon === '❄️') return { top: '#1a2535', bottom: '#0e1a28', accent: '#6baed6' };
    if (weather.icon === '☀️') return { top: '#1a1f35', bottom: '#2d1f0e', accent: '#e8945a' };
    return { top: '#1a2035', bottom: '#0e1520', accent: '#7a9cc4' }; // windy
  };
  const wColors = getWeatherGradientColors();

  return (
    <View style={styles.container}>
      {/* Top Row: Greeting */}
      <View style={styles.topRow}>
        <View style={styles.welcomeWrapper}>
          <Text style={[styles.greetingText, { color: customTextSec }]}>Bonjour,</Text>
          <Text style={[styles.nameText, { color: customText }]}>{activeProfile.name}</Text>
          {(() => {
            let scoreColor = colors.secondary;
            let scoreEmoji = '🎯';
            if (regularityScore < 50) { scoreColor = isLight ? colors.danger : colors.warning; scoreEmoji = '🌿'; }
            else if (regularityScore < 85) { scoreColor = isLight ? '#A8572A' : colors.accent; scoreEmoji = '✨'; }
            return (
              <Text style={{ color: scoreColor, marginTop: 4, fontWeight: '700', fontSize: 13 }}>
                {scoreEmoji} Score de régularité : {regularityScore}%
              </Text>
            );
          })()}
        </View>
      </View>

      {/* ═══════════════════════════════════════════ */}
      {/* 🌤️ PREMIUM WEATHER WIDGET               */}
      {/* ═══════════════════════════════════════════ */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setShowWeatherModal(true)}
        style={[styles.premiumWeatherCard, { backgroundColor: isLight ? '#1a2535' : wColors.top, borderColor: isLight ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)' }]}
      >
        {/* Compact single-row banner */}
        <View style={styles.weatherMainRow}>
          {/* Icon + condition */}
          <Text style={styles.bigWeatherIcon}>{weather.icon}</Text>
          <View style={[styles.weatherDivider, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />
          {/* City */}
          <Text style={styles.weatherCity} numberOfLines={1}>📍 {displayCity}</Text>
          <View style={[styles.weatherDivider, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />
          {/* Humidity */}
          <Text style={styles.weatherHumidityBig}>{weather.humidity}%<Text style={styles.weatherHumidityUnit}> hum</Text></Text>
          <View style={[styles.weatherDivider, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />
          {/* Temp */}
          <Text style={styles.weatherTemp}>{convertTemp(weather.temp, tempUnit)}°{tempUnit}</Text>
        </View>

        {/* ── Infinite marquee band ─────────────────────────────── */}
        {/* Step 1: Invisible measurement — 10000px parent, numberOfLines=1 → true text width */}
        <View style={{ position: 'absolute', width: 10000, opacity: 0, top: 0, left: 0 } as any} pointerEvents="none">
          <Text
            style={styles.marqueeText}
            numberOfLines={1}
            onLayout={(e) => {
              if (hasMeasured.current) return;  // measure only once per text change
              const w = e.nativeEvent.layout.width;
              if (w > 10) {
                hasMeasured.current = true;
                setSingleWidth(w);
              }
            }}
          >
            {marqueeText}{'          '}
          </Text>
        </View>
        {/* Step 2: Display — overflow:hidden clips; each copy has width=singleWidth (no wrap, no truncation) */}
        <View style={[styles.marqueeBand, { backgroundColor: 'rgba(0,0,0,0.30)', overflow: 'hidden' }]}>
          {singleWidth > 0 && (
            <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: marqueeAnim }] }}>
              {/* Copy 1 */}
              <Text style={[styles.marqueeText, { width: singleWidth }]}>
                {marqueeText}{'          '}
              </Text>
              {/* Copy 2 — seamlessly follows copy 1 */}
              <Text style={[styles.marqueeText, { width: singleWidth }]}>
                {marqueeText}{'          '}
              </Text>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>



      {/* 🌤️ Météo Capillaire Modal */}
      <Modal
        visible={showWeatherModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWeatherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isLight ? '#FFFFFF' : colors.card, borderColor: customBorder }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: customText }]}>🌤️ Météo Capillaire du Jour</Text>
              <TouchableOpacity
                onPress={() => setShowWeatherModal(false)}
                style={[styles.closeButton, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]}
              >
                <Text style={{ color: customTextSec, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Weather status details */}
            <View style={[styles.weatherStatusCard, { backgroundColor: isLight ? '#F9F9FB' : 'rgba(255, 255, 255, 0.02)', borderColor: customBorder }]}>
              <Text style={styles.statusIcon}>{weather.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusLabel, { color: customText }]}>
                  {weather.condition} — {displayCity}
                </Text>
                <Text style={[styles.statusDetails, { color: customTextSec }]}>
                  Température : {convertTemp(weather.temp, tempUnit)}°{tempUnit} | Humidité : {weather.humidity}%
                </Text>
              </View>
            </View>

            {/* Advice section */}
            {isPremium ? (
              <View style={styles.adviceWrapper}>
                <View style={[styles.adviceHeaderBadge, { backgroundColor: 'rgba(118, 160, 138, 0.1)' }]}>
                  <Text style={[styles.adviceHeaderBadgeText, { color: colors.secondary }]}>
                    ✨ Conseil Premium ({activeProfile.diagnostic.texture})
                  </Text>
                </View>
                <Text style={[styles.adviceText, { color: customText }]}>
                  {getWeatherAdvice(activeProfile.diagnostic.texture, weather.icon)}
                </Text>
              </View>
            ) : (
              <View style={styles.lockedWrapper}>
                <View style={styles.lockedHeader}>
                  <Text style={styles.lockEmoji}>🔒</Text>
                  <Text style={[styles.lockedTitle, { color: customText }]}>Conseil Météo Personnalisé Bloqué</Text>
                </View>
                <Text style={[styles.lockedSubtitle, { color: customTextSec }]}>
                  Débloquez les conseils météo en temps réel adaptés à la texture de vos cheveux ({activeProfile.diagnostic.texture}).
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.premiumUpgradeBtn}
                  onPress={() => { setPremiumStatus(true); }}
                >
                  <Text style={styles.premiumUpgradeBtnText}>Activer My Root'In Premium 🚀</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
  },
  // ── Top Row ─────────────────────────────────────────────────────
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  welcomeWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nameText: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  headerLogo: {
    width: 70,
    height: 46,
    opacity: 0.9,
  },
  // ── Compact Weather Banner ──────────────────────────────────────
  premiumWeatherCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  weatherMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  bigWeatherIcon: {
    fontSize: 22,
    lineHeight: 26,
  },
  weatherDivider: {
    width: 1,
    height: 18,
    borderRadius: 1,
  },
  weatherCity: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
    flexShrink: 1,
  },
  weatherHumidityBig: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  weatherHumidityUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  weatherTemp: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
  },
  weatherTimeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  // ── Marquee band ────────────────────────────────────────────────
  marqueeBand: {
    paddingVertical: 5,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  marqueeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 200, 120, 0.95)',
    letterSpacing: 0.3,
    whiteSpace: 'nowrap',
  } as any,
  // ── Priority Banner ─────────────────────────────────────────────
  priorityBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIndicator: {
    width: 4,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  bannerTextWrapper: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityActionText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  // ── Modal ───────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 24,
  },
  modalCard: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 36,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  adviceWrapper: {
    gap: 12,
  },
  adviceHeaderBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adviceHeaderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  adviceText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  lockedWrapper: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockEmoji: {
    fontSize: 20,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  lockedSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  premiumUpgradeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  premiumUpgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
