const express = require("express");
const bodyParser=require("body-parser");

const app=express();
app.set('view engine', 'ejs');
app.use(express.static("public")); 
app.use(bodyParser.urlencoded({extended :true}))

var l=[];
for (let i = 0; i < 407; i++) {
    l.push(i+1);
    
}
// app.get("/",function (req,res) {
//     res.render("index.ejs",{question:l.slice(0,100)});
// })
for (let i = 1; i < 6; i++) {
   
    app.get("/"+String(i),function (req,res) {
        res.render("index.ejs",{question:l.slice((i-1)*100,(i)*100)});
})
}
app.post("/",function (req,res) {
    var newQues=req.body.newQues;
    l.push(newQues);
    res.redirect("/5");
})

app.listen(3000);
