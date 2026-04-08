const express = require('express');
const { getMemories, createMemory, deleteMemory } = require('../controllers/memoryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getMemories);
router.post('/', createMemory);
router.delete('/:id', deleteMemory);

module.exports = router;
