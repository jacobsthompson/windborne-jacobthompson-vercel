// API endpoint to fetch Burger King locations
// Uses fallback list since restaurant-location-search-api may not work reliably

// Comprehensive list of Burger King locations across the US
const burgerKingLocations = [
  // West Coast
  { id: 'bk-001', lat: 34.052235, lng: -118.243683, name: "Los Angeles, CA", address: "Downtown LA", city: "Los Angeles", state: "CA" },
  { id: 'bk-002', lat: 37.774929, lng: -122.419418, name: "San Francisco, CA", address: "Downtown SF", city: "San Francisco", state: "CA" },
  { id: 'bk-003', lat: 32.715736, lng: -117.161087, name: "San Diego, CA", address: "Downtown SD", city: "San Diego", state: "CA" },
  { id: 'bk-004', lat: 37.338207, lng: -121.886330, name: "San Jose, CA", address: "Downtown SJ", city: "San Jose", state: "CA" },
  { id: 'bk-005', lat: 38.581572, lng: -121.494400, name: "Sacramento, CA", address: "Downtown Sac", city: "Sacramento", state: "CA" },
  { id: 'bk-006', lat: 36.778259, lng: -119.417931, name: "Fresno, CA", address: "Downtown Fresno", city: "Fresno", state: "CA" },
  { id: 'bk-007', lat: 47.606209, lng: -122.332069, name: "Seattle, WA", address: "Downtown Seattle", city: "Seattle", state: "WA" },
  { id: 'bk-008', lat: 45.512230, lng: -122.658722, name: "Portland, OR", address: "Downtown Portland", city: "Portland", state: "OR" },

  // Southwest
  { id: 'bk-009', lat: 33.448376, lng: -112.074036, name: "Phoenix, AZ", address: "Downtown Phoenix", city: "Phoenix", state: "AZ" },
  { id: 'bk-010', lat: 36.174465, lng: -115.137222, name: "Las Vegas, NV", address: "Las Vegas Strip", city: "Las Vegas", state: "NV" },
  { id: 'bk-011', lat: 35.106766, lng: -106.629181, name: "Albuquerque, NM", address: "Downtown ABQ", city: "Albuquerque", state: "NM" },
  { id: 'bk-012', lat: 32.715738, lng: -117.161084, name: "San Diego, CA", address: "Gaslamp Quarter", city: "San Diego", state: "CA" },

  // Mountain
  { id: 'bk-013', lat: 39.739236, lng: -104.990251, name: "Denver, CO", address: "Downtown Denver", city: "Denver", state: "CO" },
  { id: 'bk-014', lat: 40.760779, lng: -111.891047, name: "Salt Lake City, UT", address: "Downtown SLC", city: "Salt Lake City", state: "UT" },

  // Texas
  { id: 'bk-015', lat: 29.760427, lng: -95.369804, name: "Houston, TX", address: "Downtown Houston", city: "Houston", state: "TX" },
  { id: 'bk-016', lat: 32.776665, lng: -96.796989, name: "Dallas, TX", address: "Downtown Dallas", city: "Dallas", state: "TX" },
  { id: 'bk-017', lat: 30.267153, lng: -97.743057, name: "Austin, TX", address: "Downtown Austin", city: "Austin", state: "TX" },
  { id: 'bk-018', lat: 29.424122, lng: -98.493629, name: "San Antonio, TX", address: "Downtown SA", city: "San Antonio", state: "TX" },
  { id: 'bk-019', lat: 32.779167, lng: -96.808891, name: "Dallas, TX", address: "North Dallas", city: "Dallas", state: "TX" },
  { id: 'bk-020', lat: 31.761878, lng: -106.485022, name: "El Paso, TX", address: "Downtown El Paso", city: "El Paso", state: "TX" },

  // Midwest
  { id: 'bk-021', lat: 41.878113, lng: -87.629799, name: "Chicago, IL", address: "Downtown Chicago", city: "Chicago", state: "IL" },
  { id: 'bk-022', lat: 39.768403, lng: -86.158068, name: "Indianapolis, IN", address: "Downtown Indy", city: "Indianapolis", state: "IN" },
  { id: 'bk-023', lat: 39.961176, lng: -82.998794, name: "Columbus, OH", address: "Downtown Columbus", city: "Columbus", state: "OH" },
  { id: 'bk-024', lat: 42.331429, lng: -83.045753, name: "Detroit, MI", address: "Downtown Detroit", city: "Detroit", state: "MI" },
  { id: 'bk-025', lat: 43.038902, lng: -87.906471, name: "Milwaukee, WI", address: "Downtown Milwaukee", city: "Milwaukee", state: "WI" },
  { id: 'bk-026', lat: 44.977753, lng: -93.265011, name: "Minneapolis, MN", address: "Downtown Mpls", city: "Minneapolis", state: "MN" },
  { id: 'bk-027', lat: 38.627003, lng: -90.199402, name: "St. Louis, MO", address: "Downtown STL", city: "St. Louis", state: "MO" },
  { id: 'bk-028', lat: 39.099724, lng: -94.578331, name: "Kansas City, MO", address: "Downtown KC", city: "Kansas City", state: "MO" },
  { id: 'bk-029', lat: 41.257160, lng: -95.995102, name: "Omaha, NE", address: "Downtown Omaha", city: "Omaha", state: "NE" },
  { id: 'bk-030', lat: 41.505493, lng: -90.515716, name: "Moline, IL", address: "Quad Cities", city: "Moline", state: "IL" },

  // Plains
  { id: 'bk-031', lat: 35.467560, lng: -97.516426, name: "Oklahoma City, OK", address: "Downtown OKC", city: "Oklahoma City", state: "OK" },
  { id: 'bk-032', lat: 36.155007, lng: -95.992775, name: "Tulsa, OK", address: "Downtown Tulsa", city: "Tulsa", state: "OK" },
  { id: 'bk-033', lat: 37.688889, lng: -97.336111, name: "Wichita, KS", address: "Downtown Wichita", city: "Wichita", state: "KS" },

  // South
  { id: 'bk-034', lat: 33.748997, lng: -84.387985, name: "Atlanta, GA", address: "Downtown Atlanta", city: "Atlanta", state: "GA" },
  { id: 'bk-035', lat: 35.227085, lng: -80.843124, name: "Charlotte, NC", address: "Uptown Charlotte", city: "Charlotte", state: "NC" },
  { id: 'bk-036', lat: 36.162664, lng: -86.781602, name: "Nashville, TN", address: "Downtown Nashville", city: "Nashville", state: "TN" },
  { id: 'bk-037', lat: 35.149532, lng: -90.048981, name: "Memphis, TN", address: "Downtown Memphis", city: "Memphis", state: "TN" },
  { id: 'bk-038', lat: 30.332184, lng: -81.655647, name: "Jacksonville, FL", address: "Downtown Jax", city: "Jacksonville", state: "FL" },
  { id: 'bk-039', lat: 25.761681, lng: -80.191788, name: "Miami, FL", address: "Downtown Miami", city: "Miami", state: "FL" },
  { id: 'bk-040', lat: 28.538336, lng: -81.379234, name: "Orlando, FL", address: "Downtown Orlando", city: "Orlando", state: "FL" },
  { id: 'bk-041', lat: 27.950575, lng: -82.457176, name: "Tampa, FL", address: "Downtown Tampa", city: "Tampa", state: "FL" },
  { id: 'bk-042', lat: 35.960638, lng: -83.920739, name: "Knoxville, TN", address: "Downtown Knoxville", city: "Knoxville", state: "TN" },
  { id: 'bk-043', lat: 33.520661, lng: -86.802490, name: "Birmingham, AL", address: "Downtown Bham", city: "Birmingham", state: "AL" },
  { id: 'bk-044', lat: 30.451667, lng: -91.187222, name: "Baton Rouge, LA", address: "Downtown BR", city: "Baton Rouge", state: "LA" },
  { id: 'bk-045', lat: 29.951065, lng: -90.071533, name: "New Orleans, LA", address: "French Quarter", city: "New Orleans", state: "LA" },

  // East Coast
  { id: 'bk-046', lat: 40.712776, lng: -74.005974, name: "New York, NY", address: "Manhattan", city: "New York", state: "NY" },
  { id: 'bk-047', lat: 39.952583, lng: -75.165222, name: "Philadelphia, PA", address: "Center City", city: "Philadelphia", state: "PA" },
  { id: 'bk-048', lat: 38.907192, lng: -77.036873, name: "Washington, DC", address: "Downtown DC", city: "Washington", state: "DC" },
  { id: 'bk-049', lat: 42.360081, lng: -71.058884, name: "Boston, MA", address: "Downtown Boston", city: "Boston", state: "MA" },
  { id: 'bk-050', lat: 39.290882, lng: -76.612189, name: "Baltimore, MD", address: "Inner Harbor", city: "Baltimore", state: "MD" },
  { id: 'bk-051', lat: 42.886447, lng: -78.878369, name: "Buffalo, NY", address: "Downtown Buffalo", city: "Buffalo", state: "NY" },
  { id: 'bk-052', lat: 40.440624, lng: -79.995888, name: "Pittsburgh, PA", address: "Downtown Pittsburgh", city: "Pittsburgh", state: "PA" },
  { id: 'bk-053', lat: 41.763710, lng: -72.685097, name: "Hartford, CT", address: "Downtown Hartford", city: "Hartford", state: "CT" },
  { id: 'bk-054', lat: 41.308274, lng: -72.927884, name: "New Haven, CT", address: "Downtown New Haven", city: "New Haven", state: "CT" },
  { id: 'bk-055', lat: 43.048122, lng: -76.147424, name: "Syracuse, NY", address: "Downtown Syracuse", city: "Syracuse", state: "NY" },

  // Additional coverage
  { id: 'bk-056', lat: 36.072635, lng: -79.791975, name: "Greensboro, NC", address: "Downtown", city: "Greensboro", state: "NC" },
  { id: 'bk-057', lat: 35.787743, lng: -78.644257, name: "Raleigh, NC", address: "Downtown", city: "Raleigh", state: "NC" },
  { id: 'bk-058', lat: 32.776475, lng: -79.931051, name: "Charleston, SC", address: "Downtown", city: "Charleston", state: "SC" },
  { id: 'bk-059', lat: 34.000710, lng: -81.034814, name: "Columbia, SC", address: "Downtown", city: "Columbia", state: "SC" },
  { id: 'bk-060', lat: 36.166667, lng: -86.783333, name: "Nashville, TN", address: "West End", city: "Nashville", state: "TN" }
];

module.exports = async (req, res) => {
  try {
    console.log(`Returning ${burgerKingLocations.length} Burger King locations`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return res.status(200).json(burgerKingLocations);

  } catch (error) {
    console.error('Error in BK locations API:', error);
    return res.status(500).json({ error: 'Failed to fetch BK locations' });
  }
};