// ============================================================
// TEAMS MODULE – 2026 MotoGP Teams
// ============================================================

const Teams = (() => {

  const TEAMS_2026 = [
    {
      name: 'Ducati Lenovo Team',
      manufacturer: 'Ducati',
      bike: 'Desmosedici GP26',
      color: '#CC0000',
      accent: '#fff',
      category: 'Factory',
      riders: ['Marc Márquez #93', 'Francesco Bagnaia #63'],
      flag: '🇮🇹',
      founded: 2003,
      titles: 4,
    },
    {
      name: 'Aprilia Racing',
      manufacturer: 'Aprilia',
      bike: 'RS-GP26',
      color: '#003399',
      accent: '#fff',
      category: 'Factory',
      riders: ['Jorge Martín #89', 'Marco Bezzecchi #72'],
      flag: '🇮🇹',
      founded: 2015,
      titles: 0,
    },
    {
      name: 'Monster Energy Yamaha',
      manufacturer: 'Yamaha',
      bike: 'YZR-M1',
      color: '#003366',
      accent: '#0af',
      category: 'Factory',
      riders: ['Fabio Quartararo #20', 'Álex Rins #42'],
      flag: '🇯🇵',
      founded: 2002,
      titles: 9,
    },
    {
      name: 'Red Bull KTM Factory Racing',
      manufacturer: 'KTM',
      bike: 'RC16',
      color: '#FF6600',
      accent: '#fff',
      category: 'Factory',
      riders: ['Pedro Acosta #37', 'Brad Binder #33'],
      flag: '🇦🇹',
      founded: 2017,
      titles: 0,
    },
    {
      name: 'Honda HRC Castrol',
      manufacturer: 'Honda',
      bike: 'RC213V',
      color: '#CC0000',
      accent: '#fff',
      category: 'Factory',
      riders: ['Joan Mir #36', 'Luca Marini #10'],
      flag: '🇯🇵',
      founded: 1982,
      titles: 20,
    },
    {
      name: 'Prima Pramac Yamaha',
      manufacturer: 'Yamaha',
      bike: 'YZR-M1',
      color: '#0033AA',
      accent: '#fff',
      category: 'Satellite',
      riders: ['Toprak Razgatlıoğlu #54', 'Jack Miller #43'],
      flag: '🇮🇹',
      founded: 2002,
      titles: 0,
    },
    {
      name: 'Pertamina Enduro VR46',
      manufacturer: 'Ducati',
      bike: 'Desmosedici GP25',
      color: '#FFFF00',
      accent: '#111',
      category: 'Satellite',
      riders: ['Fabio Di Giannantonio #49', 'Franco Morbidelli #21'],
      flag: '🇮🇹',
      founded: 2022,
      titles: 0,
    },
    {
      name: 'Gresini Racing MotoGP',
      manufacturer: 'Ducati',
      bike: 'Desmosedici GP25',
      color: '#00AAFF',
      accent: '#fff',
      category: 'Satellite',
      riders: ['Álex Márquez #73', 'Fermín Aldeguer #54'],
      flag: '🇮🇹',
      founded: 2001,
      titles: 0,
    },
    {
      name: 'Trackhouse Racing',
      manufacturer: 'Aprilia',
      bike: 'RS-GP25',
      color: '#FF3366',
      accent: '#fff',
      category: 'Satellite',
      riders: ['Raúl Fernández #25', 'Ai Ogura #79'],
      flag: '🇺🇸',
      founded: 2023,
      titles: 0,
    },
    {
      name: 'Red Bull KTM Tech3',
      manufacturer: 'KTM',
      bike: 'RC16',
      color: '#FF4400',
      accent: '#fff',
      category: 'Satellite',
      riders: ['Maverick Viñales #12', 'Enea Bastianini #23'],
      flag: '🇫🇷',
      founded: 1996,
      titles: 0,
    },
    {
      name: 'LCR Honda',
      manufacturer: 'Honda',
      bike: 'RC213V',
      color: '#009900',
      accent: '#fff',
      category: 'Satellite',
      riders: ['Johann Zarco #5', 'Diogo Moreira #11'],
      flag: '🇲🇨',
      founded: 2006,
      titles: 0,
    },
  ];

  function renderTeamCard(team) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.style.setProperty('--team-color', team.color);
    card.style.setProperty('--team-accent', team.accent);

    const ridersHtml = team.riders.map(r => `<div class="team-rider">🏍️ ${escapeHtml(r)}</div>`).join('');

    const categoryClass = team.category === 'Factory' ? 'team-cat-factory' : 'team-cat-satellite';

    card.innerHTML = `
      <div class="team-header">
        <div class="team-manufacturer-stripe"></div>
        <div class="team-top-row">
          <span class="team-category ${categoryClass}">${team.category}</span>
          <span class="team-flag">${team.flag}</span>
        </div>
        <div class="team-name">${escapeHtml(team.name)}</div>
        <div class="team-bike">${escapeHtml(team.bike)}</div>
      </div>
      <div class="team-body">
        <div class="team-riders-label">2026 RIDERS</div>
        <div class="team-riders">${ridersHtml}</div>
        <div class="team-stats-row">
          <div class="team-stat"><span>Founded</span><strong>${team.founded}</strong></div>
          <div class="team-stat"><span>WC Titles</span><strong>${team.titles}</strong></div>
          <div class="team-stat"><span>Bike</span><strong>${escapeHtml(team.manufacturer)}</strong></div>
        </div>
      </div>
    `;
    return card;
  }

  function loadTeams() {
    const grid = document.getElementById('teams-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Group by category
    const factory = TEAMS_2026.filter(t => t.category === 'Factory');
    const satellite = TEAMS_2026.filter(t => t.category === 'Satellite');

    const factoryHeader = document.createElement('div');
    factoryHeader.className = 'teams-section-header';
    factoryHeader.innerHTML = '<h2>🏭 Factory Teams</h2>';
    grid.appendChild(factoryHeader);

    const factoryGrid = document.createElement('div');
    factoryGrid.className = 'teams-inner-grid';
    factory.forEach(t => factoryGrid.appendChild(renderTeamCard(t)));
    grid.appendChild(factoryGrid);

    const satHeader = document.createElement('div');
    satHeader.className = 'teams-section-header';
    satHeader.innerHTML = '<h2>🛠️ Satellite Teams</h2>';
    grid.appendChild(satHeader);

    const satGrid = document.createElement('div');
    satGrid.className = 'teams-inner-grid';
    satellite.forEach(t => satGrid.appendChild(renderTeamCard(t)));
    grid.appendChild(satGrid);
  }

  return { loadTeams };
})();
