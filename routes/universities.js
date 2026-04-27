const express = require('express');
const router = express.Router();
const { getUniversities, getUniversity, createUniversity, updateUniversity, deleteUniversity } = require('../controllers/universityController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getUniversities);
router.get('/:id', getUniversity);
router.post('/', protect, authorize('admin'), createUniversity);
router.put('/:id', protect, authorize('admin'), updateUniversity);
router.delete('/:id', protect, authorize('admin'), deleteUniversity);

module.exports = router;
