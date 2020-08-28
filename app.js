const express = require("express")
const app = express()
const router = require("./router")
const session = require("express-session")
const MongoStore = require("connect-mongo")(session)
const flash = require("connect-flash")

let sessionOptions = session({
    secret: "JavaScript is sooo goood",
    store: new MongoStore({client: require("./db")}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000*60*60*24, httpOnly: true}
})

app.use(sessionOptions)
app.use(flash())

app.set("views", "views")
app.set("view engine", "ejs")
app.use(express.static("public"))

app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(function(req, res, next) {
    // get visitor Id
    if(req.session.user) {
        req.visitorId = req.session.user._id
    } else {
        req.visitorId = 0
    }

    res.locals.user = req.session.user
    next()
})

app.use("/", router)






module.exports = app