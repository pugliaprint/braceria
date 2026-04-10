# 🔥 Braceria Sannicandro — Guida al Deploy Completo

## Indice
1. [Prerequisiti](#prerequisiti)
2. [MongoDB Atlas (Database)](#mongodb-atlas)
3. [Pusher (Real-time)](#pusher)
4. [Vercel (Hosting)](#vercel)
5. [CallMeBot (WhatsApp)](#callmebot)
6. [Prima configurazione](#prima-configurazione)
7. [QR Code tavoli](#qr-code)
8. [Manutenzione](#manutenzione)

---

## 1. Prerequisiti

- Account GitHub (gratuito) → https://github.com
- Account Vercel (gratuito) → https://vercel.com
- Account MongoDB Atlas (gratuito) → https://mongodb.com/atlas
- Account Pusher (gratuito) → https://pusher.com
- Node.js 18+ installato sul PC (per il seed)

---

## 2. MongoDB Atlas

### Crea il cluster gratuito
1. Vai su https://mongodb.com/atlas e registrati
2. Crea un nuovo progetto: **"Braceria"**
3. Crea un cluster **M0 Free** (gratis per sempre)
4. Scegli la regione più vicina (es: AWS / Europe / Frankfurt)
5. Aspetta ~3 minuti che venga creato

### Configura accesso
1. **Database Access** → Add New Database User
   - Username: `braceria_user`
   - Password: genera una password sicura (annotala!)
   - Role: **Atlas Admin**

2. **Network Access** → Add IP Address
   - Clicca **Allow Access from Anywhere** (0.0.0.0/0)
   - Questo è necessario per Vercel (IP dinamico)

### Ottieni la stringa di connessione
1. Vai su **Clusters** → Connect → Drivers
2. Seleziona: Driver **Node.js**, versione **5.5 or later**
3. Copia la stringa tipo:
   ```
   mongodb+srv://braceria_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Sostituisci `<password>` con la password creata sopra
5. Aggiungi il nome database: `?retryWrites=true&w=majority` → `/braceria?retryWrites=true&w=majority`

Stringa finale esempio:
```
mongodb+srv://braceria_user:MiaPassword123@cluster0.xxxxx.mongodb.net/braceria?retryWrites=true&w=majority
```

---

## 3. Pusher

1. Vai su https://pusher.com e registrati
2. Crea una nuova app: **"braceria-cucina"**
3. Scegli cluster: **eu** (Europa)
4. Nella sezione **App Keys** annota:
   - `app_id`
   - `key`
   - `secret`
   - `cluster` (es: `eu`)
5. Il **free tier** include 200.000 messaggi/giorno — più che sufficiente

---

## 4. Vercel (Deploy)

### Carica il progetto su GitHub
```bash
# Nella cartella braceria/
git init
git add .
git commit -m "Initial commit - Braceria Sannicandro"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/braceria.git
git push -u origin main
```

### Deploy su Vercel
1. Vai su https://vercel.com → New Project
2. Importa il repository GitHub **braceria**
3. Framework: **Next.js** (auto-rilevato)
4. **NON** cliccare ancora su Deploy — prima configura le variabili

### Configura variabili d'ambiente su Vercel
In **Settings → Environment Variables**, aggiungi:

| Nome | Valore |
|------|--------|
| `MONGODB_URI` | `mongodb+srv://...` (stringa completa) |
| `NEXTAUTH_SECRET` | Stringa random (genera con: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://tuodominio.vercel.app` |
| `PUSHER_APP_ID` | ID da Pusher |
| `PUSHER_KEY` | Key da Pusher |
| `PUSHER_SECRET` | Secret da Pusher |
| `PUSHER_CLUSTER` | `eu` |
| `NEXT_PUBLIC_PUSHER_KEY` | Key da Pusher (stessa di sopra) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `eu` |
| `NEXT_PUBLIC_APP_URL` | `https://tuodominio.vercel.app` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | Password sicura (cambiala!) |

5. Clicca **Deploy** → aspetta ~2 minuti

### URL finale
Il tuo sito sarà su: `https://braceria-xxxxx.vercel.app`
Puoi aggiungere un dominio personalizzato dalle impostazioni Vercel.

---

## 5. Popola il Database (Seed)

Dopo il deploy, esegui il seed **dal tuo PC**:

```bash
# Nella cartella braceria/
cp .env.example .env.local
# Modifica .env.local con tutti i tuoi valori reali

npm install
npm run seed
```

Output atteso:
```
✅ Connesso a MongoDB
✅ Admin creato: admin / LatuaPassword
✅ Categorie menu create
✅ Piatti menu creati
✅ Categorie ingredienti create
✅ Ingredienti panino creati
✅ Settings inizializzati

🎉 Seed completato con successo!
━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Admin login: admin
🔑 Password:   LatuaPassword
🍳 PIN cucina: 1234
━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 6. CallMeBot (Notifiche WhatsApp)

1. Sul telefono del proprietario, aggiungi ai contatti:
   - Nome: **CallMeBot**
   - Numero: **+34 644 91 87 47**

2. Invia questo messaggio a CallMeBot su WhatsApp:
   ```
   I allow callmebot to send me messages
   ```

3. Riceverai la tua **API key** entro qualche minuto

4. Vai sul pannello admin: `/admin/impostazioni` → tab WhatsApp
5. Inserisci:
   - **Numero**: il tuo numero con prefisso senza + (es: `393331234567`)
   - **API Key**: quella ricevuta da CallMeBot
6. Attiva le notifiche
7. Clicca **Invia Test** per verificare

---

## 7. Prima Configurazione (dopo il deploy)

Accedi al pannello admin su `/admin`

### Credenziali default
- Username: `admin`
- Password: quella impostata in `ADMIN_PASSWORD`

### Operazioni obbligatorie
1. **Cambia la password admin** (menu → impostazioni)
2. **Imposta il numero WhatsApp** per le notifiche
3. **Configura i posti** → `/admin/posti` (imposta quanti posti per fascia oraria)
4. **Rivedi il menu** → `/admin/menu` (aggiorna prezzi e disponibilità)
5. **Imposta PIN cucina** → `/admin/impostazioni` → tab Cucina

---

## 8. QR Code Tavoli

1. Vai su `/admin/qrcode`
2. Imposta il numero di tavoli
3. Clicca **Genera QR Code**
4. Clicca **Stampa tutti** oppure scarica i singoli QR
5. Stampa e plastifica i QR da mettere sui tavoli

### Come usare il QR
- Il cliente scansiona il QR con la fotocamera del telefono
- Si apre automaticamente il menu del suo tavolo (es: `/ordine/5`)
- Può ordinare direttamente senza app da installare

---

## 9. Dashboard Cucina (Tablet)

1. Apri il browser sul tablet in cucina
2. Vai su: `https://tuodominio.vercel.app/cucina`
3. Inserisci il PIN (default: `1234`)
4. Aggiungi la pagina alla schermata home del tablet (per usarla come app)

### Impostazioni tablet consigliate
- Schermo sempre acceso (impostazioni risparmio energetico → mai)
- Luminosità alta
- Rotazione bloccata in orizzontale
- Browser: Chrome o Safari

---

## 10. Struttura URL del sito

| URL | Descrizione |
|-----|-------------|
| `/` | Homepage con 3 CTA |
| `/prenota` | Prenotazione tavolo |
| `/menu` | Menu digitale (sola lettura) |
| `/ordina` | Info ordine al tavolo |
| `/ordine/[N]` | Ordine tavolo N (da QR) |
| `/delivery` | Ordine a domicilio |
| `/cucina` | Dashboard cucina (PIN) |
| `/admin` | Pannello admin (login) |
| `/admin/login` | Login admin |
| `/admin/menu` | Gestione menu |
| `/admin/ingredienti` | Gestione panino builder |
| `/admin/prenotazioni` | Gestione prenotazioni |
| `/admin/ordini` | Storico ordini |
| `/admin/posti` | Gestione posti |
| `/admin/qrcode` | Generatore QR tavoli |
| `/admin/impostazioni` | Impostazioni generali |

---

## 11. Manutenzione

### Aggiornare il menu
1. Vai su `/admin/menu`
2. Aggiungi/modifica/elimina piatti
3. Le modifiche sono immediate (nessun deploy necessario)

### Disattivare il delivery in fretta
- Dashboard admin → toggle "Servizio Delivery" in homepage
- oppure `/admin/impostazioni` → Ristorante → toggle Delivery

### Backup dati
MongoDB Atlas M0 include backup automatici giornalieri.
Per backup manuali: Atlas → Clusters → ... → Download

### Aggiornare il codice
```bash
git add .
git commit -m "Descrizione modifica"
git push
# Vercel fa il deploy automaticamente in ~1 minuto
```

---

## 12. Risoluzione Problemi

**Il seed fallisce:**
- Verifica che `MONGODB_URI` in `.env.local` sia corretto
- Verifica che l'IP del tuo PC sia autorizzato su Atlas Network Access

**Gli ordini non arrivano in cucina:**
- Controlla le variabili Pusher su Vercel
- Verifica che `NEXT_PUBLIC_PUSHER_KEY` e `PUSHER_KEY` siano uguali

**WhatsApp non funziona:**
- Verifica numero senza prefisso `+` (es: `393331234567` non `+393331234567`)
- Prova a reinviare il comando di autorizzazione a CallMeBot
- Il servizio è gratuito ma a volte lento, riprova dopo 10 minuti

**La pagina cucina non si aggiorna:**
- Il browser blocca connessioni WebSocket su alcuni network? Prova con hotspot mobile
- Verifica che Pusher sia configurato correttamente

---

*Progetto realizzato con Next.js 14, MongoDB Atlas, Pusher, CallMeBot API.*
*Deploy gratuito su Vercel.*
