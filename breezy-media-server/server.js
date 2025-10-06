const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.set('trust proxy', true); // ← Très important si derrière un proxy (ex: nginx)

const PORT = 3060;

app.use(cors()); // Active CORS

// Sert les fichiers statiques dans le dossier "medias"
app.use('/media', express.static(path.join(__dirname, 'medias')));

// Configuration de multer pour sauvegarder dans /medias
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'medias'),
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Route d’upload
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('Requête POST /upload reçue');
  console.log('Fichier reçu:', req.file);

  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });

  const protocol = req.protocol; // http ou https
  const host = req.get('host'); // exemple : media-breezy.student-project.space

  const fileUrl = `${protocol}://${host}/media/${req.file.filename}`;
  res.status(201).json({ fileUrl });
});

// Page galerie des images
app.get('/gallery', (req, res) => {
  const mediaDir = path.join(__dirname, 'medias');

  fs.readdir(mediaDir, (err, files) => {
    if (err) return res.status(500).send('Erreur de lecture du dossier médias');

    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file)) // uniquement les images
      .map(file => `<img src="/media/${file}" style="width: 200px; margin: 10px;" />`);

    res.send(`
      <html>
        <head><title>Galerie des médias</title></head>
        <body style="font-family: sans-serif;">
          <h1>Galerie</h1>
          ${images.length > 0 ? images.join('') : '<p>Aucune image trouvée.</p>'}
        </body>
      </html>
    `);
  });
});

// Route de debug
app.get('/debug', (req, res) => {
  res.json({
    protocol: req.protocol,
    host: req.get('host'),
    forwarded: req.get('x-forwarded-proto')
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(` Serveur démarré sur http://localhost:${PORT}`);
});
