const Report = require('../models/Report');

exports.createReport = async (req, res) => {
  try {
    const { targetType, targetListing, targetUser, reason, description } = req.body;
    const report = await Report.create({
      reporter: req.user._id, targetType,
      targetListing: targetType === 'listing' ? targetListing : undefined,
      targetUser: targetType === 'user' ? targetUser : undefined,
      reason, description
    });
    res.status(201).json({ success: true, report, message: 'Report submitted. Thank you.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
