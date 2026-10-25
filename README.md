# Website sebastianoelmann.de

Persönliche Website mit Blog. Die Seiten entstehen aus einfachen Textdateien im Ordner `src/`; daraus baut das Werkzeug Eleventy die fertige Website in `_site/`. GitHub Pages veröffentlicht sie automatisch bei jeder Änderung auf dem Hauptzweig.

## Einen Blogbeitrag schreiben

**Im Browser:** `https://sebastianoelmann.de/admin/` öffnen, mit dem GitHub-Zugangsschlüssel anmelden, „Blogbeiträge“ → „Neu“. Speichern veröffentlicht den Beitrag; nach ein bis zwei Minuten ist er online. Haken bei „Entwurf“ setzen, wenn der Beitrag noch nicht erscheinen soll.

**Als Datei:** Neue Datei `src/posts/JJJJ-MM-TT-kurzer-titel.md` anlegen:

```
---
title: Überschrift des Beitrags
description: Ein bis zwei Sätze als Anriss in der Liste.
bild: /assets/img/blog/bildname.jpg
---
Hier beginnt der Text. Absätze durch Leerzeilen trennen,
**fett** mit zwei Sternchen, Links so: [Text](https://…).
```

Das Datum kommt aus dem Dateinamen, die Adresse des Beitrags aus dem Rest (`/blog/kurzer-titel/`). Bilder in `src/assets/img/blog/` ablegen.

## Feste Angaben ändern

`src/_data/site.json`: Name, Untertitel im Titelbild, E-Mail-Adresse, Anbieterangaben für Impressum und Datenschutz, Menüpunkte. `src/ueber-mich.md`, `src/impressum.md`, `src/datenschutz.md` und `src/teamup/` sind normale Textseiten.

## Lokal ansehen

```
npm install
npm run dev
```

Dann `http://localhost:8080` im Browser öffnen.

## SCORM-Packer

Die Seite `/scorm-packer/` liegt in `src/scorm-packer/index.njk` (Oberfläche im Website-Layout); die Logik steht unverändert in `src/assets/js/scorm-packer.js` (Abschnitte ZIPLIB und CORE wie in der Übergabe des Workshops). `src/scorm-packer/SCORM-Packer.html` ist die Einzeldatei für die Offline-Nutzung und wird nur kopiert.

## Bilder

Das Titelbild liegt als `src/assets/img/hero.jpg` (für das Web verkleinert). Die Originale aus Higgsfield und die nicht verwendeten Alternativen liegen in `bilder/titelbild/`; dieser Ordner wird nicht mit veröffentlicht.

## Veröffentlichen

Änderungen mit Git auf den Zweig `main` schieben. Der Ablauf in `.github/workflows/deploy.yml` baut die Seite und stellt sie über GitHub Pages bereit. Die eigene Domain wird in den GitHub-Einstellungen unter Pages → „Custom domain“ eingetragen.

## Domain einrichten (einmalig)

Bei INWX unter „Nameserver“ für `sebastianoelmann.de` diese Einträge anlegen (bestehende A- oder AAAA-Einträge für die nackte Domain vorher löschen):

| Typ | Name | Wert |
| --- | --- | --- |
| A | (leer / @) | 185.199.108.153 |
| A | (leer / @) | 185.199.109.153 |
| A | (leer / @) | 185.199.110.153 |
| A | (leer / @) | 185.199.111.153 |
| CNAME | www | sebolic-vader.github.io |

Danach auf GitHub unter Settings → Pages → „Custom domain“ `sebastianoelmann.de` eintragen, speichern, und nach der Prüfung „Enforce HTTPS“ anhaken. Erledigt am 21. Oktober 2026.
