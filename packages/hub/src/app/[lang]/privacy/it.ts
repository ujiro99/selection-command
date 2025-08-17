import { HUB_URL } from "@/const"

const msg = `
Questa Informativa sulla Privacy descrive come le informazioni degli utenti vengono gestite all'interno di Selection Command Hub (di seguito denominato "il Servizio"). Utilizzando il Servizio, si considera che l'utente abbia accettato questa Informativa sulla Privacy.

## **1. Informazioni Raccolte**

Il Servizio raccoglie i seguenti tipi di informazioni:

### **1-1. Informazioni sui Comandi Pubblicate dagli Utenti**
Il Servizio raccoglie informazioni sui comandi pubblicate dagli utenti (ad esempio, nomi dei comandi, URL, descrizioni).  
Per i dettagli sulle impostazioni, consultare i [Termini di Servizio](${HUB_URL}/it/terms).  
*Nota: Queste informazioni vengono utilizzate solo quando gli utenti pubblicano o recuperano dati all'interno del Servizio.*

### **1-2. Dati di Utilizzo**
Il Servizio utilizza Google Analytics per raccogliere dati di utilizzo anonimizzati. Questi dati includono:
- Cronologia delle interazioni (ad esempio, transizioni di pagina, posizioni e conteggi dei clic)
- Informazioni sul dispositivo (ad esempio, tipo di browser, sistema operativo)
- Timestamp di accesso
- Indirizzi IP di origine (elaborati per l'anonimizzazione)
- Altri dati statistici anonimizzati forniti da Google Analytics

### **1-3. Raccolta di Informazioni Personali**
Poiché il Servizio non fornisce funzionalità di registrazione o accesso utente, non raccoglie alcuna informazione personale identificabile (ad esempio, nomi, indirizzi email, indirizzi fisici).

## **2. Scopo dell'Utilizzo delle Informazioni**

Le informazioni raccolte vengono utilizzate per i seguenti scopi:
1. Analizzare e migliorare l'utilizzo del Servizio
2. Fornire le funzionalità necessarie per il funzionamento del Servizio

## **3. Gestione delle Informazioni**

Il Servizio gestisce adeguatamente le informazioni raccolte per prevenire accessi non autorizzati o violazioni dei dati. I dati raccolti tramite Google Analytics sono gestiti in conformità con l'[Informativa sulla Privacy di Google](https://www.google.com/analytics/terms/us.html).

## **4. Fornitura a Terze Parti**

Il Servizio non fornisce le informazioni raccolte a terze parti, tranne quando richiesto dalla legge. Tuttavia, i dati raccolti tramite Google Analytics sono elaborati da Google.

## **5. Utilizzo dei Cookie**

Il Servizio utilizza i cookie tramite Google Analytics. I cookie vengono memorizzati nei browser degli utenti e vengono utilizzati per migliorare la funzionalità e analizzare il comportamento degli utenti all'interno del Servizio. Gli utenti possono disabilitare i cookie tramite le impostazioni del loro browser; tuttavia, alcune funzionalità potrebbero non funzionare correttamente come conseguenza.

## **6. Modifiche all'Informativa sulla Privacy**

Questa Informativa sulla Privacy può essere aggiornata secondo necessità. La politica rivista entrerà in vigore dopo la pubblicazione su questa pagina.

## **7. Informazioni di Contatto**

Per domande riguardanti questa Informativa sulla Privacy, contattarci tramite:
- [Pagina di Supporto di Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

In vigore dal 01/10/2025
`
export default msg
