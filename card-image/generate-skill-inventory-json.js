const fs = require('fs');
const path = require('path');

// Read existing JSON
const jsonPath = path.join(__dirname, '../frontend/src/game-modes/data/cards/skill-cards.json');
const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Update deck info
json.deck.id = 'skill_cards_52';
json.deck.name = '職能盤點卡';
json.deck.description = '52張職能盤點卡：10張行動卡 + 42張心態卡';
json.deck.version = '2.0.0';

// Helper function to generate imageUrl
function generateImageUrl(cardNum) {
  const id = String(cardNum).padStart(2, '0');
  const baseUrl = 'https://storage.googleapis.com/career-creator-assets/cards';

  // Cards 01-10: action cards (single-sided, front only)
  if (cardNum >= 1 && cardNum <= 10) {
    return {
      L: {
        front: `${baseUrl}/skill-inventory-${id}-L-front-zhtw.png`
      },
      M: {
        front: `${baseUrl}/skill-inventory-${id}-M-front-zhtw.png`
      },
      S: {
        front: `${baseUrl}/skill-inventory-${id}-S-front-zhtw.png`
      }
    };
  }

  // Cards 11-52: mindset cards (double-sided, front + back)
  return {
    L: {
      front: `${baseUrl}/skill-inventory-${id}-L-front-zhtw.png`,
      back: `${baseUrl}/skill-inventory-${id}-L-back-zhtw.png`
    },
    M: {
      front: `${baseUrl}/skill-inventory-${id}-M-front-zhtw.png`,
      back: `${baseUrl}/skill-inventory-${id}-M-back-zhtw.png`
    },
    S: {
      front: `${baseUrl}/skill-inventory-${id}-S-front-zhtw.png`,
      back: `${baseUrl}/skill-inventory-${id}-S-back-zhtw.png`
    }
  };
}

// Update existing cards (01-10) with imageUrl
json.cards.forEach((card, index) => {
  const cardNum = index + 1;
  card.imageUrl = generateImageUrl(cardNum);
});

// Add cards 11-52 with placeholder data
for (let i = 11; i <= 52; i++) {
  const id = String(i).padStart(3, '0');
  json.cards.push({
    id: `skill_${id}`,
    title: `心態卡片 ${i}`,  // Placeholder - needs to be updated by reading images
    description: '待從圖片讀取',  // Placeholder
    category: 'mindset',
    level: '待定',
    related_careers: [],
    learning_resources: [],
    time_to_develop: '待定',
    imageUrl: generateImageUrl(i)
  });
}

// Write updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
console.log(`✅ Updated skill-cards.json with ${json.cards.length} cards`);

// Validate: check a few URLs
console.log('\n📊 Sample URLs:');
console.log('Card 01 (action, single-sided):');
console.log('  L front:', json.cards[0].imageUrl.L.front);
console.log('\nCard 26 (mindset, double-sided):');
console.log('  M front:', json.cards[25].imageUrl.M.front);
console.log('  M back:', json.cards[25].imageUrl.M.back);
console.log('\nCard 52 (mindset, double-sided):');
console.log('  S front:', json.cards[51].imageUrl.S.front);
console.log('  S back:', json.cards[51].imageUrl.S.back);
