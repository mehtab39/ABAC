const sequelize = require('../database/db');
const { DataTypes } = require('sequelize');


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
}, {
  tableName: 'users',
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

const PolicyAssignment = sequelize.define('PolicyAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  policy_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Policy,
      key: 'id',
    },
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'policy_assignments',
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



User.hasMany(PolicyAssignment, { foreignKey: 'user_id' });
Policy.hasMany(PolicyAssignment, { foreignKey: 'policy_id' });

PolicyAssignment.belongsTo(User, { foreignKey: 'user_id' });
PolicyAssignment.belongsTo(Policy, { foreignKey: 'policy_id' });


module.exports = {
  sequelize,
  PolicyAssignment,
  User,
  Policy,
  Permission
};
