const express = require('express')
const router = express.Router()
const { ensureAuthenticated } = require('../config/auth')

router.get('/', (req,res) => res.render('welcome'))

router.get('/dashboard', ensureAuthenticated, (req, res) =>
    res.render('dashboard', {
        name: req.user.name,
        message: (req.user.emailVerified)? 'verified':'not verified'
    }
    ))

module.exports = router