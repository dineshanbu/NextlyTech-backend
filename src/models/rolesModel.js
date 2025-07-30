const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    uppercase: true,
    enum: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'REVIEWER', 'USER'],
    default: 'USER'
  },
  description: {
    type: String,
    required: [true, 'Role description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  permissions: [{
    resource: {
      type: String,
      required: true,
      enum: ['users', 'categories', 'subcategories', 'reviews', 'comments', 'tech-news', 'static-pages', 'all']
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'publish', 'moderate']
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance
roleSchema.index({ name: 1 });

// Method to check if role has permission
roleSchema.methods.hasPermission = function(resource, action) {
  return this.permissions.some(permission => 
    (permission.resource === resource || permission.resource === 'all') &&
    permission.actions.includes(action)
  );
};

// Static method to create default roles
roleSchema.statics.createDefaultRoles = async function() {
  const defaultRoles = [
    {
      name: 'SUPER_ADMIN',
      description: 'Full system access',
      permissions: [{
        resource: 'all',
        actions: ['create', 'read', 'update', 'delete', 'publish', 'moderate']
      }]
    },
    {
      name: 'ADMIN',
      description: 'Administrative access to most features',
      permissions: [
        {
          resource: 'users',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'categories',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'subcategories',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'reviews',
          actions: ['create', 'read', 'update', 'delete', 'publish', 'moderate']
        },
        {
          resource: 'comments',
          actions: ['read', 'update', 'delete', 'moderate']
        },
        {
          resource: 'tech-news',
          actions: ['create', 'read', 'update', 'delete', 'publish']
        },
        {
          resource: 'static-pages',
          actions: ['create', 'read', 'update', 'delete']
        }
      ]
    },
    {
      name: 'EDITOR',
      description: 'Content creation and editing access',
      permissions: [
        {
          resource: 'reviews',
          actions: ['create', 'read', 'update', 'publish']
        },
        {
          resource: 'tech-news',
          actions: ['create', 'read', 'update', 'publish']
        },
        {
          resource: 'comments',
          actions: ['read', 'moderate']
        },
        {
          resource: 'categories',
          actions: ['read']
        },
        {
          resource: 'subcategories',
          actions: ['read']
        }
      ]
    },
    {
      name: 'REVIEWER',
      description: 'Product review creation access',
      permissions: [
        {
          resource: 'reviews',
          actions: ['create', 'read', 'update']
        },
        {
          resource: 'comments',
          actions: ['read']
        },
        {
          resource: 'categories',
          actions: ['read']
        },
        {
          resource: 'subcategories',
          actions: ['read']
        }
      ]
    },
    {
      name: 'USER',
      description: 'Basic user access',
      permissions: [
        {
          resource: 'reviews',
          actions: ['read']
        },
        {
          resource: 'comments',
          actions: ['create', 'read', 'update']
        },
        {
          resource: 'tech-news',
          actions: ['read']
        },
        {
          resource: 'categories',
          actions: ['read']
        },
        {
          resource: 'subcategories',
          actions: ['read']
        }
      ]
    }
  ];

  for (const roleData of defaultRoles) {
    const existingRole = await this.findOne({ name: roleData.name });
    if (!existingRole) {
      await this.create(roleData);
    }
  }
};

module.exports = mongoose.model('Role', roleSchema);
