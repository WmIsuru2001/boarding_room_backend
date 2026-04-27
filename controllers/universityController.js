const University = require('../models/University');

exports.getUniversities = async (req, res) => {
  try {
    const universities = await University.find({ isActive: true }).sort('name');
    res.json({ success: true, universities });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getUniversity = async (req, res) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, university });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createUniversity = async (req, res) => {
  try {
    const { name, shortName, city, country, emailDomains, coordinates, logo } = req.body;
    const university = await University.create({
      name, shortName, city, country,
      emailDomains: typeof emailDomains === 'string' ? JSON.parse(emailDomains) : emailDomains,
      location: { type: 'Point', coordinates: [coordinates.lng, coordinates.lat] },
      logo
    });
    res.status(201).json({ success: true, university });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateUniversity = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.body.coordinates) {
      updates.location = { type: 'Point', coordinates: [req.body.coordinates.lng, req.body.coordinates.lat] };
      delete updates.coordinates;
    }
    const university = await University.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!university) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, university });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteUniversity = async (req, res) => {
  try {
    const university = await University.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!university) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'University deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
