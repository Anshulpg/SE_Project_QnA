const express = require("express");
const bodyParser=require("body-parser");
const mongoose = require("mongoose");

const app=express();
app.set('view engine', 'ejs');
app.use(express.static("public")); 
app.use(bodyParser.urlencoded({extended :true}))

mongoose.connect('mongodb://localhost:27017/questionsDB', {useNewUrlParser: true, useUnifiedTopology: true});
/****************************************************************************************************** */

/*************add user in schema after login */
const schemaQuestion= new mongoose.Schema({
    questionText: String,
    comments:[{commentText:String}]

})
const questions = mongoose.model('Question',schemaQuestion);


app.get("/",function (req,res) {
    res.render("home.ejs");
})
for (let i = 1; i < 6; i++) {
   
    app.get("/"+String(i),function (req,res) {
        questions.find({},function (err,questionsUploaded) {
            res.render("index.ejs",{question:questionsUploaded});
        })
        
})
}
app.post("/",function (req,res) {
    var newQues=req.body.newQues;
    var q1 = new questions({questionText:newQues})
    questions.insertMany([q1],function (err) {
        if(err){console.log(err);}
        else{ res.redirect("/1");}
    });
   
})

app.post("/comment",function (req,res){
    var newComment=req.body.commentText;
    var quesID=req.body.submitComment;
    //console.log(newComment);
    // questions.find({_id:quesID},function (err,d) {
    //     let x=d[0].comments;
    //     console.log(x)
    //     x.push({comment:newComment});
    //     console.log(x);
    //     questions.findByIdAndUpdate(quesID,{comments:x},function (err,docs) {
    //     if(err){console.log(err)};
    // })
    // });
    questions.findOneAndUpdate(
        {_id:quesID},
        {$push : {comments:{commentText:newComment}}},
        function (e,s) {
            if(e){console.log(e);}
        }
    )
   
    res.redirect("/1");
})


/********************************************* 404 and inaccesebile things */

app.get("/:anything",function (req,res) {
    res.redirect('/');
})


app.listen(3000);
