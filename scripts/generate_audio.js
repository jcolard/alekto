const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '..', 'assets', 'audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// 1-second silent MP3 base64
const silentMp3Base64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV';
const audioBuffer = Buffer.from(silentMp3Base64, 'base64');

const files = [
  'sample_dragon.mp3',
  'sample_renard.mp3',
  'sample_lune.mp3',
  'sample_ours.mp3',
  'sample_chene.mp3',
  'sample_pingouin.mp3',
  'sample_girafe.mp3'
];

files.forEach(file => {
  const filePath = path.join(audioDir, file);
  fs.writeFileSync(filePath, audioBuffer);
  console.log(`Généré : ${filePath}`);
});

console.log('Tous les fichiers audio simulés ont été créés avec succès.');
