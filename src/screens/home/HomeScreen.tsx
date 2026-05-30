import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal, SafeAreaView, ActivityIndicator, Platform, Image } from 'react-native';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';
import { DynamicHeader } from '../../components/home/DynamicHeader';
import { CircularGauge } from '../../components/common/CircularGauge';
import { QuickAction } from '../../components/home/QuickAction';
import { CatchUpCard } from '../../components/home/CatchUpCard';
import { FeaturedAdvice } from '../../components/home/FeaturedAdvice';
import { Button } from '../../components/common/Button';
import { TimePickerModal } from '../../components/common/TimePickerModal';

interface CareGuide {
  title: string;
  duration: string;
  steps: string[];
  mistakes: string[];
  products: string;
}

const careGuidesMap: { [key: string]: CareGuide } = {
  'Clarification': {
    title: '🔬 Soin Clarifiant Détox Argile',
    duration: '20 min',
    steps: [
      'Mouille abondamment tes cheveux à l\'eau chaude pour bien ouvrir les cuticules.',
      'Applique la pâte d\'argile bentonite ou ton shampoing clarifiant directement sur ton cuir chevelu par section.',
      'Masse doucement du bout des doigts pour décoller et éliminer les accumulations de produits et le calcaire.',
      'Rince abondamment à l\'eau tiède jusqu\'à ce que l\'eau soit parfaitement claire.'
    ],
    mistakes: [
      'Ne pas faire de clarification trop souvent (limiter à 1 fois par mois pour éviter d\'assécher la fibre).',
      'Oublier de faire un masque profondément hydratant juste après.'
    ],
    products: 'Argile Bentonite naturelle, Argile de Rhassoul ou Shampoing Clarifiant sans silicones.'
  },
  'Lavage': {
    title: 'shampoing Doux Hydratant 🧴',
    duration: '15 min',
    steps: [
      'Sépare tes cheveux en 4 sections pour éviter les nœuds et faciliter le lavage en douceur.',
      'Applique une noisette de ton shampoing doux uniquement sur ton cuir chevelu par section.',
      'Masse délicatement du bout des doigts sans jamais frotter vigoureusement tes longueurs.',
      'Laisse couler la mousse protectrice sur tes longueurs pendant le rinçage à l\'eau tiède.'
    ],
    mistakes: [
      'Laver directement ses longueurs (cela décape et assèche inutilement la fibre capillaire).',
      'Utiliser de l\'eau brûlante qui agresse le scalp et stimule l\'excès de sébum par réaction.'
    ],
    products: 'Shampoing Doux Hydratant à l\'aloe vera ou co-wash purifiant.'
  },
  'Bain d\'huile': {
    title: '🌿 Bain d\'Huiles Chaudes Nourrissant',
    duration: '45 min',
    steps: [
      'Humidifie légèrement tes cheveux avec un spray d\'eau tiède pour faciliter la pénétration du soin.',
      'Applique ton mélange d\'huiles tiédies des racines jusqu\'aux pointes, section par section.',
      'Enveloppe tes cheveux dans une serviette chaude humide ou sous un bonnet auto-chauffant.',
      'Laisse poser entre 30 et 45 minutes, puis procède à ton shampoing doux protecteur.'
    ],
    mistakes: [
      'Appliquer l\'huile sur cheveux totalement secs (l\'huile bloque l\'hydratation au lieu de la retenir).',
      'Utiliser des huiles trop lourdes (comme le ricin pur) sans les diluer sur des cheveux fins.'
    ],
    products: 'Huile de Jojoba ou Sweet Almond (fins/faible poro) ; Huile d\'Avocat ou Ricin (épais/forte poro).'
  },
  'Masque hydratant': {
    title: '🍯 Masque Hydratant Profond & Miel',
    duration: '30 min',
    steps: [
      'Applique généreusement ton masque hydratant sur cheveux fraîchement lavés et encore humides.',
      'Répartis le soin à l\'aide de tes doigts ou d\'un peigne à dents larges pour bien lisser les cuticules.',
      'Laisse poser 20 à 30 minutes sous une source de chaleur douce (bonnet de douche ou serviette chaude).',
      'Rince très soigneusement à l\'eau fraîche pour refermer les écailles et booster la brillance.'
    ],
    mistakes: [
      'Laver son masque toute la nuit (risque majeur de saturation et d\'hygral fatigue).',
      'Négliger le rinçage (des résidus de masque peuvent étouffer le cheveu et le rendre poisseux).'
    ],
    products: 'Masque riche en aloe vera, miel, glycérine végétale ou graines de lin.'
  },
  'Masque protéiné': {
    title: '💪 Soin Reconstructeur Fortifiant Protéines',
    duration: '25 min',
    steps: [
      'Applique ton masque protéiné après ton shampoing sur tes cheveux essorés.',
      'Insiste particulièrement sur tes pointes abîmées, tes fourches et les zones fragilisées.',
      'Laisse poser entre 15 et 25 minutes (respecte bien le temps indiqué sur le produit).',
      'Rince abondamment et applique immédiatement après un leave-in ou lait très hydratant.'
    ],
    mistakes: [
      'Faire ce soin trop souvent (un excès de protéines durcit la fibre et provoque la casse).',
      'Oublier d\'hydrater ses cheveux juste après un traitement protéiné.'
    ],
    products: 'Masque à la kératine hydrolysée, protéines de soie, de blé ou d\'avoine.'
  },
  'Soin sans rinçage': {
    title: '💧 Lait Hydratant & Méthode L.O.C.',
    duration: '10 min',
    steps: [
      'Divise ta chevelure humide en plusieurs sections de taille égale.',
      'Applique une noisette de lait ou crème sans rinçage (Leave-In) sur chaque section humide.',
      'Masse délicatement tes longueurs pour faire pénétrer le soin hydratant en profondeur.',
      'Applique quelques gouttes d\'huile légère pour sceller l\'hydratation et retenir l\'eau.'
    ],
    mistakes: [
      'Appliquer trop de produit (cela alourdit la boucle et crée un effet carton).',
      'Faire ce soin sur cheveux secs sans vaporiser un peu d\'eau au préalable.'
    ],
    products: 'Lait capillaire fluide à l\'hibiscus ou leave-in léger aux protéines de soie.'
  },
  'Co-wash': {
    title: '🌸 Co-Wash Lavant Doux',
    duration: '10 min',
    steps: [
      'Mouille abondamment tes cheveux à l\'eau tiède.',
      'Applique une quantité généreuse de co-wash lavant des racines jusqu\'aux pointes.',
      'Masse ton cuir chevelu avec la pulpe de tes doigts pour émulsionner et décoller le sébum.',
      'Démêle délicatement tes longueurs à l\'aide de tes doigts, puis rince abondamment.'
    ],
    mistakes: [
      'Ne pas rincer assez (les résidus d\'agents conditionneurs peuvent irriter le cuir chevelu).',
      'Remplacer définitivement le shampoing clarifiant mensuel par du co-wash.'
    ],
    products: 'Crème lavante douce enrichie en coco ou après-shampoing certifié co-wash.'
  },
  'Retwist': {
    title: '👑 Retwist Roots & Aloe Vera Bio',
    duration: '60 min',
    steps: [
      'Lave et hydrate en profondeur tes locks avant de commencer le retwist.',
      'Sépare une mèche, applique une fine noisette de gel d\'aloe vera pur sur la racine neuve.',
      'Tourne délicatement la racine dans le sens des aiguilles d\'une montre entre tes paumes.',
      'Fixe la lock avec une pince en métal plate, puis laisse sécher complètement sous un casque.'
    ],
    mistakes: [
      'Utiliser des cires d\'abeille lourdes qui s\'incrustent à l\'intérieur des locks et créent des résidus.',
      'Serrer trop fort au niveau des racines (provoque une alopécie de traction et casse le bulbe).'
    ],
    products: 'Gel pur d\'Aloe Vera Bio purifié ou gel de graines de lin naturel fait maison.'
  },
  'Massage cuir chevelu': {
    title: '💆‍♀️ Massage Stimulateur de Pousse du Scalp',
    duration: '5 min',
    steps: [
      'Applique 3 à 4 gouttes de ton huile stimulante sur la pulpe de tes doigts.',
      'Place tes doigts sur ton cuir chevelu sous tes cheveux.',
      'Effectue des mouvements circulaires doux en décollant la peau (ne frotte pas les cheveux).',
      'Masse pendant 5 minutes en partant de la nuque et en remontant vers le sommet du crâne.'
    ],
    mistakes: [
      'Utiliser ses ongles (provoque des micro-lésions et irrite le scalp).',
      'Appuyer trop fort ou frotter directement les mèches entre elles (crée de la casse).'
    ],
    products: 'Sérum d\'huile de jojoba infusé au romarin, menthe poivrée ou tea tree.'
  }
};

interface LibraryArticle {
  id: string;
  title: string;
  category: 'Soins' | 'Ingrédients' | 'Problèmes fréquents' | 'Tutos gestuels';
  readTime: string;
  tags: string[];
  snippet: string;
  bgEmoji: string;
  content: string;
}

const libraryArticles: LibraryArticle[] = [
  // Category: Soins
  {
    id: 'la1',
    title: 'La Clarification Mensuelle : Pourquoi et comment ?',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Locksés', 'Raides'],
    snippet: 'La clarification élimine le calcaire et les résidus de produits accumulés pour repartir sur une base saine et réceptive aux soins.',
    bgEmoji: '🔬',
    content: 'La clarification capillaire est une détox indispensable. Vos cheveux saturent sous les couches de produits (beurres, gels, huiles) et le calcaire de l\'eau. Résultat : ils deviennent secs, ternes, poisseux ou cassants, et les soins ne pénètrent plus. Une clarification à l\'argile de Rhassoul ou avec un shampoing clarifiant doux sans silicones redonne vie et volume immédiat ! Recommandé toutes les 4 à 6 semaines.',
  },
  {
    id: 'la2',
    title: 'Le Co-Wash : Laver ses cheveux sans les décaper 🌸',
    category: 'Soins',
    readTime: '3 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Fins'],
    bgEmoji: '🌸',
    snippet: 'Pour les cheveux très secs ou lavés fréquemment, le co-washing (lavage au conditionneur doux) préserve le film lipidique.',
    content: 'Le Co-Wash consiste à laver ses cheveux avec un après-shampoing spécialement formulé, riche en agents hydratants et pauvre en tensioactifs. Idéal pour rafraîchir ses boucles au milieu de la semaine sans passer par la case shampoing décapant. Attention à bien masser vigoureusement le cuir chevelu pour décoller le sébum par action mécanique, et rincez très abondamment pour éviter le surpoids.',
  },
  {
    id: 'la3',
    title: 'Le shampoing doux quotidien ou régulier 🧴',
    category: 'Soins',
    readTime: '3 min',
    tags: ['Raides', 'Ondulés', 'Moyens', 'Fins'],
    bgEmoji: '🧴',
    snippet: 'Le cuir chevelu à sébum rapide ou transpirant a besoin d\'un lavage régulier mais tout doux sans décapage.',
    content: 'Les textures lisses à ondulées et les cheveux fins font voyager le sébum très rapidement des racines aux longueurs. Pour garder un volume aérien sans agresser le cuir chevelu, optez pour un shampoing doux sans sulfates formulé avec du gel d\'aloe vera purifiant. Lavez de préférence à l\'eau tiède, voire fraîche au dernier rinçage pour refermer les cuticules.',
  },

  // Category: Ingrédients
  {
    id: 'la4',
    title: 'Le Pouvoir de l\'Aloe Vera Bio pour sceller l\'eau 🌿',
    category: 'Ingrédients',
    readTime: '3 min',
    tags: ['Faible', 'Moyenne', 'Forte', 'Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Ondulés', 'Raides'],
    bgEmoji: '🌿',
    snippet: 'Humectant naturel, le gel d\'aloe vera retient l\'humidité sans laisser de film gras.',
    content: 'Le gel d\'aloe vera bio est composé à 98% d\'eau pure et gorgé de vitamines et minéraux. Il agit comme un aimant à hydratation (humectant) fantastique. Appliquez une noisette sur cheveux humides avant votre huile pour "verrouiller" l\'eau dans la fibre capillaire. C\'est l\'ingrédient de prédilection des cheveux de faible porosité car il ne sature pas la cuticule.',
  },
  {
    id: 'la5',
    title: 'Choisir ses huiles végétales selon sa porosité 🥑',
    category: 'Ingrédients',
    readTime: '5 min',
    tags: ['Faible', 'Forte', 'Moyenne', 'Crépus', 'Frisés', 'Bouclés'],
    bgEmoji: '🥑',
    snippet: 'Huiles légères (Jojoba, Amande douce) pour porosité faible, huiles riches (Avocat, Karité) pour porosité forte.',
    content: 'Chaque type de porosité réagit différemment aux corps gras. Les cheveux de porosité FAIBLE adorent les huiles fluides et pénétrantes (Jojoba, Amande douce, Argan) qui se faufilent sous leurs écailles serrées. Les cheveux de porosité FORTE nécessitent des huiles denses et protectrices (Avocat, Ricin, beurre de Karité) pour combler les brèches et créer une barrière hydrophobe efficace.',
  },

  // Category: Problèmes fréquents
  {
    id: 'la6',
    title: 'Comment éliminer les pellicules sèches ? 💆‍♂️',
    category: 'Problèmes fréquents',
    readTime: '4 min',
    tags: ['Cuir chevelu sensible', 'Pellicules', 'Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Raides', 'Locksés'],
    bgEmoji: '💆‍♂️',
    snippet: 'Des huiles essentielles ciblées comme le Tea Tree et le Romarin assainissent le cuir chevelu en douceur.',
    content: 'Les pellicules proviennent souvent d\'un dérèglement du microbiome du cuir chevelu combiné à de la sécheresse. Pour y remédier sans utiliser de shampoings décapants à base de goudron, faites un bain d\'huile apaisant hebdomadaire : diluez 3 gouttes d\'huile essentielle de Tea Tree et 2 gouttes de Romarin à cinéole dans 2 cuillères à soupe d\'huile de jojoba. Massez 5 min, laissez poser 20 min puis lavez.',
  },
  {
    id: 'la7',
    title: 'Hygral Fatigue vs Carence Protéique ⚖️',
    category: 'Problèmes fréquents',
    readTime: '5 min',
    tags: ['Forte', 'Fins', 'Crépus', 'Frisés', 'Bouclés'],
    bgEmoji: '⚖️',
    snippet: 'Cheveux élastiques et mous = excès d\'hydratation. Cheveux secs, rêches et cassants = manque de protéines.',
    content: 'L\'équilibre hydratation/protéines est la clé d\'une fibre élastique et forte. Si vos cheveux s\'étirent comme du chewing-gum et restent mous sans ressort, ils souffrent d\'hygral fatigue (excès d\'eau). Faites un soin protéiné réparateur. Si au contraire ils sont rêches, rigides et cassent au moindre frottement, ils manquent d\'hydratation profonde : appliquez un bain d\'huile tiède puis un masque humectant doux au miel.',
  },

  // Category: Tutos gestuels
  {
    id: 'la8',
    title: 'La Méthode L.O.C. pas à pas pour boucles rebondies 💧',
    category: 'Tutos gestuels',
    readTime: '3 min',
    tags: ['Forte', 'Crépus', 'Frisés', 'Bouclés', 'Épais'],
    bgEmoji: '💧',
    snippet: 'Liquid (Eau), Oil (Huile), Cream (Crème) : la superposition idéale pour sceller l\'hydratation durablement.',
    content: 'La méthode L.O.C. est la reine du scellage d\'hydratation. Étape 1 : Liquid (L) - Humidifiez les cheveux avec de l\'eau tiède ou un spray hydratant. Étape 2 : Oil (O) - Appliquez quelques gouttes d\'huile légère (comme l\'avocat ou le jojoba) pour freiner l\'évaporation de l\'eau. Étape 3 : Cream (C) - Appliquez un lait crémeux ou crème hydratante pour lisser les écailles et définir les boucles en beauté.',
  },
  {
    id: 'la9',
    title: 'Massage crânien : Stimuler la pousse & détendre 💆‍♀️',
    category: 'Tutos gestuels',
    readTime: '4 min',
    tags: ['Locksés', 'Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Raides', 'Cuir chevelu sensible'],
    bgEmoji: '💆‍♀️',
    snippet: 'Décollez le cuir chevelu par des mouvements circulaires lents pour booster l\'afflux sanguin aux racines.',
    content: 'Le massage du cuir chevelu active la microcirculation autour des follicules pileux, optimisant l\'apport de nutriments pour accélérer la pousse. Utilisez le bout des doigts (jamais les ongles). Posez-les fermement sur le crâne et décollez délicatement la peau en effectuant de petits cercles pendant 5 minutes. Commencez par la nuque puis remontez vers le sommet du crâne.'
  },
  // New Articles: Soins
  {
    id: 'la10',
    title: 'La protection de nuit : Satin vs Coton 😴',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Ondulés', 'Raides'],
    bgEmoji: '😴',
    snippet: 'Le coton absorbe l\'hydratation et crée des frictions. Le satin ou la soie préviennent la casse et gardent vos boucles intactes.',
    content: 'Dormir sur une taie en coton ou avec un foulard classique est l\'ennemi numéro un des boucles. Le coton est une fibre hydrophile qui "boit" toute l\'hydratation naturelle de vos cheveux pendant la nuit. De plus, sa texture rugueuse crée des frictions constantes qui provoquent des nœuds, des frisottis et de la casse. Adoptez un bonnet ou une taie d\'oreiller en satin de polyester ou en soie naturelle. Vos boucles glisseront en douceur sans s\'emmêler ni se dessécher !'
  },
  {
    id: 'la11',
    title: 'La routine de lavage spéciale Locks Matures 🦁',
    category: 'Soins',
    readTime: '5 min',
    tags: ['Locksés', 'Locks matures', 'Épais'],
    bgEmoji: '🦁',
    snippet: 'Les locks matures ont besoin d\'un nettoyage en profondeur mais sans résidus. La méthode du bain de bicarbonate et vinaigre est magique.',
    content: 'Les locks matures capturent facilement la poussière, le calcaire et le sébum au cœur de leur structure serrée. Pour conserver des locks légères, propres et sans résidus, effectuez une détox bi-annuelle : plongez vos locks dans une bassine d\'eau chaude additionnée de 2 cuillères à soupe de bicarbonate de soude et d\'un demi-verre de vinaigre de cidre pendant 15 minutes. Pressez doucement pour faire sortir les impuretés accumulées. Rincez abondamment. Vos locks en ressortiront d\'une légèreté et d\'une fraîcheur incomparables !'
  },
  {
    id: 'la12',
    title: 'Le séchage au diffuseur sans frisottis 🌀',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Bouclés', 'Frisés', 'Fins', 'Moyens'],
    bgEmoji: '🌀',
    snippet: 'Utilisez de l\'air tiède à faible vitesse sans manipuler les boucles avec vos mains pour conserver une définition parfaite.',
    content: 'Le séchage à l\'air libre est idéal, mais si vous utilisez un sèche-cheveux, le diffuseur est obligatoire. Pour éviter l\'apparition de frisottis et de volume non contrôlé, suivez cette règle d\'or : appliquez vos produits coiffants sur cheveux très humides, puis penchez la tête en avant. Placez délicatement les boucles dans le bol du diffuseur, réglez l\'appareil sur température tiède et vitesse minimale. Ne touchez pas à vos cheveux avec vos doigts tant qu\'ils ne sont pas secs à 90 % pour figer la forme de la boucle sans l\'ébouriffer.'
  },
  // New Articles: Ingrédients
  {
    id: 'la13',
    title: 'L\'Huile de Carapate pour fortifier 🌰',
    category: 'Ingrédients',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Casse', 'Forte', 'Moyenne'],
    bgEmoji: '🌰',
    snippet: 'Plus riche en cendres alcalines que le ricin blanc, l\'huile de carapate nourrit intensément et active la pousse capillaire.',
    content: 'L\'huile de carapate (Black Castor Oil) est obtenue par torréfaction des graines de ricin avant extraction. Ce procédé traditionnel lui confère une couleur sombre, une odeur caractéristique et une richesse exceptionnelle en cendres alcalines et en acide ricinoléique. Elle est idéale pour réparer les pointes fourchues des cheveux crépus très secs ou pour sceller l\'hydratation des cheveux à forte porosité. Massez également quelques gouttes sur vos tempes et vos racines pour stimuler la circulation sanguine et accélérer la pousse.'
  },
  {
    id: 'la14',
    title: 'La Protéine de Soie pour les cheveux fins 🧬',
    category: 'Ingrédients',
    readTime: '3 min',
    tags: ['Fins', 'Bouclés', 'Ondulés', 'Moyens', 'Raides', 'Casse'],
    bgEmoji: '🧬',
    snippet: 'Cet actif cosmétique pénètre la cuticule pour gainer, hydrater et redonner de la force et du ressort aux boucles.',
    content: 'Les cheveux fins ou abîmés ont une structure fragile qui s\'affaisse rapidement. La protéine de soie hydrolysée est un actif naturel incroyable aux propriétés hautement pénétrantes. Elle se fixe sur la kératine du cheveu pour former un film protecteur ultra-léger sans alourdir. Elle retient l\'hydratation, améliore l\'élasticité de la fibre et redonne un ressort magnifique aux boucles relâchées. Ajoutez 2 à 3 gouttes de cet actif dans votre dose de lait capillaire ou de gel pour un effet gainant instantané !'
  },
  {
    id: 'la15',
    title: 'L\'eau de riz fermentée ancestrale 🌾',
    category: 'Ingrédients',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Ondulés', 'Raides', 'Casse'],
    bgEmoji: '🌾',
    snippet: 'Riche en inositol et acides aminés, cette lotion de rinçage naturelle fortifie et fait briller les cheveux ternes.',
    content: 'Utilisée depuis des siècles en Asie, l\'eau de riz fermentée est une mine d\'or pour les cheveux ternes et fragiles. Lors de la fermentation, le pH de l\'eau s\'équilibre avec celui du cheveu et libère de l\'inositol, une molécule capable de pénétrer à l\'intérieur du cheveu pour le réparer durablement. Après avoir rincé votre shampoing, versez l\'eau de riz (laissée à fermenter 24h à température ambiante) sur vos longueurs, massez bien, laissez poser 5 minutes, puis rincez à l\'eau fraîche. Force et brillance garanties !'
  },
  // New Articles: Problèmes fréquents
  {
    id: 'la16',
    title: 'Dompter le Shrinkage sans chaleur 📏',
    category: 'Problèmes fréquents',
    readTime: '5 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Forte', 'Moyenne'],
    bgEmoji: '📏',
    snippet: 'Le shrinkage prouve que vos cheveux sont en parfaite santé ! Apprenez à étirer vos boucles mécaniquement et en douceur.',
    content: 'Le "shrinkage" est le phénomène par lequel les cheveux crépus ou très frisés rétrécissent jusqu\'à 70 % de leur longueur réelle au contact de l\'humidité. C\'est la preuve ultime que vos cheveux sont sains et hautement élastiques ! Si vous souhaitez étirer vos boucles sans utiliser de chaleur thermique agressive, privilégiez des techniques douces d\'étirement mécanique : les tresses au fil (Threading), les Bantu Knots sur cheveux presque secs, ou les nattes (braid-outs). Appliquez toujours une noisette de beurre de karité ou de crème coiffante pour figer l\'étirement.'
  },
  {
    id: 'la17',
    title: 'Apaiser les démangeaisons sous les tresses 🪡',
    category: 'Problèmes fréquents',
    readTime: '4 min',
    tags: ['Tresses', 'Cuir chevelu sensible', 'Crépus', 'Frisés', 'Bouclés'],
    bgEmoji: '🪡',
    snippet: 'Les tensions mécaniques et l\'accumulation de sébum irritent le scalp. Utilisez une brume apaisante menthe-aloé.',
    content: 'Porter des nattes collées ou des tresses avec extensions est idéal pour laisser reposer les cheveux, mais cela exerce des tensions mécaniques sur le scalp et retient le sébum. Pour calmer instantanément les démangeaisons sans ruiner votre coiffure, vaporisez quotidiennement sur vos racines un spray fait maison : mélangez 80 % d\'hydrolat de menthe poivrée (purifiant et rafraîchissant) et 20 % de gel d\'aloe vera. Massez doucement du bout des doigts pour faire pénétrer. Vos racines seront fraîches, assainies et apaisées !'
  },
  {
    id: 'la18',
    title: 'Prévenir la casse au niveau de la nuque 🧣',
    category: 'Problèmes fréquents',
    readTime: '3 min',
    tags: ['Casse', 'Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Raides'],
    bgEmoji: '🧣',
    snippet: 'Les frictions régulières contre les manteaux et écharpes cassent la nuque. Protégez-la avec du satin.',
    content: 'Avez-vous remarqué que les cheveux situés au niveau de la nuque sont souvent plus courts ou plus secs ? Ce n\'est pas un hasard, mais le résultat des frictions répétées contre vos vêtements (surtout en hiver avec les cols roulés, les manteaux et les écharpes en laine qui agissent comme du papier de verre). Pour protéger cette zone fragile, veillez à relever vos cheveux en chignon haut (pineapple) lorsque vous portez des cols épais, ou doublez l\'intérieur de vos écharpes d\'un tissu en satin ou en soie.'
  },
  // New Articles: Tutos gestuels
  {
    id: 'la19',
    title: 'Le Démêlage aux Doigts pas à pas 🖐️',
    category: 'Tutos gestuels',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Casse', 'Forte', 'Moyenne'],
    bgEmoji: '🖐️',
    snippet: 'Les peignes et brosses arrachent les nœuds. Apprenez le geste salvateur pour éliminer les nœuds sans douleur.',
    content: 'Le secret le mieux gardé pour conserver sa longueur est de bannir le peigne et de démêler exclusivement avec vos doigts ! Les cheveux crépus et frisés s\'entremêlent naturellement. Un peigne, même à dents larges, force à travers les nœuds et brise la fibre. En utilisant vos mains recouvertes d\'après-shampoing glissant, vous pouvez localiser précisément chaque nœud, écarter les mèches doucement pour le défaire, et retirer les cheveux morts sans créer aucune casse. C\'est un gain de temps et de volume sur le long terme !'
  },
  {
    id: 'la20',
    title: 'Le "Plopping" pour dessiner les boucles 🌀',
    category: 'Tutos gestuels',
    readTime: '3 min',
    tags: ['Bouclés', 'Ondulés', 'Fins', 'Moyens'],
    bgEmoji: '🌀',
    snippet: 'Séchez vos cheveux dans un t-shirt en coton posé à plat pour obtenir des boucles rebondies et sans frisottis.',
    content: 'Le plopping est une méthode de séchage révolutionnaire pour les cheveux bouclés à ondulés. Après avoir appliqué votre crème de soin ou gel de définition sur cheveux trempés, posez un t-shirt en coton à plat sur une table ou votre lit. Penchez la tête en avant et déposez vos boucles en "accordéon" au centre du t-shirt. Enveloppez votre tête avec les manches du t-shirt et nouez-les derrière la nuque. Laissez poser 15 à 30 minutes. Le t-shirt absorbe l\'excès d\'eau sans froisser la cuticule, laissant des boucles incroyablement dessinées et sans aucun frisottis !'
  },
  {
    id: 'la21',
    title: 'Les "Finger Coils" pour des spirales parfaites 🌀',
    category: 'Tutos gestuels',
    readTime: '4 min',
    tags: ['Frisés', 'Bouclés', 'Moyens', 'Fins', 'Épais'],
    bgEmoji: '🌀',
    snippet: 'Enroulez chaque mèche autour de votre index pour sculpter des anglaises régulières qui durent des jours.',
    content: 'Les "finger coils" (boucles au doigt) permettent de sculpter des boucles spirales ultra-définies et régulières. Sur cheveux propres et bien hydratés, séparez votre chevelure en petites sections. Appliquez une noisette de gelée ou de crème coiffante sur une mèche d\'un centimètre de large. Saisissez la mèche à la racine et enroulez-la fermement autour de votre index jusqu\'aux pointes. Relâchez délicatement. Laissez sécher à l\'air libre ou au diffuseur sans y toucher. Vos spirales tiendront jusqu\'à une semaine complète !'
  },
  // Added new articles for Soins
  {
    id: 'la22',
    title: 'La méthode du Pre-Poo protecteur 🛡️',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Casse'],
    bgEmoji: '🛡️',
    snippet: 'Protégez vos longueurs du dessèchement en appliquant un bain d\'huile ou un masque tiède avant votre shampoing.',
    content: 'Le "Pre-Poo" (soin avant-shampoing) est une étape cruciale pour les cheveux crépus et très secs. Le shampoing, même doux, retire une partie des huiles naturelles du cheveu lors du lavage. En appliquant un mélange d\'huiles fluides (comme l\'olive ou l\'amande douce) ou un masque hydratant sur cheveux humides 30 minutes avant votre shampoing, vous créez un bouclier protecteur. Vos cuticules sont préservées, et vos longueurs restent douces et hydratées après le rinçage !'
  },
  {
    id: 'la23',
    title: 'Le séchage au Stretching tiède 📏',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Casse'],
    bgEmoji: '📏',
    snippet: 'Étirez vos longueurs en douceur avec de l\'air tiède et vos doigts pour limiter les nœuds et la casse sans fer.',
    content: 'Les cheveux crépus ont tendance à s\'emmêler énormément en séchant en raison de leur forme spirale serrée. Pour éviter la formation de "nœuds de fée" et réduire le shrinkage sans agresser la fibre, utilisez la méthode du stretching à l\'air tiède. Séparez vos cheveux humides en 4 sections, appliquez votre leave-in, étirez délicatement une mèche vers le bas et passez le sèche-cheveux muni d\'un embout concentrateur sur température tiède (vitesse minimale). Vos cheveux seront étirés, souples et faciles à coiffer !'
  },
  {
    id: 'la24',
    title: 'La méthode d\'hydratation L.O.B. 🧈',
    category: 'Soins',
    readTime: '5 min',
    tags: ['Crépus', 'Épais', 'Forte'],
    bgEmoji: '🧈',
    snippet: 'Liquid, Oil, Butter : la superposition idéale pour sceller l\'hydratation des cheveux crépus très denses.',
    content: 'Pour les textures de type 4C ou les cheveux de porosité forte très denses, la méthode classique L.O.C. peut être insuffisante. La méthode L.O.B. (Liquid, Oil, Butter) est la solution ultime. Étape 1 : Liquid (L) - Vaporisez de l\'eau ou une brume hydratante. Étape 2 : Oil (O) - Appliquez une fine couche d\'huile végétale (comme l\'avocat ou l\'argan). Étape 3 : Butter (B) - Scellez le tout avec un beurre végétal dense (comme le beurre de karité ou de mangue) pour emprisonner l\'hydratation et adoucir la fibre en profondeur.'
  },
  {
    id: 'la25',
    title: 'Le shampoing doux hebdomadaire 🧴',
    category: 'Soins',
    readTime: '3 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Raides'],
    bgEmoji: '🧴',
    snippet: 'Nettoyez en profondeur sans décaper grâce à une formule douce enrichie en glycérine végétale ou en miel.',
    content: 'Les cheveux crépus nécessitent des shampoings doux qui éliminent le sébum et les résidus de beurres coiffants sans décaper la cuticule. Privilégiez des formules enrichies en glycérine végétale ou en miel, qui nettoient tout en maintenant l\'hydratation de la fibre. Lavez toujours en insistant sur le cuir chevelu en mouvements circulaires et laissez couler la mousse sur les longueurs sans frotter les pointes entre elles pour éviter la casse.'
  },
  // Added new articles for Ingrédients
  {
    id: 'la26',
    title: 'Le Beurre de Karité brut protecteur 🧈',
    category: 'Ingrédients',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Forte'],
    bgEmoji: '🧈',
    snippet: 'Riche en vitamines, le beurre de karité nourrit intensément, assouplit la fibre et protège des agressions.',
    content: 'Le beurre de karité brut non raffiné est l\'allié historique des cheveux crépus et frisés. Composé d\'acides gras essentiels, il forme un film protecteur imperméable autour du cheveu, retenant l\'hydratation pendant plusieurs jours. Il est également idéal pour nourrir les pointes sèches et prévenir les fourches. Faites fondre une noisette de beurre de karité dans le creux de vos mains avant de l\'appliquer sur vos longueurs pour sceller votre lait capillaire.'
  },
  // Added new articles for Problèmes fréquents
  {
    id: 'la27',
    title: 'Démêler les nœuds de fée sans couper 🧚‍♀️',
    category: 'Problèmes fréquents',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Fins', 'Casse'],
    bgEmoji: '🧚‍♀️',
    snippet: 'Ces micro-nœuds qui se forment sur une seule mèche peuvent être évités grâce à des coiffures protectrices.',
    content: 'Les "nœuds de fée" (micro-nœuds individuels) sont très fréquents sur les cheveux crépus et fins. Ils se forment lorsque le cheveu s\'enroule sur lui-même en séchant. Pour les éviter, veillez à ne jamais laisser vos cheveux sécher à l\'air libre sans être étirés (faites des tresses ou des nattes). Si un nœud est déjà formé, appliquez une goutte d\'huile glissante (comme le brocoli ou le jojoba) et essayez de faire glisser délicatement le nœud avec une épingle à cheveux plutôt que de couper immédiatement !'
  },
  // Added new articles for Tutos gestuels
  {
    id: 'la28',
    title: 'La méthode des Bantu Knots 🌀',
    category: 'Tutos gestuels',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Épais', 'Moyens'],
    bgEmoji: '🌀',
    snippet: 'Enroulez vos mèches sur elles-mêmes en petits nœuds pour obtenir des ondulations rebondies sans chaleur.',
    content: 'Les Bantu Knots sont une coiffure protectrice ancestrale qui permet de créer des boucles serrées et rebondies sans chaleur. Sur cheveux humides et nourris avec une crème coiffante, séparez votre chevelure en sections carrées. Enroulez une section sur elle-même de la racine aux pointes, puis torsadez-la autour de sa base pour former un petit chignon serré. Fixez avec un élastique ou une pince. Laissez sécher complètement (de préférence toute la nuit sous un bonnet en satin) puis déroulez délicatement avec un peu d\'huile sur vos doigts.'
  }
];

interface HomeScreenProps {
  onAddProfilePress: () => void;
  onLogoutPress: () => void;
  onNavigateToCalendar?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAddProfilePress, onLogoutPress, onNavigateToCalendar }) => {
  const {
    profiles,
    activeProfileId,
    activeProfile,
    selectProfile,
    showFeedbackQuiz,
    submitFeedback,
    closeFeedbackQuiz,
    triggerSosBooster,
    completePorosity,
    themeMode,
    lastValidatedCare,
    lastFeedbackDelta,
    lastFeedbackReason,
    showCareSummary,
    closeCareSummary,
    routine,
    completeTodayAction,
    toggleRoutineCompleted,
    deleteRoutineItem,
    updateRoutineItemTime
  } = useAppState();

  const [showHealthDetail, setShowHealthDetail] = useState(false);
  const [sosSuccessMessage, setSosSuccessMessage] = useState('');
  const [showPorosityModal, setShowPorosityModal] = useState(false);
  const [showCareGuide, setShowCareGuide] = useState(false);
  const [showAllAdvice, setShowAllAdvice] = useState(false);
  const [activeAdviceTab, setActiveAdviceTab] = useState<'Soins' | 'Ingrédients' | 'Problèmes fréquents' | 'Tutos gestuels'>('Soins');
  const [selectedArticleContent, setSelectedArticleContent] = useState<LibraryArticle | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [selectedGuideCategory, setSelectedGuideCategory] = useState<string>('');
  const [selectedCareId, setSelectedCareId] = useState<string>('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  if (!activeProfile) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleSosPress = () => {
    triggerSosBooster();
    setSosSuccessMessage('Protocole SOS Booster 14 jours planifié dans le calendrier ! 🩺🚀');
    setTimeout(() => {
      setSosSuccessMessage('');
    }, 4000);
  };

  const isLight = themeMode === 'light';
  const todayStr = new Date().toISOString().split('T')[0];
  const customBg = isLight ? '#F5F6FA' : colors.background;

  // Find today's uncompleted task (for guides matching)
  const todayAction = routine.find(
    r => r.profileId === activeProfile.id && r.date === todayStr && !r.completed
  );

  const activeCategory = todayAction ? todayAction.category : '';

  // Find active care item being viewed in the guide
  const activeCareItem = selectedCareId 
    ? routine.find(r => r.id === selectedCareId)
    : (todayAction && (selectedGuideCategory === '' || selectedGuideCategory === activeCategory) ? todayAction : undefined);
  
  // Find matching guide
  const categoryToUse = selectedGuideCategory || activeCategory;
  let guideKey = 'Lavage';
  if (categoryToUse) {
    if (categoryToUse.toLowerCase().includes('clarif')) guideKey = 'Clarification';
    else if (categoryToUse.toLowerCase().includes('lavage')) guideKey = 'Lavage';
    else if (categoryToUse.toLowerCase().includes('bain')) guideKey = 'Bain d\'huile';
    else if (categoryToUse.toLowerCase().includes('hydratant')) guideKey = 'Masque hydratant';
    else if (categoryToUse.toLowerCase().includes('protéin')) guideKey = 'Masque protéiné';
    else if (categoryToUse.toLowerCase().includes('masque')) guideKey = 'Masque hydratant';
    else if (categoryToUse.toLowerCase().includes('rinçage') || categoryToUse.toLowerCase().includes('leave')) guideKey = 'Soin sans rinçage';
    else if (categoryToUse.toLowerCase().includes('co-wash') || categoryToUse.toLowerCase().includes('cowash')) guideKey = 'Co-wash';
    else if (categoryToUse.toLowerCase().includes('retwist')) guideKey = 'Retwist';
    else if (categoryToUse.toLowerCase().includes('massage') || categoryToUse.toLowerCase().includes('cuir')) guideKey = 'Massage cuir chevelu';
  }
  
  const currentGuide = careGuidesMap[guideKey] || careGuidesMap['Lavage'];

  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const customInputBg = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.04)';
  const customInputBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';

  const diag = activeProfile.diagnostic;
  const activeTags: string[] = [diag.texture as string, diag.porosity as string, diag.activeStyle as string, ...diag.sensitivity].filter(Boolean);

  const getRelativeDateLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays === 2) return "Après-demain";
    return `Dans ${diffDays} jours`;
  };

  // Filter future uncompleted cares (upcoming scheduled)
  const allUpcomingCares = routine
    .filter(r => r.profileId === activeProfile.id && !r.completed && r.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcomingCares = showAllUpcoming ? allUpcomingCares : allUpcomingCares.slice(0, 4);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: customBg }]}>
      {/* 👤 TOP Horizontal Multi-Profile Family Selector */}
      <View style={[
        styles.profileSelectorContainer,
        { 
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(22, 25, 42, 0.5)',
          borderColor: customBorder
        }
      ]}>
        <View style={styles.profileSelectorRow}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.profileScroll}
            style={{ flex: 1 }}
          >
            {profiles.map(p => {
              const isActive = p.id === activeProfileId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.profileAvatarWrapper, isActive && styles.profileAvatarWrapperActive]}
                  onPress={() => {
                    selectProfile(p.id);
                    setShowHealthDetail(false);
                  }}
                >
                  <Text style={[
                    styles.profileAvatarEmoji, 
                    { backgroundColor: customCard },
                    isActive && { borderColor: colors.primary }
                  ]}>
                    {p.avatar}
                  </Text>
                  <Text style={[
                    styles.profileAvatarName, 
                    isActive && styles.profileAvatarNameActive,
                    { color: isActive ? colors.primary : customTextSec }
                  ]} numberOfLines={1}>
                    {p.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            {/* Add Profile Button */}
            <TouchableOpacity style={styles.addProfileButton} onPress={onAddProfilePress}>
              <Text style={[
                styles.addProfileIcon,
                { 
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)',
                  color: customTextSec
                }
              ]}>➕</Text>
              <Text style={[styles.addProfileLabel, { color: customTextSec }]}>Ajouter</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Right-aligned Logo Asset */}
          <View style={styles.selectorLogoWrapper}>
            <Image 
              source={isLight ? require('../../../assets/logo_jour.png') : require('../../../assets/logo_nuit.png')}
              style={styles.selectorLogoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Orange Banner for Skipped Porosity */}
        {activeProfile.diagnostic.porosity === null && (
          <TouchableOpacity
            style={styles.orangeBanner}
            activeOpacity={0.9}
            onPress={() => setShowPorosityModal(true)}
          >
            <Text style={styles.orangeBannerEmoji}>🔬</Text>
            <View style={styles.orangeBannerTextWrapper}>
              <Text style={styles.orangeBannerTitle}>Porosité non renseignée ⚠️</Text>
              <Text style={styles.orangeBannerDesc}>
                Complétez le test pour débloquer vos conseils personnalisés ! Cliquez ici.
              </Text>
            </View>
            <Text style={styles.orangeBannerArrow}>➔</Text>
          </TouchableOpacity>
        )}

        {/* Dynamic header (Bandeau Dynamique) */}
        <DynamicHeader onPriorityPress={() => {
          setSelectedCareId(todayAction?.id || '');
          setSelectedGuideCategory(activeCategory);
          setShowCareGuide(true);
        }} />

        {/* Circular Health Gauge component */}
        <View style={styles.gaugeSection}>
          <CircularGauge
            percentage={activeProfile.healthScore}
            onPress={() => setShowHealthDetail(true)}
          />
          <Text style={[styles.gaugeHelpText, { color: isLight ? '#888D9F' : colors.textMuted }]}>
            👉 Appuie sur la jauge pour voir le bilan détaillé
          </Text>
        </View>

        {/* Central interactive Quick Action button */}
        <QuickAction onPress={onNavigateToCalendar} />

        {/* Ephemeral catch-up block (conditional) */}
        <CatchUpCard />

        {/* Curated recommendation card */}
        <FeaturedAdvice 
          onSeeAllPress={() => setShowAllAdvice(true)} 
          onArticlePress={(art) => {
            setSelectedArticleContent(art);
            setShowAllAdvice(true);
          }}
        />

        {/* 📅 AGENDA EXPRESS: UPCOMING PLANED CARES FEED */}
        <View style={styles.upcomingSection}>
          <Text style={[styles.upcomingSectionTitle, { color: customText }]}>🗓️ Mon Agenda à Venir</Text>
          
          {upcomingCares.length === 0 ? (
            <View style={[styles.upcomingEmptyCard, { backgroundColor: customCard, borderColor: customBorder }]}>
              <Text style={[styles.upcomingEmptyEmoji]}>🌿</Text>
              <Text style={[styles.upcomingEmptyTitle, { color: customText }]}>Aucun soin planifié</Text>
              <Text style={[styles.upcomingEmptyDesc, { color: customTextSec }]}>
                Utilisez le bouton "Mémo Soin" ci-dessus pour planifier vos soins libres personnalisés !
              </Text>
            </View>
          ) : (
            <View style={styles.upcomingListWrapper}>
              {upcomingCares.map(care => {
                // Pick appropriate emoji based on category
                let careEmoji = '🧴';
                if (care.category.toLowerCase().includes('clarif')) careEmoji = '🔬';
                else if (care.category.toLowerCase().includes('bain')) careEmoji = '🌿';
                else if (care.category.toLowerCase().includes('masque')) careEmoji = '🍯';
                else if (care.category.toLowerCase().includes('rinçage') || care.category.toLowerCase().includes('leave')) careEmoji = '💧';
                else if (care.category.toLowerCase().includes('co-wash')) careEmoji = '🌸';
                else if (care.category.toLowerCase().includes('retwist')) careEmoji = '👑';
                else if (care.category.toLowerCase().includes('massage')) careEmoji = '💆‍♀️';

                const relativeLabel = getRelativeDateLabel(care.date);

                const handleDeleteCare = () => {
                  const confirmDelete = Platform.OS === 'web' 
                    ? window.confirm(`Voulez-vous supprimer le soin "${care.category}" planifié pour le ${care.date} ?`)
                    : true; // Standard confirm on mobile or simple delete

                  if (confirmDelete) {
                    deleteRoutineItem(care.id);
                  }
                };

                return (
                  <TouchableOpacity 
                    key={care.id} 
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedCareId(care.id);
                      setSelectedGuideCategory(care.category);
                      setShowCareGuide(true);
                    }}
                    style={[
                      styles.upcomingCareCard, 
                      { backgroundColor: customCard, borderColor: customBorder }
                    ]}
                  >
                    <View style={[styles.upcomingCareEmojiBadge, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)' }]}>
                      <Text style={styles.upcomingCareEmojiText}>{careEmoji}</Text>
                    </View>

                    <View style={styles.upcomingCareInfoWrapper}>
                      <View style={styles.upcomingCareHeaderRow}>
                        <Text style={[styles.upcomingCareTitleText, { color: customText }]} numberOfLines={1}>
                          {care.category}
                        </Text>
                        <Text style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: colors.primary,
                          textTransform: 'uppercase',
                        }}>
                          {relativeLabel}
                        </Text>
                      </View>
                      
                      <Text style={[styles.upcomingCareProductText, { color: customTextSec }]} numberOfLines={1}>
                        {care.product}
                      </Text>
                      
                      <View style={styles.upcomingCareFooterRow}>
                        <Text style={{ fontSize: 9, color: colors.secondary, fontWeight: '700' }}>
                          📅 {care.date}
                        </Text>
                        {care.enableNotificationReminder && (
                          <Text style={{ fontSize: 9, color: colors.accent, fontWeight: '700', marginLeft: 8 }}>
                            🔔 Rappel actif
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Delete button (cancel care) */}
                    <TouchableOpacity 
                      style={[styles.upcomingCareDeleteButton, { backgroundColor: isLight ? 'rgba(217, 83, 79, 0.05)' : 'rgba(217, 83, 79, 0.08)' }]} 
                      onPress={handleDeleteCare}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.upcomingCareDeleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
              
              {allUpcomingCares.length > 4 && (
                <TouchableOpacity 
                  style={styles.seeMoreUpcomingButton} 
                  onPress={() => setShowAllUpcoming(!showAllUpcoming)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeMoreUpcomingText}>
                    {showAllUpcoming ? 'Voir moins ➔' : `Voir plus (${allUpcomingCares.length - 4} de plus) ➔`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Logout Bypass */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogoutPress}>
          <Text style={[styles.logoutText, { color: isLight ? '#888D9F' : colors.textMuted }]}>🔒 Déconnexion Compte Maître</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 💬 POP-UP Feedback Quiz Modal (Mini-Quiz Feedback) */}
      <Modal
        visible={showFeedbackQuiz}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFeedbackQuiz}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.feedbackCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <Text style={styles.feedbackEmoji}>Feedback 📝</Text>
            <Text style={[styles.feedbackTitle, { color: customText }]}>Comment se sentent vos cheveux après ce soin ?</Text>
            <Text style={[styles.feedbackSubtitle, { color: customTextSec }]}>
              Votre réponse permet d'ajuster en temps réel votre jauge de santé globale.
            </Text>

            <View style={styles.feedbackOptions}>
              {/* Option Dry */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.warning, backgroundColor: customInputBg }]}
                onPress={() => submitFeedback('Secs')}
              >
                <Text style={styles.optionEmojiText}>🌵</Text>
                <Text style={[styles.optionBtnLabel, { color: customText }]}>[ Secs ]</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Manque d'hydratation</Text>
              </TouchableOpacity>

              {/* Option Top */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.secondary, backgroundColor: customInputBg }]}
                onPress={() => submitFeedback('Top')}
              >
                <Text style={styles.optionEmojiText}>✨</Text>
                <Text style={[styles.optionBtnLabel, { color: customText }]}>[ Top ]</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Doux, brillants, parfaits</Text>
              </TouchableOpacity>

              {/* Option Heavy */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.primary, backgroundColor: customInputBg }]}
                onPress={() => submitFeedback('Lourds')}
              >
                <Text style={styles.optionEmojiText}>🏋️</Text>
                <Text style={[styles.optionBtnLabel, { color: customText }]}>[ Lourds ]</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Saturés, gras ou poisseux</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Passer"
              onPress={closeFeedbackQuiz}
              variant="outline"
            />
          </View>
        </View>
      </Modal>

      {/* 🔬 POROSITY SELECTOR MODAL (Complete skipped porosity) */}
      <Modal
        visible={showPorosityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPorosityModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.feedbackCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <Text style={styles.feedbackEmoji}>🔬</Text>
            <Text style={[styles.feedbackTitle, { color: customText }]}>Définir ma porosité capillaire</Text>
            <Text style={[styles.feedbackSubtitle, { color: customTextSec, marginBottom: 12 }]}>
              La porosité détermine la capacité de votre cheveu à retenir l\'eau. Une fois définie, vos conseils seront pleinement personnalisés !
            </Text>

            {/* Educational Glass of Water Test Guide callout box */}
            <View style={{
              backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.03)',
              borderColor: isLight ? 'rgba(229, 169, 130, 0.25)' : 'rgba(229, 169, 130, 0.12)',
              borderWidth: 1.2,
              borderRadius: 16,
              padding: 14,
              marginBottom: 16,
              width: '100%',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary, marginBottom: 6 }}>
                🔬 Comment faire le test du verre d\'eau ?
              </Text>
              <Text style={{ fontSize: 11, color: customTextSec, lineHeight: 16 }}>
                1. Déposez un cheveu <Text style={{ fontWeight: '700', color: customText }}>propre et sec</Text> dans un verre d\'eau à température ambiante.{"\n"}
                2. Attendez 5 minutes et observez où se place le cheveu :{"\n"}
                • <Text style={{ fontWeight: '700', color: colors.porosityLow }}>Il reste en surface</Text> ➔ Porosité <Text style={{ fontWeight: '700', color: colors.porosityLow }}>Faible</Text> (écailles fermées){"\n"}
                • <Text style={{ fontWeight: '700', color: colors.porosityMedium }}>Il stagne au milieu</Text> ➔ Porosité <Text style={{ fontWeight: '700', color: colors.porosityMedium }}>Moyenne</Text> (équilibre idéal){"\n"}
                • <Text style={{ fontWeight: '700', color: colors.porosityHigh }}>Il coule tout au fond</Text> ➔ Porosité <Text style={{ fontWeight: '700', color: colors.porosityHigh }}>Forte</Text> (écailles très ouvertes)
              </Text>
            </View>

            <View style={styles.feedbackOptions}>
              {/* Low */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.porosityLow, backgroundColor: customInputBg }]}
                onPress={() => {
                  completePorosity('Faible');
                  setShowPorosityModal(false);
                }}
              >
                <View style={[styles.porosityIndicator, { backgroundColor: colors.porosityLow }]} />
                <Text style={[styles.optionBtnLabel, { color: customText }]}>Faible</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Les écailles sont très fermées</Text>
              </TouchableOpacity>

              {/* Medium */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.porosityMedium, backgroundColor: customInputBg }]}
                onPress={() => {
                  completePorosity('Moyenne');
                  setShowPorosityModal(false);
                }}
              >
                <View style={[styles.porosityIndicator, { backgroundColor: colors.porosityMedium }]} />
                <Text style={[styles.optionBtnLabel, { color: customText }]}>Moyenne</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Hydratation équilibrée idéale</Text>
              </TouchableOpacity>

              {/* High */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.porosityHigh, backgroundColor: customInputBg }]}
                onPress={() => {
                  completePorosity('Forte');
                  setShowPorosityModal(false);
                }}
              >
                <View style={[styles.porosityIndicator, { backgroundColor: colors.porosityHigh }]} />
                <Text style={[styles.optionBtnLabel, { color: customText }]}>Forte</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Les écailles sont très ouvertes</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Fermer"
              onPress={() => setShowPorosityModal(false)}
              variant="outline"
              style={styles.closeFeedbackBtn}
            />
          </View>
        </View>
      </Modal>

      {/* 📊 DETAILED HEALTH MODAL (Vue 4.2 Bilan de Santé) */}
      <Modal
        visible={showHealthDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHealthDetail(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: customText }]}>📊 Bilan Capillaire Détaillé</Text>
              <TouchableOpacity 
                style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                onPress={() => setShowHealthDetail(false)}
              >
                <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.detailSubtitle, { color: customTextSec }]}>
              Profil Actif : <Text style={styles.boldText}>{activeProfile.name}</Text>
            </Text>

            {/* Global circular representation */}
            <View style={styles.smallGaugeWrapper}>
              <View style={[styles.smallGaugeCircle, { borderColor: colors.primary, backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.03)' }]}>
                <Text style={[styles.smallGaugeScore, { color: customText }]}>{activeProfile.healthScore}%</Text>
                <Text style={[styles.smallGaugeLabel, { color: customTextSec }]}>Santé Globale</Text>
              </View>
            </View>

            {/* Horizontal sub-gauges: Hydration, Nutrition, Scalp */}
            <View style={styles.subGaugesContainer}>
              {/* Gauge 1: Hydratation */}
              <View style={styles.horizontalGaugeWrapper}>
                <View style={styles.gaugeLabelRow}>
                  <Text style={[styles.gaugeName, { color: customText }]}>💧 Hydratation</Text>
                  <Text style={[styles.gaugeVal, { color: customTextSec }]}>{activeProfile.hydration}%</Text>
                </View>
                <View style={[styles.gaugeTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                  <View style={[styles.gaugeFill, { width: `${activeProfile.hydration}%`, backgroundColor: '#5C858A' }]} />
                </View>
              </View>

              {/* Gauge 2: Nutrition / Force */}
              <View style={styles.horizontalGaugeWrapper}>
                <View style={styles.gaugeLabelRow}>
                  <Text style={[styles.gaugeName, { color: customText }]}>💪 Nutrition & Force</Text>
                  <Text style={[styles.gaugeVal, { color: customTextSec }]}>{activeProfile.nutrition}%</Text>
                </View>
                <View style={[styles.gaugeTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                  <View style={[styles.gaugeFill, { width: `${activeProfile.nutrition}%`, backgroundColor: colors.primary }]} />
                </View>
              </View>

              {/* Gauge 3: Cuir Chevelu */}
              <View style={styles.horizontalGaugeWrapper}>
                <View style={styles.gaugeLabelRow}>
                  <Text style={[styles.gaugeName, { color: customText }]}>🌱 Santé Cuir Chevelu</Text>
                  <Text style={[styles.gaugeVal, { color: customTextSec }]}>{activeProfile.scalp}%</Text>
                </View>
                <View style={[styles.gaugeTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                  <View style={[styles.gaugeFill, { width: `${activeProfile.scalp}%`, backgroundColor: colors.secondary }]} />
                </View>
              </View>
            </View>

            {/* Success SOS alert feedback */}
            {sosSuccessMessage ? (
              <View style={styles.sosAlertBox}>
                <Text style={styles.sosAlertText}>{sosSuccessMessage}</Text>
              </View>
            ) : null}

            {/* Conditional SOS Booster button if score < 40% */}
            {activeProfile.healthScore < 40 ? (
              <View style={styles.sosSection}>
                <View style={styles.sosWarningBox}>
                  <Text style={styles.sosWarningText}>
                    ⚠️ Note inférieure à 40% ! Vos cheveux ont besoin d'aide immédiate.
                  </Text>
                </View>
                <Button
                  title="🆘 Activer le SOS Booster 14J"
                  onPress={handleSosPress}
                  variant="danger"
                  style={styles.sosButton}
                />
              </View>
            ) : (
              <View style={[styles.sosHealthyBox, { backgroundColor: isLight ? 'rgba(92, 138, 107, 0.05)' : 'rgba(92, 138, 107, 0.06)', borderColor: isLight ? 'rgba(92, 138, 107, 0.15)' : 'rgba(92, 138, 107, 0.15)' }]}>
                <Text style={[styles.sosHealthyText, { color: customTextSec }]}>
                  ✨ Vos cheveux sont dans la zone de sécurité. Continuez votre routine pour maintenir cet équilibre !
                </Text>
              </View>
            )}

            <Button
              title="Fermer le bilan"
              onPress={() => setShowHealthDetail(false)}
              variant="secondary"
              style={styles.closeDetailBtn}
            />
          </View>
        </View>
      </Modal>

      {/* 🏆 POST-FEEDBACK CARE SUMMARY MODAL */}
      <Modal
        visible={showCareSummary}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCareSummary}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: customText }]}>🏆 Soin Enregistré !</Text>
              <TouchableOpacity 
                style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                onPress={closeCareSummary}
              >
                <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.detailSubtitle, { color: customTextSec, marginBottom: 12 }]}>
              Félicitations pour avoir complété votre routine capillaire.
            </Text>

            {/* Care details info card */}
            <View style={[styles.feedbackOptionItem, { borderColor: customBorder, backgroundColor: customInputBg, marginVertical: 8, paddingVertical: 14 }]}>
              <Text style={styles.optionEmojiText}>🧴</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionBtnLabel, { color: customText, width: '100%' }]}>
                  {lastValidatedCare?.category || 'Soin Quotidien'}
                </Text>
                <Text style={{ fontSize: 11, color: customTextSec, marginTop: 2 }}>
                  Validé le {lastValidatedCare?.date || todayStr}
                </Text>
              </View>
            </View>

            {/* Gauge Impact animated box */}
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <Text style={{ fontSize: 12, color: customTextSec, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' }}>
                Impact sur la Jauge :
              </Text>
              <Text style={{ 
                fontSize: 34, 
                fontWeight: '900', 
                color: lastFeedbackDelta >= 0 ? '#5C8A6B' : colors.danger,
                marginTop: 6 
              }}>
                {lastFeedbackDelta >= 0 ? `+${lastFeedbackDelta}` : lastFeedbackDelta} pts
              </Text>
              <Text style={{ fontSize: 11, color: customTextSec, marginTop: 4, fontWeight: '600' }}>
                {lastFeedbackReason}
              </Text>
            </View>

            {/* Dynamic Advice Message based on delta/reason */}
            <View style={{
              backgroundColor: lastFeedbackDelta >= 0 ? 'rgba(92, 138, 107, 0.06)' : 'rgba(217, 83, 79, 0.06)',
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: lastFeedbackDelta >= 0 ? 'rgba(92, 138, 107, 0.2)' : 'rgba(217, 83, 79, 0.2)',
              padding: 14,
              marginBottom: 16
            }}>
              <Text style={{
                color: lastFeedbackDelta >= 0 ? colors.secondary : colors.danger,
                fontWeight: '700',
                fontSize: 12,
                marginBottom: 4,
                textTransform: 'uppercase'
              }}>
                Conseil Immédiat :
              </Text>
              <Text style={{ fontSize: 12, color: customText, lineHeight: 18 }}>
                {lastFeedbackReason.includes('Secs') && 
                  "Tes cheveux manquent d'hydratation 💧 Pense à appliquer un soin sans rinçage après ton prochain lavage (ajouté à ton calendrier dans 2 jours !)"
                }
                {lastFeedbackReason.includes('Top') && 
                  "Parfait ! Tes cheveux adorent cette routine 🌿 Ton score de régularité progresse ! (+5 pts de santé)."
                }
                {lastFeedbackReason.includes('Lourds') && 
                  "Tes cheveux sont surchargés 😬 Réduis la quantité de produit. Une clarification légère peut aider (ajoutée à ton calendrier dans 5 jours !)"
                }
                {!lastFeedbackReason.includes('Secs') && !lastFeedbackReason.includes('Top') && !lastFeedbackReason.includes('Lourds') &&
                  "Routine complétée avec succès ! Prenez soin de vous au quotidien."
                }
              </Text>
            </View>

            {/* Next scheduled care reminder */}
            {(() => {
              const nextCare = routine
                .filter(r => r.profileId === activeProfile.id && !r.completed && r.date >= todayStr && r.date !== lastValidatedCare?.date)
                .sort((a, b) => a.date.localeCompare(b.date))[0];
              
              if (!nextCare) return null;

              return (
                <View style={{
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 16,
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: customTextSec }}>
                    Prochain soin : <Text style={{ color: colors.primary }}>{nextCare.category}</Text> le {nextCare.date}
                  </Text>
                </View>
              );
            })()}

            <Button
              title="Retour à l'accueil"
              onPress={closeCareSummary}
              variant="primary"
            />
          </View>
        </View>
      </Modal>

      {/* 📖 DETAILED CARE GUIDE MODAL (Priorité du jour cliquable) */}
      <Modal
        visible={showCareGuide}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCareGuide(false);
          setSelectedCareId('');
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.guideCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: customText, fontSize: 18 }]}>📖 Guide Pratique de Soin</Text>
              <TouchableOpacity 
                style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                onPress={() => {
                  setShowCareGuide(false);
                  setSelectedCareId('');
                }}
              >
                <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.guideScrollContent} showsVerticalScrollIndicator={false}>
              {/* Nom & Durée */}
              <View style={styles.guideTitleContainer}>
                <Text style={[styles.guideTitle, { color: colors.primary }]}>{currentGuide.title}</Text>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>⏱️ {currentGuide.duration}</Text>
                </View>
              </View>

              {/* Produits recommandés */}
              <View style={[styles.guideSectionBox, { backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.03)', borderColor: 'rgba(229, 169, 130, 0.15)' }]}>
                <Text style={styles.guideSectionHeader}>🧴 Produits recommandés pour toi :</Text>
                <Text style={[styles.guideSectionText, { color: customText }]}>
                  {currentGuide.products}
                </Text>
                <Text style={{ fontSize: 9.5, color: customTextSec, marginTop: 6, fontStyle: 'italic' }}>
                  *Personnalisé pour vos cheveux {activeProfile.diagnostic.texture} ({activeProfile.diagnostic.porosity || 'porosité non définie'}, épaisseur {activeProfile.diagnostic.thickness.toLowerCase()}).
                </Text>
              </View>

              {/* Individual Care Reminder Hour Picker Row */}
              {activeCareItem && (
                <View style={[styles.guideSectionBox, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)', borderColor: customBorder, marginTop: 4, marginBottom: 12 }]}>
                  <Text style={styles.guideSectionHeader}>⏰ Heure de rappel pour ce soin :</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text style={[styles.guideSectionText, { color: customText, fontWeight: '700', fontSize: 13 }]}>
                      ⏰ {activeCareItem.reminderTime || activeProfile.notifications.time || '08:30'}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setShowTimePicker(true)}
                      style={{ backgroundColor: 'rgba(229, 169, 130, 0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Personnaliser ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Étapes numérotées */}
              <View style={styles.stepsContainer}>
                <Text style={[styles.guideSubtitle, { color: customText }]}>👣 Étapes à suivre :</Text>
                {currentGuide.steps.map((step, idx) => (
                  <View key={idx} style={styles.stepItemRow}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={[styles.stepItemText, { color: customTextSec }]}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Erreurs à éviter */}
              <View style={[styles.guideSectionBox, { backgroundColor: 'rgba(217, 83, 79, 0.04)', borderColor: 'rgba(217, 83, 79, 0.15)', marginTop: 12 }]}>
                <Text style={[styles.guideSectionHeader, { color: colors.danger }]}>⚠️ Erreurs courantes à éviter :</Text>
                {currentGuide.mistakes.map((mistake, idx) => (
                  <Text key={idx} style={[styles.guideSectionText, { color: customText, marginBottom: 4 }]}>
                    • {mistake}
                  </Text>
                ))}
              </View>
            </ScrollView>

            {/* CTA complete care */}
            <View style={styles.guideActionRow}>
              <Button
                title={
                  activeCareItem
                    ? (activeCareItem.completed ? "Soin déjà enregistré" : "Enregistrer ce soin comme fait 🌿")
                    : "Aucun soin prévu"
                }
                onPress={() => {
                  if (activeCareItem) {
                    if (todayAction && activeCareItem.id === todayAction.id) {
                      completeTodayAction(activeCareItem.category);
                    } else {
                      toggleRoutineCompleted(activeCareItem.id);
                    }
                  }
                  setShowCareGuide(false);
                  setSelectedCareId('');
                }}
                disabled={!activeCareItem || activeCareItem.completed}
                variant="primary"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Fermer"
                onPress={() => {
                  setShowCareGuide(false);
                  setSelectedCareId('');
                }}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ⏰ INDIVIDUAL TIME PICKER OVERLAY */}
      {activeCareItem && (
        <TimePickerModal
          visible={showTimePicker}
          initialTime={activeCareItem.reminderTime || activeProfile.notifications.time || '08:30'}
          onClose={() => setShowTimePicker(false)}
          onSave={(time) => {
            updateRoutineItemTime(activeCareItem.id, time);
          }}
          title={`Heure du rappel : ${activeCareItem.category} ⏰`}
        />
      )}

      {/* 📚 ADVICE LIBRARY MODAL (Voir tous mes conseils) */}
      <Modal
        visible={showAllAdvice}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllAdvice(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.adviceLibraryCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: customText, fontSize: 18 }]}>📚 Bibliothèque de Conseils</Text>
              <TouchableOpacity 
                style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                onPress={() => {
                  setShowAllAdvice(false);
                  setSelectedArticleContent(null);
                }}
              >
                <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.detailSubtitle, { color: customTextSec, marginBottom: 12 }]}>
              Conseils ciblés pour vos cheveux <Text style={{ color: colors.primary, fontWeight: '700' }}>{activeProfile.diagnostic.texture}</Text> et profil.
            </Text>

            {/* Horizontal Tabs: Soins, Ingrédients, Problèmes fréquents, Tutos gestuels */}
            <View style={styles.tabsRow}>
              {(['Soins', 'Ingrédients', 'Problèmes fréquents', 'Tutos gestuels'] as const).map(tab => {
                const isSelected = activeAdviceTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => {
                      setActiveAdviceTab(tab);
                      setSelectedArticleContent(null);
                    }}
                    style={[
                      styles.tabItemButton,
                      isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                    ]}
                  >
                    <Text style={[
                      styles.tabItemText,
                      { color: isSelected ? colors.primary : customTextSec, fontWeight: isSelected ? '700' : '500' }
                    ]}>
                      {tab === 'Problèmes fréquents' ? 'Problèmes' : (tab === 'Tutos gestuels' ? 'Tutos' : tab)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Detailed Article Expanded view or list view */}
            {selectedArticleContent ? (
              <ScrollView contentContainerStyle={styles.articleDetailContainer} showsVerticalScrollIndicator={false}>
                <TouchableOpacity 
                  style={styles.backToLibraryBtn} 
                  onPress={() => setSelectedArticleContent(null)}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>◀ Retour aux articles</Text>
                </TouchableOpacity>

                <Text style={styles.articleDetailEmoji}>{selectedArticleContent.bgEmoji}</Text>
                <Text style={[styles.articleDetailTitle, { color: customText }]}>{selectedArticleContent.title}</Text>
                
                <View style={styles.tagPillRow}>
                  {selectedArticleContent.tags.map(t => {
                    const isMatched = activeTags.includes(t);
                    return (
                      <View 
                        key={t} 
                        style={[
                          styles.tagPill, 
                          { 
                            backgroundColor: isMatched ? 'rgba(229, 169, 130, 0.12)' : (isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)'),
                            borderColor: isMatched ? colors.primary : 'transparent',
                            borderWidth: isMatched ? 1 : 0
                          }
                        ]}
                      >
                        <Text style={[styles.tagPillText, { color: isMatched ? colors.primary : customTextSec }]}>#{t}</Text>
                      </View>
                    );
                  })}
                </View>

                <Text style={[styles.articleDetailBodyText, { color: customText, lineHeight: 22 }]}>
                  {selectedArticleContent.content}
                </Text>
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={styles.articlesListContainer} showsVerticalScrollIndicator={false}>
                {(() => {
                  const filtered = libraryArticles.filter(art => 
                    art.category === activeAdviceTab && 
                    art.tags.includes(activeProfile.diagnostic.texture)
                  );
                  if (filtered.length === 0) {
                    return (
                      <View style={styles.emptyArticlesBox}>
                        <Text style={[styles.emptyArticlesText, { color: customTextSec }]}>
                          Aucun conseil disponible pour cette catégorie dans vos critères capillaires actuels.
                        </Text>
                      </View>
                    );
                  }

                  return filtered.map(art => {
                    return (
                      <TouchableOpacity
                        key={art.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedArticleContent(art)}
                        style={[styles.libraryArticleItem, { backgroundColor: customInputBg, borderColor: customBorder }]}
                      >
                        <View style={styles.libraryArticleHeaderRow}>
                          <Text style={styles.libraryArticleEmoji}>{art.bgEmoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.libraryArticleTitle, { color: customText }]}>{art.title}</Text>
                            <Text style={[styles.libraryArticleSnippet, { color: customTextSec }]} numberOfLines={2}>
                              {art.snippet}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.libraryArticleFooterRow}>
                          <View style={styles.tagPillRow}>
                            {art.tags.slice(0, 3).map(t => {
                              const isMatched = activeTags.includes(t);
                              return (
                                <View 
                                  key={t} 
                                  style={[
                                    styles.tagPill, 
                                    { 
                                      backgroundColor: isMatched ? 'rgba(229, 169, 130, 0.12)' : 'transparent',
                                      borderColor: isMatched ? colors.primary : 'transparent',
                                      borderWidth: isMatched ? 1 : 0
                                    }
                                  ]}
                                >
                                  <Text style={[styles.tagPillText, { color: isMatched ? colors.primary : customTextSec, fontSize: 8.5 }]}>#{t}</Text>
                                </View>
                              );
                            })}
                            {art.tags.length > 3 && (
                              <Text style={{ fontSize: 9, color: customTextSec }}>+{art.tags.length - 3}</Text>
                            )}
                          </View>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>Lire ➔</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>
            )}

            <Button
              title="Fermer"
              onPress={() => {
                setShowAllAdvice(false);
                setSelectedArticleContent(null);
              }}
              variant="secondary"
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSelectorContainer: {
    borderBottomWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(22, 25, 42, 0.5)',
    paddingVertical: 12,
  },
  profileScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileAvatarWrapper: {
    width: 60,
    marginRight: 16,
    alignItems: 'center',
    opacity: 0.6,
  },
  profileAvatarWrapperActive: {
    opacity: 1,
  },
  profileAvatarEmoji: {
    fontSize: 32,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    textAlign: 'center',
    lineHeight: 52,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  // Re-declare custom styles to cleanly support border activation
  profileAvatarWrapperActiveBorder: {
    borderColor: colors.primary,
  },
  profileAvatarName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  profileAvatarNameActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  addProfileButton: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addProfileIcon: {
    fontSize: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    lineHeight: 52,
    color: colors.textSecondary,
  },
  addProfileLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  gaugeSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  gaugeHelpText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  logoutBtn: {
    alignSelf: 'center',
    marginTop: 32,
    padding: 10,
  },
  logoutText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  feedbackCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  feedbackEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  feedbackSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 16,
  },
  feedbackOptions: {
    width: '100%',
    marginBottom: 16,
  },
  feedbackOptionItem: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  optionEmojiText: {
    fontSize: 22,
    marginRight: 12,
  },
  optionBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    width: 80,
  },
  optionDescText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  closeFeedbackBtn: {
    width: '100%',
    marginTop: 6,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDetailIconText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  detailSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  boldText: {
    color: colors.primary,
    fontWeight: '700',
  },
  smallGaugeWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  smallGaugeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 130, 0.03)',
  },
  smallGaugeScore: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  smallGaugeLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  subGaugesContainer: {
    marginBottom: 20,
  },
  horizontalGaugeWrapper: {
    marginVertical: 10,
  },
  gaugeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gaugeName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  gaugeVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  gaugeTrack: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 5,
  },
  sosAlertBox: {
    backgroundColor: 'rgba(92, 138, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(92, 138, 107, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sosAlertText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  sosSection: {
    marginBottom: 16,
  },
  sosWarningBox: {
    backgroundColor: 'rgba(217, 83, 79, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(217, 83, 79, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  sosWarningText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  sosButton: {
    marginVertical: 0,
  },
  sosHealthyBox: {
    backgroundColor: 'rgba(92, 138, 107, 0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(92, 138, 107, 0.15)',
  },
  sosHealthyText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  closeDetailBtn: {
    marginTop: 6,
  },
  orangeBanner: {
    backgroundColor: '#FFE8D6',
    borderWidth: 1.5,
    borderColor: '#E29578',
    borderRadius: borderRadius.md,
    padding: 14,
    marginHorizontal: 24,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#E29578',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  orangeBannerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  orangeBannerTextWrapper: {
    flex: 1,
  },
  orangeBannerTitle: {
    color: '#A35C37',
    fontSize: 13,
    fontWeight: '800',
  },
  orangeBannerDesc: {
    color: '#684534',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    lineHeight: 15,
  },
  orangeBannerArrow: {
    color: '#A35C37',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  porosityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 16,
  },
  guideCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    height: '82%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  guideScrollContent: {
    paddingVertical: 12,
  },
  guideTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  durationBadge: {
    backgroundColor: 'rgba(92, 138, 107, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  durationText: {
    color: '#5C8A6B',
    fontSize: 11,
    fontWeight: '700',
  },
  guideSectionBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  guideSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  guideSectionText: {
    fontSize: 12,
    lineHeight: 18,
  },
  guideSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  stepsContainer: {
    marginBottom: 14,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepItemText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  guideActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  adviceLibraryCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    height: '82%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  tabItemButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  articlesListContainer: {
    paddingBottom: 16,
  },
  emptyArticlesBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArticlesText: {
    fontSize: 12,
    textAlign: 'center',
  },
  libraryArticleItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
  },
  libraryArticleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  libraryArticleEmoji: {
    fontSize: 26,
    marginRight: 12,
    marginTop: 2,
  },
  libraryArticleTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 17,
  },
  libraryArticleSnippet: {
    fontSize: 11,
    lineHeight: 15,
  },
  libraryArticleFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  articleDetailContainer: {
    paddingBottom: 24,
  },
  backToLibraryBtn: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  articleDetailEmoji: {
    fontSize: 48,
    alignSelf: 'center',
    marginVertical: 12,
  },
  articleDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  articleDetailBodyText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
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
  upcomingSection: {
    marginHorizontal: 24,
    marginVertical: 16,
  },
  upcomingSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  upcomingEmptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingEmptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  upcomingEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  upcomingEmptyDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  upcomingListWrapper: {
    width: '100%',
  },
  upcomingCareCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  upcomingCareEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  upcomingCareEmojiText: {
    fontSize: 22,
  },
  upcomingCareInfoWrapper: {
    flex: 1,
    marginRight: 10,
  },
  upcomingCareHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingCareTitleText: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  upcomingCareProductText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  upcomingCareFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  upcomingCareDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingCareDeleteButtonText: {
    fontSize: 14,
  },
  seeMoreUpcomingButton: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  seeMoreUpcomingText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  profileSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  selectorLogoWrapper: {
    paddingLeft: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(229, 169, 130, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    width: 90,
  },
  selectorLogoImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.5 }],
  },
});
