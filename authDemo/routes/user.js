const express = require('express')
const router = express.Router()
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const async = require('async')
const nodemailer = require('nodemailer')
const crypto = require('crypto')

//login page
router.get('/login', (req,res) => res.render('login'))

//register page
router.get('/register', (req,res) => res.render('register'))

// register handle
router.post('/register',(req,res)=>{
    const { name, email, password, password2 } = req.body
    let errors = []
    //check
    if(!email || !name || !password || !password2){
        errors.push({msg: 'please fill in all fields!'})
    }
    if(password != password2){
        errors.push({msg: 'Passwords do not match'})
    }
    if(password.length < 6){
        errors.push({msg: 'Password should be at least 6 caracters long'})
    }
    if(errors.length > 0){
        res.render('register',{
            errors,
            email,
            name,
            password,
            password2
        })
    } else {
        //Validation passed
        User.findOne({email:email})
            .then(user => {
                if(user){
                    //User exists
                    errors.push({msg: 'Email is already registered!'})
                    res.render('register',{
                        errors,
                        email,
                        name,
                        password,
                        password2
                    })
                } else {
                    // register user
                    const newUser = new User({
                        name,
                        email,
                        password
                    })

                    // Hash pasword
                    bcrypt.genSalt(10,(err, salt)=> 
                        bcrypt.hash(newUser.password, salt, (err,hash) => {
                            if(err) throw err
                            // Set password to hashed
                            newUser.password = hash
                            // Save User
                            newUser.save()
                                .then(user =>{
                                    req.flash('success_msg', 'You are now registered and can login')
                                    res.redirect('/users/login')
                                })
                                .catch(err => console.log(err))
                        }
                    ))
                }
            })
    }
})

// Login handle
router.post('/login',(req, res, next)=>{
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
})

// Logout handle
router.get('/logout', (req,res)=>{
    req.logout()
    req.flash('success_msg','You are Logged out')
    res.redirect('/users/login')
})

// Reset password page
router.get('/forgot', (req, res)=> {
    res.render('forgot')
})

// Reset password handle
router.post('/forgot', (req, res, next)=> {
    async.waterfall([
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            const token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          User.findOne({ email: req.body.email }, function(err, user) {
            if (!user) {
              req.flash('error_msg', 'No account with that email address exists.');
              return res.redirect('/users/forgot');
            }
    
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
            user.save(function(err) {
              done(err, token, user);
            });
          });
        },
        function(token, user, done) {
          const smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
              user: 'jamesdelaneycompany@gmail.com',
              pass: process.env.GMAILPW
            }
          });
          const mailOptions = {
            to: user.email,
            from: 'jamesdelaneycompany@gmail.com',
            subject: 'Node.js Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            console.log('mail sent');
            req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
            done(err, 'done');
          });
        }
      ], function(err) {
        if (err) return next(err);
        res.redirect('/users/forgot');
      })
})

router.get('/reset/:token', (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error_msg', 'Password reset token is invalid or has expired.');
        return res.redirect('/users/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
  });

router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                if (!user) {
                    req.flash('error_msg', 'Password reset token is invalid or has expired.')
                    return res.redirect('back')
                }
                const { password, password2 } = req.body
                let errors = []
                if(password != password2){
                    errors.push({msg: 'Passwords do not match'})
                }
                if(password.length < 6){
                    errors.push({msg: 'Password should be at least 6 caracters long'})
                }
                if(errors.length > 0){
                    req.flash('error_msg', errors[0].msg)
                    res.redirect('back')
                } else {
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    // Hash pasword
                    bcrypt.genSalt(10,(err, salt)=> 
                        bcrypt.hash(password, salt, (err,hash) => {
                            if(err) throw err
                            // Set password to hashed
                            user.password = hash
                            // Save User
                            user.save()
                                .then(()=> done(null, user))
                                .catch(err => console.log(err))
                        }
                    ))
                }
            });
        },
        function (user, done) {
            const smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'jamesdelaneycompany@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'jamesdelaneycompany@mail.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash('success_msg', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function (err) {
        res.redirect('/users/login');
    });
});
module.exports = router