const Campground = require('../models/campground');
const {cloudinary} = require('../cloudinary');
const mapBoxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mapBoxGeocoding({accessToken:mapBoxToken});
module.exports.homePage = async (req,res)=>{
    const camps=await Campground.find({});
    res.render('campgrounds/index.ejs',{camps}); 
}
module.exports.renderNewCampgroundForm = (req,res)=>{
    res.render('campgrounds/new.ejs');
}
module.exports.makeNewCampground = async (req,res,next)=>{
    const geoInfo = await geocoder.forwardGeocode({
        query:req.body.campground.location,
        limit:1 
    }).send();
    const camp=new Campground(req.body.campground);
    camp.geometry=geoInfo.body.features[0].geometry;
    camp.author=req.user._id;
    camp.image = req.files.map(f =>({url:f.path,filename:f.filename}));
    await camp.save();
    console.log(camp);
    req.flash('success','Campground made Successfully');
    res.redirect(`/campgrounds/${camp._id}`);
}
module.exports.singleCampground = async (req,res)=>{
    const {id}=req.params;
    const camp=await Campground.findById(id).populate({
        path:'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if(!camp){
        req.flash('error','Campground not found');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show.ejs',{camp});
}
module.exports.renderUpdateCampgroundForm = async (req,res)=>{
    const {id}=req.params;
    const camp=await Campground.findById(id);
    if(!camp){
        req.flash('error','Campground not found');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/update',{camp});
}
module.exports.updateCampground = async (req,res)=>{
    const {id}=req.params;
    const camp=await Campground.findByIdAndUpdate(id,{...req.body.campground});
    const temp = req.files.map((img)=>({url:img.path,filename:img.filename}));
    camp.image = camp.image.concat(temp);
    await camp.save();
    if(req.body.deleteImages){
        for(let f of req.body.deleteImages){
            await cloudinary.uploader.destroy(f);
        }
        await Campground.updateOne({$pull:{images:{filename:{$in: req.body.deleteImages}}}})
    }
    req.flash('success','Successfully updated the campground');
    res.redirect(`/campgrounds/${id}`)
}
module.exports.deleteCampground = async (req,res)=>{
    const {id}=req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success','Successfully deleted the campground');
    res.redirect('/campgrounds');
}

