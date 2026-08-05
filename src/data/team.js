// Sustainable Cities team, Sony CSL Rome. `roleKey` indexes contact.roles in
// the dictionaries so job titles translate; names do not.
//
// The English role labels are agent nouns ("Researcher"); the Italian ones name
// the function instead ("Ricerca", "Dottorato"). Italian agent nouns agree in
// gender with the person, and a shared translation key cannot know anyone's
// gender — naming the function sidesteps that rather than guessing.

export const TEAM = [
  { name: 'Vittorio Loreto', roleKey: 'director' },
  { name: 'Lavinia Rossi Mori', roleKey: 'assistant' },
  { name: 'Bruno Campanelli', roleKey: 'consultant' },
  { name: 'Matteo Bruno', roleKey: 'associate' },
  { name: 'Michele Avalle', roleKey: 'sapienzaResearcher' },
  { name: 'Riccardo Basilone', roleKey: 'sapienzaPhd' },
  { name: 'Hygor P. M. Melo', roleKey: 'consultant' },
  { name: 'Federica Fanelli', roleKey: 'sapienzaPhd' },
  { name: 'Shirui Zhou', roleKey: 'visitingPhd' },
  { name: 'Milena Di Canio', roleKey: 'communications' },
  { name: 'Elisabetta Falivene', roleKey: 'developer' },
  { name: 'Cinzia Di Salvio', roleKey: 'admin' },
  { name: null, roleKey: 'hiring', isJoin: true },
];

export const FORMER_MEMBERS = [
  { name: 'Francesco Marzolla', roleKey: 'phd' },
  { name: 'Francesco Zimmaro', roleKey: 'master' },
  { name: 'Bernardo Monechi', roleKey: 'researcher' },
  { name: 'Claudio Chiappetta', roleKey: 'phd' },
  { name: 'Gabriele Rossi', roleKey: 'master' },
  { name: 'Andrea Guizzo', roleKey: 'visitingPhd' },
  { name: 'Indaco Biazzo', roleKey: 'researcher' },
  { name: 'Enrico Ubaldi', roleKey: 'researcher' },
  { name: 'Riccardo Di Clemente', roleKey: 'visitingResearcher' },
];

export const CONTACT = {
  general: 'access-atlas@sony.com',
  careers: 'careers@sony.com',
  press: 'press@sony.com',
  code: 'github.com/sony-csl-rome',
  codeUrl: 'https://github.com/sony-csl-rome',
  phone: '+39 06 4991 3333',
};
