export type VideoType = 'lecture' | 'tv';

export interface Video {
  id: string;
  title: string;
  secondaryTitle?: string;
  type: VideoType;
  customThumbnail?: boolean;
}

export const videos: Video[] = [
  {
    id: 'uHLEpvx5fCw',
    title: 'LECTURE – Rajko Radivojac – Matica Brčko',
    secondaryTitle: 'PREDAVANJE – Rajko Radivojac – MATICA BRCKO',
    type: 'lecture',
    customThumbnail: true,
  },
  {
    id: '3f_lD0L4zDs',
    title: 'Lecture at the Gudovac Fair – Rajko Radivojac: Queen Rearing',
    secondaryTitle: 'RAJKO RADIVOJAC, UZGOJ MATICA',
    type: 'lecture',
  },
  {
    id: 'qkJvC9VSWRc',
    title: 'RAJKO RADIVOJAC, LECTURE, VELIKA KLADUŠA',
    secondaryTitle: 'RAJKO RADIVOJAC, PREDAVANJE, VELIKA KLADUSA',
    type: 'lecture',
    customThumbnail: true,
  },
  {
    id: '_rbUBLkJx4g',
    title: 'Beekeeper Rajko Radivojac',
    secondaryTitle: 'Pcelar Rajko Radivojac',
    type: 'tv',
    customThumbnail: true,
  },
  {
    id: '20feLA4D90s',
    title: 'Rajko Radivojac: With a Manual for Advanced Beekeepers, Success in Beekeeping Is Guaranteed!',
    secondaryTitle: 'Rajko Radivojac: SA PRIRUČNIKOM ZA NAPREDNE PČELARE USPJEH U PČELARSTVU JE ZAGARANTOVAN!',
    type: 'tv',
  },
  {
    id: 'rJ4zD1qLsbM',
    title: 'Prijedor Beekeeper Rajko Radivojac Advises Colleagues Ahead of the New Season – RTRS Report',
    secondaryTitle: 'Prijedorski pcelar Rajko Radivojac savjetuje kolege uoci nove sezone – RTRS prilog',
    type: 'tv',
    customThumbnail: true,
  },
  {
    id: 'bgwVb-9BYG4',
    title: 'Rajko Radivojac: Young Beekeepers Should Start with the Hives Used by Their Mentor',
    secondaryTitle: 'RAJKO RADIVOJAC: MLADI PČELARI NEKA POČNU SA KOŠNICAMA KOJE KORISTI NJIHOV MENTOR',
    type: 'tv',
    customThumbnail: true,
  },
  {
    id: '0zq_FkxVLZ8',
    title: 'Il Miele di Prijedor',
    secondaryTitle: 'The Honey of Prijedor',
    type: 'tv',
  },
  {
    id: 'rP9CNhqsWJM',
    title: 'Low Honey Yield Among Beekeepers in the Potkozarje Region – RTRS Report',
    secondaryTitle: 'Nizak prinos meda kod potkozarskih pcelara – RTRS prilog',
    type: 'tv',
    customThumbnail: true,
  },
  {
    id: 'p_TQTftPveU',
    title: 'How to Recognize Real Honey – Advice from Prijedor Beekeeper Rajko Radivojac – RTRS Report',
    secondaryTitle: 'Kako prepoznati pravi med – Savjeti prijedorskog pčelara Rajka Radivojca – RTRS prilog',
    type: 'tv',
    customThumbnail: true,
  },
];
