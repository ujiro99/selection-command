import { HUB_URL } from '@/const'

const msg = `
Diese Datenschutzerklärung beschreibt, wie Benutzerinformationen innerhalb des Selection Command Hub (im Folgenden als "der Dienst" bezeichnet) behandelt werden. Durch die Nutzung des Dienstes erklären Sie sich mit dieser Datenschutzerklärung einverstanden.

## **1. Erfasste Informationen**

Der Dienst erfasst folgende Arten von Informationen:

### **1-1. Von Benutzern gepostete Befehlsinformationen**
Der Dienst erfasst Befehlsinformationen, die von Benutzern gepostet werden (z.B. Befehlsnamen, URLs, Beschreibungen).  
Einzelheiten zu den Einstellungen finden Sie in den [Nutzungsbedingungen](${HUB_URL}/de/terms).  
*Hinweis: Diese Informationen werden nur verwendet, wenn Benutzer Daten innerhalb des Dienstes posten oder abrufen.*

### **1-2. Nutzungsdaten**
Der Dienst verwendet Google Analytics, um anonymisierte Nutzungsdaten zu sammeln. Diese Daten umfassen:
- Interaktionshistorie (z.B. Seitenübergänge, Klickpositionen und -anzahlen)
- Geräteinformationen (z.B. Browsertyp, Betriebssystem)
- Zugriffszeitstempel
- Quell-IP-Adressen (anonymisiert verarbeitet)
- Weitere anonymisierte statistische Daten von Google Analytics

### **1-3. Erfassung personenbezogener Daten**
Da der Dienst keine Benutzerregistrierung oder Anmeldung bietet, werden keine personenbezogenen Daten (z.B. Namen, E-Mail-Adressen, physische Adressen) erfasst.

## **2. Zweck der Informationsnutzung**

Die gesammelten Informationen werden für folgende Zwecke verwendet:
1. Analyse und Verbesserung der Nutzung des Dienstes
2. Bereitstellung notwendiger Funktionen für den Betrieb des Dienstes

## **3. Informationsverwaltung**

Der Dienst verwaltet die gesammelten Informationen angemessen, um unbefugten Zugriff oder Datenverletzungen zu verhindern. Über Google Analytics gesammelte Daten werden gemäß der [Google-Datenschutzerklärung](https://www.google.com/analytics/terms/us.html) verwaltet.

## **4. Weitergabe an Dritte**

Der Dienst gibt gesammelte Informationen nicht an Dritte weiter, es sei denn, dies ist gesetzlich erforderlich. Daten, die über Google Analytics gesammelt werden, werden jedoch von Google verarbeitet.

## **5. Verwendung von Cookies**

Der Dienst verwendet Cookies über Google Analytics. Cookies werden in den Browsern der Benutzer gespeichert und dienen zur Verbesserung der Funktionalität und Analyse des Benutzerverhaltens innerhalb des Dienstes. Benutzer können Cookies über ihre Browsereinstellungen deaktivieren; einige Funktionen funktionieren dann möglicherweise nicht mehr ordnungsgemäß.

## **6. Änderungen der Datenschutzerklärung**

Diese Datenschutzerklärung kann bei Bedarf aktualisiert werden. Die überarbeitete Richtlinie tritt mit der Veröffentlichung auf dieser Seite in Kraft.

## **7. Kontaktinformationen**

Bei Fragen zu dieser Datenschutzerklärung kontaktieren Sie uns bitte über:
- [Chrome Web Store Support-Seite](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

Gültig ab 01/10/2025
`
export default msg
