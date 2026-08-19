const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('C:/Users/mutya/Documents/apps/Derriam/.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const subjects = [
  'sneaked out of the house', 'pretended to be asleep to avoid talking', 'eaten food off the floor',
  'read a partner\'s messages without them knowing', 'lied about my age', 'been arrested',
  'gotten a tattoo I regret', 'faked sick to get out of work', 'forgotten my own phone number',
  'cut my own hair and ruined it', 'accidentally sent a spicy text to the wrong person',
  'stolen a street sign', 'fallen asleep in the cinema', 'tripped in public and played it off',
  'been kicked out of a bar', 'cried at a cartoon', 'eaten an entire pizza by myself',
  'used someone else\'s toothbrush', 'been on TV', 'met a celebrity and embarrassed myself',
  'lied in this game', 'been skinny dipping', 'Googled myself', 'had a crush on a teacher',
  'regifted a present', 'snooped through a friend\'s bathroom cabinet', 'broken a bone',
  'been afraid of the dark', 'talked to myself out loud in public', 'kissed a stranger'
];
const scenarios = [
  'while drunk', 'at a party', 'in front of my parents', 'on vacation', 'at school',
  'on a first date', 'during a wedding', 'while driving', 'in the middle of the night'
];

const nhiePrompts = [];
// Generate 100 random ones
for (let i = 0; i < 150; i++) {
  const randomSubj = subjects[Math.floor(Math.random() * subjects.length)];
  const randomScen = scenarios[Math.floor(Math.random() * scenarios.length)];
  const text = i % 2 === 0 ? `Never have I ever ${randomSubj} ${randomScen}.` : `Never have I ever ${randomSubj}.`;
  // Only add unique
  if (!nhiePrompts.find(p => p.question === text)) {
    nhiePrompts.push({
      category: 'never-have-i-ever',
      question: text,
      option_a: 'Have',
      option_b: 'Never'
    });
  }
}

console.log('Inserting', nhiePrompts.length, 'prompts...');

async function run() {
  const { data, error } = await supabase.from('prompts').insert(nhiePrompts);
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted', nhiePrompts.length, 'prompts!');
  }
}
run();
