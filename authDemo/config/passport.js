const localStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Models
const User = require('../models/User')

module.exports = (passport) =>{
    passport.use(
        new localStrategy(
            {usernameField: 'email'},
            (email, password, done) => {
                // Match User
                User.findOne({email: email})
                    .then(user => {
                        // No user found
                        if(!user) return done(null, false, {message: 'email is not registered'})
                        
                        // match password
                        bcrypt.compare(password, user.password, (err, isMatch)=>{
                            if(err) throw err
                            if(isMatch){
                                return done(null, user)
                            } else {
                                return done(null, false, {message: 'Password incorrect'})
                            }
                        })
                    })
                    .catch(err => console.log(err))
            } 
        )
    )
    // session id set
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
}