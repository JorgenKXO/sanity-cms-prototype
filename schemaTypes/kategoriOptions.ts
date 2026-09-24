// Delt kategoriliste for artikler og navigasjonssider, slik at begge
// dokumenttypene kan organiseres i de samme mappene i strukturen.
export const kategoriOptions = [
  {title: 'Aksjer og verdipapirer', value: 'aksjer-og-verdipapirer'},
  {title: 'Aksjonærregisteroppgaven', value: 'aksjonaerregisteroppgaven'},
  {title: 'A-meldingen', value: 'a-meldingen'},
  {title: 'Arbeid', value: 'arbeid'},
  {title: 'Arbeidsgiver', value: 'arbeidsgiver'},
  {title: 'Arv og gave', value: 'arv-og-gave'},
  {title: 'Bank og lån', value: 'bank-og-lan'},
  {title: 'Bil og kjøretøy (skatt)', value: 'bil-og-kjoretoy-skatt'},
  {title: 'Bilavgift', value: 'bilavgift'},
  {title: 'Bolig og eiendom', value: 'bolig-og-eiendom'},
  {title: 'Deling', value: 'deling'},
  {title: 'Familie og helse', value: 'familie-og-helse'},
  {title: 'Finnmark og svalbard', value: 'finnmark-og-svalbard'},
  {title: 'Folkeregister', value: 'folkeregister'},
  {title: 'Hobby eller næring', value: 'hobby-eller-naering'},
  {title: 'Innkreving og betaling', value: 'innkreving-og-betaling'},
  {title: 'Internprising', value: 'internprising'},
  {title: 'Kalender (datoer og frister)', value: 'kalender-datoer-og-frister'},
  {title: 'Merverdiavgift', value: 'merverdiavgift'},
  {title: 'Offentlig støtte', value: 'offentlig-stotte'},
  {title: 'Samisk', value: 'samisk'},
  {title: 'Skatt næring', value: 'skatt-naering'},
  {title: 'Skattekort og forskudd', value: 'skattekort-og-forskudd'},
  {title: 'Skattemelding person', value: 'skattemelding-person'},
  {title: 'Skatteoppgjør', value: 'skatteoppgjor'},
  {title: 'Særavgift', value: 'saeravgift'},
  {title: 'Tredjepartsopplysninger', value: 'tredjepartsopplysninger'},
  {title: 'Trygd og pensjon', value: 'trygd-og-pensjon'},
] as const

export type KategoriValue = (typeof kategoriOptions)[number]['value']
