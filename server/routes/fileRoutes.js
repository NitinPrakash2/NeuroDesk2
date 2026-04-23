const express = require('express');
const { getFiles, createFile, deleteFile, getFileContent, updateFileSummary } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getFiles);
router.post('/', createFile);
router.get('/:id', getFileContent);
router.patch('/:id/summary', updateFileSummary);
router.delete('/:id', deleteFile);

module.exports = router;
