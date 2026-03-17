const TEAM_CONFIG = {
    'mercedes': { color: '#27F4D2', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/mercedes/2026mercedescarright.png' },
    'ferrari': { color: '#E80020', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/ferrari/2026ferraricarright.png' },
    'mclaren': { color: '#FF8000', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/mclaren/2026mclarencarright.png' },
    'audi': { color: '#F50537', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/audi/2026audicarright.png' },
    'cadillac': { color: '#FFD700', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/cadillac/2026cadillaccarright.png' },
    'red_bull': { color: '#3671C6', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/redbullracing/2026redbullracingcarright.png' },
    'aston_martin': { color: '#229971', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/astonmartin/2026astonmartincarright.png' },
    'haas': { color: '#B6BABD', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/haasf1team/2026haasf1teamcarright.png' },
    'rb': { color: '#6692FF', img: 'https://media.formula1.com/image/upload/c_lfill,h_224/q_auto/d_common:f1:2026:fallback:car:2026fallbackcarright.webp/v1740000000/common/f1/2026/racingbulls/2026racingbullscarright.webp' },
    'alpine': { color: '#0093CC', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/alpine/2026alpinecarright.png' },
    'williams': { color: '#64C4FF', img: 'https://media.formula1.com/image/upload/f_auto,q_auto/v1740000000/common/f1/2026/williams/2026williamscarright.png' }
};

// Middle-Out Lane Order: Center, Inner-Right, Inner-Left, Outer-Right, Outer-Left
const LANE_OFFSETS = ["50%", "90%", "10%", "77%", "23%", "38%", "62%"];
const VERTICAL_BUFFER = 80; // Pixels needed between cars in the same lane

async function syncData() {
    try {
        const year = 2026;
        const [dRes, cRes] = await Promise.all([
            fetch(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`).then(r => r.json()),
            fetch(`https://api.jolpi.ca/ergast/f1/${year}/constructorStandings.json`).then(r => r.json())
        ]);

        const drivers = dRes.MRData.StandingsTable.StandingsLists[0].DriverStandings;
        const teams = cRes.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;

        renderTrack('drivers-layer', drivers, 'driver');
        renderTrack('constructors-layer', teams, 'team');
        document.getElementById('status').innerText = `Live Data Synced: ${new Date().toLocaleTimeString()}`;
    } catch (e) {
        document.getElementById('status').innerText = "Sync Error: API Connection Failed";
    }
}

function renderTrack(layerId, data, mode) {
    const layer = document.getElementById(layerId);
    if (!layer) return;
    
    const trackHeight = layer.parentElement.offsetHeight - 100;
    const maxPoints = Math.max(...data.map(d => parseFloat(d.points)));
    const sortedData = [...data].sort((a, b) => b.points - a.points);
    let laneMemory = Array(LANE_OFFSETS.length).fill(-200);

    sortedData.forEach((entry, index) => {
        const points = parseFloat(entry.points);
        
        // --- ADDED: ZERO POINTS SPECIAL HANDLING ---
        let yPos;
        let chosenLane;

        if (maxPoints === 0 || points === 0) {
            // If points are 0, stick them to the bottom
            yPos = trackHeight;
            // Spread them across lanes using the index to ensure even distribution
            chosenLane = index % LANE_OFFSETS.length;
        } else {
            // Standard Proportional Y calculation
            yPos = ((maxPoints - points) / maxPoints) * trackHeight;

            // Middle-out logic for non-zero points
            chosenLane = 0; 
            for (let l = 0; l < LANE_OFFSETS.length; l++) {
                if (yPos > laneMemory[l] + VERTICAL_BUFFER) {
                    chosenLane = l;
                    break;
                }
            }
        }
        // --------------------------------------------

        laneMemory[chosenLane] = yPos;

        // ... rest of your DOM creation logic remains the same ...
        const teamId = mode === 'driver' ? entry.Constructors[0].constructorId : entry.Constructor.constructorId;
        // etc...
    });
}
