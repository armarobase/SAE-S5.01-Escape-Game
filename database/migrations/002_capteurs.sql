-- Capteurs du contrat MQTT (docs/mqtt.md §3). Modifier ici si le contrat change.
INSERT INTO capteur (topic, type, acte) VALUES
    ('datamonstre/acte1/badge',    'rfid',     1),
    ('datamonstre/acte1/bouton/1', 'bouton',   1),
    ('datamonstre/acte1/bouton/2', 'bouton',   1),
    ('datamonstre/acte1/bouton/3', 'bouton',   1),
    ('datamonstre/acte1/slider',   'slider',   1),
    ('datamonstre/acte1/lumiere',  'lumiere',  1),
    ('datamonstre/acte2/presence', 'presence', 2),
    ('datamonstre/acte3/port/1',   'port',     3),
    ('datamonstre/acte3/port/2',   'port',     3),
    ('datamonstre/acte3/port/3',   'port',     3),
    ('datamonstre/acte3/port/4',   'port',     3),
    ('datamonstre/acte4/code',     'clavier',  4);
