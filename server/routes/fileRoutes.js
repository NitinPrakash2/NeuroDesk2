const express = require('express');
const { getFiles, createFile, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getFiles);
router.post('/', createFile);
router.delete('/:id', deleteFile);

module.exports = router;
