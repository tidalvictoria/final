const express = require('express');
const router = express.Router();
const { addSubscriber } = require('../controllers/subscriberController');

// Public route to add an email to the launch list
router.post('/', addSubscriber);

module.exports = router;
