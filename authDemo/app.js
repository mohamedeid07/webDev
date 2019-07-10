const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const mongoose = require('mongoose')
const flash = require('connect-flash')
const session = require('express-session')
const passport = require('passport')

const app = express();

const PORT = process.env.PORT || 5000

// public folder setup
app.use(express.static(__dirname + "/public"))

// dotenv config
require('dotenv').config()

// passport config
require('./config/passport')(passport)

// DB Config
const db = require('./config/keys').MongoURI

//Mongo
mongoose.connect(db, {useNewUrlParser: true, dbName: 'authDemoDB'})
    .then(()=> console.log("Database Conntected!"))
    .catch((err)=> console.log(err))

// reseting Database
//require('./config/reset')()

//EJS
app.use(expressLayouts)
app.set('view engine', 'ejs')

//body parser
app.use(express.urlencoded({extended: false}))

// Express session
app.use(session({
    secret: 'james delaney',
    resave: true,
    saveUninitialized: true
}))

// passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash())

//Global variables
app.use((req, res, next)=>{
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
})



//Routes
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/user'))

app.listen(PORT, console.log('Server Started on port '+PORT))