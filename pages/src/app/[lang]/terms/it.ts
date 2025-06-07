import { HUB_URL } from '@/const'

const msg = `
Questi Termini di Servizio (di seguito "Termini") stabiliscono le condizioni per l'utilizzo dell'"Selection Command Hub" (di seguito "Servizio") fornito dall'Operatore (di seguito "noi"). Si prega di leggere attentamente questi Termini prima di utilizzare il Servizio. Utilizzando il Servizio, si considera che abbiate accettato questi Termini.

## 1. Applicazione
1. Questi Termini si applicano a tutte le relazioni tra noi e gli utenti riguardo all'utilizzo del Servizio.
2. Qualsiasi regola o linea guida stabilita separatamente da noi riguardo al Servizio costituirà parte di questi Termini.

## 2. Descrizione del Servizio
1. Il Servizio è relativo all'estensione Chrome "Selection Command" e fornisce le seguenti funzionalità:
   - La possibilità per gli utenti di pubblicare comandi (di seguito "Dati Pubblicati").
   - La possibilità per gli utenti di visualizzare e recuperare comandi pubblicati da altri utenti.
2. I Dati Pubblicati includono le seguenti informazioni:
   - Il titolo di una pagina web.
   - L'URL di una pagina web.
   - L'icona di una pagina web.
   - La descrizione e la classificazione di un comando.
   - Altre informazioni necessarie per visualizzare una pagina web.
3. Il Servizio non richiede registrazione utente e può essere utilizzato in modo anonimo.

## 3. Condotte Vietate
Gli utenti sono vietati di impegnarsi nelle seguenti attività durante l'utilizzo del Servizio:
- Atti che violano le leggi o l'ordine pubblico e la morale.
- Atti che violano i diritti di altri (ad esempio, diritti d'autore, marchi registrati, diritti alla privacy).
- Fornire informazioni false, inaccurate o dannose come Dati Pubblicati.
- Atti che causano danni al Servizio o ad altri utenti.
- Qualsiasi altro atto che riteniamo inappropriato.

## 4. Gestione dei Dati Pubblicati
1. Gli utenti sono i soli responsabili dei loro Dati Pubblicati. Una volta che i Dati Pubblicati sono stati inviati, non possono essere modificati o eliminati, quindi si prega di prestare attenzione quando si pubblica contenuto.
2. Ci riserviamo il diritto di eliminare o rendere privati i Dati Pubblicati se necessario, ma non siamo obbligati a farlo.
3. Se una terza parte presenta reclami per violazione dei diritti riguardo ai Dati Pubblicati, possiamo modificare o eliminare tali dati a nostra discrezione.
4. È vietata la riproduzione, duplicazione o utilizzo non autorizzato dei Dati Pubblicati o di qualsiasi parte del Servizio per scopi diversi dall'utilizzo del Servizio.

## 5. Diritti di Proprietà Intellettuale e Permessi di Utilizzo
1. Tutti i diritti di proprietà intellettuale relativi al Servizio appartengono a noi o ai legittimi proprietari.
2. Gli utenti mantengono la proprietà dei loro Dati Pubblicati ma si considerano aver concesso il permesso per l'utilizzo da parte di altri nelle seguenti circostanze:
   - Altri utenti possono visualizzare, recuperare, utilizzare, modificare e ridistribuire i Dati Pubblicati nell'ambito del Servizio.
   - Possiamo utilizzare, pubblicare, modificare e distribuire i Dati Pubblicati secondo necessità per operare il Servizio.

## 6. Esclusione di Responsabilità
1. Non garantiamo che il Servizio soddisfi scopi specifici, fornisca utilità o assicuri sicurezza per gli utenti.
2. Non siamo responsabili per danni o controversie derivanti dai Dati Pubblicati o dal loro contenuto.
3. Non siamo inoltre responsabili per danni derivanti da interruzioni o terminazione del Servizio.

## 7. Informativa sulla Privacy
1. Il trattamento delle informazioni personali e dei cookie relativi all'utilizzo di questo servizio sarà regolato dall'Informativa sulla Privacy stabilita separatamente da noi.
2. Per i dettagli, si prega di consultare la seguente pagina:
   - [Informativa sulla Privacy](${HUB_URL}/it/privacy)

## 8. Sospensione e Restrizioni
1. Se un utente viola questi Termini, possiamo limitare l'accesso o sospendere l'utilizzo del Servizio senza preavviso.

## 9. Modifiche e Terminazione
1. Ci riserviamo il diritto di modificare o terminare questi Termini e/o il contenuto del Servizio senza preavviso.
2. L'utilizzo continuato del Servizio dopo che sono state apportate modifiche costituisce accettazione dei nuovi Termini.

## 10. Contatto Supporto
Per domande o richieste di supporto relative a questo Servizio, si prega di contattarci tramite:
- [Pagina di Supporto Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

## 11. Legge Applicabile e Giurisdizione
1. Questi Termini saranno regolati dalla legge giapponese.
2. In caso di controversie derivanti da questi Termini o dal Servizio, la giurisdizione esclusiva sarà dei tribunali giapponesi.

Efficace dal 01/10/2025
`
export default msg
