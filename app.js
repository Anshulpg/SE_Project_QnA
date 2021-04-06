const express = require("express");
const bodyParser=require("body-parser");

const app=express();
app.set('view engine', 'ejs');
app.use(express.static("public")); 
app.use(bodyParser.urlencoded({extended :true}))

var l=[];
for (let i = 0; i < 500; i++) {
    l.push(i+1);
    
}

app.get("/",function (req,res) {
    res.render("index.ejs",{question:l});
})

app.post("/",function (req,res) {
    var newQues=req.body.newQues;
    l.push(newQues);
    res.redirect("/");
})

app.listen(3000);
