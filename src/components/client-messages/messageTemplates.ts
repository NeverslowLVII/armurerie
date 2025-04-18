/**
 * Templates de messages pour la communication client
 *
 * Ce fichier contient tous les templates et formulations utilisés
 * pour générer des messages personnalisés pour les clients.
 */

export interface MessageSections {
  intro: string;
  body: string;
  recommendation: string;
  closing: string;
}

export interface MessageTemplateConfig {
  id: string;
  name: string;
  template: (data: MessageTemplateData) => MessageSections;
}

export interface MessageTemplateData {
  uniqueWeapons: string[];
  formattedTotal: string;
  purchaseCount: number;
  daysSinceLastPurchase: number;
  recommendations: string[];
}

// Salutations possibles pour les messages - strictement neutres
export const SALUTATIONS = [
  (name: string) => `${name},`,
  (name: string) => `Bonjour ${name},`,
  (name: string) => `Salutations distinguées ${name},`,
  (name: string) => `Bien le bonjour ${name},`,
  (name: string) => `À l'attention de ${name},`,
];

// Formules de politesse pour la fin des messages
export const FORMULES_POLITESSE = [
  'Avec mes salutations distinguées,',
  'Bien à vous,',
  'Au plaisir de vous revoir bientôt à Saint-Denis,',
  'Avec ma plus sincère considération,',
  "Dans l'attente du plaisir de vous accueillir à nouveau,",
];

// Templates de messages disponibles
export const MESSAGE_TEMPLATES: MessageTemplateConfig[] = [
  {
    id: 'standard',
    name: 'Standard',
    template: (data: MessageTemplateData): MessageSections => ({
      intro: `Votre satisfaction demeure la priorité absolue de notre établissement, qui sert fièrement la ville de Saint-Denis depuis près de vingt années.`,
      body:
        data.uniqueWeapons.length > 0
          ? `Le ${data.uniqueWeapons[0]} que vous avez choisi fait la fierté de notre collection et procure généralement une grande satisfaction à sa possession. Cette arme est particulièrement renommée pour sa fiabilité exemplaire, même par temps humide comme nous en connaissons souvent dans notre belle région de Lemoyne.`
          : `Espérons que les armes acquises dans notre boutique vous apportent toujours pleine satisfaction et tranquillité d'esprit lors de vos déplacements. Les routes entre Saint-Denis et Valentine comportant leurs dangers, un équipement fiable reste indispensable pour tout voyage serein.`,
      recommendation:
        data.recommendations.length > 0
          ? `Une nouvelle cargaison vient tout juste d'arriver dans notre établissement. Parmi ces pièces de choix figurent ${data.recommendations[0]}.`
          : `Plusieurs modèles de grande qualité viennent d'enrichir notre collection et pourraient retenir votre attention. Notre dernière livraison, en provenance directe des prestigieux ateliers de New York, comprend des pièces à la finition remarquable.`,
      closing: `Lors de votre prochaine visite en ville, notre boutique vous accueillera avec plaisir. Un verre de notre fameux whisky de Bayou vous sera offert selon la tradition de notre maison, tandis que vous pourrez admirer ces nouvelles merveilles d'armurerie.`,
    }),
  },
  {
    id: 'relance',
    name: 'Relance',
    template: (data: MessageTemplateData): MessageSections => ({
      intro: `Voilà maintenant ${data.daysSinceLastPurchase} jours que notre établissement n'a pas eu l'honneur de votre visite. Les rues de Saint-Denis semblent moins animées sans votre présence régulière.`,
      body: `Les registres de notre armurerie font état d'un montant total de ${data.formattedTotal} pour l'acquisition de ${data.purchaseCount} armes dans notre boutique. Cette fidélité mérite d'être soulignée, et chaque échange avec vous reste dans nos mémoires comme un moment des plus agréables.`,
      recommendation:
        data.recommendations.length > 0
          ? `Vous pourriez trouver un intérêt particulier pour ${data.recommendations[0]} récemment arrivé dans nos rayons. Ces pièces d'exception ont été sélectionnées avec le plus grand soin.`
          : `De nouvelles pièces attendent patiemment dans nos vitrines fraîchement astiquées. Chaque arme a été minutieusement inspectée et certaines évoquent immédiatement vos précédents choix.`,
      closing: `Votre présence serait particulièrement appréciée dans notre boutique de la rue principale. Comme toujours, le café sera chaud et le whisky parfaitement frais, prêts à vous être servis comme vous l'appréciez.`,
    }),
  },
  {
    id: 'promo',
    name: 'Promotion',
    template: (data: MessageTemplateData): MessageSections => ({
      intro: `Après ${data.purchaseCount} acquisitions réalisées dans notre établissement, votre fidélité mérite d'être honorée comme il se doit. Cette confiance accordée à notre maison nous touche profondément.`,
      body: `En témoignage de notre gratitude, notre établissement souhaite vous faire bénéficier d'une réduction exceptionnelle de 10% sur votre prochain achat. Cette remise s'appliquera à l'ensemble de notre catalogue, incluant nos nouvelles pièces importées des meilleurs ateliers américains et européens.`,
      recommendation: `Cette offre restera valable uniquement jusqu'à dimanche prochain, au coucher du soleil. Notre récente cargaison comprend des modèles rares que vous serez parmi les premiers à pouvoir contempler.`,
      closing: `Nous espérons vous voir bientôt pour profiter de cette opportunité. Un accueil chaleureux vous sera réservé, et nous nous ferons un plaisir de vous présenter nos dernières acquisitions autour d'un verre de notre bourbon de réserve spéciale.`,
    }),
  },
  {
    id: 'remerciement',
    name: 'Remerciement',
    template: (data: MessageTemplateData): MessageSections => ({
      intro: `Par la présente lettre, permettez l'expression de notre plus sincère gratitude pour la confiance accordée à notre modeste établissement au fil des années.`,
      body: `Avec ${data.purchaseCount} armes acquises pour un montant total de ${data.formattedTotal}, votre contribution à la renommée et à la prospérité de notre commerce est véritablement inestimable. Chaque visite représente un honneur et un plaisir pour toute notre équipe.`,
      recommendation:
        data.recommendations.length > 0
          ? `Au fil du temps, nous avons eu le privilège d'observer vos goûts et préférences. Quelques pièces ont été spécialement réservées qui pourraient vous intéresser. En particulier, ${data.recommendations[0]} semble correspondre parfaitement à vos critères exigeants.`
          : `Des modèles exceptionnels viennent tout juste d'arriver par le train de la semaine dernière, évoquant immédiatement vos préférences habituelles. La finition de ces pièces est véritablement remarquable.`,
      closing: `Votre prochaine visite dans notre boutique sera un moment attendu avec impatience. Comme toujours, votre verre de bienvenue vous attend, fidèle à nos traditions d'accueil.`,
    }),
  },
];

// Fonction pour obtenir un template de message par son ID
export const getMessageTemplateById = (id: string): MessageTemplateConfig => {
  return MESSAGE_TEMPLATES.find(template => template.id === id) || MESSAGE_TEMPLATES[0];
};

// Fonction pour obtenir une salutation aléatoire
export const getRandomSalutation = (name: string): string => {
  const randomIndex = Math.floor(Math.random() * SALUTATIONS.length);
  return SALUTATIONS[randomIndex](name);
};

// Fonction pour obtenir une formule de politesse aléatoire
export const getRandomFormulePolitesse = (): string => {
  const randomIndex = Math.floor(Math.random() * FORMULES_POLITESSE.length);
  return FORMULES_POLITESSE[randomIndex];
};
