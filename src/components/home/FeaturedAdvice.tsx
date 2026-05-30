import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface Article {
  id: string;
  title: string;
  category: 'Soins' | 'Ingrédients' | 'Problèmes fréquents' | 'Tutos gestuels';
  readTime: string;
  tags: string[];
  snippet: string;
  bgEmoji: string;
  content: string;
}

const mockArticles: Article[] = [
  {
    id: 'a1',
    title: 'Hydrater les cheveux crépus de porosité faible 💧',
    category: 'Ingrédients',
    readTime: '4 min read',
    tags: ['Crépus', 'Faible', 'Naturel'],
    snippet: 'La porosité faible requiert de la chaleur pour ouvrir les écailles. Privilégiez des huiles légères comme le Jojoba et appliquez vos soins sur cheveux tièdes !',
    bgEmoji: '🍃',
    content: 'La porosité faible requiert de la chaleur pour ouvrir les écailles. Privilégiez des huiles légères comme le Jojoba et appliquez vos soins sur cheveux tièdes ! En effet, des cuticules très fermées bloquent les molécules d\'eau et de gras lourds. En humidifiant à l\'eau tiède sous un bonnet auto-chauffant, les cuticules s\'écartent doucement, permettant à l\'hydratation de se fixer au cœur du cortex.',
  },
  {
    id: 'a2',
    title: 'L\'art du Retwist sain sans résidus ✨',
    category: 'Soins',
    readTime: '5 min read',
    tags: ['Locksés', 'Locks en évolution'],
    snippet: 'Pour éviter l\'accumulation de poussières et de résidus collants, évitez les cires lourdes. Préférez un gel d\'aloe vera pur ou de lin fait maison.',
    bgEmoji: '☀️',
    content: 'Pour éviter l\'accumulation de poussières et de résidus collants, évitez les cires lourdes. Préférez un gel d\'aloe vera pur ou de lin fait maison. La wax traditionnelle et le beurre non raffiné s\'accumulent le long des locksés au fil des mois, étouffant la fibre et créant des dépôts blanchâtres difficiles à éliminer. Le gel d\'aloe vera sèche proprement sans laisser de traces.',
  },
  {
    id: 'a3',
    title: 'Soulager un cuir chevelu sensible aux pellicules 💆🏾',
    category: 'Problèmes fréquents',
    readTime: '3 min read',
    tags: ['Cuir chevelu sensible', 'Bouclés', 'Frisés'],
    snippet: 'Un massage hebdomadaire avec quelques gouttes d\'huile essentielle de Tea Tree diluée dans de l\'huile de Jojoba assainit le scalp et réduit les démangeaisons.',
    bgEmoji: '🌸',
    content: 'Un massage hebdomadaire avec quelques gouttes d\'huile essentielle de Tea Tree diluée dans de l\'huile de Jojoba assainit le scalp et réduit les démangeaisons. Le Tea Tree possède des propriétés antibactériennes et antifongiques naturelles majeures, qui calment l\'excès de sébum et régulent les pellicules sans décaper la peau fragile du cuir chevelu.',
  },
  {
    id: 'a4',
    title: 'Prendre soin des boucles fines de porosité moyenne 🌀',
    category: 'Ingrédients',
    readTime: '4 min read',
    tags: ['Bouclés', 'Fins', 'Moyenne'],
    snippet: 'Vos boucles adorent la légèreté. Le gel de graines de lin est parfait pour définir vos ressorts sans figer ni alourdir votre fibre capillaire.',
    bgEmoji: '💧',
    content: 'Vos boucles adorent la légèreté. Le gel de graines de lin est parfait pour définir vos ressorts sans figer ni alourdir votre fibre capillaire. Riche en mucilages naturels, ce gel hydrate en continu, combat les frisottis dus à l\'humidité ambiante, et apporte une brillance miroir incroyable sans laisser aucun effet carton.',
  },
  {
    id: 'a5',
    title: 'Gérer le sébum sur cheveux raides 💇‍♀️',
    category: 'Soins',
    readTime: '3 min read',
    tags: ['Raides', 'Naturel'],
    snippet: 'Le sébum voyage très rapidement sur les cheveux lisses et raides. Un lavage régulier (2-3 fois par semaine) avec des shampoings doux évite l\'effet lourd.',
    bgEmoji: '🧴',
    content: 'Le sébum voyage très rapidement sur les cheveux lisses et raides. Un lavage régulier (2-3 fois par semaine) avec des shampoings doux évite l\'effet lourd. Contrairement aux textures frisées ou crépues, le sébum s\'écoule sans obstacle. Privilégiez des lavages doux à l\'eau tiède et évitez les huiles riches près des racines pour préserver votre volume naturel.',
  },
  {
    id: 'a6',
    title: 'La protection de nuit : Satin vs Coton 😴',
    category: 'Soins',
    readTime: '4 min read',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Ondulés', 'Raides'],
    bgEmoji: '😴',
    snippet: 'Le coton absorbe l\'hydratation et crée des frictions. Le satin ou la soie préviennent la casse et gardent vos boucles intactes.',
    content: 'Dormir sur une taie en coton ou avec un foulard classique est l\'ennemi numéro un des boucles. Le coton est une fibre hydrophile qui "boit" toute l\'hydratation naturelle de vos cheveux pendant la nuit. De plus, sa texture rugueuse crée des frictions constantes qui provoquent des nœuds, des frisottis et de la casse. Adoptez un bonnet ou une taie d\'oreiller en satin de polyester ou en soie naturelle. Vos boucles glisseront en douceur sans s\'emmêler ni se dessécher !'
  },
  {
    id: 'a7',
    title: 'La routine de lavage spéciale Locks Matures 🦁',
    category: 'Soins',
    readTime: '5 min read',
    tags: ['Locksés', 'Locks matures', 'Épais'],
    bgEmoji: '🦁',
    snippet: 'Les locks matures ont besoin d\'un nettoyage en profondeur mais sans résidus. La méthode du bain de bicarbonate et vinaigre est magique.',
    content: 'Les locks matures capturent facilement la poussière, le calcaire et le sébum au cœur de leur structure serrée. Pour conserver des locks légères, propres et sans résidus, effectuez une détox bi-annuelle : plongez vos locks dans une bassine d\'eau chaude additionnée de 2 cuillères à soupe de bicarbonate de soude et d\'un demi-verre de vinaigre de cidre pendant 15 minutes. Pressez doucement pour faire sortir les impuretés accumulées. Rincez abondamment. Vos locks en ressortiront d\'une légèreté et d\'une fraîcheur incomparables !'
  },
  {
    id: 'a8',
    title: 'Le séchage au diffuseur sans frisottis 🌀',
    category: 'Soins',
    readTime: '4 min read',
    tags: ['Bouclés', 'Frisés', 'Fins', 'Moyens'],
    bgEmoji: '🌀',
    snippet: 'Utilisez de l\'air tiède à faible vitesse sans manipuler les boucles avec vos mains pour conserver une définition parfaite.',
    content: 'Le séchage à l\'air libre est idéal, mais si vous utilisez un sèche-cheveux, le diffuseur est obligatoire. Pour éviter l\'apparition de frisottis et de volume non contrôlé, suivez cette règle d\'or : appliquez vos produits coiffants sur cheveux très humides, puis penchez la tête en avant. Placez délicatement les boucles dans le bol du diffuseur, réglez l\'appareil sur température tiède et vitesse minimale. Ne touchez pas à vos cheveux avec vos doigts tant qu\'ils ne sont pas secs à 90 % pour figer la forme de la boucle sans l\'ébouriffer.'
  },
  {
    id: 'a9',
    title: 'L\'Huile de Carapate pour fortifier 🌰',
    category: 'Ingrédients',
    readTime: '4 min read',
    tags: ['Crépus', 'Frisés', 'Épais', 'Casse', 'Forte', 'Moyenne'],
    bgEmoji: '🌰',
    snippet: 'Plus riche en cendres alcalines que le ricin blanc, l\'huile de carapate nourrit intensément et active la pousse capillaire.',
    content: 'L\'huile de carapate (Black Castor Oil) est obtenue par torréfaction des graines de ricin avant extraction. Ce procédé traditionnel lui confère une couleur sombre, une odeur caractéristique et une richesse exceptionnelle en cendres alcalines et en acide ricinoléique. Elle est idéale pour réparer les pointes fourchues des cheveux crépus très secs ou pour sceller l\'hydratation des cheveux à forte porosité. Massez également quelques gouttes sur vos tempes et vos racines pour stimuler la circulation sanguine et accélérer la pousse.'
  },
  {
    id: 'a10',
    title: 'La Protéine de Soie pour les cheveux fins 🧬',
    category: 'Ingrédients',
    readTime: '3 min read',
    tags: ['Fins', 'Bouclés', 'Ondulés', 'Moyens', 'Raides', 'Casse'],
    bgEmoji: '🧬',
    snippet: 'Cet actif cosmétique pénètre la cuticule pour gainer, hydrater et redonner de la force et du ressort aux boucles.',
    content: 'Les cheveux fins ou abîmés ont une structure fragile qui s\'affaisse rapidement. La protéine de soie hydrolysée est un actif naturel incroyable aux propriétés hautement pénétrantes. Elle se fixe sur la kératine du cheveu pour former un film protecteur ultra-léger sans alourdir. Elle retient l\'hydratation, améliore l\'élasticité de la fibre et redonne un ressort magnifique aux boucles relâchées. Ajoutez 2 à 3 gouttes de cet actif dans votre dose de lait capillaire ou de gel pour un effet gainant instantané !'
  },
  {
    id: 'a11',
    title: 'L\'eau de riz fermentée ancestrale 🌾',
    category: 'Ingrédients',
    readTime: '4 min read',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Ondulés', 'Raides', 'Casse'],
    bgEmoji: '🌾',
    snippet: 'Riche en inositol et acides aminés, cette lotion de rinçage naturelle fortifie et fait briller les cheveux ternes.',
    content: 'Utilisée depuis des siècles en Asie, l\'eau de riz fermentée est une mine d\'or pour les cheveux ternes et fragiles. Lors de la fermentation, le pH de l\'eau s\'équilibre avec celui du cheveu et libère de l\'inositol, une molécule capable de pénétrer à l\'intérieur du cheveu pour le réparer durablement. Après avoir rincé votre shampoing, versez l\'eau de riz (laissée à fermenter 24h à température ambiante) sur vos longueurs, massez bien, laissez poser 5 minutes, puis rincez à l\'eau fraîche. Force et brillance garanties !'
  },
  {
    id: 'a12',
    title: 'Dompter le Shrinkage sans chaleur 📏',
    category: 'Problèmes fréquents',
    readTime: '5 min read',
    tags: ['Crépus', 'Frisés', 'Épais', 'Forte', 'Moyenne'],
    bgEmoji: '📏',
    snippet: 'Le shrinkage prouve que vos cheveux sont en parfaite santé ! Apprenez à étirer vos boucles mécaniquement et en douceur.',
    content: 'Le "shrinkage" est le phénomène par lequel les cheveux crépus ou très frisés rétrécissent jusqu\'à 70 % de leur longueur réelle au contact de l\'humidité. C\'est la preuve ultime que vos cheveux sont sains et hautement élastiques ! Si vous souhaitez étirer vos boucles sans utiliser de chaleur thermique agressive, privilégiez des techniques douces d\'étirement mécanique : les tresses au fil (Threading), les Bantu Knots sur cheveux presque secs, ou les nattes (braid-outs). Appliquez toujours une noisette de beurre de karité ou de crème coiffante pour figer l\'étirement.'
  },
  {
    id: 'a13',
    title: 'Apaiser les démangeaisons sous les tresses 🪡',
    category: 'Problèmes fréquents',
    readTime: '4 min read',
    tags: ['Tresses', 'Cuir chevelu sensible', 'Crépus', 'Frisés', 'Bouclés'],
    bgEmoji: '🪡',
    snippet: 'Les tensions mécaniques et l\'accumulation de sébum irritent le scalp. Utilisez une brume apaisante menthe-aloé.',
    content: 'Porter des nattes collées ou des tresses avec extensions est idéal pour laisser reposer les cheveux, mais cela exerce des tensions mécaniques sur le scalp et retient le sébum. Pour calmer instantanément les démangeaisons sans ruiner votre coiffure, vaporisez quotidiennement sur vos racines un spray fait maison : mélangez 80 % d\'hydrolat de menthe poivrée (purifiant et rafraîchissant) et 20 % de gel d\'aloe vera. Massez doucement du bout des doigts pour faire pénétrer. Vos racines seront fraîches, assainies et apaisées !'
  },
  {
    id: 'a14',
    title: 'Prévenir la casse au niveau de la nuque 🧣',
    category: 'Problèmes fréquents',
    readTime: '3 min read',
    tags: ['Casse', 'Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Raides'],
    bgEmoji: '🧣',
    snippet: 'Les frictions régulières contre les manteaux et écharpes cassent la nuque. Protégez-la avec du satin.',
    content: 'Avez-vous remarqué que les cheveux situés au niveau de la nuque sont souvent plus courts ou plus secs ? Ce n\'est pas un hasard, mais le résultat des frictions répétées contre vos vêtements (surtout en hiver avec les cols roulés, les manteaux et les écharpes en laine qui agissent comme du papier de verre). Pour protéger cette zone fragile, veillez à relever vos cheveux en chignon haut (pineapple) lorsque vous portez des cols épais, ou doublez l\'intérieur de vos écharpes d\'un tissu en satin ou en soie.'
  },
  {
    id: 'a15',
    title: 'Le Démêlage aux Doigts pas à pas 🖐️',
    category: 'Tutos gestuels',
    readTime: '4 min read',
    tags: ['Crépus', 'Frisés', 'Épais', 'Casse', 'Forte', 'Moyenne'],
    bgEmoji: '🖐️',
    snippet: 'Les peignes et brosses arrachent les nœuds. Apprenez le geste salvateur pour éliminer les nœuds sans douleur.',
    content: 'Le secret le mieux gardé pour conserver sa longueur est de bannir le peigne et de démêler exclusivement avec vos doigts ! Les cheveux crépus et frisés s\'entremêlent naturellement. Un peigne, même à dents larges, force à travers les nœuds et brise la fibre. En utilisant vos mains recouvertes d\'après-shampoing glissant, vous pouvez localiser précisément chaque nœud, écarter les mèches doucement pour le défaire, et retirer les cheveux morts sans créer aucune casse. C\'est un gain de temps et de volume sur le long terme !'
  },
  {
    id: 'a16',
    title: 'Le "Plopping" pour dessiner les boucles 🌀',
    category: 'Tutos gestuels',
    readTime: '3 min read',
    tags: ['Bouclés', 'Ondulés', 'Fins', 'Moyens'],
    bgEmoji: '🌀',
    snippet: 'Séchez vos cheveux dans un t-shirt en coton posé à plat pour obtenir des boucles rebondies et sans frisottis.',
    content: 'Le plopping est une méthode de séchage révolutionnaire pour les cheveux bouclés à ondulés. Après avoir appliqué votre crème de soin ou gel de définition sur cheveux trempés, posez un t-shirt en coton à plat sur une table ou votre lit. Penchez la tête en avant et déposez vos boucles en "accordéon" au centre du t-shirt. Enveloppez votre tête avec les manches du t-shirt et nouez-les derrière la nuque. Laissez poser 15 à 30 minutes. Le t-shirt absorbe l\'excess d\'eau sans froisser la cuticule, laissant des boucles incroyablement dessinées et sans aucun frisottis !'
  },
  {
    id: 'a17',
    title: 'Les "Finger Coils" pour des spirales parfaites 🌀',
    category: 'Tutos gestuels',
    readTime: '4 min read',
    tags: ['Frisés', 'Bouclés', 'Moyens', 'Fins', 'Épais'],
    bgEmoji: '🌀',
    snippet: 'Enroulez chaque mèche autour de votre index pour sculpter des anglaises régulières qui durent des jours.',
    content: 'Les "finger coils" (boucles au doigt) permettent de sculpter des boucles spirales ultra-définies et régulières. Sur cheveux propres et bien hydratés, séparez votre chevelure en petites sections. Appliquez une noisette de gelée ou de crème coiffante sur une mèche d\'un centimètre de large. Saisissez la mèche à la racine et enroulez-la fermement autour de votre index jusqu\'aux pointes. Relâchez délicatement. Laissez sécher à l\'air libre ou au diffuseur sans y toucher. Vos spirales tiendront jusqu\'à une semaine complète !'
  }
];

interface FeaturedAdviceProps {
  onSeeAllPress?: () => void;
  onArticlePress?: (article: any) => void;
}

export const FeaturedAdvice: React.FC<FeaturedAdviceProps> = ({ onSeeAllPress, onArticlePress }) => {
  const { activeProfile, themeMode } = useAppState();

  if (!activeProfile) return null;

  const isLight = themeMode === 'light';
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;

  // Find a matching article based on active profile texture, porosity or sensitivity tags
  const diag = activeProfile.diagnostic;
  const isPorosityNull = diag.porosity === null;

  // Filter mock articles:
  // We strictly require that the article contains the user's hair texture tag to be shown
  const baseFiltered = mockArticles.filter(art => {
    if (!art.tags.includes(diag.texture)) {
      return false;
    }
    if (isPorosityNull) {
      return !art.tags.includes('Faible') && !art.tags.includes('Forte') && !art.tags.includes('Moyenne');
    }
    return true;
  });

  const availableArticles = [
    ...baseFiltered,
    ...(isPorosityNull ? [{
      id: 'a-generic-warning',
      title: '🚨 Routine de sécurité : Sans sulfates ni silicones',
      category: 'Ingrédients' as const,
      readTime: '3 min read',
      tags: [diag.texture, 'Ingrédients', 'Sans Sulfate', 'Soin Sain'],
      snippet: 'Porosité non définie. Par sécurité, nous filtrons uniquement les sulfates asséchants et les silicones insolubles pour préserver votre fibre capillaire.',
      bgEmoji: '🛡️',
      content: 'Votre porosité n\'étant pas définie, notre algorithme applique un principe de précaution strict : exclusion des sulfates de lavage agressifs (qui assèchent dramatiquement le cortex) et rejet des silicones insolubles (qui étouffent le cheveu). Nous vous recommandons vivement de faire le test de porosité via le bandeau orange en haut de l\'écran pour affiner votre profil !',
    }] : [])
  ];

  const activeTags = [diag.texture, diag.porosity, diag.activeStyle, ...diag.sensitivity];
  
  // Safe articles fallback: If strict filtering leaves us with nothing, use mockArticles excluding locks for non-locks users (and vice versa)
  let finalArticles = availableArticles;
  if (finalArticles.length === 0) {
    finalArticles = mockArticles.filter(art => {
      if (diag.texture !== 'Locksés') {
        return !art.tags.includes('Locksés');
      }
      return art.tags.includes('Locksés');
    });
  }

  // Find article with the highest tag match count, fallback to first
  const matchedArticle = finalArticles.reduce((best, current) => {
    const currentMatches = current.tags.filter(tag => activeTags.includes(tag as any)).length;
    const bestMatches = best.tags.filter(tag => activeTags.includes(tag as any)).length;
    return currentMatches > bestMatches ? current : best;
  }, finalArticles[0]);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: customText }]}>Conseil Vedette pour toi ✨</Text>
      
      <TouchableOpacity 
        activeOpacity={0.9} 
        style={[styles.card, { backgroundColor: customCard, borderColor: customBorder }]}
        onPress={() => onArticlePress && onArticlePress(matchedArticle)}
      >
        <View style={[styles.emojiBackground, { backgroundColor: isLight ? 'rgba(229, 169, 130, 0.06)' : 'rgba(229, 169, 130, 0.08)', borderColor: customBorder }]}>
          <Text style={styles.bgEmoji}>{matchedArticle.bgEmoji}</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.tagRow}>
            <View style={[styles.categoryBadge, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)' }]}>
              <Text style={[styles.categoryText, { color: customTextSec }]}>{matchedArticle.category}</Text>
            </View>
            <Text style={[styles.readTimeText, { color: isLight ? '#888D9F' : colors.textMuted }]}>{matchedArticle.readTime}</Text>
          </View>

          <Text style={[styles.titleText, { color: customText }]}>{matchedArticle.title}</Text>
          <Text style={[styles.snippetText, { color: customTextSec }]} numberOfLines={2}>
            {matchedArticle.snippet}
          </Text>

          <View style={styles.tagPillRow}>
            {matchedArticle.tags.map(t => (
              <View key={t} style={[styles.tagPill, { backgroundColor: isLight ? 'rgba(118, 160, 138, 0.06)' : 'rgba(118, 160, 138, 0.08)', borderColor: isLight ? 'rgba(118, 160, 138, 0.15)' : 'rgba(118, 160, 138, 0.2)' }]}>
                <Text style={styles.tagPillText}>#{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>

      {onSeeAllPress && (
        <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAllPress} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>Voir tous mes conseils ➔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 155,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  emojiBackground: {
    width: 75,
    backgroundColor: 'rgba(229, 169, 130, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: colors.cardBorder,
  },
  bgEmoji: {
    fontSize: 36,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  readTimeText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 18,
    marginVertical: 4,
  },
  snippetText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  tagPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(118, 160, 138, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(118, 160, 138, 0.2)',
  },
  tagPillText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '700',
  },
  seeAllButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
