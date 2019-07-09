const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const mongoose = require('mongoose')
const flash = require('connect-flash')
const session = require('express-session')
const app = express();

const PORT = process.env.PORT || 5000

// DB Config
const db = require('./config/keys').MongoURI

//Mongo
mongoose.connect(db, {useNewUrlParser: true, dbName: 'authDemoDB'})
    .then(()=> console.log("Database Conntected!"))
    .catch((err)=> console.log(err))

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

// Connect Flash
app.use(flash())

//Global variables
app.use((req, res, next)=>{
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    next()
})
//Routes
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/user'))

app.listen(PORT, console.log('Server Started on port '+PORT))