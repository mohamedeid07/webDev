const express = require('express')
const router = express.Router()
const User = require('../models/User')
const bcrypt = require('bcryptjs')

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

module.exports = router