import { useEffect, useId, useState } from 'react';
import { LIGHTNING_BOLTS, LIGHTNING_DRAW_SECONDS } from '../utils/pixelLightning';
import './PixelWindow.css';

const SEASONS = {
  spring: { hill: '#b6d5b1', hillShade: '#91bd9b', grass: '#93bd8b', grassShade: '#749d77', leaf: '#edb5cf', leafLight: '#f7d3e1', leafShade: '#c98cae', flower: '#f5bdd6' },
  summer: { hill: '#a3ccad', hillShade: '#83b799', grass: '#81b789', grassShade: '#649976', leaf: '#91bf88', leafLight: '#bbdba0', leafShade: '#6a9d7a', flower: '#ffe3a0' },
  autumn: { hill: '#d4c19b', hillShade: '#b8aa88', grass: '#c1aa82', grassShade: '#aa906f', leaf: '#d89b84', leafLight: '#edc096', leafShade: '#b47b79', flower: '#eed5a4' },
  winter: { hill: '#d8e3ed', hillShade: '#b6c9de', grass: '#e9edf5', grassShade: '#c8d4e7', leaf: '#c3d5df', leafLight: '#edf1f5', leafShade: '#93adc0', flower: '#f4f1fc' },
};

const SKIES = {
  day: { sky: '#bfdce7', middle: '#d4e5eb', horizon: '#eee7e5', cloud: '#fbf3ed', cloudShade: '#e1dce9', distant: '#c4cbd3', light: '#ffe4a6', star: '#fff2c6' },
  dusk: { sky: '#a59aca', middle: '#d0adcf', horizon: '#f1c5b8', cloud: '#efd0d9', cloudShade: '#c7adcf', distant: '#b3a6c5', light: '#ffdfaa', star: '#ffe8c2' },
  night: { sky: '#383955', middle: '#494769', horizon: '#66607e', cloud: '#6d6889', cloudShade: '#5a5677', distant: '#716d89', light: '#f5e3be', star: '#efdbba' },
};

const CLOUD_PATH = 'M0 10H5V5H14V0H28V5H37V10H44V19H0Z';

function Cloud({ x, y, scale = 1, shade, className = '' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={className}>
        <path d={CLOUD_PATH} fill={shade.cloudShade} />
        <path d="M0 10H5V5H14V0H28V5H37V10H41V14H0Z" fill={shade.cloud} />
        <rect x="8" y="6" width="12" height="3" fill={shade.cloud} />
      </g>
    </g>
  );
}

function LeafTree({ x, y, colors, winter = false, flip = false }) {
  return (
    <g transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`}>
      <path d="M-5 8H5V74H11V79H-12V74H-5Z" fill="#806f80" />
      <path d="M-2 30H2V75H-2ZM-18 28H-14V35H-6V40H-2V45H-8V40H-13V36H-18ZM4 48H9V42H16V36H20V43H15V48H10V53H4Z" fill="#a38792" />
      <g className="pixel-window__motion pixel-window__foliage">
      <path d="M-29-8H-22V-19H-9V-25H9V-20H21V-12H30V-1H35V17H29V28H17V34H-15V29H-29V20H-35V0H-29Z" fill={colors.leafShade} />
      <path d="M-29-8H-22V-19H-9V-25H9V-20H21V-12H30V0H27V11H15V19H-10V15H-26V6H-32V-2H-29Z" fill={colors.leaf} />
      <path d="M-22-12H-15V-20H-3V-23H8V-18H16V-12H7V-7H-9V0H-24V-5H-28V-9H-22Z" fill={colors.leafLight} />
      <rect x="17" y="0" width="7" height="5" fill={colors.leafLight} />
      <rect x="-23" y="19" width="5" height="4" fill={colors.leaf} />
      {winter && <path d="M-31-6H-24V-17H-12V-24H8V-19H21V-11H31V-4H18V-9H7V-13H-12V-7H-23V0H-31Z" fill="#f6f3fa" />}
      </g>
    </g>
  );
}

function Pine({ x, y, fill, shade, snow }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-3" y="36" width="6" height="21" fill="#8b7882" />
      <path d="M-3-20H3V-12H8V-4H13V4H18V12H12V17H21V25H27V37H-27V25H-21V17H-12V12H-18V4H-13V-4H-8V-12H-3Z" fill={shade} />
      <path d="M-3-20H3V-12H8V-4H13V4H18V8H6V2H-7V8H-18V4H-13V-4H-8V-12H-3ZM-11 15H-5V10H4V16H12V20H21V25H27V31H15V26H5V23H-8V28H-21V31H-27V25H-21V20H-11Z" fill={fill} />
      {snow && <path d="M-3-20H3V-12H8V-4H13V2H5V-2H-5V3H-13V-4H-8V-12H-3ZM-12 14H-5V9H5V15H13V20H21V26H11V23H-6V27H-21V20H-12Z" fill="#eff0f6" />}
    </g>
  );
}

function Cottage({ x, y, night, winter, smoking }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {smoking && <g fill={night ? '#b4adbd' : '#f2e7df'} opacity="0.55">
        {[0, 1, 2].map((i) => <path key={i} className="pixel-window__motion pixel-window__chimney-smoke" style={{ animationDelay: `${-i * 2.6}s` }} d="M38-36H42V-39H47V-35H50V-31H38Z" />)}
      </g>}
      <rect x="37" y="-27" width="8" height="21" fill="#a78791" />
      <rect x="35" y="-29" width="12" height="4" fill="#7e6c80" />
      <path d="M0-4H8V-11H16V-18H23V-25H31V-18H39V-11H47V-4H55V3H0Z" fill={night ? '#907588' : '#bd8796'} />
      <path d="M6-7H12V-14H20V-21H26V-25H31V-20H25V-14H19V-7H12V0H6Z" fill={winter ? '#f0edf3' : '#dba7ae'} />
      {winter && <path d="M28-25H31V-18H39V-11H47V-4H55V0H46V-6H38V-13H30Z" fill="#e5e7ef" />}
      <rect x="5" y="3" width="45" height="32" fill={night ? '#ac9aa4' : '#e5c8b4'} />
      <rect x="5" y="3" width="45" height="4" fill={night ? '#8c8297' : '#c6a7a0'} />
      <rect x="27" y="17" width="12" height="18" fill="#8e7886" />
      <rect x="29" y="19" width="8" height="16" fill="#a89199" />
      <rect x="35" y="26" width="2" height="2" fill="#f1d6af" />
      <rect x="11" y="12" width="12" height="13" fill="#897887" />
      <rect x="13" y="14" width="8" height="9" fill={night ? '#ffe0a0' : '#e7e7dd'} />
      <path d="M16 14H18V23H16ZM13 18H21V20H13Z" fill="#a68b90" />
      <rect x="9" y="25" width="16" height="3" fill="#b18c96" />
      <rect x="0" y="35" width="55" height="4" fill={winter ? '#f1eff7' : '#9c8e89'} />
      <rect x="26" y="39" width="17" height="3" fill={winter ? '#c6cede' : '#d9c5ab'} />
    </g>
  );
}

function Flowers({ season, fill }) {
  return (
    <g>
      {[40, 218, 290, 357, 447, 511, 601, 675, 738, 765].map((x, i) => {
        const y = 373 + (i * 13) % 20;
        return season === 'winter' ? (
          <path key={x} d={`M${x} ${y}h8v2h-8zm3-2h9v2h-9z`} fill="#f8f5fc" />
        ) : (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path d="M2 2H4V10H2ZM-1 6H2V8H-1ZM4 4H7V6H4Z" fill="#7c9980" />
            <path d="M1-2H5V0H7V4H5V6H1V4H-1V0H1Z" fill={fill} />
            <rect x="2" y="1" width="2" height="2" fill="#f4dfa1" />
          </g>
        );
      })}
    </g>
  );
}

function SillPlant() {
  return (
    <g transform="translate(34 419)">
      <path d="M13-20H16V0H13ZM7-26H12V-21H15V-15H10V-19H5V-24H7ZM16-13H21V-18H28V-13H24V-8H16ZM15-32H18V-36H24V-29H19V-21H15Z" fill="#829d87" />
      <path d="M6-25H10V-21H6ZM20-33H23V-29H20ZM21-16H26V-13H21Z" fill="#b4c6a0" />
      <path d="M3-2H28V4H25V18H7V4H3Z" fill="#bd8d9e" />
      <path d="M3-2H28V2H3ZM7 4H10V15H7Z" fill="#edbdc4" />
      <rect x="10" y="18" width="16" height="3" fill="#927788" />
      <rect x="18" y="7" width="4" height="4" fill="#e7afb8" />
    </g>
  );
}

function SleepingCat() {
  return (
    <g className="pixel-window__cat" transform="translate(70 402)">
      <path d="M3 34H47V36H3Z" fill="#8b6c7f" opacity="0.22" />
      {/* Rounded back behind a separate head and two front paws. */}
      <g className="pixel-window__motion pixel-window__cat-breath">
      <path d="M17 15H20V11H27V9H37V11H43V15H46V21H47V28H44V32H20V29H17Z" fill="#8b6c7f" />
      <path d="M19 15H22V13H27V11H36V13H41V16H44V22H45V27H42V30H21V27H19Z" fill="#e9ba91" />
      <path d="M23 15H28V13H35V15H39V18H41V21H35V19H27V20H23Z" fill="#f5d1a7" />
      <path d="M28 11H31V17H28ZM37 14H40V19H43V22H39V19H37Z" fill="#c48e79" />
      </g>
      <path d="M2 0H6V2H9V5H16V2H19V0H22V11H24V20H21V24H18V26H7V24H3V21H0V11H2Z" fill="#8b6c7f" />
      <path d="M3 3H5V5H8V7H17V5H20V3H21V12H22V19H20V22H17V24H8V22H4V20H2V12H3Z" fill="#f0c69e" />
      <path d="M4 5H6V7H8V10H4ZM18 7H20V5H21V11H17V9H18Z" fill="#d99aa4" />
      <path d="M10 7H12V11H10ZM14 7H16V11H14Z" fill="#c48e79" />
      <path d="M6 18H10V19H17V18H20V21H17V24H8V22H6Z" fill="#ffe2bd" />
      <path d="M4 14H6V15H9V14H11V16H9V17H6V16H4ZM14 14H16V15H19V14H21V16H19V17H16V16H14Z" fill="#725969" />
      <path d="M11 19H15V21H14V22H12V21H11Z" fill="#bd7f8e" />
      <path d="M5 25H13V27H15V32H13V34H4V32H3V28H5ZM17 25H23V27H25V32H23V34H15V32H14V28H17Z" fill="#8b6c7f" />
      <path d="M5 28H7V27H11V28H13V32H5ZM16 28H18V27H22V28H23V32H16Z" fill="#ffe2bd" />
      <path d="M8 30H9V32H8ZM11 30H12V32H11ZM19 30H20V32H19ZM22 30H23V32H22Z" fill="#c6988a" />
      {/* Curled tail has its own contour instead of merging with the belly. */}
      <g className="pixel-window__motion pixel-window__cat-tail">
      <path d="M43 19H48V22H51V29H49V32H45V34H37V32H34V29H35V25H39V27H38V29H44V27H46V23H43Z" fill="#8b6c7f" />
      <path d="M44 21H47V24H49V28H47V31H44V32H38V30H36V28H38V29H43V28H46V25H47V23H44Z" fill="#efc29b" />
      <path d="M36 27H38V29H36ZM46 24H49V27H47V25H46Z" fill="#ffe2bd" />
      </g>
    </g>
  );
}

function SillBooks() {
  return (
    <g transform="translate(704 417)">
      <path d="M0 11H44V19H0Z" fill="#9c8faa" />
      <rect x="4" y="13" width="35" height="4" fill="#e4d7d5" />
      <path d="M4 3H40V11H4Z" fill="#b7929e" />
      <rect x="8" y="5" width="29" height="4" fill="#f2e0cd" />
      <path d="M0-4H35V3H0Z" fill="#a2b8a8" />
      <rect x="4" y="-2" width="27" height="3" fill="#f2e5d3" />
      <path d="M6-21H24V-8H22V-5H9V-8H6ZM24-18H30V-9H24V-12H27V-15H24Z" fill="#ddbac6" />
      <rect x="9" y="-20" width="13" height="3" fill="#927888" />
      <rect x="9" y="-16" width="3" height="7" fill="#f6dbe2" />
      <g fill="#f3e5e3" opacity="0.75">
        {[0, 1].map((i) => <path key={i} className="pixel-window__motion pixel-window__cup-steam" style={{ animationDelay: `${-i * 2.6}s` }} d={`M${11 + i * 7}-26h2v-4h2v-4h-2v-3h-2v5h-2v4h2z`} />)}
      </g>
    </g>
  );
}

function StormLight() {
  return (
    <g className="pixel-window__storm">
      {LIGHTNING_BOLTS.map(({ x, y, stages }, i) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <g className={`pixel-window__motion pixel-window__storm-flash${i ? ' pixel-window__storm-flash--far' : ''}`}>
            {stages.map(({ core, edge }, stage) => (
              <g key={stage} className="pixel-window__motion pixel-window__lightning-stage"
                style={{ '--segment-delay': `${stage * LIGHTNING_DRAW_SECONDS / Math.max(1, stages.length - 1)}s` }}>
                <path d={edge} fill="#b6a1dc" opacity="0.65" />
                <path d={core} fill="#f9edf8" className="pixel-window__lightning-core" />
              </g>
            ))}
          </g>
        </g>
      ))}
    </g>
  );
}

function SeasonalDrift({ season, phase, weather, colors }) {
  const calmWeather = weather === 'clear' || weather === 'cloudy';
  const falling = (season === 'spring' || season === 'autumn') && weather !== 'storm' && weather !== 'snow';
  if (falling) {
    return (
      <g className={`pixel-window__season-drift pixel-window__season-drift--${season}`} fill={season === 'spring' ? colors.leafLight : colors.leaf}>
        {[{ x: 46, y: 298 }, { x: 78, y: 323 }, { x: 739, y: 317 }, { x: 757, y: 291 }].map(({ x, y }, i) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path className="pixel-window__motion pixel-window__falling-leaf" style={{ animationDelay: `${-i * 2.7}s`, animationDuration: `${12 + i * 2}s` }} d={season === 'spring' ? 'M0 0H4V2H6V4H2V2H0Z' : 'M0 2H2V0H6V4H4V6H0Z'} />
          </g>
        ))}
      </g>
    );
  }
  if (season !== 'summer' || !calmWeather) return null;
  if (phase !== 'day') {
    return (
      <g className="pixel-window__fireflies" fill="#f7e7a8">
        {[{ x: 51, y: 358 }, { x: 93, y: 392 }, { x: 748, y: 383 }].map(({ x, y }, i) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <rect className="pixel-window__motion pixel-window__firefly" style={{ animationDelay: `${-i * 3}s` }} width="2" height="2" />
          </g>
        ))}
      </g>
    );
  }
  return (
    <g className="pixel-window__butterflies">
      {[{ x: 73, y: 365 }, { x: 741, y: 356 }].map(({ x, y }, i) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <g className="pixel-window__motion pixel-window__butterfly" style={{ animationDelay: `${-i * 6}s` }}>
            <path d="M-4-2H-1V1H1V-2H4V2H2V4H0V2H-2V4H-4Z" fill={i === 0 ? '#edc6d8' : '#f4d59e'} />
            <rect x="-1" y="0" width="2" height="4" fill="#987f98" />
          </g>
        </g>
      ))}
    </g>
  );
}

/** Decorative, code-native pixel scenery. Weather data and date handling live in the caller. */
export default function PixelWindow({ scene = {}, animated = true }) {
  const clipId = useId();
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');
  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', updateVisibility);
    updateVisibility();
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);
  const season = Object.hasOwn(SEASONS, scene.season) ? scene.season : 'summer';
  const phase = Object.hasOwn(SKIES, scene.phase) ? scene.phase : 'day';
  const weather = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'storm', 'unknown'].includes(scene.weather) ? scene.weather : 'unknown';
  const night = phase === 'night';
  const wet = weather === 'rain' || weather === 'storm';
  const overcast = wet || weather === 'cloudy' || weather === 'snow' || weather === 'fog';
  const colors = { ...SEASONS[season] };
  let sky = { ...SKIES[phase] };
  if (overcast) {
    sky = night
      ? { ...sky, sky: '#3f4155', middle: '#525469', horizon: '#747482', cloud: '#817e93', cloudShade: '#69697d' }
      : phase === 'dusk'
        ? { ...sky, sky: '#a4a0b9', middle: '#b9b0c5', horizon: '#d4c1cc', cloud: '#ddd0da', cloudShade: '#bfb4ca' }
        : { ...sky, sky: '#aabdc9', middle: '#c3d0d7', horizon: '#dfe0df', cloud: '#e3e3e6', cloudShade: '#c3c7d3' };
  }
  if (weather === 'storm') {
    sky = night
      ? { ...sky, sky: '#282c47', middle: '#373b59', horizon: '#565973', cloud: '#656586', cloudShade: '#4b4e70' }
      : phase === 'dusk'
        ? { ...sky, sky: '#716b94', middle: '#8f82a7', horizon: '#b4a0b9', cloud: '#a09bbd', cloudShade: '#797395' }
        : { ...sky, sky: '#747e9b', middle: '#9099ae', horizon: '#b8bcc9', cloud: '#aaaac2', cloudShade: '#858ca7', distant: '#9da6b7' };
  }
  if (night) {
    Object.assign(colors, season === 'winter'
      ? { hill: '#8893ad', hillShade: '#6e809e', grass: '#a5adc4', grassShade: '#8c97b3', leaf: '#8996b1', leafLight: '#bec6d9', leafShade: '#697993', flower: '#c7cbde' }
      : { hill: '#747b8b', hillShade: '#5f7380', grass: '#70877e', grassShade: '#5d716f', leaf: season === 'autumn' ? '#aa8189' : season === 'spring' ? '#b48aa7' : '#7c9589', leafLight: season === 'autumn' ? '#c59b9b' : season === 'spring' ? '#d2afc4' : '#9bb0a0', leafShade: '#647982', flower: '#c6b3c0' });
  }
  return (
    <div className={`pixel-window pixel-window--${phase} pixel-window--${weather}`} data-season={season} data-weather={weather} data-phase={phase} data-animated={animated && pageVisible} aria-hidden="true">
      <svg className="pixel-window__art" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" focusable="false">
        <defs><clipPath id={clipId}><rect x="24" y="24" width="752" height="409" /></clipPath></defs>
        <rect width="800" height="480" className="pixel-window__wall" />
        <path d="M0 30H800V32H0ZM0 463H800V466H0ZM15 0H17V480H15ZM783 0H785V480H783Z" className="pixel-window__wall-detail" />
        <g clipPath={`url(#${clipId})`}>
          <rect x="24" y="24" width="752" height="409" fill={sky.sky} />
          <path d="M24 175H110V180H241V169H379V181H520V174H671V183H776V433H24Z" fill={sky.middle} />
          <path d="M24 268H178V261H297V270H440V264H569V272H706V262H776V433H24Z" fill={sky.horizon} />
          {night && weather !== 'unknown' && weather !== 'storm' ? (
            <g>
              <path d="M72 83H81V78H96V83H102V92H106V108H101V116H91V120H76V116H69V110H64V95H68V87H72Z" fill={sky.light} />
              <path d="M86 80H96V84H102V92H106V108H101V116H91V120H82V116H87V111H92V103H94V92H90V87H86Z" fill="#d9c5ba" />
              <rect x="73" y="95" width="6" height="6" fill="#e2ccb8" />
              <rect x="81" y="108" width="4" height="4" fill="#e2ccb8" />
              {!overcast && [46, 130, 184, 233, 296, 360, 469, 529, 584, 639, 710, 754].map((x, i) => <path key={x} className="pixel-window__motion pixel-window__star" style={{ animationDelay: `${-i * 1.3}s`, animationDuration: `${8 + i % 4}s` }} d={`M${x} ${48 + i * 29 % 124}h2v-3h2v3h3v2h-3v3h-2v-3h-2z`} fill={sky.star} opacity={i % 3 === 0 ? 0.55 : 0.9} />)}
            </g>
          ) : weather === 'clear' && (
            <g>
              <path d="M67 86H77V80H95V86H105V96H111V114H105V124H95V130H77V124H67V114H61V96H67Z" fill={sky.light} opacity="0.2" />
              <path d="M72 91H79V86H93V91H100V98H105V112H100V119H93V124H79V119H72V112H67V98H72Z" fill={sky.light} />
              <path d="M74 94H80V90H91V94H80V101H74Z" fill="#fff2cc" />
              <path d="M84 69H88V76H84ZM84 134H88V141H84ZM49 103H56V107H49ZM116 103H123V107H116Z" fill={sky.light} opacity="0.65" />
            </g>
          )}
          <Cloud x={32} y={overcast ? 75 : 139} scale={overcast ? 2.1 : 1.25} shade={sky} className="pixel-window__motion pixel-window__cloud pixel-window__cloud--near" />
          <Cloud x={661} y={overcast ? 72 : 123} scale={overcast ? 2.3 : 1.6} shade={sky} className="pixel-window__motion pixel-window__cloud" />
          <Cloud x={308} y={83} scale={1.7} shade={sky} className="pixel-window__motion pixel-window__cloud" />
          {overcast && <><Cloud x={139} y={109} scale={2.5} shade={sky} /><Cloud x={475} y={121} scale={2.2} shade={sky} /><Cloud x={709} y={153} scale={1.5} shade={sky} /></>}
          {weather === 'storm' && <StormLight />}
          <path d="M24 320V294H48V281H77V272H106V281H136V289H162V302H210V291H247V280H294V289H335V301H380V290H420V285H452V295H496V310H538V293H565V280H594V270H624V279H654V286H689V278H725V288H754V300H776V433H24Z" fill={sky.distant} />
          <path d="M24 351V321H52V310H85V302H120V297H152V306H180V318H214V326H257V315H290V307H329V316H367V331H411V339H459V326H486V312H520V305H559V314H596V326H630V317H661V302H697V296H729V309H759V322H776V433H24Z" fill={colors.hill} />
          <path d="M24 370V348H63V338H97V332H125V345H162V356H211V344H260V334H299V346H341V360H387V351H427V342H465V349H501V362H540V347H578V335H616V339H650V348H691V337H721V341H749V354H776V433H24Z" fill={colors.hillShade} />
          <Pine x={124} y={306} fill={colors.leaf} shade={colors.leafShade} snow={season === 'winter'} />
          <Pine x={655} y={310} fill={colors.leaf} shade={colors.leafShade} snow={season === 'winter'} />
          <path d="M24 380H75V375H153V383H232V378H305V384H408V375H496V382H576V378H670V383H730V374H776V433H24Z" fill={colors.grass} />
          <path d="M24 414H100V410H180V418H246V411H361V420H459V414H560V419H647V411H712V415H776V433H24Z" fill={colors.grassShade} />
          <Cottage x={691} y={335} night={night || overcast} winter={season === 'winter'} smoking={night || wet || season === 'autumn' || season === 'winter'} />
          <path d="M720 377H733V384H746V391H754V399H765V405H776V412H758V406H748V400H738V393H725V387H716V380H720Z" fill={season === 'winter' ? '#d1dae7' : '#d9c6ad'} />
          <LeafTree x={61} y={300} colors={colors} winter={season === 'winter'} />
          <LeafTree x={771} y={308} colors={colors} winter={season === 'winter'} flip />
          <Flowers season={season} fill={colors.flower} />
          <SeasonalDrift season={season} phase={phase} weather={weather} colors={colors} />
          {season === 'autumn' && <path d="M42 379H47V382H52V385H44V382H42ZM108 405H115V409H111V412H106V408H108ZM746 385H752V389H749V392H743V389H746Z" fill={colors.leaf} />}
          {weather === 'fog' && <g fill={sky.cloud} opacity="0.33"><path d="M24 319H119V315H217V321H314V317H430V323H542V318H664V322H776V337H674V333H557V340H444V335H322V339H217V332H118V338H24Z" /><path d="M24 369H138V365H265V370H398V366H532V372H667V366H776V383H654V380H516V387H390V382H257V386H126V379H24Z" /></g>}
          {wet && <g fill={night ? '#b7c5e4' : '#edf2ff'} opacity={weather === 'storm' ? 0.6 : 0.5}>{Array.from({ length: weather === 'storm' ? 62 : 38 }, (_, i) => <path key={i} className="pixel-window__motion pixel-window__rain" style={{ animationDelay: `${-(i % 9) * 0.15}s` }} d={`M${28 + i * 53 % 742} ${30 + i * 67 % 380}h2v7h-2zm-2 7h2v5h-2z`} />)}</g>}
          {weather === 'snow' && <g fill={night ? '#e0e2f4' : '#fff9fb'}>{Array.from({ length: 42 }, (_, i) => <path key={i} className="pixel-window__motion pixel-window__snow" style={{ animationDelay: `${-(i % 11) * 0.65}s`, animationDuration: `${7 + i % 4}s` }} d={`M${28 + i * 73 % 742} ${30 + i * 47 % 380}h${i % 3 === 0 ? 3 : 2}v${i % 3 === 0 ? 3 : 2}h-${i % 3 === 0 ? 3 : 2}z`} />)}</g>}
          <path d="M32 35H57V38H38V92H35V38H32ZM742 35H766V37H745V40H742Z" fill="#fff4ee" opacity="0.3" />
        </g>
      </svg>
      {/* The landscape covers the viewport; the room frame stays inside its edges. */}
      <svg className="pixel-window__frame-art" viewBox="0 0 800 480" preserveAspectRatio="none" shapeRendering="crispEdges" focusable="false">
        <path d="M0 0H800V480H0ZM19 17V434H781V17Z" fillRule="evenodd" className="pixel-window__wall" />
        <path d="M0 463H800V466H0ZM15 0H17V480H15ZM783 0H785V480H783Z" className="pixel-window__wall-detail" />
        <path d="M15 13H785V438H15ZM26 26V425H774V26Z" fillRule="evenodd" className="pixel-window__frame-shadow" />
        <path d="M19 17H781V434H19ZM27 27V425H773V27Z" fillRule="evenodd" className="pixel-window__frame" />
        <path d="M19 17H781V21H23V434H19ZM27 421H773V425H27Z" className="pixel-window__frame-light" />
        <path d="M27 25H773V28H30V421H27ZM770 28H773V421H770Z" className="pixel-window__frame-inner" />
        <rect x="395" y="26" width="10" height="399" className="pixel-window__frame-shadow" />
        <rect x="396" y="26" width="7" height="399" className="pixel-window__frame" />
        <rect x="396" y="26" width="2" height="399" className="pixel-window__frame-light" />
        <rect x="27" y="222" width="746" height="10" className="pixel-window__frame-shadow" />
        <rect x="27" y="222" width="746" height="7" className="pixel-window__frame" />
        <rect x="27" y="222" width="746" height="2" className="pixel-window__frame-light" />
        <g>
        <path d="M9 13H113V23H105V36H95V47H81V57H65V66H46V184H42V220H35V260H15V434H0V13Z" className="pixel-window__curtain-shadow" />
        <path d="M0 17H103V28H95V39H83V49H68V58H49V178H44V214H36V251H29V287H22V434H0Z" className="pixel-window__curtain" />
        <path d="M13 17H22V187H17V250H12ZM37 17H44V152H38ZM61 17H69V48H61ZM85 17H92V30H85Z" className="pixel-window__curtain-light" />
        <path d="M0 253H30V263H0ZM0 265H25V269H0Z" className="pixel-window__tie" />
        </g>
        <g transform="translate(800 0) scale(-1 1)">
          <g>
          <path d="M9 13H113V23H105V36H95V47H81V57H65V66H46V184H42V220H35V260H15V434H0V13Z" className="pixel-window__curtain-shadow" />
          <path d="M0 17H103V28H95V39H83V49H68V58H49V178H44V214H36V251H29V287H22V434H0Z" className="pixel-window__curtain" />
          <path d="M13 17H22V187H17V250H12ZM37 17H44V152H38ZM61 17H69V48H61ZM85 17H92V30H85Z" className="pixel-window__curtain-light" />
          <path d="M0 253H30V263H0ZM0 265H25V269H0Z" className="pixel-window__tie" />
          </g>
        </g>
        <rect x="6" y="8" width="788" height="6" className="pixel-window__rod" />
        <path d="M2 6H9V16H2ZM791 6H798V16H791Z" className="pixel-window__frame-shadow" />
        <path d="M12 435H788V450H780V460H20V450H12Z" className="pixel-window__frame-shadow" />
        <path d="M8 431H792V442H8Z" className="pixel-window__frame" />
        <rect x="8" y="431" width="784" height="4" className="pixel-window__frame-light" />
        <rect x="20" y="445" width="760" height="9" className="pixel-window__frame" />
        <rect x="24" y="445" width="752" height="2" className="pixel-window__frame-light" />
        <SillPlant />
        <SleepingCat />
        <SillBooks />
      </svg>
    </div>
  );
}
