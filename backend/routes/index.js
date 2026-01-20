// === backend/routes/index.js (update) ===
const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
res.send('Welcome to JalSetu API');
});


router.use('/complaints', require('./complaints'));
router.use('/tickets', require('./tickets'));
router.use('/sensors', require('./sensors'));


module.exports = router;