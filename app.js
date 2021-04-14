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


function min(a,b) {
    if (a<b){
        return a;
    }
    return b;
}


app.get("/",function (req,res) {
    res.render("home.ejs");
})
for (let i = 1; i < 6; i++) {
   
    app.get("/"+String(i),function (req,res) {
        questions.find({},function (err,questionsUploaded) {
            if(questionsUploaded.length-(i-1)*100>0){
            res.render("index.ejs",{question:questionsUploaded.slice(-550,),pageNumber:i,pageNum:i,numberOfQues:min(questionsUploaded.length-(i-1)*100,100)});
            }
            else{res.render("noQues.ejs")}
        })
        
})
}
app.post("/",function (req,res) {
    var newQues=req.body.newQues;
    var q1 = new questions({questionText:newQues})
    questions.insertMany([q1],function (err) {
        if(err){console.log(err);}
        
    });
   res.redirect('/1');
})

app.post("/comment",function (req,res){
    var newComment=req.body.commentText;
    var quesID=req.body.submitComment;
    questions.findOneAndUpdate(
        {_id:quesID},
        {$push : {comments:{commentText:newComment}}},
        function (e,s) {
            if(e){console.log(e);}
            else{res.redirect('/1');}
        }
    )
    
    
})
//////////////******************  only uncomment to add elements in databse for testing  *********** */
// for (let i = 300; i < 701; i++) {
//     var aaa=new questions({questionText:i});
//     questions.insertMany([aaa],function (err) {
//         console.log(err);        
//     });
// }

app.listen(3000);
