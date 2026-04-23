const express = require('express');
const rateLimit = require('express-rate-limit');
const { processMessage, getSuggestions, summarizePDF, extractPoints, extractAndSave, generateRoadmap, goalChat, getChatHistory, clearChatHistory, generateQuestions } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many AI requests, slow down.' },
});

const router = express.Router();
router.use(protect);
router.use(aiLimiter);

router.post('/chat', processMessage);
router.get('/suggestions', getSuggestions);
router.post('/summarize', summarizePDF);
router.post('/extract', extractPoints);
router.post('/extract-and-save', extractAndSave);
router.post('/roadmap', generateRoadmap);
router.post('/goal-chat', goalChat);
router.post('/generate-questions', generateQuestions);
router.get('/history', getChatHistory);
router.delete('/history', clearChatHistory);

module.exports = router;
