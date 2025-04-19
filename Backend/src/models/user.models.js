import mongoose from 'mongoose';
import crypto from 'crypto'; 

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String, 
            required: true,
            unique: true,
        },
        fullname: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: function() {
                return !this.googleId;
            },
            minlength: 6,
        },
        profilepic: {
            type: String,
            default: "",
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // Only enforces uniqueness if field exists
        },
        authMethod: {
            type: String,
            required: true,
            enum: ['local', 'google'],
            default: 'local'
        }
    },
    {timestamps: true}
);

// Pre-save middleware to handle OAuth users
userSchema.pre('save', function(next) {
    // If this is a Google user and no password is set, generate a random one
    if (this.googleId && !this.password) {
        // Generate a secure random string that won't be used for actual login
        this.password = crypto.randomBytes(32).toString('hex');
    }
    next();
});

const User = mongoose.model('User', userSchema);
export default User;