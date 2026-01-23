const asyncHandler = require('../utils/asyncHandler');

module.exports = (db) => ({
  getEquityData: asyncHandler(async (req, res) => {
    const result = await db.query(`
      SELECT 
        name,
        equity_score,
        avg_supply_hours
      FROM wards
      ORDER BY equity_score ASC
    `);

    res.json({
      success: true,
      wards: result.rows
    });
  })
});
