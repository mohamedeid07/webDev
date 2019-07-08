const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const app = express();

const PORT = process.env.PORT || 5000

//EJS
app.use(expressLayouts)
app.set('view engine', 'ejs')

//Routes
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/user'))

app.listen(PORT, console.log('Server Started on port '+PORT))