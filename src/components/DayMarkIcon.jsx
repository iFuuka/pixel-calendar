const INK = '#725969';
const CREAM = '#fff1ce';
const PEACH = '#f2c794';
const PINK = '#e6a4b6';
const ROSE = '#c97d98';
const LILAC = '#baa2df';
const BLUE = '#9bcbe0';

// Each coordinate is a whole pixel on the same 16 × 16 canvas.
const FACE_OUTLINE = 'M5 2H11V3H13V5H14V11H13V13H11V14H5V13H3V11H2V5H3V3H5Z';
const FACE_FILL = 'M5 3H11V4H12V5H13V11H12V12H11V13H5V12H4V11H3V5H4V4H5Z';

const FACES = {
  '😊': {
    color: PEACH,
    expression: 'M4 6H5V5H6V6H7V7H6V6H5V7H4ZM9 6H10V5H11V6H12V7H11V6H10V7H9ZM5 9H6V10H10V9H11V11H10V12H6V11H5Z',
    blush: true,
  },
  '😌': {
    color: '#d7dcc0',
    expression: 'M4 6H5V7H7V8H4ZM9 7H11V6H12V8H9ZM7 10H9V11H7Z',
    blush: true,
  },
  '😐': {
    color: PEACH,
    expression: 'M5 6H6V8H5ZM10 6H11V8H10ZM6 10H10V11H6Z',
  },
  '😢': {
    color: '#c5d6e4',
    expression: 'M4 5H6V6H4ZM10 5H12V6H10ZM5 7H6V8H5ZM10 7H11V8H10ZM6 11V10H7V9H9V10H10V11H9V10H7V11Z',
    extra: [{ d: 'M4 8H5V9H6V11H4Z', fill: '#689abf' }, { d: 'M4 9H5V10H4Z', fill: '#e0f4f5' }],
  },
  '😴': {
    color: '#d2c1e5',
    expression: 'M4 7H7V8H4ZM9 7H12V8H9ZM7 10H9V12H7Z',
    extra: [{ d: 'M10 0H14V1H13V2H12V3H14V4H10V3H11V2H12V1H10Z', fill: INK }],
  },
  '😡': {
    color: '#efb3ac',
    expression: 'M4 5H5V6H7V7H5V6H4ZM9 6H11V5H12V6H11V7H9ZM5 8H6V9H5ZM10 8H11V9H10ZM6 12V11H7V10H9V11H10V12H9V11H7V12Z',
  },
};

const SYMBOLS = {
  '🔥': [
    { d: 'M8 0H9V2H11V4H12V7H13V5H14V8H15V12H14V14H12V15H5V14H3V12H2V8H3V6H5V3H6V2H8Z', fill: INK },
    { d: 'M8 2H9V3H10V5H11V8H12V9H13V8H14V12H13V13H11V14H5V13H4V11H3V8H4V7H6V4H7V3H8Z', fill: '#e7a184' },
    { d: 'M7 6H8V9H10V8H11V10H12V12H11V13H6V12H5V10H6V8H7Z', fill: '#f6ce87' },
    { d: 'M8 10H9V11H10V13H7V11H8Z', fill: CREAM },
  ],
  '🎂': [
    { d: 'M3 6H13V8H14V13H15V15H1V13H2V8H3Z', fill: INK },
    { d: 'M3 9H13V13H3Z', fill: PINK },
    { d: 'M4 7H12V8H13V10H11V9H9V10H7V9H5V10H3V8H4Z', fill: CREAM },
    { d: 'M4 11H6V12H4ZM8 11H10V12H8ZM12 11H13V12H12Z', fill: ROSE },
    { d: 'M2 14H14V15H2Z', fill: '#c7b5dd' },
    { d: 'M7 3H9V7H7Z', fill: INK },
    { d: 'M8 4H9V6H8Z', fill: BLUE },
    { d: 'M7 0H8V1H9V3H7V2H6V1H7Z', fill: '#e2a578' },
    { d: 'M7 1H8V2H7Z', fill: CREAM },
  ],
  '✈': [
    { d: 'M7 0H9V1H10V5H11V6H13V7H15V8H16V10H10V12H11V13H12V15H4V13H5V12H6V10H0V8H1V7H3V6H5V5H6V1H7Z', fill: INK },
    { d: 'M7 1H9V6H11V7H13V8H15V9H9V13H10V14H6V13H7V9H1V8H3V7H5V6H7Z', fill: '#c6dce8' },
    { d: 'M7 2H8V7H7ZM3 8H6V9H3ZM9 7H11V8H9Z', fill: '#f5eee5' },
    { d: 'M8 4H9V7H8ZM8 10H9V13H8Z', fill: '#93accb' },
  ],
  '❤': [
    { d: 'M3 2H6V3H7V4H9V3H10V2H13V3H14V4H15V8H14V10H12V12H10V14H9V15H7V14H6V13H5V12H4V11H3V10H2V8H1V4H2V3H3Z', fill: INK },
    { d: 'M3 3H6V4H7V5H9V4H10V3H13V4H14V8H13V9H12V11H10V13H9V14H7V13H6V12H5V11H4V10H3V8H2V4H3Z', fill: PINK },
    { d: 'M3 4H6V5H4V7H3Z', fill: '#ffe4df' },
    { d: 'M12 7H14V8H13V9H12V11H10V13H9V14H7V13H9V12H10V10H12Z', fill: ROSE },
  ],
  '⭐': [
    { d: 'M7 0H9V2H10V4H11V5H15V6H16V8H14V9H13V11H14V15H11V14H9V13H7V14H5V15H2V11H3V9H2V8H0V6H1V5H5V4H6V2H7Z', fill: INK },
    { d: 'M7 2H9V4H10V6H14V7H13V8H12V9H11V11H12V14H11V13H9V12H7V13H5V14H3V12H4V9H3V8H2V7H1V6H6V4H7Z', fill: '#eed191' },
    { d: 'M7 4H8V7H5V8H3V7H6V6H7Z', fill: CREAM },
    { d: 'M9 8H10V11H9V10H7V11H6V9H9Z', fill: '#e0ac75' },
  ],
  '🎁': [
    { d: 'M3 0H6V1H7V3H9V1H10V0H13V1H14V4H15V8H14V15H2V8H1V4H2V1H3Z', fill: INK },
    { d: 'M3 1H5V2H6V3H3ZM11 1H13V3H10V2H11Z', fill: '#f0cd8e' },
    { d: 'M2 5H14V7H2ZM3 8H13V14H3Z', fill: LILAC },
    { d: 'M3 5H6V6H3ZM4 9H6V12H4Z', fill: '#dfd1ef' },
    { d: 'M7 4H9V14H7Z', fill: '#f3d7a3' },
    { d: 'M10 8H13V9H10ZM12 9H13V14H12Z', fill: '#9e83c1' },
  ],
  '🎵': [
    { d: 'M12 1H15V11H14V13H11V14H9V13H8V10H9V9H12V6H7V13H6V15H3V16H1V15H0V12H1V11H4V3H7V2H12Z', fill: INK },
    { d: 'M12 2H14V4H12V5H6V12H5V14H2V15H1V12H5V4H7V3H12ZM13 5H14V11H13V12H10V13H9V10H13Z', fill: LILAC },
    { d: 'M6 4H7V5H6ZM10 3H13V4H10ZM2 12H4V13H2ZM10 10H12V11H10Z', fill: '#e1d4f1' },
  ],
  '☕': [
    { d: 'M2 6H12V7H15V8H16V11H15V12H12V13H11V14H3V13H2ZM1 14H13V15H1Z', fill: INK },
    { d: 'M3 7H11V12H10V13H4V12H3ZM12 8H14V9H15V10H14V11H12V10H14V9H12Z', fill: PINK },
    { d: 'M4 7H10V8H4Z', fill: '#9d7b83' },
    { d: 'M4 9H5V12H4ZM2 14H12V15H2Z', fill: '#ffe1dd' },
    { d: 'M4 1H5V2H4V4H5V5H3V2H4ZM8 0H9V2H8V3H9V5H8V4H7V2H8Z', fill: '#a292b4' },
  ],
  '🏆': [
    { d: 'M4 1H12V3H15V7H14V8H12V9H11V10H9V12H11V13H12V15H4V13H5V12H7V10H5V9H4V8H2V7H1V3H4Z', fill: INK },
    { d: 'M5 2H11V7H10V9H6V7H5ZM2 4H4V7H3V6H2ZM12 4H14V6H13V7H12Z', fill: '#ecca86' },
    { d: 'M6 3H7V6H6ZM7 7H9V8H7Z', fill: CREAM },
    { d: 'M8 10H9V13H11V14H5V13H8Z', fill: '#ddb47c' },
  ],
  '📌': [
    { d: 'M5 1H11V2H12V4H11V7H12V8H13V11H9V14H8V16H7V11H3V8H4V7H5V4H4V2H5Z', fill: INK },
    { d: 'M5 2H11V3H10V8H11V9H12V10H4V9H5V8H6V3H5Z', fill: PINK },
    { d: 'M6 2H9V3H7V6H6ZM5 9H8V10H5Z', fill: '#ffe0df' },
    { d: 'M9 4H10V8H11V10H9Z', fill: ROSE },
    { d: 'M8 11H9V13H8Z', fill: '#d0cadb' },
  ],
};

function Face({ face }) {
  return (
    <>
      <path d={FACE_OUTLINE} fill={INK} />
      <path d={FACE_FILL} fill={face.color} />
      <path d="M5 4H8V5H5V6H4V5H5Z" fill={CREAM} opacity="0.75" />
      {face.blush && <path d="M3 8H5V9H3ZM11 8H13V9H11Z" fill={PINK} />}
      <path d={face.expression} fill={INK} />
      {face.extra?.map((part, index) => <path key={index} {...part} />)}
    </>
  );
}

export default function DayMarkIcon({ value, size = 24, style, ...props }) {
  const key = typeof value === 'string' ? value.replace(/\uFE0F/g, '') : '';
  const face = FACES[key];
  const symbol = SYMBOLS[key];

  if (!face && !symbol) {
    return (
      <span
        {...props}
        aria-hidden="true"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, fontSize: size, lineHeight: 1, flexShrink: 0, ...style }}
      >
        {value}
      </span>
    );
  }

  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', imageRendering: 'pixelated', flexShrink: 0, ...style }}
    >
      {face ? <Face face={face} /> : symbol.map((part, index) => <path key={index} {...part} />)}
    </svg>
  );
}
