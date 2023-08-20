export function fake_getProfileTripTych(id: string) {
  const hash = id.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  // Use the hash to generate a random index in the array
  const index = hash % FAKE_TRIPTYCH.length;
  return FAKE_TRIPTYCH[index];
}

const FAKE_TRIPTYCH = [
  { primary: '#B2C5CB', dark: '#161F2F', light: '#FFFFFF' },
  { primary: '#FB37C8', dark: '#380663', light: '#FFFFFF' },
  { primary: '#BF344E', dark: '#161F2F', light: '#FAE3C4' },
  { primary: '#FF869C', dark: '#0F1D38', light: '#E1F6FF' },
  { primary: '#DA8CFF', dark: '#000000', light: '#FFFFFF' },
  { primary: '#FF6C1E', dark: '#4D2A5D', light: '#FFFFFF' },
  { primary: '#B5703B', dark: '#140A05', light: '#FFFFFF' },
  { primary: '#86D9F3', dark: '#283749', light: '#FFFAF6' },
  { primary: '#DD1581', dark: '#22020A', light: '#FDFFE2' },
  { primary: '#83FFD2', dark: '#005874', light: '#FFFFFF' },
  { primary: '#C49C9C', dark: '#1E1927', light: '#F5EAEA' },
];
