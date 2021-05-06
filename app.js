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

const User = require('./models/User');

//EJS
//app.use(expressLayouts);
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
    comments:[{commentText:String,userName:String,commentDate : String}],
    date : String

})
const questions = mongoose.model('Question',schemaQuestion);


const schemaFeedback = new mongoose.Schema({
    name:String,
    email:String,
    subject:String,
    message:String
})
const feedback = mongoose.model('Feedback',schemaFeedback);

function min(a,b) {
    if (a<b){
        return a;
    }
    return b;
}


app.get("/",function (req,res) {
    var t=0
    if(req.isAuthenticated()){
        t=1;
    }
    res.render("home_page.ejs",{
        t:t
    });
})
for (let i = 1; i < 6; i++) {
   
    app.get("/"+String(i),ensureAuthenticated,function (req,res) {
        questions.find({},function (err,questionsUploaded) {
            if(questionsUploaded.length-(i-1)*100>0){
            res.render("index.ejs",{question:questionsUploaded.slice(-550,),pageNumber:i,pageNum:i,userEmail:req.user.email,numberOfQues:min(questionsUploaded.length-(i-1)*100,100),user:req.user.name});
            }
            else{res.render("noQues.ejs",{userEmail:req.user.email})}
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
    var currentdate = new Date(); 
                var datetime =  currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes();
    var d = currentdate.toLocaleString();
    let today=new Date();
    let options={
        year:"numeric",
        day:"numeric",
        month:"long"
    };
    let minute={ hour: '2-digit', minute: '2-digit' };
    let timeof = today.toLocaleTimeString("en-us",minute);
    let day=today.toLocaleDateString("en-us",options);
    var q1 = new questions({questionText:newQues,userWithQuestion:userNameHere,realUserWithQuestion:req.user.email,date:day+" "+timeof});
    questions.insertMany([q1],function (err) {
        if(err){console.log(err);}
        else{ res.redirect('/1');}
    });
  
})



app.post("/comment",function (req,res){
    var newComment=req.body.commentText;
    var quesID=req.body.submitComment;
    var redir = req.headers.referer;
    //console.log(redir);
    var currentdate = new Date(); 
                var datetime =  currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes();
    let today=new Date();
    let options={
        year:"numeric",
        day:"numeric",
        month:"long"
    };
    let minute={ hour: '2-digit', minute: '2-digit' };
    let timeof = today.toLocaleTimeString("en-us",minute);
    let day=today.toLocaleDateString("en-us",options);
    questions.findOneAndUpdate(
        {_id:quesID},
        {$push : {comments:{commentText:newComment,userName:req.user.name,commentDate:day+" "+timeof}}},
        function (e,s) {
            if(e){console.log(e);}
            else{res.redirect(redir);}
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


/**////////////////////////****************************************** */ */

// for (let i = 300; i < 601; i++) {
//     var aaa="aaa";
//     questions.findOneAndUpdate(
//         {_id:"60941a3e188b1b1d049f333c"},
//         {$push : {comments:{commentText:aaa}}},
//         function (e,s) {
//             if(e){console.log(e);}
            
//         }
//     )
// }


app.get("/users/my-questions/:token",ensureAuthenticated,function (req,res) {
    const {token} = req.params;
    User.findOne({email:token},function (err,user) {
        if(err){res.redirect('/users/login')}
        //console.log(user);
        if(!user){
            res.redirect('/users/login');
        }
        else{
            if(user.email==req.user.email){
                questions.find({realUserWithQuestion:user.email},function (err,questionsUploaded) {
                    if(err){console.log(err)};
                    //console.log(questionsUploaded);
                    res.render("myQues.ejs",{question:questionsUploaded,user:req.user.name, userEmail:req.user.email});
                    
                    
                })
            }
            else{ res.redirect('/1');}
        }        
    })
})

app.post('/home/contact',function (req,res) {
    var name = req.body.name;
    var email = req.body.email;
    var subject = req.body.subject;
    var message = req.body.message;

    var feed1 = new feedback({name:name,email:email,subject:subject,message:message});

    feedback.insertMany([feed1],function (err) {
        if(err){console.log(err);}
        else{ res.redirect('/');}
    });

})

app.listen(3000);
