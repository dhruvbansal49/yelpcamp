const express=require('express');
const mongoose=require('mongoose');
const path=require('path');
const ejsMate=require('ejs-mate');
const Campground=require('./models/campground');
const methodOverride=require('method-override');
const wrapasync=require('./utilities/wrapasync')

mongoose.connect("mongodb://localhost:27017/yelp-camp",{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true,
});


mongoose.set('useFindAndModify', false);

const db=mongoose.connection;
db.on("error",console.error.bind(console,"connection error:"));
db.once("open",()=>{
    console.log("Database connected");
})

const app=express();

app.engine('ejs',ejsMate);
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));

app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/campgrounds',async (req,res)=>{
    const camps=await Campground.find({});
    res.render('campgrounds/index.ejs',{camps}); 
})

app.get('/campgrounds/new',(req,res)=>{
    res.render('campgrounds/new.ejs');
})
app.post('/campgrounds',wrapasync(async (req,res,next)=>{
    
    const camp=new Campground(req.body.campground);
    await camp.save();
    res.redirect(`/campgrounds/${camp._id}`);
    
}))
app.get('/campgrounds/:id',async (req,res)=>{
    const {id}=req.params;
    const camp=await Campground.findById(id);
    res.render('campgrounds/show.ejs',{camp});
})
app.get('/campgrounds/:id/edit',async (req,res)=>{
    const {id}=req.params;
    const camp=await Campground.findById(id);
    res.render('campgrounds/update',{camp});
})
app.put('/campgrounds/:id',async (req,res)=>{
    const {id}=req.params;
    const camp=await Campground.findByIdAndUpdate(id,{...req.body.campground});
    res.redirect(`/campgrounds/${id}`)
})

app.delete('/campgrounds/:id',async (req,res)=>{
    const {id}=req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
})

app.use((err,req,res,next)=>{
    res.send("Error!!!!!")
})

app.listen(3000,()=>{
    console.log("Port 3000");
})