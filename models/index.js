const sequelize = require('../database/db');
const { DataTypes } = require('sequelize');

// Role
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
}, {
  tableName: 'roles',
  timestamps: false,
});

// User
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: 'id',
    },
    field: 'role_id',
  }
}, {
  tableName: 'users',
  timestamps: false,
});

// UserAttribute
const UserAttribute = sequelize.define('UserAttribute', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  region: DataTypes.STRING,
  department: DataTypes.STRING,
}, {
  tableName: 'user_attributes',
  timestamps: false,
});

// Policy
const Policy = sequelize.define('Policy', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  rules_json: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'policies',
  timestamps: false,
});

// RolePolicy
const RolePolicy = sequelize.define('RolePolicy', {
  role_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Role,
      key: 'id',
    },
  },
  policy_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    references: {
      model: Policy,
      key: 'id',
    },
  },
}, {
  tableName: 'role_policies',
  timestamps: false,
});

// Permission
const Permission = sequelize.define('Permission', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
}, {
  tableName: 'permissions',
  timestamps: false,
});


// Associations

Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

User.hasOne(UserAttribute, { foreignKey: 'user_id',  as: 'attributes'  });
UserAttribute.belongsTo(User, { foreignKey: 'user_id' });

Role.belongsToMany(Policy, {
  through: RolePolicy,
  foreignKey: 'role_id',
  otherKey: 'policy_id',
});
Policy.belongsToMany(Role, {
  through: RolePolicy,
  foreignKey: 'policy_id',
  otherKey: 'role_id',
});

module.exports = {
  sequelize,
  Role,
  User,
  UserAttribute,
  Policy,
  RolePolicy,
  Permission
};
