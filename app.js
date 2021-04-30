const express = require("express");

const expressLayouts = require('express-ejs-layouts');

const bodyParser=require("body-parser");
const mongoose = require("mongoose");
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport");
const { ensureAuthenticated } = require('./config/auth');
const { on } = require("./models/User");

const app=express();

//Passport config
require('./config/passport')(passport);

//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

app.use(express.static("public")); 
app.use(bodyParser.urlencoded({extended :true}))

//Express Session
app.use(session({
    secret : 'secret',
    resave: true,
    saveUninitialized : true
}));

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());

//Global Variables
app.use(function(req,res,next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

//Routes

app.use("/users", require('./routes/users'));

mongoose.connect('mongodb://localhost:27017/questionsDB', {useNewUrlParser: true, useUnifiedTopology: true});
/****************************************************************************************************** */

/*************add user in schema after login */
const schemaQuestion= new mongoose.Schema({
    questionText: String,
    userWithQuestion:String,
    realUserWithQuestion:String,
    comments:[{commentText:String,userName:String}]

})
const questions = mongoose.model('Question',schemaQuestion);


function min(a,b) {
    if (a<b){
        return a;
    }
    return b;
}


app.get("/",ensureAuthenticated ,function (req,res) {
    res.render("home.ejs",{
        name : req.user.name
    });
})
for (let i = 1; i < 6; i++) {
   
    app.get("/"+String(i),ensureAuthenticated,function (req,res) {
        questions.find({},function (err,questionsUploaded) {
            if(questionsUploaded.length-(i-1)*100>0){
            res.render("index.ejs",{question:questionsUploaded.slice(-550,),pageNumber:i,pageNum:i,numberOfQues:min(questionsUploaded.length-(i-1)*100,100),user:req.user.name});
            }
            else{res.render("noQues.ejs")}
        })
        
})
}
app.post("/",function (req,res) {
    var newQues=req.body.newQues;
    var asAnonymous = req.body.asAnonymous;
    if (asAnonymous=="on") {
    var userNameHere="Anonymous"
    }
    else{
        userNameHere=req.user.name
    }
    var q1 = new questions({questionText:newQues,userWithQuestion:userNameHere,realUserWithQuestion:req.user.email})
    questions.insertMany([q1],function (err) {
        if(err){console.log(err);}
        else{ res.redirect('/1');}
    });
  
})

app.post("/comment",function (req,res){
    var newComment=req.body.commentText;
    var quesID=req.body.submitComment;
    questions.findOneAndUpdate(
        {_id:quesID},
        {$push : {comments:{commentText:newComment,userName:req.user.name}}},
        function (e,s) {
            if(e){console.log(e);}
            else{res.redirect('/1');}
        }
    )
    
    
})
//////////////******************  only uncomment to add elements in databse for testing  *********** */
// for (let i = 300; i < 601; i++) {
//     var aaa=new questions({questionText:i,userWithQuestion:"Temporary User"});
//     questions.insertMany([aaa],function (err) {
//         if(err){console.log(err)};        
//     });
// }





app.listen(3000);
