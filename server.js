const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

const distFolder = path.join(__dirname, 'dist', 'pokedex');
const indexFile = path.join(distFolder, 'index.html');

if (!fs.existsSync(distFolder)) {
    console.error('[FATAL] Pasta dist não encontrada:', distFolder);
}
if (!fs.existsSync(indexFile)) {
    console.error('[FATAL] index.html não encontrado em:', indexFile);
}

app.use(express.static(distFolder, {
    index: false,
    maxAge: '1h',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

app.get('/_ah/health', (req, res) => res.status(200).send('ok'));

app.use((req, res, next) => {
    res.sendFile(indexFile, err => err && next(err));
});

app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    if (!res.headersSent) res.status(500).send('Erro interno do servidor');
});

app.listen(PORT, () => {
    console.log('Servidor na porta', PORT);
    console.log('Servindo', distFolder);
});