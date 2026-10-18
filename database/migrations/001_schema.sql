-- Schéma de la base Data-Monstre (GDD §4.2 : Session, Enigme, Capteur, Evenement, FragmentCode, Score)
-- Exécuté automatiquement par le conteneur postgres au premier démarrage (volume pgdata vide).
-- Pour repartir de zéro : docker compose down -v && docker compose up -d

CREATE TABLE session (
    id            SERIAL PRIMARY KEY,
    statut        TEXT        NOT NULL DEFAULT 'attente'
                  CHECK (statut IN ('attente', 'en_cours', 'victoire', 'defaite')),
    acte_courant  SMALLINT    NOT NULL DEFAULT 1 CHECK (acte_courant BETWEEN 1 AND 4),
    jauge         SMALLINT    NOT NULL DEFAULT 0 CHECK (jauge BETWEEN 0 AND 100),
    duree_limite_s INTEGER    NOT NULL DEFAULT 1800 CHECK (duree_limite_s > 0),
    nb_erreurs    INTEGER     NOT NULL DEFAULT 0 CHECK (nb_erreurs >= 0),
    cree_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    debut_le      TIMESTAMPTZ,
    fin_le        TIMESTAMPTZ
);

-- Une énigme par session : machine à états verrouillée -> active -> résolue
CREATE TABLE enigme (
    id          SERIAL PRIMARY KEY,
    session_id  INTEGER  NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    acte        SMALLINT NOT NULL CHECK (acte BETWEEN 1 AND 4),
    code        TEXT     NOT NULL,   -- identifiant stable, ex. 'acte1_badge'
    nom         TEXT     NOT NULL,
    etat        TEXT     NOT NULL DEFAULT 'verrouillee'
                CHECK (etat IN ('verrouillee', 'active', 'resolue')),
    resolue_le  TIMESTAMPTZ,
    UNIQUE (session_id, code)
);

-- Un capteur ou actionneur par topic MQTT (valeurs partagées par toutes les sessions)
CREATE TABLE capteur (
    id             SERIAL PRIMARY KEY,
    topic          TEXT     NOT NULL UNIQUE,
    type           TEXT     NOT NULL,   -- rfid, bouton, slider, lumiere, presence, port, clavier
    acte           SMALLINT NOT NULL CHECK (acte BETWEEN 1 AND 4),
    derniere_valeur JSONB,
    derniere_maj   TIMESTAMPTZ
);

-- Journal horodaté de la partie (messages MQTT, changements d'état, erreurs...)
CREATE TABLE evenement (
    id          BIGSERIAL PRIMARY KEY,
    session_id  INTEGER REFERENCES session(id) ON DELETE CASCADE,
    capteur_id  INTEGER REFERENCES capteur(id) ON DELETE SET NULL,
    type        TEXT  NOT NULL,         -- ex. 'mqtt', 'enigme_resolue', 'erreur_code'
    message     TEXT,
    donnees     JSONB,
    cree_le     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX evenement_session_idx ON evenement (session_id, cree_le);

-- Fragment du code final obtenu à la fin d'un acte (réutilisé à l'Acte 4)
CREATE TABLE fragment_code (
    id                SERIAL PRIMARY KEY,
    session_id        INTEGER  NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    acte              SMALLINT NOT NULL CHECK (acte BETWEEN 1 AND 3),
    valeur            TEXT     NOT NULL,
    ordre_assemblage  SMALLINT NOT NULL CHECK (ordre_assemblage BETWEEN 1 AND 3),
    brouille          BOOLEAN  NOT NULL DEFAULT FALSE,   -- le monstre a brouillé ce fragment (Acte 4)
    collecte_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, acte),
    UNIQUE (session_id, ordre_assemblage)
);

-- Résultat final d'une partie terminée
CREATE TABLE score (
    id           SERIAL PRIMARY KEY,
    session_id   INTEGER NOT NULL UNIQUE REFERENCES session(id) ON DELETE CASCADE,
    temps_s      INTEGER NOT NULL CHECK (temps_s >= 0),
    nb_erreurs   INTEGER NOT NULL CHECK (nb_erreurs >= 0),
    jauge_finale SMALLINT NOT NULL CHECK (jauge_finale BETWEEN 0 AND 100),
    victoire     BOOLEAN NOT NULL,
    points       INTEGER NOT NULL,
    cree_le      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Une seule partie en cours à la fois : les messages MQTT ne portent pas d'identifiant de session
CREATE UNIQUE INDEX session_une_seule_en_cours ON session ((true)) WHERE statut = 'en_cours';
