import { HUB_URL } from "@/const"

const msg = `
Diese Nutzungsbedingungen (im Folgenden als "Bedingungen" bezeichnet) legen die Bedingungen für die Nutzung des "Selection Command Hub" (im Folgenden als "Dienst" bezeichnet) fest, der vom Betreiber (im Folgenden als "wir" oder "uns" bezeichnet) bereitgestellt wird. Bitte lesen Sie diese Bedingungen sorgfältig durch, bevor Sie den Dienst nutzen. Durch die Nutzung des Dienstes gelten Sie als mit diesen Bedingungen einverstanden.

## 1. Anwendung
1. Diese Bedingungen gelten für alle Beziehungen zwischen uns und Nutzern bezüglich der Nutzung des Dienstes.
2. Alle von uns separat festgelegten Regeln oder Richtlinien bezüglich des Dienstes bilden einen Teil dieser Bedingungen.

## 2. Beschreibung des Dienstes
1. Der Dienst bezieht sich auf die Chrome-Erweiterung "Selection Command" und bietet folgende Funktionen:
   - Die Möglichkeit für Nutzer, Befehle zu veröffentlichen (im Folgenden als "Veröffentlichte Daten" bezeichnet).
   - Die Möglichkeit für Nutzer, von anderen Nutzern veröffentlichte Befehle anzusehen und abzurufen.
2. Veröffentlichte Daten umfassen folgende Informationen:
   - Den Titel einer Webseite.
   - Die URL einer Webseite.
   - Das Symbol einer Webseite.
   - Die Beschreibung und Klassifizierung eines Befehls.
   - Andere für die Anzeige einer Webseite erforderliche Informationen.
3. Der Dienst erfordert keine Benutzerregistrierung und kann anonym genutzt werden.

## 3. Verbotene Handlungen
Bei der Nutzung des Dienstes ist es Nutzern untersagt, folgende Aktivitäten durchzuführen:
- Handlungen, die gegen Gesetze oder die öffentliche Ordnung und Moral verstoßen.
- Handlungen, die die Rechte anderer verletzen (z.B. Urheberrechte, Markenrechte, Persönlichkeitsrechte).
- Bereitstellung falscher, ungenauer oder schädlicher Informationen als Veröffentlichte Daten.
- Handlungen, die dem Dienst oder anderen Nutzern Schaden zufügen.
- Alle anderen von uns als unangemessen erachteten Handlungen.

## 4. Umgang mit veröffentlichten Daten
1. Nutzer sind allein verantwortlich für ihre Veröffentlichten Daten. Sobald Daten veröffentlicht wurden, können sie nicht mehr geändert oder gelöscht werden. Bitte seien Sie daher vorsichtig beim Veröffentlichen von Inhalten.
2. Wir behalten uns das Recht vor, Veröffentlichte Daten bei Bedarf zu löschen oder privat zu machen, sind dazu jedoch nicht verpflichtet.
3. Wenn Dritte Ansprüche auf Rechteverletzung bezüglich Veröffentlichter Daten erheben, können wir solche Daten nach eigenem Ermessen ändern oder löschen.
4. Unbefugte Vervielfältigung, Duplizierung oder Nutzung Veröffentlichter Daten oder eines Teils des Dienstes für andere Zwecke als die Nutzung des Dienstes ist untersagt.

## 5. Geistige Eigentumsrechte und Nutzungsgenehmigungen
1. Alle geistigen Eigentumsrechte im Zusammenhang mit dem Dienst gehören uns oder den rechtmäßigen Eigentümern.
2. Nutzer behalten das Eigentum an ihren Veröffentlichten Daten, gelten jedoch als Einwilligung zur Nutzung durch andere unter folgenden Umständen:
   - Andere Nutzer können Veröffentlichte Daten im Rahmen des Dienstes ansehen, abrufen, nutzen, bearbeiten und weiterverbreiten.
   - Wir können Veröffentlichte Daten nach Bedarf für den Betrieb des Dienstes nutzen, veröffentlichen, bearbeiten und verbreiten.

## 6. Haftungsausschluss
1. Wir garantieren nicht, dass der Dienst bestimmten Zwecken dient, Nutzen bietet oder für Nutzer sicher ist.
2. Wir haften nicht für Schäden oder Streitigkeiten, die sich aus Veröffentlichten Daten oder deren Inhalt ergeben.
3. Wir haften auch nicht für Schäden, die durch Unterbrechungen oder Beendigung des Dienstes entstehen.

## 7. Datenschutzrichtlinie
1. Der Umgang mit personenbezogenen Daten und Cookies im Zusammenhang mit der Nutzung dieses Dienstes unterliegt der von uns separat festgelegten Datenschutzrichtlinie.
2. Einzelheiten finden Sie auf der folgenden Seite:
   - [Datenschutzrichtlinie](${HUB_URL}/de/privacy)

## 8. Aussetzung und Einschränkungen
1. Wenn ein Nutzer gegen diese Bedingungen verstößt, können wir den Zugriff auf oder die Nutzung des Dienstes ohne vorherige Ankündigung einschränken oder aussetzen.

## 9. Änderungen und Beendigung
1. Wir behalten uns das Recht vor, diese Bedingungen und/oder den Inhalt des Dienstes ohne vorherige Ankündigung zu ändern oder zu beenden.
2. Die fortgesetzte Nutzung des Dienstes nach Änderungen gilt als Annahme der neuen Bedingungen.

## 10. Support-Kontakt
Für Anfragen oder Support-Anfragen bezüglich dieses Dienstes kontaktieren Sie uns bitte über:
- [Chrome Web Store Support-Seite](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

## 11. Geltendes Recht und Gerichtsstand
1. Diese Bedingungen unterliegen dem japanischen Recht.
2. Im Falle von Streitigkeiten aus diesen Bedingungen oder dem Dienst liegt die ausschließliche Zuständigkeit bei Gerichten in Japan.

Gültig ab 01/10/2025
`
export default msg
