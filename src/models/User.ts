// src/models/User.ts
import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, getDefaultPermissions } from '../types/index.js';

const permissionsSchema = new Schema(
  {
    canCreate: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canPublish: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    temporaryPassword: {
      type: String,
      select: false,
    },
    isTemporaryPassword: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  
    role: {
  type: String,
  enum: [
    'super_admin',
    'gallery_admin',
    'news_admin',
    'history_admin',
    'entertainment_admin',
    'health_admin',
    'technology_admin',
    'vacancy_admin',
    'viewer',
  ],
  default: 'viewer',
},
  department: {
  type: String,
  trim: true,
},
  isActive: {
  type: Boolean,
  default: true,
},
  lastLogin: {
  type: Date,
},
  permissions: {
  type: permissionsSchema,
  default: () => getDefaultPermissions('viewer'),
},
  },

{ timestamps: true }
);

userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return;
});

// Keep permissions in sync with role
userSchema.pre('save', function (next) {
  if (this.isModified('role') || this.isNew) {
    this.permissions = getDefaultPermissions(this.role as UserRole);
  }
  return;
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

// Never leak the password hasha
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as { password?: string }).password;
    return ret;
  },
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
