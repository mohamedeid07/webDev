const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoClient = require('mongodb').MongoClient
const { check, validationResult } = require('express-validator')
const app = express()
const port = 3000
const User = require('./models/user');
var db
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}))

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/dashboard');
    } else {
        next();
    }    
};

app.get('/', sessionChecker, (req, res) => {
    db.collection('products').find().toArray((err, result) => {
        if (err) return console.log(err)
        console.log("products recieved")
        res.render('index', {products: result})
    })
})

app.get('/product/new', sessionChecker, (req, res) => {
    res.render('products/new');
})
app.get('/search', sessionChecker, (req, res) => {
    console.log("search route")
    db.collection('products').find(
        { $or: [ { name: req.query.search }, { category: req.query.search } ] }
        ).toArray((err, result) => {
        if (err) return console.log(err)
        console.log("products recieved")
        res.render('index', {products: result})
    })
})
app.post('/products', sessionChecker, (req, res) => {
    db.collection('products').insertOne(req.body, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/')
    })
})

app.get('/user/new', sessionChecker, (req, res) => {
    res.render('users/new');
})

app.post('/users', sessionChecker,[
    // username must be an email
    check('email').isEmail(),
    // password must be at least 6 chars long
    check('password').isLength({ min: 6 })
  ] ,(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log({ errors: errors.array() })
        res.redirect('/user/new')
    } else {
        
        res.redirect('/')
    }
    
})

MongoClient.connect('mongodb+srv://mohamedeid:1911998@cluster0-nmadd.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true }, (err, client) => {
  if (err) return console.log(err)
  db = client.db('products') 
  app.listen(port, () => console.log(`App listening on port ${port}!`))
})
