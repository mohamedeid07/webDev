const User = require('../models/User')
module.exports = () => {
    User.deleteMany({})
        .then(()=> console.log('deleted all users'))
        .catch((err)=> console.log(err))
}