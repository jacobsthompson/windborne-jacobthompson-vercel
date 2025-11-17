module.exports = async (req, res) => {
  const { offset } = req.query;
  const n = Number(offset);
  
  console.log(`API called with offset: ${offset}`);
  
  if (isNaN(n) || n < 0 || n > 23) {
    return res.status(400).json({ error: "Invalid offset" });
  }

  try {
    const url = `https://a.windbornesystems.com/treasure/${String(n).padStart(2, "0")}.json`;
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Bad response ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.length} balloons for offset ${offset}`);
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(data);
  } catch (e) {
    console.error(`Failed to fetch balloon data:`, e.message);
    return res.status(500).json({ error: "Failed to fetch", details: e.message });
  }
};