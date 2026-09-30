// scripts/fetch-dictionary.mjs
import fs from 'fs';
import path from 'path';

async function generateDictionary() {
  console.log('Fetching word list from ENABLE lexicon...');
  
  // Standard, curated, open-source English word list (~173,000 words)
  const response = await fetch(
    'https://raw.githubusercontent.com/raun/Scrabble/master/words.txt'
  );
  const text = await response.text();
  const rawWords = text.split(/\r?\n/);

  console.log(`Processing ${rawWords.length} raw words...`);

  // Filter words strictly suitable for Spelling Bee
  const beeWords = rawWords
    .map((w) => w.trim().toUpperCase())
    .filter((word) => {
      // Must be at least 4 letters, strictly alphabetic
      if (word.length < 4 || !/^[A-Z]+$/.test(word)) return false;
      
      // Spelling bee has 7 letters total. Any word with >7 unique letters is impossible to spell!
      const uniqueLetters = new Set(word);
      return uniqueLetters.size <= 7;
    });

  // Extract candidate pangrams (words with exactly 7 unique letters) for the game seed generator
  const pangrams = beeWords.filter((w) => new Set(w).size === 7);

  const outputPath = path.resolve('src/lib/dictionary.json');
  fs.writeFileSync(outputPath, JSON.stringify({ words: beeWords, pangrams }), 'utf-8');

  console.log(`Saved ${beeWords.length} words and ${pangrams.length} pangrams to ${outputPath}`);
}

generateDictionary();