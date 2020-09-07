// import bcrypt for password security
const bcrypt = require("bcryptjs")
// import database
const userCollection = require("../db").db().collection("users")
// import validator
const validator = require("validator")
// import md5 package
const md5 = require("md5")

// model constructor function, 'data' is an object which is passed into the function
let User = function(data, getAvatar) {
    // set constructor properties
    this.data = data
    // create errors array property
    this.errors = []
    
    if(getAvatar == undefined) {getAvatar = false}
    if(getAvatar) {this.getAvatar()}
}

// clean up the data
User.prototype.cleanUp = function() {
    if(typeof(this.data.username) != "string") {this.data.username = ""}
    if(typeof(this.data.email) != "string") {this.data.email = ""}
    if(typeof(this.data.password) != "string") {this.data.password = ""}

    this.data = {
        username: this.data.username.trim().toLowerCase(),
        // trim() get rid of beginning and ending whitespaces, but not the inner ones
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if(this.data.username == "") {this.errors.push("please set a username")}
        if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){this.errors.push("username need to be letters mixed with numbers")}
        if(this.data.email == "") {this.errors.push("please set an email")}
        if(this.data.email !="" && !validator.isEmail(this.data.email)) {this.errors.push("not a valid email address")}
        if(this.data.password == "") {this.errors.push("please set a password")}
        if(this.data.password.length >0 && this.data.password.length <12){this.errors.push("password need be more than 12 symbols")}
        if(this.data.password.length >50) {this.errors.push("password is too long")}
        if(this.data.username.length >0 && this.data.username.length <6){this.errors.push("username need be more than 6 symbols")}
        if(this.data.username.length >20) {this.errors.push("username is too long")}
        
        // check if username has been already used
        let usernameExist = await userCollection.findOne({username: this.data.username})
        // findOne function resolves a database doc object if there is one, otherwise it resolves null object
        if(usernameExist) {
            this.errors.push("this username has been taken")
        }
        
        // check if email has been already used
        let emailExist = await userCollection.findOne({email: this.data.email})
        if(emailExist) {
            this.errors.push("this email has been registered")
        }
        resolve()
    })
}

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        userCollection.findOne({username: this.data.username}).then((attemptedOne) => {
            if(attemptedOne && bcrypt.compareSync(this.data.password, attemptedOne.password)) {
                this.data = attemptedOne
                this.getAvatar()
                resolve("successfully logged in")
            } else {
                reject("username or password is not correct")
            }
        }).catch(function() {
            reject("sorry, please try again later!")
        }) 
    })    
}

User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {
        // validation of the user input, call validate constructor method
        this.cleanUp()
        await this.validate()
        
        // if no errors of validation, then put the data to database
        if (!this.errors.length) {
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await userCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        } else {
            reject(this.errors)
        }
        
    })
}

User.prototype.getAvatar = function() {
    //constructor properties and functions 
    this.avatar = `https://s.gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username) {
    return new Promise(function(resolve, reject) {
        if(typeof(username) != "string") {
            reject()
            return
        }
        userCollection.findOne({username: username}).then(function(userDoc) {
            if(userDoc) {
                userDoc1 = new User(userDoc, true)
                userDoc2 = {
                    _id: userDoc1.data._id,
                    username: userDoc1.data.username,
                    avatar: userDoc1.avatar
                }
                resolve(userDoc2)
            } else {
                reject()
            }
        }).catch(function() {
            reject("try again later")
        })
    }) 
}

module.exports = User