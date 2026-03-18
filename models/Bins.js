const mongoose=require('mongoose');

const BinsSchema=new mongoose.Schema({
    binCode:{
        type:String,
        unique:true
    },
    location:{
        type:String,
        required:true
    },
    capacity:{
        type:Number,
        required:true
    },
    currentFillLevel:{
        type:Number,
        required:true   
    },
    status:{
        type:String,    
        enum:['empty','half-full','full'],
        default:'empty'
    },
    lastEmptied:{
        type:Date,
        default:Date.now
    },
    locationCoordinates:{
        type:{
            type:String,
            enum:['Point'],
            required:true
        },
        coordinates:{
            type:[Number],
            required:true
        }
    },
     authority: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staffs'
        },
        name: {
            type: String,
            required: true
        },
        contact: {
            type: Number, 
            required: true
        },
        email: {
            type: String,
            optional: true
        }
    }
},{timestamps:true});
module.exports=mongoose.model('Bins',BinsSchema);