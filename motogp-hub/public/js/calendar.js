// ============================================================
// CALENDAR MODULE – 2026 MotoGP Full Season Calendar
// ============================================================

const Calendar = (() => {

  const ROUNDS_2026 = [
    { round: 1,  name: 'Qatar Grand Prix',       circuit: 'Losail International Circuit',     country: 'Qatar',        flag: '🇶🇦', dates: '27 Feb – 2 Mar',   status: 'done',    winner: 'Marc Márquez' },
    { round: 2,  name: 'Thailand Grand Prix',    circuit: 'Chang International Circuit',       country: 'Thailand',     flag: '🇹🇭', dates: '28 Feb – 2 Mar',   status: 'done',    winner: 'Jorge Martín' },
    { round: 3,  name: 'Argentina Grand Prix',   circuit: 'Autodromo Termas de Río Hondo',    country: 'Argentina',    flag: '🇦🇷', dates: '28 Mar – 30 Mar',  status: 'done',    winner: 'Marco Bezzecchi' },
    { round: 4,  name: 'Spanish Grand Prix',     circuit: 'Circuito de Jerez',                country: 'Spain',        flag: '🇪🇸', dates: '24 – 26 Apr',      status: 'done',    winner: 'Álex Márquez' },
    { round: 5,  name: 'French Grand Prix',      circuit: 'Circuit de la Sarthe, Le Mans',    country: 'France',       flag: '🇫🇷', dates: '8 – 10 May',       status: 'live',    winner: null },
    { round: 6,  name: 'Catalan Grand Prix',     circuit: 'Circuit de Barcelona-Catalunya',   country: 'Catalonia',    flag: '🏴', dates: '15 – 17 May',      status: 'upcoming', winner: null },
    { round: 7,  name: 'Italian Grand Prix',     circuit: 'Autodromo del Mugello',            country: 'Italy',        flag: '🇮🇹', dates: '29 – 31 May',      status: 'upcoming', winner: null },
    { round: 8,  name: 'Czech Republic Grand Prix', circuit: 'Automotodrom Brno',             country: 'Czechia',      flag: '🇨🇿', dates: '19 – 21 Jun',      status: 'upcoming', winner: null },
    { round: 9,  name: 'Dutch Grand Prix',       circuit: 'TT Circuit Assen',                 country: 'Netherlands',  flag: '🇳🇱', dates: '26 – 28 Jun',      status: 'upcoming', winner: null },
    { round: 10, name: 'German Grand Prix',      circuit: 'Sachsenring',                      country: 'Germany',      flag: '🇩🇪', dates: '10 – 12 Jul',      status: 'upcoming', winner: null },
    { round: 11, name: 'British Grand Prix',     circuit: 'Silverstone Circuit',              country: 'Great Britain',flag: '🇬🇧', dates: '7 – 9 Aug',        status: 'upcoming', winner: null },
    { round: 12, name: 'Aragon Grand Prix',      circuit: 'MotorLand Aragón',                 country: 'Spain',        flag: '🇪🇸', dates: '28 – 30 Aug',      status: 'upcoming', winner: null },
    { round: 13, name: 'San Marino Grand Prix',  circuit: 'Misano World Circuit',             country: 'San Marino',   flag: '🇸🇲', dates: '11 – 13 Sep',      status: 'upcoming', winner: null },
    { round: 14, name: 'Austrian Grand Prix',    circuit: 'Red Bull Ring',                    country: 'Austria',      flag: '🇦🇹', dates: '18 – 20 Sep',      status: 'upcoming', winner: null },
    { round: 15, name: 'Indonesian Grand Prix',  circuit: 'Mandalika International Street Circuit', country: 'Indonesia', flag: '🇮🇩', dates: '3 – 5 Oct',   status: 'upcoming', winner: null },
    { round: 16, name: 'Japanese Grand Prix',    circuit: 'Twin Ring Motegi',                 country: 'Japan',        flag: '🇯🇵', dates: '16 – 18 Oct',      status: 'upcoming', winner: null },
    { round: 17, name: 'Australian Grand Prix',  circuit: 'Phillip Island Circuit',           country: 'Australia',    flag: '🇦🇺', dates: '23 – 25 Oct',      status: 'upcoming', winner: null },
    { round: 18, name: 'Malaysian Grand Prix',   circuit: 'Sepang International Circuit',     country: 'Malaysia',     flag: '🇲🇾', dates: '30 Oct – 1 Nov',   status: 'upcoming', winner: null },
    { round: 19, name: 'Emilia Romagna Grand Prix', circuit: 'Misano World Circuit',          country: 'Italy',        flag: '🇮🇹', dates: '6 – 8 Nov',        status: 'upcoming', winner: null },
    { round: 20, name: 'Brazilian Grand Prix',   circuit: 'Autódromo José Carlos Pace',       country: 'Brazil',       flag: '🇧🇷', dates: '13 – 15 Nov',      status: 'upcoming', winner: null },
    { round: 21, name: 'Qatar Grand Prix',       circuit: 'Losail International Circuit',     country: 'Qatar',        flag: '🇶🇦', dates: '6 – 8 Nov',        status: 'upcoming', winner: null },
    { round: 22, name: 'Valencia Grand Prix',    circuit: 'Circuit Ricardo Tormo',            country: 'Spain',        flag: '🇪🇸', dates: '27 – 29 Nov',      status: 'upcoming', winner: null },
  ];

  function renderRound(r) {
    const div = document.createElement('div');
    div.className = 'cal-round cal-' + r.status;

    let statusBadge = '';
    if (r.status === 'done') statusBadge = `<span class="cal-badge cal-badge-done">✓ Completed</span>`;
    else if (r.status === 'live') statusBadge = `<span class="cal-badge cal-badge-live"><span class="live-dot"></span>LIVE NOW</span>`;
    else statusBadge = `<span class="cal-badge cal-badge-upcoming">Upcoming</span>`;

    div.innerHTML = `
      <div class="cal-round-num">${r.round}</div>
      <div class="cal-flag">${r.flag}</div>
      <div class="cal-info">
        <div class="cal-name">${escapeHtml(r.name)}</div>
        <div class="cal-circuit">${escapeHtml(r.circuit)}</div>
        <div class="cal-dates">${escapeHtml(r.dates)}</div>
        ${r.winner ? `<div class="cal-winner">🏆 ${escapeHtml(r.winner)}</div>` : ''}
      </div>
      <div class="cal-status">${statusBadge}</div>
    `;
    return div;
  }

  function open() {
    const modal = document.getElementById('calendar-modal');
    const container = document.getElementById('calendar-rounds');
    modal.style.display = 'flex';

    if (container.children.length === 0) {
      ROUNDS_2026.forEach(r => container.appendChild(renderRound(r)));
    }
  }

  function close() {
    document.getElementById('calendar-modal').style.display = 'none';
  }

  function init() {
    document.getElementById('open-calendar-btn').addEventListener('click', open);
    document.getElementById('calendar-modal-close').addEventListener('click', close);
    document.getElementById('calendar-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('calendar-modal')) close();
    });
  }

  return { init };
})();
