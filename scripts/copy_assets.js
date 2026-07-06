const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'assets', 'images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Artifact folder where images are saved
const artifactDir = 'C:\\Users\\jerem\\.gemini\\antigravity\\brain\\05fdcd61-4063-4be9-b9b4-3f2020152642';

// Let's find the files in the artifact folder matching the prefixes
const files = fs.readdirSync(artifactDir);

const mappings = {
  'alekto_campfire': 'alekto_hero.png',
  'dragon_journey': 'dragon_journey.png',
  'petit_renard': 'petit_renard.png'
};

files.forEach(file => {
  for (const prefix in mappings) {
    if (file.startsWith(prefix) && file.endsWith('.png')) {
      const srcPath = path.join(artifactDir, file);
      const destPath = path.join(targetDir, mappings[prefix]);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copié ${file} -> ${destPath}`);
      
      // Also duplicate some to other names to ensure we have all files
      if (prefix === 'petit_renard') {
        fs.copyFileSync(srcPath, path.join(targetDir, 'renard_etoile.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'renard_imposteur.png'));
      }
      if (prefix === 'dragon_journey') {
        fs.copyFileSync(srcPath, path.join(targetDir, 'baleineau_nuages.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'expedition_cimes.png'));
      }
      if (prefix === 'alekto_campfire') {
        fs.copyFileSync(srcPath, path.join(targetDir, 'lune_dodo.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'foret_de_verre.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'valse_lucioles.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'piano_enchante.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'pyjama_ours.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'chene_voyageur.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'pingouin.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'girafe.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'article_conte.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'article_clara.png'));
        
        fs.copyFileSync(srcPath, path.join(targetDir, 'creation_tree.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'creation_whale.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'illustration_dream.png'));
        fs.copyFileSync(srcPath, path.join(targetDir, 'illustration_monsters.png'));
      }
    }
  }
});

console.log('Copie et duplication des images terminées.');
