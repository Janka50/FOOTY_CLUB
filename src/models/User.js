const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {  // Changed from passwordHash to password
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password'  // This maps to 'password' column in database
  },
  accountType: {
    type: DataTypes.ENUM('fan', 'team', 'admin'),
    allowNull: false,
    defaultValue: 'fan',
    field: 'account_type'
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'full_name'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatarUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'avatar_url'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  },
  socialMedia: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'social_media'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeBulkCreate: async (users) => {
      for (const user of users) {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
User.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    username: this.username,
    email: this.email,
    accountType: this.accountType,
    fullName: this.fullName,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    isVerified: this.isVerified,
    socialMedia: this.socialMedia,
    createdAt: this.createdAt
  };
};

module.exports = User;