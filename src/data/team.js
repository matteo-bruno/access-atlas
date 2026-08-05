// Sustainable Cities team, Sony CSL Rome. `roleKey` indexes contact.roles in
// the dictionaries so job titles translate; names do not.
//
// Italian agent nouns agree in gender, so the gendered roles carry a `M`/`F`
// key per person — `sapienzaPhdM` is "Dottorando", `sapienzaPhdF`
// "Dottoranda", and both are "PhD student, Sapienza" in English. The forms
// below were stated by the team rather than inferred here; a name is not
// evidence of anyone's gender, so a new member needs asking rather than
// guessing. Roles whose Italian is invariable ("Assistente di ricerca") or
// names a function ("Amministrazione, senior") take a single key.

export const TEAM = [
  { name: 'Vittorio Loreto', roleKey: 'director' },
  // `email` turns the name into a mailto link. Only for people who have asked
  // for one — a name is not an invitation to be written to.
  { name: 'Matteo Bruno', roleKey: 'staffResearcherM', email: 'matteo.bruno@sony.com' },
  { name: 'Lavinia Rossi Mori', roleKey: 'assistant' },
  { name: 'Bruno Campanelli', roleKey: 'consultantM' },
  { name: 'Michele Avalle', roleKey: 'sapienzaResearcherM' },
  { name: 'Riccardo Basilone', roleKey: 'sapienzaPhdM' },
  { name: 'Hygor P. M. Melo', roleKey: 'consultantM' },
  { name: 'Federica Fanelli', roleKey: 'sapienzaPhdF' },
  { name: 'Shirui Zhou', roleKey: 'visitingPhdM' },
  { name: 'Milena Di Canio', roleKey: 'communications' },
  { name: 'Elisabetta Falivene', roleKey: 'developerF' },
  { name: 'Cinzia Di Salvio', roleKey: 'admin' },
  { name: null, roleKey: 'hiring', isJoin: true },
];

export const FORMER_MEMBERS = [
  { name: 'Francesco Marzolla', roleKey: 'phdM' },
  { name: 'Francesco Zimmaro', roleKey: 'masterM' },
  { name: 'Bernardo Monechi', roleKey: 'researcherM' },
  { name: 'Claudio Chiappetta', roleKey: 'phdM' },
  { name: 'Gabriele Rossi', roleKey: 'masterM' },
  { name: 'Andrea Guizzo', roleKey: 'visitingPhdM' },
  { name: 'Indaco Biazzo', roleKey: 'researcherM' },
  { name: 'Enrico Ubaldi', roleKey: 'researcherM' },
  { name: 'Riccardo Di Clemente', roleKey: 'visitingResearcherM' },
];

// One address for everything. The separate press and careers mailboxes that
// used to sit here came from the design mock and were never real; the Work
// page falls back to `general` on its own.
export const CONTACT = {
  general: 'cslrome@sony.com',
  code: 'github.com/sony-csl-rome',
  codeUrl: 'https://github.com/sony-csl-rome',
  phone: '+39 0645502903',
};
