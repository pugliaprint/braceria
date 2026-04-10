/**
 * scripts/seed.js
 * Popola il database con dati iniziali realistici per una braceria pugliese.
 * Esegui con: npm run seed
 *
 * ATTENZIONE: cancella e ricrea tutti i dati esistenti (menu, ingredienti, settings).
 * Le prenotazioni e gli ordini NON vengono toccati.
 */

require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI non configurato in .env.local')
  process.exit(1)
}

// ---- Schema minimali per il seed ----
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, default: 'admin' },
})
const CategorySchema = new mongoose.Schema({ nome: String, descrizione: String, icona: String, ordine: Number, attiva: Boolean })
const MenuItemSchema = new mongoose.Schema({ nome: String, descrizione: String, prezzo: Number, categoria: mongoose.Schema.Types.ObjectId, immagine: String, disponibile: Boolean, evidenziato: Boolean, ordine: Number })
const IngCatSchema = new mongoose.Schema({ nome: String, descrizione: String, icona: String, ordine: Number, sceltaMinima: Number, sceltaMassima: Number, attiva: Boolean })
const IngSchema = new mongoose.Schema({ nome: String, categoria: mongoose.Schema.Types.ObjectId, prezzoExtra: Number, disponibile: Boolean, ordine: Number })
const SettingsSchema = new mongoose.Schema({}, { strict: false })

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema)
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema)
const IngCat = mongoose.models.IngredientCategory || mongoose.model('IngredientCategory', IngCatSchema)
const Ing = mongoose.models.Ingredient || mongoose.model('Ingredient', IngSchema)
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connesso a MongoDB')

  // ---- Admin User ----
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
  const esistente = await User.findOne({ username: adminUsername })
  if (!esistente) {
    const hash = await bcrypt.hash(adminPassword, 12)
    await User.create({ username: adminUsername, password: hash, role: 'admin' })
    console.log(`✅ Admin creato: ${adminUsername} / ${adminPassword}`)
  } else {
    console.log(`ℹ️  Admin già esistente: ${adminUsername}`)
  }

  // ---- Pulisci menu e ingredienti ----
  await Category.deleteMany({})
  await MenuItem.deleteMany({})
  await IngCat.deleteMany({})
  await Ing.deleteMany({})
  console.log('🗑️  Menu e ingredienti puliti')

  // ---- Categorie Menu ----
  const categorie = await Category.insertMany([
    { nome: 'Antipasti',          icona: '🥗', ordine: 1,  attiva: true, descrizione: 'Per iniziare con gusto' },
    { nome: 'Bombette & Involtini', icona: '🥩', ordine: 2,  attiva: true, descrizione: 'La specialità della casa' },
    { nome: 'Grigliata',          icona: '🔥', ordine: 3,  attiva: true, descrizione: 'Carne alla brace' },
    { nome: 'Panini',             icona: '🥪', ordine: 4,  attiva: true, descrizione: 'Panini artigianali' },
    { nome: 'Contorni',           icona: '🥔', ordine: 5,  attiva: true, descrizione: 'Per accompagnare' },
    { nome: 'Dolci',              icona: '🍮', ordine: 6,  attiva: true, descrizione: 'Per finire in dolcezza' },
    { nome: 'Birre',              icona: '🍺', ordine: 7,  attiva: true, descrizione: 'Birre artigianali e non' },
    { nome: 'Bevande',            icona: '🥤', ordine: 8,  attiva: true, descrizione: 'Analcoliche e altro' },
  ])

  const [cAntipasti, cBombette, cGrigliata, cPanini, cContorni, cDolci, cBirre, cBevande] = categorie
  console.log('✅ Categorie menu create')

  // ---- Piatti ----
  await MenuItem.insertMany([
    // Antipasti
    { nome: 'Bruschetta al Pomodoro', descrizione: 'Pane casereccio tostato con pomodorini freschi, aglio e basilico', prezzo: 4.50, categoria: cAntipasti._id, ordine: 1, disponibile: true, evidenziato: false },
    { nome: 'Crostini con Lardo di Colonnata', descrizione: 'Fettine di pane abbrustolito con lardo di Colonnata DOP', prezzo: 6.00, categoria: cAntipasti._id, ordine: 2, disponibile: true, evidenziato: false },
    { nome: 'Tagliere Misto', descrizione: 'Selezione di salumi artigianali, formaggi locali e olive', prezzo: 12.00, categoria: cAntipasti._id, ordine: 3, disponibile: true, evidenziato: true },
    { nome: 'Verdure Grigliate alla Brace', descrizione: 'Melanzane, zucchine, peperoni e cipolla rossa grigliati con olio EVO', prezzo: 7.00, categoria: cAntipasti._id, ordine: 4, disponibile: true, evidenziato: false },

    // Bombette & Involtini
    { nome: 'Bombette Pugliesi (5 pz)', descrizione: 'Involtini di capocollo con caciocavallo e prezzemolo, cotti alla brace. La vera specialità di Valle d\'Itria', prezzo: 10.00, categoria: cBombette._id, ordine: 1, disponibile: true, evidenziato: true },
    { nome: 'Bombette Piccanti (5 pz)', descrizione: 'Come le classiche, con aggiunta di peperoncino fresco calabrese', prezzo: 10.50, categoria: cBombette._id, ordine: 2, disponibile: true, evidenziato: false },
    { nome: 'Involtini di Maiale con Provola', descrizione: 'Fettine di lonza avvolte con provola affumicata e rucola', prezzo: 11.00, categoria: cBombette._id, ordine: 3, disponibile: true, evidenziato: false },
    { nome: 'Braciolette di Agnello (4 pz)', descrizione: 'Costolette di agnello locale marinate con rosmarino e limone', prezzo: 13.00, categoria: cBombette._id, ordine: 4, disponibile: true, evidenziato: true },

    // Grigliata
    { nome: 'Salsiccia alla Brace', descrizione: 'Salsiccia fresca di maiale artigianale, cotta lentamente sulla brace di legna', prezzo: 9.00, categoria: cGrigliata._id, ordine: 1, disponibile: true, evidenziato: false },
    { nome: 'Costine di Maiale', descrizione: 'Ribs di maiale marinate 24h con salsa BBQ artigianale', prezzo: 13.00, categoria: cGrigliata._id, ordine: 2, disponibile: true, evidenziato: false },
    { nome: 'Grigliata Mista per 1', descrizione: 'Salsiccia, bombetta, costoletta e bracioletta di maiale. Il meglio della brace in un piatto', prezzo: 18.00, categoria: cGrigliata._id, ordine: 3, disponibile: true, evidenziato: true },
    { nome: 'Grigliata Mista per 2', descrizione: 'Versione abbondante della grigliata mista, perfetta da condividere', prezzo: 32.00, categoria: cGrigliata._id, ordine: 4, disponibile: true, evidenziato: true },
    { nome: 'Petto di Pollo alla Brace', descrizione: 'Petto di pollo marinato con erbe aromatiche e cotto alla brace', prezzo: 10.00, categoria: cGrigliata._id, ordine: 5, disponibile: true, evidenziato: false },
    { nome: 'Entrecôte Angus', descrizione: 'Taglio pregiato di manzo Angus, 300g, cotto al punto desiderato', prezzo: 22.00, categoria: cGrigliata._id, ordine: 6, disponibile: true, evidenziato: false },

    // Panini
    { nome: 'Panino con Salsiccia', descrizione: 'Panino artigianale con salsiccia alla brace e peperoni arrostiti', prezzo: 7.00, categoria: cPanini._id, ordine: 1, disponibile: true, evidenziato: false },
    { nome: 'Panino con Bombetta', descrizione: 'Panino con 3 bombette pugliesi, lattuga e pomodorini', prezzo: 8.00, categoria: cPanini._id, ordine: 2, disponibile: true, evidenziato: false },
    { nome: 'Panino Personalizzato 🔧', descrizione: 'Scegli tu gli ingredienti! Carne, salse e verdure a tuo gusto', prezzo: 6.00, categoria: cPanini._id, ordine: 3, disponibile: true, evidenziato: true },

    // Contorni
    { nome: 'Patatine Fritte', descrizione: 'Patate fresche fritte, croccanti e dorate', prezzo: 4.00, categoria: cContorni._id, ordine: 1, disponibile: true, evidenziato: false },
    { nome: 'Patate al Forno con Rosmarino', descrizione: 'Patate al forno con rosmarino fresco e olio EVO', prezzo: 4.50, categoria: cContorni._id, ordine: 2, disponibile: true, evidenziato: false },
    { nome: 'Insalata Mista', descrizione: 'Lattuga, rucola, pomodorini, carote e olive', prezzo: 5.00, categoria: cContorni._id, ordine: 3, disponibile: true, evidenziato: false },
    { nome: 'Cipolle di Tropea Grigliate', descrizione: 'Cipolle rosse di Tropea grigliate con aceto balsamico', prezzo: 4.00, categoria: cContorni._id, ordine: 4, disponibile: true, evidenziato: false },
    { nome: 'Peperoni Arrostiti', descrizione: 'Peperoni rossi e gialli arrostiti alla brace con aglio e prezzemolo', prezzo: 5.00, categoria: cContorni._id, ordine: 5, disponibile: true, evidenziato: false },

    // Dolci
    { nome: 'Pasticciotto Leccese', descrizione: 'Il dolce tipico salentino con crema pasticcera', prezzo: 3.50, categoria: cDolci._id, ordine: 1, disponibile: true, evidenziato: false },
    { nome: 'Torta della Nonna', descrizione: 'Torta con crema pasticcera e pinoli, ricetta artigianale', prezzo: 4.00, categoria: cDolci._id, ordine: 2, disponibile: true, evidenziato: false },
    { nome: 'Gelato Artigianale (2 gusti)', descrizione: 'Gelato del giorno, domandaci i gusti disponibili', prezzo: 3.50, categoria: cDolci._id, ordine: 3, disponibile: true, evidenziato: false },

    // Birre
    { nome: 'Birra Peroni 33cl', descrizione: 'Birra lager italiana classica', prezzo: 3.00, categoria: cBirre._id, ordine: 1, disponibile: true, evidenziato: false },
    { nome: 'Birra Moretti 33cl', descrizione: 'Birra chiara italiana', prezzo: 3.00, categoria: cBirre._id, ordine: 2, disponibile: true, evidenziato: false },
    { nome: 'Birra Artigianale IPA 33cl', descrizione: 'Birra artigianale locale, amara e luppolata', prezzo: 5.00, categoria: cBirre._id, ordine: 3, disponibile: true, evidenziato: true },
    { nome: 'Birra Artigianale Rossa 33cl', descrizione: 'Birra rossa artigianale con malto tostato', prezzo: 5.00, categoria: cBirre._id, ordine: 4, disponibile: true, evidenziato: false },
    { nome: 'Birra alla spina (piccola)', descrizione: 'Birra fresca alla spina, 0.3L', prezzo: 3.50, categoria: cBirre._id, ordine: 5, disponibile: true, evidenziato: false },
    { nome: 'Birra alla spina (media)', descrizione: 'Birra fresca alla spina, 0.5L', prezzo: 5.00, categoria: cBirre._id, ordine: 6, disponibile: true, evidenziato: false },

    // Bevande
    { nome: 'Acqua Naturale 0.5L', descrizione: '', prezzo: 1.50, categoria: cBevande._id, ordine: 1, disponibile: true, evidenziato: false },
    { nome: 'Acqua Frizzante 0.5L', descrizione: '', prezzo: 1.50, categoria: cBevande._id, ordine: 2, disponibile: true, evidenziato: false },
    { nome: 'Coca Cola 33cl', descrizione: '', prezzo: 2.50, categoria: cBevande._id, ordine: 3, disponibile: true, evidenziato: false },
    { nome: 'Fanta / Sprite 33cl', descrizione: '', prezzo: 2.50, categoria: cBevande._id, ordine: 4, disponibile: true, evidenziato: false },
    { nome: 'Succo di Frutta', descrizione: 'Pesca, albicocca o arancia', prezzo: 2.50, categoria: cBevande._id, ordine: 5, disponibile: true, evidenziato: false },
    { nome: 'Vino Rosso della Casa (calice)', descrizione: 'Vino rosso pugliese sfuso', prezzo: 3.00, categoria: cBevande._id, ordine: 6, disponibile: true, evidenziato: false },
    { nome: 'Vino Rosso della Casa (caraffa 0.5L)', descrizione: 'Vino rosso pugliese sfuso', prezzo: 6.00, categoria: cBevande._id, ordine: 7, disponibile: true, evidenziato: false },
  ])
  console.log('✅ Piatti menu creati')

  // ---- Categorie Ingredienti Panino ----
  const ingCat = await IngCat.insertMany([
    { nome: 'Tipo di Pane',   icona: '🍞', ordine: 1, sceltaMinima: 1, sceltaMassima: 1,  attiva: true, descrizione: 'Scegli il tipo di pane' },
    { nome: 'Carne',          icona: '🥩', ordine: 2, sceltaMinima: 1, sceltaMassima: 2,  attiva: true, descrizione: 'Scegli la carne (max 2)' },
    { nome: 'Formaggio',      icona: '🧀', ordine: 3, sceltaMinima: 0, sceltaMassima: 2,  attiva: true, descrizione: 'Aggiungi il formaggio' },
    { nome: 'Salse',          icona: '🫙', ordine: 4, sceltaMinima: 0, sceltaMassima: 10, attiva: true, descrizione: 'Scegli le salse' },
    { nome: 'Verdure',        icona: '🥬', ordine: 5, sceltaMinima: 0, sceltaMassima: 10, attiva: true, descrizione: 'Aggiungi le verdure' },
    { nome: 'Extra',          icona: '✨', ordine: 6, sceltaMinima: 0, sceltaMassima: 10, attiva: true, descrizione: 'Ingredienti extra' },
  ])

  const [cPane, cCarne, cFormaggio, cSalse, cVerdure, cExtra] = ingCat
  console.log('✅ Categorie ingredienti create')

  // ---- Ingredienti ----
  await Ing.insertMany([
    // Pane
    { nome: 'Panino Classico',         categoria: cPane._id,     prezzoExtra: 0,    disponibile: true, ordine: 1 },
    { nome: 'Panino Integrale',        categoria: cPane._id,     prezzoExtra: 0,    disponibile: true, ordine: 2 },
    { nome: 'Panino Senza Glutine',    categoria: cPane._id,     prezzoExtra: 1.50, disponibile: true, ordine: 3 },
    { nome: 'Ciabatta',                categoria: cPane._id,     prezzoExtra: 0,    disponibile: true, ordine: 4 },
    { nome: 'Focaccia Pugliese',       categoria: cPane._id,     prezzoExtra: 0.50, disponibile: true, ordine: 5 },

    // Carne
    { nome: 'Bombetta Pugliese',       categoria: cCarne._id,    prezzoExtra: 2.00, disponibile: true, ordine: 1 },
    { nome: 'Salsiccia alla Brace',    categoria: cCarne._id,    prezzoExtra: 1.50, disponibile: true, ordine: 2 },
    { nome: 'Angus Grigliato',         categoria: cCarne._id,    prezzoExtra: 3.00, disponibile: true, ordine: 3 },
    { nome: 'Pollo alla Brace',        categoria: cCarne._id,    prezzoExtra: 1.50, disponibile: true, ordine: 4 },
    { nome: 'Pancetta Croccante',      categoria: cCarne._id,    prezzoExtra: 1.00, disponibile: true, ordine: 5 },
    { nome: 'Speck',                   categoria: cCarne._id,    prezzoExtra: 1.00, disponibile: true, ordine: 6 },

    // Formaggio
    { nome: 'Provola Affumicata',      categoria: cFormaggio._id, prezzoExtra: 1.00, disponibile: true, ordine: 1 },
    { nome: 'Scamorza',                categoria: cFormaggio._id, prezzoExtra: 1.00, disponibile: true, ordine: 2 },
    { nome: 'Caciocavallo',            categoria: cFormaggio._id, prezzoExtra: 1.00, disponibile: true, ordine: 3 },
    { nome: 'Burrata',                 categoria: cFormaggio._id, prezzoExtra: 1.50, disponibile: true, ordine: 4 },
    { nome: 'Cheddar',                 categoria: cFormaggio._id, prezzoExtra: 0.50, disponibile: true, ordine: 5 },

    // Salse
    { nome: 'Maionese',                categoria: cSalse._id,    prezzoExtra: 0,    disponibile: true, ordine: 1 },
    { nome: 'Ketchup',                 categoria: cSalse._id,    prezzoExtra: 0,    disponibile: true, ordine: 2 },
    { nome: 'Senape',                  categoria: cSalse._id,    prezzoExtra: 0,    disponibile: true, ordine: 3 },
    { nome: 'Salsa BBQ',               categoria: cSalse._id,    prezzoExtra: 0,    disponibile: true, ordine: 4 },
    { nome: 'Salsa Piccante',          categoria: cSalse._id,    prezzoExtra: 0,    disponibile: true, ordine: 5 },
    { nome: 'Aioli all\'Aglio',        categoria: cSalse._id,    prezzoExtra: 0.50, disponibile: true, ordine: 6 },
    { nome: 'Salsa Verde Pugliese',    categoria: cSalse._id,    prezzoExtra: 0.50, disponibile: true, ordine: 7 },

    // Verdure
    { nome: 'Lattuga Iceberg',         categoria: cVerdure._id,  prezzoExtra: 0,    disponibile: true, ordine: 1 },
    { nome: 'Pomodoro Fresco',         categoria: cVerdure._id,  prezzoExtra: 0,    disponibile: true, ordine: 2 },
    { nome: 'Cipolla Rossa',           categoria: cVerdure._id,  prezzoExtra: 0,    disponibile: true, ordine: 3 },
    { nome: 'Cipolla di Tropea',       categoria: cVerdure._id,  prezzoExtra: 0.50, disponibile: true, ordine: 4 },
    { nome: 'Rucola',                  categoria: cVerdure._id,  prezzoExtra: 0,    disponibile: true, ordine: 5 },
    { nome: 'Peperoni Arrostiti',      categoria: cVerdure._id,  prezzoExtra: 0.50, disponibile: true, ordine: 6 },
    { nome: 'Melanzane Grigliate',     categoria: cVerdure._id,  prezzoExtra: 0.50, disponibile: true, ordine: 7 },
    { nome: 'Cetrioli',                categoria: cVerdure._id,  prezzoExtra: 0,    disponibile: true, ordine: 8 },
    { nome: 'Pomodorini Secchi',       categoria: cVerdure._id,  prezzoExtra: 0.50, disponibile: true, ordine: 9 },

    // Extra
    { nome: 'Uovo Fritto',             categoria: cExtra._id,    prezzoExtra: 1.00, disponibile: true, ordine: 1 },
    { nome: 'Funghi Trifolati',        categoria: cExtra._id,    prezzoExtra: 1.00, disponibile: true, ordine: 2 },
    { nome: 'Tartufo Nero',            categoria: cExtra._id,    prezzoExtra: 2.00, disponibile: true, ordine: 3 },
    { nome: 'Olive Nere',              categoria: cExtra._id,    prezzoExtra: 0.50, disponibile: true, ordine: 4 },
    { nome: 'Jalapeños',               categoria: cExtra._id,    prezzoExtra: 0.50, disponibile: true, ordine: 5 },
  ])
  console.log('✅ Ingredienti panino creati')

  // ---- Settings default ----
  await Settings.deleteMany({})
  await Settings.create({
    fasceOrarieDefault: [
      { ora: '19:00', attiva: true },
      { ora: '19:30', attiva: true },
      { ora: '20:00', attiva: true },
      { ora: '20:30', attiva: true },
      { ora: '21:00', attiva: true },
      { ora: '21:30', attiva: true },
      { ora: '22:00', attiva: true },
    ],
    pranzoDomenicaAttivo: false,
    fascePranzo: [
      { ora: '12:00', attiva: true },
      { ora: '12:30', attiva: true },
      { ora: '13:00', attiva: true },
      { ora: '13:30', attiva: true },
    ],
    // Default 40 posti per ogni giorno (lun-dom) e ogni fascia cena
    postiDefaultPerFascia: [
      ...Array.from({ length: 7 }, (_, g) => [
        { giornoSettimana: g, fasciaOraria: '19:00', posti: 40 },
        { giornoSettimana: g, fasciaOraria: '19:30', posti: 40 },
        { giornoSettimana: g, fasciaOraria: '20:00', posti: 40 },
        { giornoSettimana: g, fasciaOraria: '20:30', posti: 40 },
        { giornoSettimana: g, fasciaOraria: '21:00', posti: 40 },
        { giornoSettimana: g, fasciaOraria: '21:30', posti: 40 },
        { giornoSettimana: g, fasciaOraria: '22:00', posti: 40 },
      ]).flat(),
    ],
    postiEccezioni: [],
    deliveryAttivo: true,
    costoConsegna: 1.00,
    whatsappNumero: '',
    whatsappApiKey: '',
    whatsappAttivo: false,
    nomeRistorante: 'Braceria Sannicandro',
    indirizzoRistorante: 'Via XX Settembre 12, Sannicandro di Bari (BA)',
    telefonoRistorante: '',
    pinCucina: '1234',
  })
  console.log('✅ Settings inizializzati')

  console.log('\n🎉 Seed completato con successo!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`👤 Admin login: ${process.env.ADMIN_USERNAME || 'admin'}`)
  console.log(`🔑 Password:   ${process.env.ADMIN_PASSWORD || 'Admin123!'}`)
  console.log(`🍳 PIN cucina: 1234`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  Cambia la password admin dal pannello prima di andare live!')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Errore seed:', err)
  process.exit(1)
})
