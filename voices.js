// MyFit voices. Safe to keep in your public GitHub repo: it holds NO secret key.
// 1. server: the address of your Cloudflare Worker (ends in .workers.dev).
// 2. Paste each ElevenLabs voice ID between the quotes. Leave a coach empty to keep the phone voice.
window.MYFIT_VOICES = {
  // Recorded voices: upload each person's folder into voice/ on GitHub, then list them here.
  // Folder names use dashes for spaces, e.g. voice/Marcus-Steele/introduction.mp3
  recorded: {
    host: 'Maya-Secretary',          // Maya's folder (front desk)
    coaches: ['Marcus Steele', 'Maya Rivers', 'Adrian Ace Cole'],
    version: 1                       // add 1 after re-recording files, so phones fetch the new ones
  },

  // Live voices (optional, needs your voice server): see voice-server/SETUP-VOICES.md
  server: '',

  // Maya, the front-desk secretary (Canadian woman)
  maya: '',

  coaches: {
    // The Beast
    "Marcus Steele": '',   // man, Brooklyn, New York
    "Dwayne Iron Campbell": '',   // man, Kingston, Jamaica
    "Victoria Viper Cross": '',   // woman, Detroit
    "Rosa Vega": '',   // woman, Miami
    // The Drill Sergeant
    "Jack Mercer": '',   // man, Halifax
    "Andre Lewis": '',   // man, Kingston, Jamaica
    "Sasha Grant": '',   // woman, London
    "Nina Kovac": '',   // woman, Warsaw
    // The Athlete
    "Adrian Ace Cole": '',   // man, Toronto
    "Jordan Jet Mitchell": '',   // man, Bronx, New York
    "Simone Blake": '',   // woman, Montego Bay, Jamaica
    "Lucia Moretti": '',   // woman, Milan
    // The Scientist
    "Omar Haddad": '',   // man, Amman
    "Daniel Chen": '',   // man, Singapore
    "Priya Shah": '',   // woman, Mumbai
    "Elena Brooks": '',   // woman, Vancouver
    // The Personal Trainer
    "Carlos Reyes": '',   // man, San Antonio
    "Theo Martin": '',   // man, Montreal
    "Aisha Morgan": '',   // woman, Atlanta
    "Natalie James": '',   // woman, Edmonton
    // The Cheerleader
    "Mateo Silva": '',   // man, Lisbon
    "Tyler Bennett": '',   // man, Seattle
    "Jasmine Jazz Carter": '',   // woman, Houston
    "Leah Williams": '',   // woman, Birmingham
    // The Zen Coach
    "Noah Bennett": '',   // man, Wellington
    "Kenji Tanaka": '',   // man, Kyoto
    "Anika Rao": '',   // woman, Pune
    "Maya Rivers": '',   // woman, Victoria
  }
};
