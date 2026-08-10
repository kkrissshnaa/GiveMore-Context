export interface ExploreItem {
  id: string;
  image: any;
  title: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  dimensions: string;
  seed: number;
  guidanceScale: number;
  category: 'Graphic Art' | 'Noir & Comic' | 'Cinematic' | 'Minimalist';
  creator: {
    name: string;
    handle: string;
    avatarColor: string;
    initials: string;
  };
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: 'exp-1',
    image: require('../../assets/images/explore/explore_1.png'),
    title: 'PLUR Linocut Comic Collage',
    prompt: 'Black and white linocut print style graphic novel panel, emotional gaze eyes framing, noir punk aesthetic, high contrast woodcut texture, avant-garde typography, PLUR text stamp overlay',
    model: 'Flux 1.1 Pro',
    aspectRatio: '1:1',
    dimensions: '1024 x 1024',
    seed: 8492041,
    guidanceScale: 7.5,
    category: 'Noir & Comic',
    creator: {
      name: 'Elena Rostova',
      handle: '@elena_art',
      avatarColor: '#f43f5e',
      initials: 'ER',
    },
    likesCount: 342,
    commentsCount: 28,
    createdAt: '2 hours ago',
  },
  {
    id: 'exp-2',
    image: require('../../assets/images/explore/explore_2.png'),
    title: 'Listen What You Love Poster',
    prompt: 'Swiss graphic design album artwork poster, Helvetica bold typography "listen what you love", halftone red stacked vinyl records, vintage Japanese cassette technical drawing schematic, off-white textured paper',
    model: 'Ideogram v2',
    aspectRatio: '1:1',
    dimensions: '1024 x 1024',
    seed: 1928374,
    guidanceScale: 6.0,
    category: 'Graphic Art',
    creator: {
      name: 'Marcus Chen',
      handle: '@marcus_design',
      avatarColor: '#b2ff59',
      initials: 'MC',
    },
    likesCount: 589,
    commentsCount: 42,
    createdAt: '4 hours ago',
  },
  {
    id: 'exp-3',
    image: require('../../assets/images/explore/explore_3.jpg'),
    title: 'Sahara Dune Nomad',
    prompt: 'Cinematic 35mm film photograph, solitary nomad standing in sweeping Sahara sand dunes wearing black linen Tuareg tagelmust robe and face cover, golden hour desert sunlight, steep limestone cliff backdrop, National Geographic style',
    model: 'Krea AI v2',
    aspectRatio: '16:9',
    dimensions: '1920 x 1080',
    seed: 9940128,
    guidanceScale: 8.0,
    category: 'Cinematic',
    creator: {
      name: 'Tariq Al-Mansoor',
      handle: '@tariq_lens',
      avatarColor: '#eab308',
      initials: 'TA',
    },
    likesCount: 1240,
    commentsCount: 95,
    createdAt: '6 hours ago',
  },
  {
    id: 'exp-4',
    image: require('../../assets/images/explore/explore_4.jpg'),
    title: 'Miles Morales Scrapbook Collage',
    prompt: 'Spider-Man Into The Spider-Verse wallpaper art, Miles Morales graffiti cutout scrapbook aesthetic, halftone comic book panels, dynamic sticker badges, HELLO my name is tag, bold street punk collage',
    model: 'Flux 1.1 Pro',
    aspectRatio: '16:9',
    dimensions: '1920 x 1080',
    seed: 4509218,
    guidanceScale: 7.0,
    category: 'Noir & Comic',
    creator: {
      name: 'Sabrina Torres',
      handle: '@sabrina_graphics',
      avatarColor: '#a855f7',
      initials: 'ST',
    },
    likesCount: 875,
    commentsCount: 64,
    createdAt: '12 hours ago',
  },
  {
    id: 'exp-5',
    image: require('../../assets/images/explore/explore_5.jpg'),
    title: 'Vinyl Tracklist Minimal Print',
    prompt: 'Minimalist editorial vinyl album tracklist poster, bold "listen what you love" heading, red halftone vinyl stack on light grey grid paper background, precise typography layout with song credits',
    model: 'Ideogram v2',
    aspectRatio: '1:1',
    dimensions: '1024 x 1024',
    seed: 3829104,
    guidanceScale: 6.5,
    category: 'Minimalist',
    creator: {
      name: 'Devon Vance',
      handle: '@devon_type',
      avatarColor: '#06b6d4',
      initials: 'DV',
    },
    likesCount: 412,
    commentsCount: 19,
    createdAt: '1 day ago',
  },
  {
    id: 'exp-6',
    image: require('../../assets/images/explore/explore_1.png'),
    title: 'Noir Monolithic Woodcut',
    prompt: 'Expressive graphic novel character closeup, heavy ink line work, woodcut printmaking texture, moody dark shadows, monochrome manga panel composition with typography stamps',
    model: 'Flux 1.1 Pro',
    aspectRatio: '1:1',
    dimensions: '1024 x 1024',
    seed: 7362910,
    guidanceScale: 7.5,
    category: 'Noir & Comic',
    creator: {
      name: 'Kaito Tanaka',
      handle: '@kaito_ink',
      avatarColor: '#3b82f6',
      initials: 'KT',
    },
    likesCount: 630,
    commentsCount: 37,
    createdAt: '1 day ago',
  },
];
