// gelen isteği ilgili controllera yönlendirir.
const express = require('express');
const router = express.Router(); 

// Standart olan kısım, bu fonk controllerdan import ediliyor.
const { register, login } = require('../controllers/auth.controller'); 

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// Yapılan işlemler export ediliyor.
module.exports = router;