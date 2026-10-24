// Ordres envoyés par le backend aux postes (docs/mqtt.md, section 4).
// Tous les ordres sont "retained" : une carte qui redémarre reçoit tout de suite le dernier état.

function publier(client, topic, valeur, qos) {
  const message = JSON.stringify({ valeur });
  client.publish(topic, message, { qos, retain: true }, (err) => {
    if (err) console.error(`[MQTT] Publication impossible sur ${topic} :`, err.message);
  });
}

// LED d'un poste : "on" / "off" pour l'Acte 1 (QoS 1)
function publierLed(client, acte, numero, valeur) {
  publier(client, `datamonstre/acte${acte}/led/${numero}`, valeur, 1);
}

// Niveau du bargraph, entier de 0 à 10 (QoS 0 : un message perdu est remplacé par le suivant)
function publierBargraph(client, niveau) {
  publier(client, 'datamonstre/acte1/bargraph', niveau, 0);
}

// État du jeu : statut ("attente", "en_cours", "victoire", "defaite") et acte courant (QoS 1)
function publierEtatJeu(client, statut, acte) {
  publier(client, 'datamonstre/jeu/etat', { statut, acte }, 1);
}

module.exports = { publierLed, publierBargraph, publierEtatJeu };
